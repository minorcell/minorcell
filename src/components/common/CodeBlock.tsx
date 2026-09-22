'use client'

import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { MotionIconSwap } from '@/components/effects/MotionPrimitives'

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
        className="pressable absolute top-1.5 right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-100 hover:bg-muted hover:text-foreground focus-visible:pointer-events-auto focus-visible:opacity-100 [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100 after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
      >
        <MotionIconSwap active={copied}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-link-accent" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </MotionIconSwap>
      </button>
    </div>
  )
}
