import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { parseTutorialContent, type TutorialStep } from '@/lib/step-parser'

export type { TutorialStep }
export type {
  TutorialCodeStep,
  TutorialImageStep,
  TutorialDemoStep,
} from '@/lib/step-parser'

const root = process.cwd()

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentVariant = 'article' | 'tutorial'

export interface ContentMeta {
  title: string
  type: ContentVariant
  description?: string
  date?: string
  updated?: string
  tags?: string[]
  keywords?: string[]
  image?: string
  order?: number
  topicSlug?: string
  [key: string]: unknown
}

export interface ArticleContent {
  type: 'article'
  slug: string
  metadata: ContentMeta
  content: string
  rawContent: string
}

export interface TutorialContent {
  type: 'tutorial'
  slug: string
  metadata: ContentMeta
  intro: string
  steps: TutorialStep[]
}

export type ContentItem = ArticleContent | TutorialContent

// ─── Internal helpers ────────────────────────────────────────────────────────

function mdFilesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []

  function walk(currentDir: string) {
    for (const entry of fs.readdirSync(currentDir)) {
      const full = path.join(currentDir, entry)
      if (fs.statSync(full).isDirectory()) {
        walk(full)
      } else if (/\.mdx?$/.test(entry)) {
        files.push(path.relative(dir, full))
      }
    }
  }

  walk(dir)
  return files
}

function extractFirstImage(markdown: string): string | undefined {
  const match = markdown.match(/!\[.*?\]\((.*?)\)/)
  return match ? match[1] : undefined
}

function parseDate(value: unknown): string | undefined {
  if (!value) return undefined
  const d = new Date(value as string | Date)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function inferType(filePath: string, fm: Record<string, unknown>): ContentVariant | null {
  if (fm.type === 'interactive') return 'tutorial'
  if (fm.type === 'article') return 'article'
  // Fallback: content under articles/ dir → article
  if (filePath.startsWith('content/articles/') || filePath.startsWith('articles/')) return 'article'
  return null
}

// ─── Article parsing ────────────────────────────────────────────────────────

const ARTICLES_DIR = path.join(root, 'content', 'articles')

function parseArticle(slug: string, fullPath: string): ArticleContent {
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const fm = data as Record<string, unknown>

  return {
    type: 'article',
    slug,
    metadata: {
      ...fm,
      title: (fm.title as string) || path.basename(slug),
      type: (fm.type as ContentVariant) || 'article',
      date: parseDate(fm.date),
      description: fm.description as string | undefined,
      image: (fm.image as string) || extractFirstImage(content),
      order: fm.order as number | undefined,
      topicSlug: fm.topicSlug as string | undefined,
      tags: fm.tags as string[] | undefined,
      keywords: fm.keywords as string[] | undefined,
      updated: parseDate(fm.updated ?? fm.updatedAt ?? fm.modifiedAt ?? fm.lastmod),
    } as ContentMeta,
    content,
    rawContent: raw,
  }
}

// ─── Tutorial parsing ───────────────────────────────────────────────────────

const TUTORIALS_DIR = path.join(root, 'content', 'tutorials')

function parseTutorial(slug: string, fullPath: string): TutorialContent | null {
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const fm = data as Record<string, unknown>

  if (fm.type !== 'interactive') return null

  const tutorialDir = path.dirname(fullPath)
  const { intro, steps } = parseTutorialContent(content, tutorialDir)

  return {
    type: 'tutorial',
    slug,
    metadata: {
      ...fm,
      title: (fm.title as string) || slug,
      type: 'tutorial',
      description: fm.description as string | undefined,
      tags: fm.tags as string[] | undefined,
      keywords: fm.keywords as string[] | undefined,
    } as ContentMeta,
    intro,
    steps,
  }
}

function findTutorialSlugs(): string[] {
  if (!fs.existsSync(TUTORIALS_DIR)) return []
  return fs
    .readdirSync(TUTORIALS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAllArticles(): ArticleContent[] {
  const slugs = mdFilesUnder(ARTICLES_DIR)
  return slugs
    .map((slug) => {
      const realSlug = slug.replace(/\.mdx?$/, '')
      const fullPath = path.join(ARTICLES_DIR, slug)
      return parseArticle(realSlug, fullPath)
    })
    .sort((a, b) => {
      const da = a.metadata.date ? new Date(a.metadata.date).getTime() : 0
      const db = b.metadata.date ? new Date(b.metadata.date).getTime() : 0
      return db - da
    })
}

export function getArticleBySlug(slug: string): ArticleContent | null {
  const realSlug = slug.replace(/\.mdx?$/, '')
  // Try .md then .mdx
  for (const ext of ['.md', '.mdx']) {
    const fullPath = path.join(ARTICLES_DIR, `${realSlug}${ext}`)
    if (fs.existsSync(fullPath)) {
      return parseArticle(realSlug, fullPath)
    }
  }
  return null
}

export function getAllTutorials(): TutorialContent[] {
  return findTutorialSlugs()
    .map((slug) => {
      const fullPath = path.join(TUTORIALS_DIR, slug, 'content.md')
      if (!fs.existsSync(fullPath)) return null
      return parseTutorial(slug, fullPath)
    })
    .filter((t): t is TutorialContent => t !== null)
}

export function getTutorialBySlug(slug: string): TutorialContent | null {
  const fullPath = path.join(TUTORIALS_DIR, slug, 'content.md')
  if (!fs.existsSync(fullPath)) return null
  return parseTutorial(slug, fullPath)
}

export function getAllContent(): ContentItem[] {
  return [...getAllArticles(), ...getAllTutorials()]
}

// ─── Stub detection ─────────────────────────────────────────────────────────

export function isStubArticle(item: ContentItem): item is ArticleContent {
  if (item.type !== 'article') return false
  const ts = item.metadata.topicSlug
  return typeof ts === 'string' && ts.trim().length > 0
}

export function getStubTargetSlug(item: ArticleContent): string | undefined {
  const ts = item.metadata.topicSlug
  if (typeof ts !== 'string') return undefined
  const trimmed = ts.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

// ─── URL generation ─────────────────────────────────────────────────────────

export function getContentHref(item: ContentItem): string {
  if (item.type === 'tutorial') {
    return `/tutorials/${item.slug}`
  }
  const targetSlug = getStubTargetSlug(item)
  if (targetSlug) {
    return `/tutorials/${targetSlug}`
  }
  return `/articles/${item.slug}`
}
