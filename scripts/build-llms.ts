#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const root = process.cwd()
const articlesDir = path.join(root, 'content', 'articles')
const tutorialsDir = path.join(root, 'content', 'tutorials')
const siteConfigPath = path.join(root, 'content', 'site', 'site.json')
const outputPath = path.join(root, 'public', 'llms.txt')

function walkMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []

  function walk(currentDir: string) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (/\.mdx?$/i.test(entry.name)) files.push(fullPath)
    }
  }

  walk(dir)
  return files
}

function toPosix(value: string) {
  return value.replace(/\\/g, '/')
}

function parseDate(value: unknown): string | null {
  if (!value) return null
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null
  if (!date || Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>-]/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function oneLine(value: unknown, maxLength = 160) {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}…`
}

function encodePath(pathname: string) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

interface LlmsItem {
  title: string
  description: string
  url: string
  date: string | null
}

function readArticles(items: LlmsItem[]) {
  for (const filePath of walkMarkdownFiles(articlesDir)) {
    const parsed = matter(fs.readFileSync(filePath, 'utf8'))
    const metadata = parsed.data || {}

    // Redirect pages and tutorial stubs are not canonical article URLs.
    if (metadata.redirect || metadata.topicSlug) continue

    const slug = toPosix(path.relative(articlesDir, filePath)).replace(
      /\.mdx?$/i,
      '',
    )
    const title =
      typeof metadata.title === 'string' && metadata.title.trim()
        ? metadata.title.trim()
        : path.basename(slug)
    const description =
      typeof metadata.description === 'string' && metadata.description.trim()
        ? metadata.description.trim()
        : stripMarkdown(parsed.content)

    items.push({
      title,
      description: oneLine(description),
      url: `${siteUrl}/articles/${encodePath(slug)}`,
      date: parseDate(metadata.date),
    })
  }
}

function readTutorials(items: LlmsItem[]) {
  if (!fs.existsSync(tutorialsDir)) return

  for (const entry of fs.readdirSync(tutorialsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const filePath = path.join(tutorialsDir, entry.name, 'content.md')
    if (!fs.existsSync(filePath)) continue

    const parsed = matter(fs.readFileSync(filePath, 'utf8'))
    const metadata = parsed.data || {}
    const title =
      typeof metadata.title === 'string' && metadata.title.trim()
        ? metadata.title.trim()
        : entry.name
    const description =
      typeof metadata.description === 'string' && metadata.description.trim()
        ? metadata.description.trim()
        : stripMarkdown(parsed.content)

    items.push({
      title,
      description: oneLine(description),
      url: `${siteUrl}/tutorials/${encodePath(entry.name)}`,
      date: parseDate(metadata.date),
    })
  }
}

function formatList(items: LlmsItem[]) {
  return items.map((item) => {
    const meta = [item.description, item.date].filter(Boolean).join(' · ')
    return `- [${item.title}](${item.url})${meta ? `: ${meta}` : ''}`
  })
}

const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'))
const siteUrl = String(siteConfig.url ?? '').replace(/\/+$/, '')
if (!siteUrl) {
  throw new Error('`content/site/site.json` 中缺少可用的 `url` 字段')
}

const articles: LlmsItem[] = []
const tutorials: LlmsItem[] = []
readArticles(articles)
readTutorials(tutorials)

const byDateDesc = (a: LlmsItem, b: LlmsItem) => {
  if (a.date && b.date) return b.date.localeCompare(a.date)
  if (a.date) return -1
  if (b.date) return 1
  return a.title.localeCompare(b.title)
}

articles.sort(byDateDesc)
tutorials.sort(byDateDesc)

const summary =
  typeof siteConfig.description === 'string' && siteConfig.description.trim()
    ? siteConfig.description.trim()
    : 'minorcell 的个人技术博客。'

const lines = [
  `# ${siteConfig.name ?? 'minorcell'}`,
  '',
  `> ${oneLine(summary, 240)}`,
  '',
  '个人技术博客，记录 AI 工程、软件开发、技术选择与产品实践。内容以中文为主。',
  '',
  '## 文章',
  '',
  ...formatList(articles),
  '',
  '## 教程',
  '',
  ...formatList(tutorials),
  '',
  '## 订阅',
  '',
  `- [RSS Feed](${siteUrl}/feed.xml): 通过 RSS 订阅最新文章`,
  `- [站点地图](${siteUrl}/sitemap.xml): 全部可索引页面`,
  '',
]

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, lines.join('\n'))

console.log(
  `Built llms.txt: ${articles.length} articles, ${tutorials.length} tutorials -> ${path.relative(root, outputPath)}`,
)
