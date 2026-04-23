'use client'

import React from 'react'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { useScrollProgress } from './useScrollProgress'

export interface ImageStep {
  src: string
  alt?: string
}

export interface ImageStepContent {
  step: ImageStep
  prose: string
}

interface ImageWaveProps {
  steps: ImageStepContent[]
}

export function ImageWave({ steps }: ImageWaveProps) {
  const { progress, setRef } = useScrollProgress(steps.length)
  if (steps.length === 0) return null

  return (
    <div className="imagewave-container relative">
      {/* Mobile: stacked layout */}
      <div className="lg:hidden space-y-8">
        {steps.map((s, i) => (
          <div key={i}>
            <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
              <img
                src={s.step.src}
                alt={s.step.alt || ''}
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="prose-sm">
              <MarkdownRenderer content={s.prose} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: side-by-side scrollytelling */}
      <div className="hidden lg:flex gap-0 items-start">
        {/* Left: sticky image panel — prev/curr/next crossfade */}
        <div className="w-[50%] shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] flex items-center justify-center">
            <div
              className="relative rounded-lg border border-border bg-card overflow-hidden w-full"
              style={{ height: 'calc(100vh - 8rem)' }}
            >
              {steps.map((s, i) => {
                const dist = Math.abs(i - progress)
                const opacity = Math.max(0, 1 - dist)
                if (opacity <= 0) return null
                return (
                  <img
                    key={i}
                    src={s.step.src}
                    alt={s.step.alt || ''}
                    className="absolute inset-0 m-auto max-w-full object-contain"
                    style={{ maxHeight: 'calc(100vh - 10rem)', opacity }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: scrollable prose */}
        <div className="w-[50%] pl-8">
          <div className="h-[40vh]" />
          {steps.map((s, i) => {
            const dist = Math.abs(i - progress)
            const opacity = dist < 1 ? 0.3 + 0.7 * (1 - dist) : 0.3
            return (
              <div
                key={i}
                ref={setRef(i)}
                className="min-h-[50vh] py-8"
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
