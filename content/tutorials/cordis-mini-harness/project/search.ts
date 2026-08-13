import { readdir, readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import type { Context } from 'cordis'

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.txt', '.yml', '.yaml', '.html', '.css',
])

async function searchFiles(dir: string, keyword: string, depth = 3): Promise<string[]> {
  if (depth < 0) return []
  const results: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await searchFiles(full, keyword, depth - 1)))
    } else if (TEXT_EXT.has(extname(entry.name))) {
      const content = await readFile(full, 'utf8').catch(() => '')
      if (content.includes(keyword)) results.push(full)
    }
  }
  return results
}

export const name = 'mini-search'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register({
    name: 'file_search',
    description: '在目录下搜索包含关键词的文本文件（跳过 node_modules 和隐藏目录）',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '要搜索的关键词' },
        dir: { type: 'string', description: '起始目录，默认当前目录' },
      },
      required: ['keyword'],
    },
    async execute(args) {
      const keyword = String(args.keyword ?? '')
      const dir = String(args.dir ?? process.cwd())
      try {
        const found = await searchFiles(dir, keyword)
        return found.length ? found.slice(0, 20).join('\n') : '没有找到匹配文件'
      } catch (error) {
        return `搜索失败：${(error as Error).message}`
      }
    },
  })
}
