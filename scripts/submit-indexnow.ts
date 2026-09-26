import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const siteUrl = (process.env.SITE_URL ?? 'https://minorcell.top').replace(
  /\/$/,
  '',
)
const host = new URL(siteUrl).hostname
const publicDir = new URL('../public/', import.meta.url)
const publicPath = (file: string) => new URL(file, publicDir)

const keyFile = readdirSync(publicDir).find((file) =>
  /^[a-f0-9]{32}\.txt$/i.test(file),
)

if (!keyFile) {
  throw new Error('No IndexNow key file found in public/.')
}

const key = readFileSync(publicPath(keyFile), 'utf8').trim()
const keyLocation = `${siteUrl}/${keyFile}`

const decodeXml = (value: string) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")

const sitemapUrls = async () => {
  const response = await fetch(`${siteUrl}/sitemap.xml`)
  if (!response.ok) {
    throw new Error(`Unable to fetch sitemap: HTTP ${response.status}`)
  }

  const xml = await response.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    decodeXml(match[1]),
  )
}

const changedFiles = () => {
  const before = process.env.GITHUB_EVENT_BEFORE
  const commit = process.env.GITHUB_SHA

  if (!before || !commit || /^0+$/.test(before)) return []

  return execFileSync('git', ['diff', '--name-only', before, commit], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
}

const urlForChangedFile = (file: string) => {
  if (file.startsWith('content/articles/')) {
    const slug = file.slice('content/articles/'.length).replace(/\.mdx?$/, '')
    return `${siteUrl}/articles/${slug}`
  }

  if (file.startsWith('content/tutorials/')) {
    const slug = file.slice('content/tutorials/'.length).split('/')[0]
    return `${siteUrl}/tutorials/${slug}`
  }

  return null
}

const changed = changedFiles()
const contentChanges = changed.filter((file) =>
  /^(content\/|src\/app\/|src\/lib\/(seo|structured-data|site-content|content-parser)\.|public\/llms\.txt$)/.test(
    file,
  ),
)

if (changed.length > 0 && contentChanges.length === 0) {
  console.log(
    'No indexable content or SEO changes detected; skipping IndexNow.',
  )
  process.exit(0)
}

const changedUrls = contentChanges.map(urlForChangedFile).filter(Boolean)
const urls = new Set(changedUrls)

if (urls.size === 0 || process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
  for (const url of await sitemapUrls()) urls.add(url)
}

if (urls.size === 0) {
  console.log('No URLs to submit to IndexNow.')
  process.exit(0)
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'content-type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList: [...urls].slice(0, 10000),
  }),
})

if (!response.ok) {
  const body = await response.text()
  throw new Error(`IndexNow request failed: HTTP ${response.status} ${body}`)
}

console.log(`Submitted ${urls.size} URL(s) to IndexNow.`)
