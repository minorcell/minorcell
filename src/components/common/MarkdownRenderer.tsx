'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Streamdown,
  type AnimateOptions,
  type Components,
  type PluginConfig,
} from 'streamdown'
import { createCodePlugin } from '@streamdown/code'
import { ContentImage } from '@/components/common/ContentImage'
import { createMermaidTheme } from '@/lib/mermaid-theme'

type MermaidPlugin = NonNullable<PluginConfig['mermaid']>

interface MarkdownRendererProps {
  content: string
  className?: string
  isStreaming?: boolean
  animateStreaming?: boolean
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
  return <ContentImage {...props} />
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

function HeadingOne({ node, children, ...props }: StreamdownHeadingOneProps) {
  void node
  // Keep a single H1 per page: markdown content is rendered under page-level title.
  return <h2 {...props}>{children}</h2>
}

const components: Components = {
  h1: HeadingOne,
  img: MarkdownImage,
  p: Paragraph,
}

const codePlugin = createCodePlugin({
  themes: ['github-dark-high-contrast', 'github-dark-high-contrast'],
})
const linkSafety = { enabled: false }
const streamingAnimation: AnimateOptions = {
  animation: 'fadeIn',
  duration: 180,
  easing: 'ease-out',
  sep: 'char',
  stagger: 0,
}

const readIsDark = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

// Cheap heuristic: does the markdown source contain a mermaid fence?
// Only ~3/52 articles do, so most renders skip the mermaid runtime entirely.
const hasMermaidFence = (src: string) => /^[ \t]*```mermaid/m.test(src)

export function MarkdownRenderer({
  content,
  className,
  isStreaming = false,
  animateStreaming = false,
}: MarkdownRendererProps) {
  const [isDark, setIsDark] = useState(readIsDark)
  const [mermaidPlugin, setMermaidPlugin] = useState<MermaidPlugin | null>(null)
  const needsMermaid = hasMermaidFence(content)

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
    if (!needsMermaid) return
    let cancelled = false
    import('@streamdown/mermaid').then((mod) => {
      if (cancelled) return
      setMermaidPlugin(() => mod.mermaid as unknown as MermaidPlugin)
    })
    return () => {
      cancelled = true
    }
  }, [needsMermaid])

  const mermaidOptions = useMemo(
    () => ({
      config: createMermaidTheme(isDark),
    }),
    [isDark],
  )
  const plugins = useMemo(
    () =>
      mermaidPlugin
        ? { code: codePlugin, mermaid: mermaidPlugin }
        : { code: codePlugin },
    [mermaidPlugin],
  )

  return (
    <Streamdown
      mode={isStreaming ? 'streaming' : 'static'}
      isAnimating={isStreaming}
      animated={animateStreaming && isStreaming ? streamingAnimation : false}
      plugins={plugins}
      mermaid={mermaidPlugin ? mermaidOptions : undefined}
      linkSafety={linkSafety}
      className={['article-markdown', className].filter(Boolean).join(' ')}
      components={components}
    >
      {content}
    </Streamdown>
  )
}
