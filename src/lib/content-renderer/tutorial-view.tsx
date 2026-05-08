'use client'

import { InteractiveTutorialView } from '@/components/interactive/InteractiveTutorialView'
import type {
  SerializedCodeStep,
  SerializedImageStep,
  SerializedDemoStep,
  SerializedStep,
} from '@/components/interactive/InteractiveTutorialView'
import { GiscusComments } from '@/components/common/GiscusComments'
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
  discussionTerm: string
}

export function TutorialView({ tutorial, discussionTerm }: TutorialViewProps) {
  const serializedSteps: SerializedStep[] = tutorial.steps.map(toSerializedStep)

  return (
    <>
      <InteractiveTutorialView
        title={tutorial.metadata.title}
        description={tutorial.metadata.description ?? ''}
        intro={tutorial.intro}
        steps={serializedSteps}
      />

      <section className="mx-auto w-full max-w-[920px] px-6 sm:px-10">
        <hr className="section-divider" />

        <section className="mt-12">
          <div className="mb-6 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
            <h2
              className="m-0 text-[clamp(1.25rem,1.05rem+0.8vw,1.6rem)] tracking-[-0.02em]"
              style={{
                fontFamily: 'var(--font-orbitron), Georgia, serif',
                fontWeight: 700,
              }}
            >
              Discussion
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              留言区
            </span>
          </div>
          <GiscusComments term={discussionTerm} />
        </section>
      </section>
    </>
  )
}
