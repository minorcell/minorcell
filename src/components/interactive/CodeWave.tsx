'use client'

import React, { useRef, useEffect } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const lines = step.code.split('\n')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 })
  }, [step.code, step.highlightLines])

  return (
    <div className="h-full">
      <div ref={scrollRef} className="max-h-full overflow-auto">
        <pre className="px-4 py-3 text-[13px] leading-[1.7] font-mono">
          <code>
            {lines.map((line, i) => {
              const lineNum = i + 1
              const hasHighlight =
                step.highlightLines && step.highlightLines.length > 0
              const isHighlighted = hasHighlight
                ? step.highlightLines!.includes(lineNum)
                : true
              return (
                <div
                  key={i}
                  className={`flex transition-opacity duration-300 ${
                    isHighlighted ? 'opacity-100' : 'opacity-25'
                  }`}
                >
                  <span className="select-none w-8 shrink-0 text-right mr-3 text-muted-foreground/40 text-xs leading-[1.7]">
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre">{line}</span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function CodeWave({ steps }: CodeWaveProps) {
  const { progress, setRef } = useScrollProgress(steps.length)
  const activeIndex = Math.round(progress)

  if (steps.length === 0) return null

  const activeStep = steps[activeIndex]?.step ?? steps[0].step

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
        {/* Left: sticky code panel */}
        <div className="w-[55%] shrink-0 border-r border-border/30">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="flex h-full items-center px-8 py-10">
              <div className="w-full max-h-[min(36rem,calc(100vh-8rem))]">
                <CodePanel step={activeStep} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: scrollable prose — top/bottom padding anchors first/last step to center */}
        <div className="w-[45%]">
          <div className="h-[40vh]" />
          {steps.map((s, i) => {
            const dist = Math.abs(i - progress)
            const opacity = dist < 1 ? 0.3 + 0.7 * (1 - dist) : 0.3
            return (
              <div
                key={i}
                ref={setRef(i)}
                className="min-h-[60vh] px-8 py-10"
                style={{ opacity, transition: 'opacity 0.15s ease' }}
              >
                <MarkdownRenderer content={s.prose} />
              </div>
            )
          })}
          <div className="h-[40vh]" />
        </div>
      </div>
    </div>
  )
}
