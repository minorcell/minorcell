'use client'

import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Code block wrapper for server-rendered markdown: keeps the pre as plain
 * (build-time highlighted) markup and adds a copy button that reads the
 * rendered text back from the DOM, so the raw source is not duplicated in
 * the HTML.
 */
export function CodeBlock({ children, ...props }: React.ComponentProps<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  const onCopy = async () => {
    const text = preRef.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  return (
    <div className="code-block group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={() => void onCopy()}
        aria-label={copied ? '已复制' : '复制代码'}
        title={copied ? '已复制' : '复制代码'}
        className="absolute top-2 right-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-[background-color,color,opacity] duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-link-accent" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
