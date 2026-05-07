'use client'

import { InteractiveTutorialView } from '@/components/interactive/InteractiveTutorialView'
import type {
  SerializedCodeStep,
  SerializedImageStep,
  SerializedDemoStep,
  SerializedStep,
} from '@/components/interactive/InteractiveTutorialView'
import type { TutorialContent, TutorialStep } from '@/lib/content-parser'

function toSerializedStep(step: TutorialStep): SerializedStep {
  switch (step.kind) {
    case 'code':
      return {
        kind: 'code',
        code: step.code,
        language: step.language,
        highlightLines: step.highlightLines,
        fileName: step.fileName,
        prose: step.prose,
      } satisfies SerializedCodeStep
    case 'image':
      return {
        kind: 'image',
        src: step.src,
        alt: step.alt,
        prose: step.prose,
      } satisfies SerializedImageStep
    case 'demo':
      return {
        kind: 'demo',
        html: step.html,
        title: step.title,
        height: step.height,
        aspect: step.aspect,
        prose: step.prose,
      } satisfies SerializedDemoStep
  }
}

interface TutorialViewProps {
  tutorial: TutorialContent
}

export function TutorialView({ tutorial }: TutorialViewProps) {
  const serializedSteps: SerializedStep[] = tutorial.steps.map(toSerializedStep)

  return (
    <InteractiveTutorialView
      title={tutorial.metadata.title}
      description={tutorial.metadata.description ?? ''}
      intro={tutorial.intro}
      steps={serializedSteps}
    />
  )
}
