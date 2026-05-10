'use client'

import { TransitionLink } from '@/components/effects/PageTransition'

const spineColors = [
  'oklch(0.55 0.05 70)',
  'oklch(0.48 0.06 250)',
  'oklch(0.42 0.05 290)',
  'oklch(0.52 0.04 150)',
]

interface BookCardProps {
  slug: string
  title: string
  description?: string
  volumeCount: number
  chapterCount: number
  index: number
}

export function BookCard({
  slug,
  title,
  description,
  volumeCount,
  chapterCount,
  index,
}: BookCardProps) {
  const spineColor = spineColors[index % spineColors.length]

  return (
    <TransitionLink
      href={`/books/${slug}`}
      className="group relative flex w-[220px] flex-col rounded-[3px_6px_6px_3px] border border-border bg-card transition-all duration-[0.35s] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1.5 hover:border-[var(--link-accent)] max-sm:w-[160px]"
      style={{
        minHeight: 280,
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.04), 2px 3px 6px rgba(0,0,0,0.06)',
      }}
    >
      {/* Spine */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-sm transition-all duration-[0.35s] group-hover:w-2"
        style={{ backgroundColor: spineColor }}
      />

      {/* Cover content */}
      <div className="flex flex-1 flex-col py-[1.35rem] pr-5 pl-7">
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
          {volumeCount} 卷 · {chapterCount} 章
        </div>
        <div
          className="mb-2 text-[1.15em] leading-[1.3] tracking-[-0.01em] text-foreground"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 600,
          }}
        >
          {title}
        </div>
        {description && (
          <div className="line-clamp-3 text-[0.82em] leading-[1.45] text-muted-foreground">
            {description}
          </div>
        )}
        <div className="mt-auto border-t border-border pt-3 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
          {chapterCount} 章
        </div>
      </div>
    </TransitionLink>
  )
}
