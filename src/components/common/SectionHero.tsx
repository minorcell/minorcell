import type { ReactNode } from 'react'

interface SectionHeroProps {
  title: string
  intro: ReactNode
  countLabel?: string
}

export function SectionHero({ title, intro, countLabel }: SectionHeroProps) {
  return (
    <header className="border-b border-border pb-10 pt-10 sm:pb-14 sm:pt-16">
      <div className="flex items-baseline justify-between gap-4">
        <span className="swiss-label text-muted-foreground">Archive</span>
        {countLabel ? (
          <span className="swiss-label flex items-center gap-2 text-link-accent">
            <span aria-hidden="true" className="swiss-mark !h-1.5 !w-1.5" />
            {countLabel}
          </span>
        ) : null}
      </div>
      <h1 className="type-page-title m-0 mt-6 tracking-tight">{title}</h1>
      <p className="type-intro m-0 mt-5 max-w-[58ch] text-muted-foreground">
        {intro}
      </p>
    </header>
  )
}
