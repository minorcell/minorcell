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
        <h1 className="m-0 text-[2.5rem] font-semibold leading-[1.08] text-foreground sm:text-[3.5rem]">
          {title}
        </h1>
        {countLabel ? (
          <span className="mb-1 text-[13px] font-medium text-[color:var(--link-accent)]">
            {countLabel}
          </span>
        ) : null}
      </div>
      <p className="mb-0 mt-5 max-w-[58ch] text-[1.0625rem] leading-7 text-muted-foreground sm:text-[1.125rem]">
        {intro}
      </p>
    </header>
  )
}
