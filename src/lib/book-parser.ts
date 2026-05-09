import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { parseTutorialContent, type TutorialStep } from '@/lib/step-parser'

const root = process.cwd()
const BOOKS_DIR = path.join(root, 'content', 'books')

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookChapter {
  slug: string
  title: string
  volume: number
  chapter: number
  description?: string
  content: string
  /** Parsed interactive steps. undefined = no steps in this chapter. */
  steps?: TutorialStep[]
  /** Intro text before the first step. Only set when steps exist. */
  intro?: string
}

export interface BookVolume {
  number: number
  chapters: BookChapter[]
}

export interface BookMeta {
  slug: string
  title: string
  description?: string
  volumes: BookVolume[]
  indexContent: string
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

function parseBookChapter(
  filePath: string,
  slug: string,
  bookDir: string,
): BookChapter | null {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const fm = data as Record<string, unknown>

  if (typeof fm.volume !== 'number' || typeof fm.chapter !== 'number') {
    return null
  }

  // Try to parse interactive steps from the chapter content
  const { intro, steps } = parseTutorialContent(content, bookDir)
  const hasSteps = steps.length > 0

  return {
    slug,
    title: (fm.title as string) || slug,
    volume: fm.volume,
    chapter: fm.chapter,
    description: fm.description as string | undefined,
    content: hasSteps ? '' : content,       // when interactive, content is split into steps
    steps: hasSteps ? steps : undefined,
    intro: hasSteps ? intro : undefined,
  }
}

function parseBook(bookDir: string, slug: string): BookMeta | null {
  const indexPath = path.join(bookDir, 'index.md')
  if (!fs.existsSync(indexPath)) return null

  const indexRaw = fs.readFileSync(indexPath, 'utf8')
  const { data: indexFm, content: indexContent } = matter(indexRaw)
  const fm = indexFm as Record<string, unknown>

  // Scan chapter files from content/ subdirectory
  const contentDir = path.join(bookDir, 'content')
  const chapterFiles = fs.existsSync(contentDir)
    ? fs.readdirSync(contentDir)
        .filter((f) => f.endsWith('.md'))
        .sort()
    : []

  const chapters: BookChapter[] = []
  for (const file of chapterFiles) {
    const chapterSlug = file.replace(/\.md$/, '')
    const chapter = parseBookChapter(path.join(contentDir, file), chapterSlug, bookDir)
    if (chapter) chapters.push(chapter)
  }

  // Group by volume
  const volumeMap = new Map<number, BookChapter[]>()
  for (const ch of chapters) {
    const list = volumeMap.get(ch.volume) || []
    list.push(ch)
    volumeMap.set(ch.volume, list)
  }

  const volumes: BookVolume[] = []
  for (const [num, chs] of volumeMap) {
    chs.sort((a, b) => a.chapter - b.chapter)
    volumes.push({ number: num, chapters: chs })
  }
  volumes.sort((a, b) => a.number - b.number)

  return {
    slug,
    title: (fm.title as string) || slug,
    description: fm.description as string | undefined,
    volumes,
    indexContent,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAllBooks(): BookMeta[] {
  if (!fs.existsSync(BOOKS_DIR)) return []

  return fs
    .readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const bookDir = path.join(BOOKS_DIR, d.name)
      return parseBook(bookDir, d.name)
    })
    .filter((b): b is BookMeta => b !== null)
}

export function getBookBySlug(slug: string): BookMeta | null {
  const bookDir = path.join(BOOKS_DIR, slug)
  if (!fs.existsSync(bookDir)) return null
  return parseBook(bookDir, slug)
}

export function getBookChapter(
  bookSlug: string,
  chapterSlug: string,
): BookChapter | null {
  const bookDir = path.join(BOOKS_DIR, bookSlug)
  const filePath = path.join(bookDir, 'content', `${chapterSlug}.md`)
  if (!fs.existsSync(filePath)) return null
  return parseBookChapter(filePath, chapterSlug, bookDir)
}

export function getAdjacentChapters(
  book: BookMeta,
  chapterSlug: string,
): { prev: BookChapter | null; next: BookChapter | null } {
  const flat: BookChapter[] = []
  for (const vol of book.volumes) {
    for (const ch of vol.chapters) {
      flat.push(ch)
    }
  }

  const idx = flat.findIndex((ch) => ch.slug === chapterSlug)
  if (idx === -1) return { prev: null, next: null }

  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  }
}
