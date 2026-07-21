import type { ReactNode } from 'react'

interface SectionHeroProps {
  title: string
  intro: ReactNode
  countLabel?: string
}

export function SectionHero({ title, intro, countLabel }: SectionHeroProps) {
  return (
    <header className="max-w-[760px] pt-10 sm:pt-16">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <h1 className="type-page-title m-0 text-foreground">{title}</h1>
        {countLabel ? (
          <span className="type-caption mb-1 font-medium text-link-accent">
            {countLabel}
          </span>
        ) : null}
      </div>
      <p className="type-intro mb-0 mt-5 max-w-[58ch] text-muted-foreground">
        {intro}
      </p>
    </header>
  )
}
