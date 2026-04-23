'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const { currentIndex, setRef } = useScrollProgress(steps.length)
  if (steps.length === 0) return null

  const activeStep = steps[currentIndex]?.step ?? steps[0].step

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
        {/* Left: sticky image panel — crossfades on step change */}
        <div className="w-[50%] shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] flex items-center justify-center">
            <div
              className="relative rounded-lg border border-border bg-card overflow-hidden w-full"
              style={{ height: 'calc(100vh - 8rem)' }}
            >
              <AnimatePresence initial={false} mode="sync">
                <motion.img
                  key={currentIndex}
                  src={activeStep.src}
                  alt={activeStep.alt || ''}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 m-auto max-w-full object-contain"
                  style={{ maxHeight: 'calc(100vh - 10rem)' }}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: scrollable prose — spring opacity matching CodeWave */}
        <div className="w-[50%] pl-8">
          <div className="h-[20vh]" />
          {steps.map((s, i) => (
            <motion.div
              key={i}
              ref={setRef(i) as React.Ref<HTMLDivElement>}
              animate={{ opacity: i === currentIndex ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 24, damping: 12 }}
              className="min-h-[50vh] py-8"
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
