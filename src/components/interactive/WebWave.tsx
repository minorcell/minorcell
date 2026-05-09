'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createCodePlugin } from '@streamdown/code'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { useVisibleStepIndex } from '../../hooks/useVisibleStepIndex'

export interface WebStep {
  html: string
  title?: string
  height?: number
  aspect?: string
}

export interface WebStepContent {
  step: WebStep
  prose: string
}

interface WebWaveProps {
  steps: WebStepContent[]
}

type ViewMode = 'preview' | 'source'

type ShikiToken = {
  content: string
  htmlStyle?: Record<string, string>
}

const codePlugin = createCodePlugin({
  themes: ['github-light', 'github-dark'],
})

const readIsDark = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

/**
 * Compute a CSS aspect-ratio value from author input.
 * Accepts "16/9", "16:9", "1.78". Returns undefined if unparseable.
 */
function parseAspect(aspect?: string): string | undefined {
  if (!aspect) return undefined
  const trimmed = aspect.trim()
  if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)$/)
  if (m) return `${m[1]} / ${m[2]}`
  return undefined
}

/**
 * Lightweight Shiki-rendered <pre> for the HTML source view.
 * No line highlight, no scroll-centering — pure "read the source".
 */
function SourcePanel({ code }: { code: string }) {
  const [tokenLines, setTokenLines] = useState<ShikiToken[][] | null>(null)
  const [isDark, setIsDark] = useState(readIsDark)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains('dark'))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let canceled = false
    const highlighted = codePlugin.highlight(
      {
        code,
        language: 'html' as never,
        themes: ['github-light', 'github-dark'],
      },
      (asyncResult) => {
        if (!canceled) {
          setTokenLines(
            (asyncResult as { tokens?: ShikiToken[][] }).tokens ?? null,
          )
        }
      },
    )
    if (!canceled && highlighted) {
      queueMicrotask(() => {
        if (!canceled) {
          setTokenLines(
            (highlighted as { tokens?: ShikiToken[][] }).tokens ?? null,
          )
        }
      })
    }
    return () => {
      canceled = true
    }
  }, [code])

  const lines = code.split('\n')

  return (
    <div className="h-full overflow-auto overscroll-contain" data-lenis-prevent>
      <pre className="px-4 py-4 text-[12px] leading-[1.6] font-mono sm:px-5">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="flex-1 whitespace-pre">
                {tokenLines?.[i]?.length
                  ? tokenLines[i].map((token, ti) => {
                      const lightColor = token.htmlStyle?.color
                      const darkColor = token.htmlStyle?.['--shiki-dark']
                      const color = isDark
                        ? darkColor || lightColor
                        : lightColor
                      return (
                        <span
                          key={`${i}-${ti}`}
                          style={color ? { color } : undefined}
                        >
                          {token.content}
                        </span>
                      )
                    })
                  : line || ' '}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

/**
 * Sticky panel that shows either an iframe preview or the HTML source for
 * the active step. Both are mounted simultaneously and toggled via CSS so
 * iframe runtime state (timers, animations, user input) survives toggling.
 */
function WebPanel({
  step,
  mode,
  onToggle,
}: {
  step: WebStep
  mode: ViewMode
  onToggle: (mode: ViewMode) => void
}) {
  const aspect = parseAspect(step.aspect)
  const fixedHeight = step.height
  // Default body sizing: fill available sticky height; aspect/height override.
  const bodyStyle: React.CSSProperties = {}
  if (aspect) {
    bodyStyle.aspectRatio = aspect
    bodyStyle.height = 'auto'
  } else if (fixedHeight) {
    bodyStyle.height = `${fixedHeight}px`
  } else {
    bodyStyle.flex = '1 1 auto'
    bodyStyle.minHeight = 0
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header: title + view-mode toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {step.title || 'Web'}
        </div>
        <div
          role="tablist"
          aria-label="Web view mode"
          className="inline-flex shrink-0 overflow-hidden rounded-md border border-border text-[11px] font-mono"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            onClick={() => onToggle('preview')}
            className={`px-2.5 py-1 transition-colors ${
              mode === 'preview'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'source'}
            onClick={() => onToggle('source')}
            className={`border-l border-border px-2.5 py-1 transition-colors ${
              mode === 'source'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Source
          </button>
        </div>
      </div>

      {/* Body — both views mounted; visibility toggled to keep iframe state alive */}
      <div className="relative w-full" style={bodyStyle}>
        <div
          className="absolute inset-0"
          style={{ display: mode === 'preview' ? 'block' : 'none' }}
        >
          <iframe
            title={step.title || 'Web preview'}
            srcDoc={step.html}
            sandbox="allow-scripts"
            loading="lazy"
            className="h-full w-full border-0 bg-white"
          />
        </div>
        <div
          className="absolute inset-0 bg-card"
          style={{ display: mode === 'source' ? 'block' : 'none' }}
        >
          <SourcePanel code={step.html} />
        </div>
      </div>
    </div>
  )
}

export function WebWave({ steps }: WebWaveProps) {
  const { currentIndex, setRef } = useVisibleStepIndex(steps.length)
  // View mode is per-step so users can toggle independently per demo.
  const [viewModes, setViewModes] = useState<Record<number, ViewMode>>({})

  // Stable identity for the active step container so framer-motion crossfade triggers per step.
  const activeKey = useMemo(() => `web-${currentIndex}`, [currentIndex])

  if (steps.length === 0) return null

  const activeIndex = Math.min(currentIndex, steps.length - 1)
  const activeStep = steps[activeIndex].step
  const activeMode = viewModes[activeIndex] ?? 'preview'

  return (
    <div className="webwave-container relative">
      <div className="flex items-stretch">
        <div className="w-[50%] shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="flex h-full items-stretch px-6 py-6 xl:px-8">
              <div className="relative flex-1">
                <AnimatePresence mode="sync">
                  <motion.div
                    key={activeKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    <WebPanel
                      step={activeStep}
                      mode={activeMode}
                      onToggle={(m) =>
                        setViewModes((prev) => ({ ...prev, [activeIndex]: m }))
                      }
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[50%]">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              ref={setRef(i) as React.Ref<HTMLDivElement>}
              animate={{ opacity: i === currentIndex ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 24, damping: 12 }}
              className="min-h-[60vh] px-6 py-8 xl:px-8"
            >
              <MarkdownRenderer content={s.prose} />
            </motion.div>
          ))}
          <div className="h-[20vh]" />
        </div>
      </div>
    </div>
  )
}
