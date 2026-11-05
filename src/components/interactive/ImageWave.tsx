'use client'

import React from 'react'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { useVisibleStepIndex } from '../../hooks/useVisibleStepIndex'

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
  const { currentIndex, setRef } = useVisibleStepIndex(steps.length)
  if (steps.length === 0) return null

  const activeStep = steps[currentIndex]?.step ?? steps[0].step

  return (
    <div className="imagewave-container relative">
      {/* Desktop-only scrollytelling. Mobile is rendered flat by
       * InteractiveTutorialView. */}
      <div className="flex gap-0 items-start">
        {/* Left: sticky image panel — switches instantly on step change */}
        <div className="w-[50%] shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] flex items-center justify-center">
            <div
              className="relative w-full overflow-hidden rounded-lg bg-card"
              style={{ height: 'calc(100vh - 8rem)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={currentIndex}
                src={activeStep.src}
                alt={activeStep.alt || ''}
                className="absolute inset-0 m-auto max-w-full object-contain"
                style={{ maxHeight: 'calc(100vh - 10rem)' }}
              />
            </div>
          </div>
        </div>

        {/* Right: scrollable prose */}
        <div className="w-[50%] pl-8">
          <div className="h-[20vh]" />
          {steps.map((s, i) => (
            <div
              key={i}
              ref={setRef(i) as React.Ref<HTMLDivElement>}
              className={`min-h-[50vh] py-8 ${
                i === currentIndex ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <MarkdownRenderer content={s.prose} />
            </div>
          ))}
          <div className="h-[20vh]" />
        </div>
      </div>
    </div>
  )
}
