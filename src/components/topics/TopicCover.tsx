import React from 'react'
import { siteContent } from '@/lib/site-content'

interface TopicCoverProps {
  title: string
  description?: string
  issueNumber: string
  stepsCount: number
  composition: string
}

/**
 * Magazine-style full-viewport cover for topic detail pages.
 *
 * Behavior (CSS-only, see globals.css `.topic-cover` rules):
 *   - sticks to viewport top (height = 100dvh)
 *   - recedes slightly via scroll-driven animation as the stage rises over it
 *   - paired with `<section class="topic-stage">` which has margin-top: 100dvh
 */
export function TopicCover({
  title,
  description,
  issueNumber,
  stepsCount,
  composition,
}: TopicCoverProps) {
  return (
    <section
      className="topic-cover"
      aria-label="Topic cover"
      data-issue={issueNumber}
    >
      <div className="topic-cover-rule">
        <span>TOPIC §{issueNumber}</span>
        <span aria-hidden />
        <span className="hidden sm:inline">
          {siteContent.name.toUpperCase()} · A FIELD JOURNAL
        </span>
      </div>

      <div className="topic-cover-center">
        <h1 className="topic-cover-title">{title}</h1>
        {description && (
          <>
            <span className="topic-cover-divider" aria-hidden />
            <p className="topic-cover-standfirst">{description}</p>
          </>
        )}
      </div>

      <div className="topic-cover-rule">
        <span>
          {stepsCount} STEPS · {composition}
        </span>
        <span aria-hidden />
        <span className="topic-cover-begin">
          BEGIN <span className="topic-cover-arrow" aria-hidden>↓</span>
        </span>
      </div>
    </section>
  )
}
