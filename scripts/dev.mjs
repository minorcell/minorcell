import { readdir, readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import * as pagefind from 'pagefind'

const parser = unified().use(remarkParse).use(remarkGfm)
const contentDir = path.resolve('content')

function isSearchSource(section, filename, eventType = 'change') {
  if (!filename) return true
  const relative = String(filename).split(path.sep).join('/')
  if (section === 'tutorials') {
    return (
      /^[^/]+\/content\.md$/.test(relative) ||
      (eventType === 'rename' &&
        !relative.includes('/') &&
        !path.extname(relative))
    )
  }
  if (/^(AGENTS|CLAUDE)\.md$/.test(path.basename(relative))) return false
  return (
    /\.mdx?$/.test(relative) ||
    (eventType === 'rename' && !path.extname(relative))
  )
}

function createSearchScheduler(
  rebuild,
  { delay = 300, onError = console.error } = {},
) {
  let timer
  let running
  let pending = false
  let stopped = false

  function flush() {
    timer = undefined
    if (stopped || running || !pending) return
    pending = false
    running = Promise.resolve()
      .then(rebuild)
      .catch(onError)
      .finally(() => {
        running = undefined
        // Changes during a build collapse into one follow-up once their debounce expires.
        if (pending && !timer && !stopped) flush()
      })
  }

  return {
    request() {
      if (stopped) return
      pending = true
      clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },
    async stop() {
      stopped = true
      pending = false
      clearTimeout(timer)
      await running
    },
  }
}

function textContent(node) {
  if (node.type === 'html') return ''
  if (node.children) return node.children.map(textContent).join(' ')
  return node.value ?? node.alt ?? ''
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) return markdownFiles(file)
      return /\.mdx?$/.test(entry.name) ? [file] : []
    }),
  )
  return files.flat()
}

function check(response) {
  if (response.errors.length) throw new Error(response.errors.join('\n'))
  return response
}

async function buildSearchIndex() {
  const { index } = check(await pagefind.createIndex())
  if (!index) throw new Error('Pagefind did not create an index')
  let count = 0
  try {
    for (const section of ['articles', 'tutorials']) {
      const directory = path.join(contentDir, section)
      for (const file of await markdownFiles(directory)) {
        const relative = path
          .relative(directory, file)
          .split(path.sep)
          .join('/')
        if (!isSearchSource(section, relative)) continue
        const { data, content } = matter(await readFile(file, 'utf8'))
        if (data.redirect || data.topicSlug) continue
        const slug =
          section === 'tutorials'
            ? relative.split('/')[0]
            : relative.replace(/\.mdx?$/, '')
        const title = String(data.title || path.basename(slug))
        check(
          await index.addCustomRecord({
            url: `/${section}/${slug.split('/').map(encodeURIComponent).join('/')}`,
            content: `${title} ${data.description || ''} ${textContent(parser.parse(content))}`,
            language: 'zh-cn',
            meta: { title },
          }),
        )
        count++
      }
    }
    check(await index.writeFiles({ outputPath: 'public/pagefind-dev' }))
    console.log(`[pagefind] Development search index updated: ${count} pages`)
  } finally {
    await index.deleteIndex()
  }
}

try {
  await buildSearchIndex()
} catch (error) {
  await pagefind.close()
  throw error
}
if (process.argv.includes('--index-only')) {
  await pagefind.close()
} else {
  const scheduler = createSearchScheduler(buildSearchIndex, {
    onError: (error) => console.error('[pagefind]', error),
  })
  const watchers = ['articles', 'tutorials'].map((section) =>
    watch(
      path.join(contentDir, section),
      { recursive: true },
      (eventType, filename) => {
        if (isSearchSource(section, filename, eventType)) scheduler.request()
      },
    ),
  )
  const require = createRequire(import.meta.url)
  const child = spawn(
    process.execPath,
    [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)],
    {
      stdio: 'inherit',
    },
  )
  let stopping = false
  function stop(signal = 'SIGTERM') {
    if (stopping) return
    stopping = true
    for (const watcher of watchers) watcher.close()
    void scheduler.stop()
    child.kill(signal)
  }
  process.on('SIGINT', () => stop('SIGINT'))
  process.on('SIGTERM', () => stop())
  child.on('error', async (error) => {
    console.error(error)
    stop()
    await scheduler.stop()
    await pagefind.close()
    process.exitCode = 1
  })
  child.on('exit', async (code) => {
    stop()
    await scheduler.stop()
    await pagefind.close()
    process.exitCode = code ?? 0
  })
}
