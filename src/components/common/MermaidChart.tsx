'use client'

import { useEffect, useId, useRef } from 'react'

const readIsDark = () => document.documentElement.classList.contains('dark')

/**
 * Renders a mermaid diagram from its source. The mermaid runtime (~700 KB)
 * is lazy-loaded only on pages that actually contain a diagram, and the
 * diagram re-renders when the site theme toggles.
 */
export function MermaidChart({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rawId = useId()
  const renderId = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    const render = async () => {
      const { default: mermaid } = await import('mermaid')
      if (cancelled) return
      mermaid.initialize({
        startOnLoad: false,
        theme: readIsDark() ? 'dark' : 'default',
        securityLevel: 'strict',
        fontFamily: 'monospace',
        suppressErrorRendering: true,
      })
      try {
        const { svg } = await mermaid.render(renderId, chart)
        if (!cancelled) container.innerHTML = svg
      } catch (err) {
        console.error('Mermaid render failed', err)
      }
    }

    void render()

    const observer = new MutationObserver(() => void render())
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [chart, renderId])

  return <div ref={containerRef} className="mermaid-chart my-8" />
}
