'use client'

import React from 'react'
import { CodeWave, type StepContent } from './CodeWave'
import { ImageWave, type ImageStepContent } from './ImageWave'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'

export interface SerializedCodeStep {
  kind: 'code'
  code: string
  language: string
  highlightLines?: number[]
  fileName?: string
  prose: string
}

export interface SerializedImageStep {
  kind: 'image'
  src: string
  alt?: string
  prose: string
}

export type SerializedStep = SerializedCodeStep | SerializedImageStep

interface InteractiveTutorialViewProps {
  title: string
  description: string
  intro: string
  steps: SerializedStep[]
}

/**
 * Group consecutive steps of the same kind into sections,
 * so we can render CodeWave/ImageWave blocks appropriately.
 */
function groupSteps(
  steps: SerializedStep[],
): { kind: 'code' | 'image'; steps: SerializedStep[] }[] {
  const groups: { kind: 'code' | 'image'; steps: SerializedStep[] }[] = []

  for (const step of steps) {
    const last = groups[groups.length - 1]
    if (last && last.kind === step.kind) {
      last.steps.push(step)
    } else {
      groups.push({ kind: step.kind, steps: [step] })
    }
  }

  return groups
}

function mergeIntroIntoSteps(
  intro: string,
  steps: SerializedStep[],
): SerializedStep[] {
  const trimmedIntro = intro.trim()
  if (!trimmedIntro || steps.length === 0) {
    return steps
  }

  const [firstStep, ...restSteps] = steps

  return [
    {
      ...firstStep,
      prose: [trimmedIntro, firstStep.prose].filter(Boolean).join('\n\n'),
    },
    ...restSteps,
  ]
}

/**
 * Build a single flat markdown document from all steps for mobile rendering.
 * Each step becomes: optional file label → code fence (or image) → prose.
 */
function buildMobileMarkdown(steps: SerializedStep[]): string {
  const blocks: string[] = []

  steps.forEach((step, i) => {
    const stepLabel = `**Step ${String(i + 1).padStart(2, '0')}**`

    if (step.kind === 'code') {
      const fileLine = step.fileName ? ` · \`${step.fileName}\`` : ''
      blocks.push(`${stepLabel}${fileLine}`)
      blocks.push('```' + (step.language || 'text') + '\n' + step.code + '\n```')
      if (step.prose.trim()) blocks.push(step.prose.trim())
    } else {
      blocks.push(stepLabel)
      const alt = step.alt ? step.alt.replace(/[\[\]]/g, '') : ''
      blocks.push(`![${alt}](${step.src})`)
      if (step.prose.trim()) blocks.push(step.prose.trim())
    }
  })

  return blocks.join('\n\n')
}

export function InteractiveTutorialView({
  title,
  description,
  intro,
  steps,
}: InteractiveTutorialViewProps) {
  const merged = mergeIntroIntoSteps(intro, steps)
  const groups = groupSteps(merged)
  const mobileMarkdown = buildMobileMarkdown(merged)

  return (
    <div
      className="interactive-tutorial relative"
      aria-label={description || title}
    >
      {/* MOBILE — flat, non-interactive rendering with desktop-experience hint */}
      <div className="lg:hidden">
        <aside
          className="mx-auto mb-10 w-full max-w-[920px] border-y border-[color-mix(in_oklab,var(--border)_85%,transparent)] px-6 py-4 sm:px-10"
          role="note"
        >
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            VIEWING NOTE
          </div>
          <p
            className="mt-1.5 text-[14px] leading-[1.55] text-muted-foreground"
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            本专题为「滚动式交互教程」，以左右联动呈现。在手机上为静态平铺版本，
            建议在桌面端（≥ lg 屏宽）阅读，可获得最佳体验。
          </p>
        </aside>

        <div className="mx-auto w-full max-w-[920px] px-6 sm:px-10">
          <MarkdownRenderer content={mobileMarkdown} />
        </div>
      </div>

      {/* DESKTOP — interactive scrollytelling */}
      <div className="hidden lg:block">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.kind === 'code' ? (
              <div className="px-4 sm:px-6 lg:px-8">
                <CodeWave
                  steps={(group.steps as SerializedCodeStep[]).map(
                    (s): StepContent => ({
                      step: {
                        code: s.code,
                        language: s.language,
                        highlightLines: s.highlightLines,
                        fileName: s.fileName,
                      },
                      prose: s.prose,
                    }),
                  )}
                />
              </div>
            ) : (
              <div className="px-4 sm:px-6 lg:px-8">
                <ImageWave
                  steps={(group.steps as SerializedImageStep[]).map(
                    (s): ImageStepContent => ({
                      step: {
                        src: s.src,
                        alt: s.alt,
                      },
                      prose: s.prose,
                    }),
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
