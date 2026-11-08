import type { PageChunk } from './budget'

export interface PageBlock {
  kind: 'heading' | 'paragraph' | 'code'
  text: string
}

export interface PageSnapshot {
  title: string
  path: string
  chunks: PageChunk[]
}

const CHUNK_CHARS = 450
const IGNORE =
  'nav, footer, script, style, svg, noscript, dialog, [data-page-bot], [data-pagefind-ignore]'

export function blocksToChunks(
  blocks: PageBlock[],
  title: string,
): PageChunk[] {
  const chunks: PageChunk[] = []
  let heading = title || '本页'
  let buffer: string[] = []
  let chars = 0

  const flush = () => {
    const text = buffer.join('\n').trim()
    buffer = []
    chars = 0
    if (text.length === 0) return
    chunks.push({ heading, text })
  }

  for (const block of blocks) {
    if (block.kind === 'heading') {
      flush()
      const next = block.text.replace(/\s+/g, ' ').trim().slice(0, 80)
      if (next.length > 0) heading = next
      continue
    }

    const text = block.text.trim()
    if (text.length === 0) continue
    const piece =
      block.kind === 'code' ? text.slice(0, 360) : text.slice(0, 700)
    if (chars > 0 && chars + piece.length > CHUNK_CHARS) flush()
    buffer.push(piece)
    chars += piece.length
    if (chars >= CHUNK_CHARS) flush()
  }

  flush()
  return chunks.slice(0, 200)
}

export function readPage(doc: Document = document): PageSnapshot {
  const root =
    doc.querySelector<HTMLElement>('[data-pagefind-body]') ??
    doc.querySelector<HTMLElement>('#main')
  const title = readTitle(doc, root)
  const path = doc.location?.pathname || '/'
  if (!root) return { title, path, chunks: [] }

  const blocks: PageBlock[] = []
  const nodes = root.querySelectorAll<HTMLElement>(
    'h1, h2, h3, h4, p, li, pre, blockquote',
  )

  for (const node of nodes) {
    if (isIgnored(node, root)) continue
    const parentBlock = node.parentElement?.closest('li, pre, blockquote')
    if (parentBlock && parentBlock !== node && root.contains(parentBlock)) {
      continue
    }

    const kind = headingKind(node.tagName)
    const text = plainText(node, kind === 'code')
    if (text.length === 0) continue
    blocks.push({ kind, text })
  }

  return {
    title,
    path,
    chunks: blocksToChunks(blocks, title),
  }
}

export function readSelection(doc: Document = document): string {
  const selection = doc.getSelection?.()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0)
    return ''

  const text = selection
    .toString()
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  if (text.length < 8) return ''

  const anchor = selection.anchorNode
  const element = anchor instanceof Element ? anchor : anchor?.parentElement
  if (!element) return ''
  if (element.closest('[data-page-bot]')) return ''

  const root =
    doc.querySelector('[data-pagefind-body]') ?? doc.querySelector('#main')
  if (root && !root.contains(element)) return ''
  return text.slice(0, 800)
}

function readTitle(doc: Document, root: Element | null): string {
  const heading = root
    ?.querySelector('h1')
    ?.textContent?.replace(/\s+/g, ' ')
    .trim()
  if (heading) return heading.slice(0, 120)
  const fromDocument = doc.title.replace(/\s+\|\s*minorcell\s*$/i, '').trim()
  return fromDocument.slice(0, 120)
}

function headingKind(tagName: string): PageBlock['kind'] {
  if (/^H[1-4]$/.test(tagName)) return 'heading'
  if (tagName === 'PRE') return 'code'
  return 'paragraph'
}

function plainText(node: HTMLElement, keepLines: boolean): string {
  if (node.tagName === 'LI') {
    const clone = node.cloneNode(true) as HTMLElement
    clone.querySelectorAll('ul, ol').forEach((list) => list.remove())
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim()
  }

  const raw = node.textContent ?? ''
  if (keepLines) return raw.replace(/\n{3,}/g, '\n\n').trim()
  return raw.replace(/\s+/g, ' ').trim()
}

function isIgnored(node: Element, root: Element): boolean {
  const ignored = node.closest(IGNORE)
  return ignored !== null && root.contains(ignored)
}
