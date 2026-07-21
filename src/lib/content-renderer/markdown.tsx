import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import React from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { Element, ElementContent, Root, RootContent } from 'hast'
import { ZoomImage } from '@/components/common/ZoomImage'
import { CodeBlock } from '@/components/common/CodeBlock'
import { MermaidChart } from '@/components/common/MermaidChart'
import { CODE_THEME } from '@/lib/content-renderer/highlight'

export interface TocHeading {
  id: string
  text: string
  level: 2 | 3
}

export interface RenderedMarkdown {
  node: React.ReactNode
  headings: TocHeading[]
}

// ─── Hast helpers ────────────────────────────────────────────────────────────

function isElement(node: unknown): node is Element {
  return (
    typeof node === 'object' &&
    node !== null &&
    (node as Element).type === 'element'
  )
}

function visitElements(node: Root | RootContent, fn: (el: Element) => void) {
  if (node.type === 'root') {
    for (const child of node.children) visitElements(child, fn)
    return
  }
  if (!isElement(node)) return
  fn(node)
  for (const child of node.children) visitElements(child, fn)
}

function textContent(node: Element | ElementContent): string {
  if (node.type === 'text') return node.value
  if (isElement(node)) return node.children.map(textContent).join('')
  return ''
}

// ─── Custom rehype plugins ───────────────────────────────────────────────────

/** Replace mermaid code fences with a placeholder the client island picks up. */
function rehypeMermaid() {
  return (tree: Root) => {
    visitElements(tree, (el) => {
      if (el.tagName !== 'pre') return
      const code = el.children.find(
        (child): child is Element =>
          isElement(child) && child.tagName === 'code',
      )
      if (!code) return
      const className = code.properties?.className
      const classes = Array.isArray(className) ? className : []
      if (!classes.includes('language-mermaid')) return

      el.tagName = 'div'
      el.properties = {
        className: ['mermaid-chart'],
        'data-chart': textContent(code),
      }
      el.children = []
    })
  }
}

/** Collect h2/h3 (with rehype-slug ids) for the table of contents. */
function rehypeCollectHeadings(headings: TocHeading[]) {
  return (tree: Root) => {
    visitElements(tree, (el) => {
      if (el.tagName !== 'h2' && el.tagName !== 'h3') return
      const id = el.properties?.id
      if (typeof id !== 'string' || !id) return
      headings.push({
        id,
        text: textContent(el).trim(),
        level: el.tagName === 'h2' ? 2 : 3,
      })
    })
  }
}

// ─── JSX component overrides ─────────────────────────────────────────────────

// Keep a single H1 per page: markdown content renders under the page title.
function HeadingOne(props: React.ComponentProps<'h1'>) {
  // oxlint-disable-next-line jsx-a11y/heading-has-content
  return <h2 {...props} />
}

// A paragraph whose only child is an image becomes a figure, so images get
// block spacing instead of inline paragraph flow.
function Paragraph({ children, ...props }: React.ComponentProps<'p'>) {
  const nodes = React.Children.toArray(children)
  const onlyChild = nodes.length === 1 ? nodes[0] : null

  if (
    onlyChild &&
    React.isValidElement(onlyChild) &&
    (onlyChild.type === ZoomImage || onlyChild.type === 'img')
  ) {
    return <figure className="my-8">{onlyChild}</figure>
  }

  return <p {...props}>{children}</p>
}

// Route mermaid placeholders to the client island; leave other divs alone.
function SmartDiv({ children, ...props }: React.ComponentProps<'div'>) {
  const chart = (props as Record<string, unknown>)['data-chart']
  if (typeof chart === 'string') {
    return <MermaidChart chart={chart} />
  }
  return <div {...props}>{children}</div>
}

const components = {
  h1: HeadingOne,
  p: Paragraph,
  img: ZoomImage,
  pre: CodeBlock,
  div: SmartDiv,
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render markdown to React at build time (RSC / static export).
 * Shiki highlighting runs here too — no markdown, shiki, or renderer JS is
 * shipped to the browser; only small client islands (zoom, copy, mermaid).
 */
export async function renderMarkdown(
  markdown: string,
): Promise<RenderedMarkdown> {
  const headings: TocHeading[] = []

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeMermaid)
    .use(rehypeShiki, { theme: CODE_THEME })
    .use(rehypeSlug)
    .use(rehypeCollectHeadings, headings)

  const hast = (await processor.run(processor.parse(markdown))) as Root

  const node = toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components,
  })

  return { node, headings }
}
