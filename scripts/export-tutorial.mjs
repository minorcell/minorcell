#!/usr/bin/env node
/**
 * 将教程导出为标准 Markdown 文章，展开所有步骤代码引用。
 * 用法：node scripts/export-tutorial.mjs <tutorial-slug>
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const slug = process.argv[2]
if (!slug) {
  console.error('用法：node scripts/export-tutorial.mjs <tutorial-slug>')
  console.error('示例：node scripts/export-tutorial.mjs js-event-loop-to-promise')
  process.exit(1)
}

const tutorialDir = path.join(root, 'content', 'tutorials', slug)
const contentPath = path.join(tutorialDir, 'content.md')

if (!fs.existsSync(contentPath)) {
  console.error(`找不到教程：${contentPath}`)
  process.exit(1)
}

let content = fs.readFileSync(contentPath, 'utf8')

// 去掉 frontmatter，用 # 标题替代
content = content.replace(/^---\n([\s\S]*?)\n---\n/, (_, fm) => {
  const title = fm.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1]
  const desc = fm.match(/^description:\s*['"]?(.+?)['"]?\s*$/m)?.[1]
  let header = title ? `# ${title}\n` : ''
  if (desc) header += `\n> ${desc}\n`
  return header + '\n'
})

// 展开 step 代码块：```lang step file=steps/xx.js ... ```
content = content.replace(
  /^```(\w*)\s+step([^\n]*)\n([\s\S]*?)^```$/gm,
  (_, lang, meta, body) => {
    const fileMatch = meta.match(/file=(\S+)/)
    if (fileMatch) {
      const filePath = path.join(tutorialDir, fileMatch[1])
      if (fs.existsSync(filePath)) {
        const code = fs.readFileSync(filePath, 'utf8').trimEnd()
        return `\`\`\`${lang}\n${code}\n\`\`\``
      }
    }
    return `\`\`\`${lang}\n${body.trimEnd()}\n\`\`\``
  }
)

// 转换 step-image 注释
content = content.replace(
  /^<!--\s*step-image\s+src=(\S+)(?:\s+alt=(.+?))?\s*-->$/gm,
  (_, src, alt) => `![${alt?.trim() ?? ''}](${src})`
)

// 展开 step-demo：读取 HTML 文件作为代码块输出
content = content.replace(/^<!--\s*step-demo\s+(.+?)\s*-->$/gm, (_, attrs) => {
  const src = attrs.match(/src=(\S+)/)?.[1]
  const title = attrs.match(/title="([^"]+)"/)?.[1] ?? attrs.match(/title='([^']+)'/)?.[1] ?? attrs.match(/title=(\S+)/)?.[1]
  if (!src) return ''
  const filePath = path.join(tutorialDir, src)
  if (!fs.existsSync(filePath)) {
    console.warn(`  [跳过] demo 文件不存在：${src}`)
    return ''
  }
  const html = fs.readFileSync(filePath, 'utf8').trimEnd()
  const header = title ? `**${title}**\n\n` : ''
  return `${header}\`\`\`html\n${html}\n\`\`\``
})

// 写入 temp/
const tempDir = path.join(root, 'temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

const outPath = path.join(tempDir, `${slug}.md`)
fs.writeFileSync(outPath, content.trimEnd() + '\n', 'utf8')
console.log(`已导出：${outPath}`)
