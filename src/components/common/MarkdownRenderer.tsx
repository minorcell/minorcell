'use client'

import React, { useEffect, useState } from 'react'
import { Streamdown, type Components, type PluginConfig } from 'streamdown'
import { createCodePlugin } from '@streamdown/code'
import { ZoomImage } from '@/components/common/ZoomImage'

type MermaidPlugin = NonNullable<PluginConfig['mermaid']>

interface MarkdownRendererProps {
  content: string
  className?: string
}

type StreamdownParagraphProps = React.ComponentProps<'p'> & {
  node?: unknown
}

type StreamdownHeadingOneProps = React.ComponentProps<'h1'> & {
  node?: unknown
}

type StreamdownImageProps = React.ComponentProps<'img'> & {
  node?: unknown
}

function MarkdownImage({ node, ...props }: StreamdownImageProps) {
  void node
  return <ZoomImage {...props} />
}

function Paragraph({ children, node, ...props }: StreamdownParagraphProps) {
  void node
  const nodes = React.Children.toArray(children)
  const onlyChild = nodes.length === 1 ? nodes[0] : null

  if (
    onlyChild &&
    React.isValidElement(onlyChild) &&
    (onlyChild.type === MarkdownImage || onlyChild.type === 'img')
  ) {
    return <figure className="my-8">{onlyChild}</figure>
  }

  return <p {...props}>{children}</p>
}

function HeadingOne({ node, ...props }: StreamdownHeadingOneProps) {
  void node
  // Keep a single H1 per page: markdown content is rendered under page-level title.
  return <h2 {...props} />
}

const components: Components = {
  h1: HeadingOne,
  img: MarkdownImage,
  p: Paragraph,
}

const lightCodePlugin = createCodePlugin({
  themes: ['github-light', 'github-light'],
})
const darkCodePlugin = createCodePlugin({
  themes: ['github-dark', 'github-dark'],
})

const readIsDark = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

// Cheap heuristic: does the markdown source contain a mermaid fence?
// Only ~3/52 articles do, so most renders skip the mermaid runtime entirely.
const hasMermaidFence = (src: string) => /^[ \t]*```mermaid/m.test(src)

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const [isDark, setIsDark] = useState(readIsDark)
  const [mermaidPlugin, setMermaidPlugin] = useState<MermaidPlugin | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains('dark'))

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Lazy-load the mermaid plugin (~700 KB inc. shiki) only when we see one.
  useEffect(() => {
    if (!hasMermaidFence(content)) return
    let cancelled = false
    import('@streamdown/mermaid').then((mod) => {
      if (cancelled) return
      setMermaidPlugin(() => mod.mermaid as unknown as MermaidPlugin)
    })
    return () => {
      cancelled = true
    }
  }, [content])

  const codePlugin = isDark ? darkCodePlugin : lightCodePlugin
  const plugins = mermaidPlugin
    ? { code: codePlugin, mermaid: mermaidPlugin }
    : { code: codePlugin }

  return (
    <Streamdown
      mode="static"
      plugins={plugins}
      linkSafety={{ enabled: false }}
      className={['article-markdown', className].filter(Boolean).join(' ')}
      components={components}
    >
      {content}
    </Streamdown>
  )
}
