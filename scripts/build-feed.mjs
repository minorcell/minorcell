#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const root = process.cwd()
const articlesDir = path.join(root, 'content', 'articles')
const siteConfigPath = path.join(root, 'content', 'site', 'site.json')
const outputPath = path.join(root, 'public', 'feed.xml')

function walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return []

  const files = []

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (/\.mdx?$/i.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

function toPosix(value) {
  return value.replace(/\\/g, '/')
}

function parseDate(value, fallback) {
  const date = new Date(value ?? fallback)
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

function stripMarkdown(markdown) {
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

function excerptFromContent(content, maxLength = 180) {
  const text = stripMarkdown(content)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}

function encodePath(pathname) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toCdata(value) {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function normalizeBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const trimmed = value.trim()

  try {
    const url = new URL(trimmed)
    const normalizedPath = url.pathname.replace(/\/+$/, '')
    return `${url.origin}${normalizedPath}`
  } catch {
    return trimmed.replace(/\/+$/, '')
  }
}

function readSiteConfig() {
  const raw = fs.readFileSync(siteConfigPath, 'utf8')
  return JSON.parse(raw)
}

function build() {
  const siteConfig = readSiteConfig()
  const siteUrl = normalizeBaseUrl(siteConfig.url)
  if (!siteUrl) {
    throw new Error('`content/site/site.json` 中缺少可用的 `url` 字段')
  }

  const files = walkMarkdownFiles(articlesDir)
  const posts = []

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8')
    const parsed = matter(source)
    const metadata = parsed.data || {}
    const stat = fs.statSync(filePath)

    const slug = toPosix(path.relative(articlesDir, filePath)).replace(/\.mdx?$/i, '')
    const title =
      typeof metadata.title === 'string' && metadata.title.trim()
        ? metadata.title.trim()
        : path.basename(slug)
    const description =
      typeof metadata.description === 'string' && metadata.description.trim()
        ? metadata.description.trim()
        : excerptFromContent(parsed.content)
    const date = parseDate(metadata.date, stat.mtime)

    if (!date) continue

    // Stub posts defer their content to an interactive topic at
    // /topics/<topicSlug>. Point RSS subscribers straight at the topic so they
    // never land on the empty stub page.
    const topicSlug =
      typeof metadata.topicSlug === 'string' && metadata.topicSlug.trim()
        ? metadata.topicSlug.trim()
        : undefined
    const encodedSlug = encodePath(slug)
    const link = topicSlug
      ? `${siteUrl}/tutorials/${encodePath(topicSlug)}`
      : `${siteUrl}/articles/${encodedSlug}`
    posts.push({
      slug,
      title,
      description,
      date,
      link,
    })
  }

  posts.sort((a, b) => {
    const diff = b.date.getTime() - a.date.getTime()
    if (diff !== 0) return diff
    return a.slug.localeCompare(b.slug)
  })

  const lastBuildDate = posts[0]?.date ?? new Date()
  const channelTitle =
    typeof siteConfig.title === 'string' && siteConfig.title.trim()
      ? siteConfig.title.trim()
      : typeof siteConfig.name === 'string' && siteConfig.name.trim()
        ? siteConfig.name.trim()
        : 'Minor Cell'
  const channelDescription =
    typeof siteConfig.description === 'string' && siteConfig.description.trim()
      ? siteConfig.description.trim()
      : typeof siteConfig.subtitle === 'string' && siteConfig.subtitle.trim()
        ? siteConfig.subtitle.trim()
        : `${channelTitle} RSS Feed`
  const channelLanguage =
    typeof siteConfig.locale === 'string' && siteConfig.locale.trim()
      ? siteConfig.locale.trim()
      : 'zh-CN'
  const feedUrl = `${siteUrl}/feed.xml`

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${toCdata(channelTitle)}</title>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <description>${toCdata(channelDescription)}</description>`,
    `    <language>${escapeXml(channelLanguage)}</language>`,
    `    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    '    <generator>Minor Cell RSS Generator</generator>',
    ...posts.flatMap((post) => {
      const item = [
        '    <item>',
        `      <title>${toCdata(post.title)}</title>`,
        `      <link>${escapeXml(post.link)}</link>`,
        `      <guid>${escapeXml(post.link)}</guid>`,
        `      <pubDate>${post.date.toUTCString()}</pubDate>`,
      ]
      if (post.description) {
        item.push(`      <description>${toCdata(post.description)}</description>`)
      }
      item.push('    </item>')
      return item
    }),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, xml)

  console.log(`Built RSS feed: ${posts.length} posts -> ${path.relative(root, outputPath)}`)
}

build()
