'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createCodePlugin } from '@streamdown/code'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { useScrollProgress } from './useScrollProgress'

export interface CodeStep {
  code: string
  language: string
  highlightLines?: number[]
  fileName?: string
}

export interface StepContent {
  step: CodeStep
  prose: string
}

interface CodeWaveProps {
  steps: StepContent[]
}

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

function CodePanel({ step }: { step: CodeStep }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMountRef = useRef(true)
  const lines = step.code.split('\n')
  const [tokenLines, setTokenLines] = useState<ShikiToken[][] | null>(null)
  const [isDark, setIsDark] = useState(readIsDark)
  const hasHighlight = !!(step.highlightLines && step.highlightLines.length > 0)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains('dark'))
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let canceled = false

    const language = codePlugin.supportsLanguage(step.language as never)
      ? step.language
      : 'text'

    const highlighted = codePlugin.highlight(
      {
        code: step.code,
        language: language as never,
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
  }, [step.code, step.language])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isFirstMount = isMountRef.current
    isMountRef.current = false

    const behavior = isFirstMount ? ('instant' as const) : ('smooth' as const)
    const lineEls = container.querySelectorAll<HTMLElement>('[data-line]')
    const containerRect = container.getBoundingClientRect()

    if (!hasHighlight || !step.highlightLines?.length) {
      const firstEl = lineEls[0]
      if (firstEl) {
        const dy = firstEl.getBoundingClientRect().top - containerRect.top - 16
        container.scrollBy({ top: dy, behavior })
      }
      return
    }

    const minLine = Math.min(...step.highlightLines) - 1
    const maxLine = Math.max(...step.highlightLines) - 1
    const centerLine = Math.round((minLine + maxLine) / 2)
    const el = lineEls[centerLine]
    if (!el) return

    const elRect = el.getBoundingClientRect()
    const dy =
      elRect.top +
      el.offsetHeight / 2 -
      (containerRect.top + container.clientHeight / 2)
    container.scrollBy({ top: dy, behavior })
  }, [step.highlightLines, hasHighlight])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overscroll-contain"
    >
      <pre
        className="px-4 text-[12px] leading-[1.6] font-mono sm:px-5"
        style={{ paddingTop: '20rem', paddingBottom: '20rem' }}
      >
        <code>
          {lines.map((line, i) => {
            const isHighlighted = hasHighlight
              ? step.highlightLines!.includes(i + 1)
              : true
            return (
              <div
                key={i}
                data-line={i}
                className={`flex transition-opacity duration-300 ${
                  isHighlighted ? 'opacity-100' : 'opacity-25'
                }`}
              >
                <span className="flex-1 whitespace-pre">
                  {tokenLines?.[i]?.length
                    ? tokenLines[i].map((token, tokenIndex) => {
                        const lightColor = token.htmlStyle?.color
                        const darkColor = token.htmlStyle?.['--shiki-dark']
                        const color = isDark
                          ? darkColor || lightColor
                          : lightColor
                        return (
                          <span
                            key={`${i}-${tokenIndex}`}
                            style={color ? { color } : undefined}
                          >
                            {token.content}
                          </span>
                        )
                      })
                    : line || ' '}
                </span>
              </div>
            )
          })}
        </code>
      </pre>
    </div>
  )
}

export function CodeWave({ steps }: CodeWaveProps) {
  const { currentIndex, setRef } = useScrollProgress(steps.length)

  if (steps.length === 0) return null

  const activeStep = steps[currentIndex]?.step ?? steps[0].step

  return (
    <div className="codewave-container relative">
      {/* Desktop-only scrollytelling. Mobile is rendered flat by
       * InteractiveTutorialView, so we no longer ship a mobile fallback here. */}
      <div className="flex items-stretch">
        {/* Left: sticky code panel — crossfades on step change */}
        <div className="w-[50%] shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="flex h-full items-center px-6 py-8 xl:px-8">
              <motion.div
                key={activeStep.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="w-full h-[calc(100vh-8rem)]"
              >
                <CodePanel step={activeStep} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right: scrollable prose — spring opacity matching site's stiffness/damping */}
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
