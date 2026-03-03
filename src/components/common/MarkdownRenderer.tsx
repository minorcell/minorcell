'use client'

import React, { useEffect, useState } from 'react'
import { Streamdown, type Components, type PluginConfig } from 'streamdown'
import { createCodePlugin } from '@streamdown/code'
import { mermaid } from '@streamdown/mermaid'
import { ZoomImage } from '@/components/common/ZoomImage'

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

function Paragraph({
  children,
  node,
  ...props
}: StreamdownParagraphProps) {
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

const mermaidPlugin = mermaid as unknown as NonNullable<PluginConfig['mermaid']>
const lightCodePlugin = createCodePlugin({
  themes: ['github-light', 'github-light'],
})
const darkCodePlugin = createCodePlugin({
  themes: ['github-dark', 'github-dark'],
})

const readIsDark = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const [isDark, setIsDark] = useState(readIsDark)

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

  const codePlugin = isDark ? darkCodePlugin : lightCodePlugin

  return (
    <Streamdown
      mode="static"
      plugins={{ code: codePlugin, mermaid: mermaidPlugin }}
      linkSafety={{ enabled: false }}
      className={className}
      components={components}
    >
      {content}
    </Streamdown>
  )
}
