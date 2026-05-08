'use client'

import React from 'react'
import { CodeWave, type StepContent } from './CodeWave'
import { ImageWave, type ImageStepContent } from './ImageWave'
import { WebWave, type WebStepContent } from './WebWave'
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

export interface SerializedDemoStep {
  kind: 'demo'
  html: string
  title?: string
  height?: number
  aspect?: string
  prose: string
}

export type SerializedStep =
  | SerializedCodeStep
  | SerializedImageStep
  | SerializedDemoStep

interface InteractiveTutorialViewProps {
  title: string
  description: string
  intro: string
  steps: SerializedStep[]
}

type StepKind = SerializedStep['kind']

/**
 * Group consecutive steps of the same kind into sections,
 * so we can render CodeWave/ImageWave/WebWave blocks appropriately.
 */
function groupSteps(
  steps: SerializedStep[],
): { kind: StepKind; steps: SerializedStep[] }[] {
  const groups: { kind: StepKind; steps: SerializedStep[] }[] = []

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
  const merged = mergeIntroIntoSteps(intro, steps)
  const groups = groupSteps(merged)

  return (
    <div
      className="interactive-tutorial relative"
      aria-label={description || title}
    >
      {/* MOBILE — flat, per-step rendering with desktop-experience hint */}
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
              fontFamily: 'var(--font-orbitron), Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            本专题为「滚动式交互教程」，以左右联动呈现。在手机上为静态平铺版本，
            建议在桌面端（≥ lg 屏宽）阅读，可获得最佳体验。
          </p>
        </aside>

        <div className="mx-auto w-full max-w-[920px] px-6 sm:px-10">
          {merged.map((step, i) => (
            <MobileStep key={i} step={step} index={i} />
          ))}
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
            ) : group.kind === 'image' ? (
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
            ) : (
              <div className="px-4 sm:px-6 lg:px-8">
                <WebWave
                  steps={(group.steps as SerializedDemoStep[]).map(
                    (s): WebStepContent => ({
                      step: {
                        html: s.html,
                        title: s.title,
                        height: s.height,
                        aspect: s.aspect,
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

/**
 * Mobile rendering for a single step.
 *
 * - code/image steps: rendered through MarkdownRenderer so they share the
 *   article's typography / Shiki theme.
 * - demo steps: iframe inline + a collapsed source view via <details>.
 */
function MobileStep({ step, index }: { step: SerializedStep; index: number }) {
  const stepLabel = `**Step ${String(index + 1).padStart(2, '0')}**`

  if (step.kind === 'code') {
    const fileLine = step.fileName ? ` · \`${step.fileName}\`` : ''
    const md = [
      `${stepLabel}${fileLine}`,
      '```' + (step.language || 'text') + '\n' + step.code + '\n```',
      step.prose.trim(),
    ]
      .filter(Boolean)
      .join('\n\n')
    return <MarkdownRenderer content={md} />
  }

  if (step.kind === 'image') {
    const alt = step.alt ? step.alt.replace(/[\[\]]/g, '') : ''
    const md = [stepLabel, `![${alt}](${step.src})`, step.prose.trim()]
      .filter(Boolean)
      .join('\n\n')
    return <MarkdownRenderer content={md} />
  }

  // demo
  const titleLine = step.title ? ` · ${step.title}` : ''
  const headerMd = `${stepLabel}${titleLine}`
  const proseMd = step.prose.trim()
  const aspectStyle: React.CSSProperties = {}
  if (step.aspect) {
    const m = step.aspect
      .trim()
      .match(/^(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)$/)
    if (m) aspectStyle.aspectRatio = `${m[1]} / ${m[2]}`
  }
  if (!aspectStyle.aspectRatio && step.height) {
    aspectStyle.height = `${step.height}px`
  }
  if (!aspectStyle.aspectRatio && !aspectStyle.height) {
    aspectStyle.height = '320px'
  }

  return (
    <div className="my-8">
      <MarkdownRenderer content={headerMd} />
      <div
        className="my-4 overflow-hidden rounded-lg border border-border bg-white"
        style={aspectStyle}
      >
        <iframe
          title={step.title || 'Demo preview'}
          srcDoc={step.html}
          sandbox="allow-scripts"
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
      <details className="my-4 rounded-md border border-border bg-card text-[13px]">
        <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          查看源码
        </summary>
        <div className="border-t border-border">
          <MarkdownRenderer content={'```html\n' + step.html + '\n```'} />
        </div>
      </details>
      {proseMd && <MarkdownRenderer content={proseMd} />}
    </div>
  )
}
