'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
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

function CodePanel({ step }: { step: CodeStep }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMountRef = useRef(true)
  const lines = step.code.split('\n')
  const hasHighlight = !!(step.highlightLines && step.highlightLines.length > 0)

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
    <div ref={containerRef} className="h-full overflow-y-auto">
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
                <span className="flex-1 whitespace-pre">{line || ' '}</span>
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
      {/* Mobile: stacked layout */}
      <div className="lg:hidden space-y-6">
        {steps.map((s, i) => (
          <div key={i}>
            <div className="mb-3 max-h-[50vh] overflow-hidden">
              <CodePanel step={s.step} />
            </div>
            <div className="px-1">
              <MarkdownRenderer content={s.prose} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: side-by-side scrollytelling */}
      <div className="hidden lg:flex items-stretch">
        {/* Left: sticky code panel — crossfades on step change */}
        <div className="w-[50%] shrink-0 border-r border-border/30">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="flex h-full items-center px-6 py-8 xl:px-8">
              <motion.div
                key={activeStep.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="w-full h-[min(36rem,calc(100vh-8rem))]"
              >
                <CodePanel step={activeStep} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right: scrollable prose — spring opacity matching site's stiffness/damping */}
        <div className="w-[50%]">
          <div className="h-[20vh]" />
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
