import React from 'react'
import { siteContent } from '@/lib/site-content'

interface TutorialCoverProps {
  title: string
  description?: string
  issueNumber: string
  stepsCount: number
  composition: string
}

/**
 * Magazine-style full-viewport cover for tutorial detail pages.
 *
 * Behavior (CSS-only, see globals.css `.tutorial-cover` rules):
 *   - sticks to viewport top (height = 100dvh)
 *   - recedes slightly via scroll-driven animation as the stage rises over it
 *   - paired with `<section class="tutorial-stage">` which has margin-top: 100dvh
 */
export function TutorialCover({
  title,
  description,
  issueNumber,
  stepsCount,
  composition,
}: TutorialCoverProps) {
  return (
    <section
      className="tutorial-cover"
      aria-label="Tutorial cover"
      data-issue={issueNumber}
    >
      <div className="tutorial-cover-rule">
        <span>TUTORIAL §{issueNumber}</span>
        <span aria-hidden />
        <span className="hidden sm:inline">
          {siteContent.name.toUpperCase()} · A FIELD JOURNAL
        </span>
      </div>

      <div className="tutorial-cover-center">
        <h1 className="tutorial-cover-title">{title}</h1>
        {description && (
          <>
            <span className="tutorial-cover-divider" aria-hidden />
            <p className="tutorial-cover-standfirst">{description}</p>
          </>
        )}
      </div>

      <div className="tutorial-cover-rule">
        <span>
          {stepsCount} STEPS · {composition}
        </span>
        <span aria-hidden />
        <span className="tutorial-cover-begin">
          BEGIN <span className="tutorial-cover-arrow" aria-hidden>↓</span>
        </span>
      </div>
    </section>
  )
}
