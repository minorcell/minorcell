'use client'

import React from 'react'
import { CodeWave, type StepContent } from './CodeWave'
import { ImageWave, type ImageStepContent } from './ImageWave'

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

export function InteractiveTutorialView({
  title,
  description,
  intro,
  steps,
}: InteractiveTutorialViewProps) {
  const groups = groupSteps(mergeIntroIntoSteps(intro, steps))

  return (
    <div
      className="interactive-tutorial relative"
      aria-label={description || title}
    >
      {/* Step groups — full width */}
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
  )
}
