import type { ReactNode } from 'react'

interface SectionHeroProps {
  sectionLabel: string
  sectionCountLabel?: string
  dateLabel: string
  title: ReactNode
  introLabel: string
  intro: ReactNode
}

export function SectionHero({
  sectionLabel,
  sectionCountLabel,
  dateLabel,
  title,
  introLabel,
  intro,
}: SectionHeroProps) {
  return (
    <header>
      <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <div className="flex items-center gap-5">
          <span>{sectionLabel}</span>
          {sectionCountLabel ? (
            <span className="hidden sm:inline">{sectionCountLabel}</span>
          ) : null}
        </div>
        <span>{dateLabel}</span>
      </div>

      <h1
        className="m-0 mt-9 text-[clamp(2.8rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em] text-pretty sm:text-balance"
        style={{
          fontFamily: 'var(--font-orbitron), Georgia, serif',
          fontWeight: 800,
        }}
      >
        {title}
      </h1>

      <div className="mt-7 grid gap-4 sm:mt-9 sm:grid-cols-[220px_1fr] sm:gap-10">
        <div className="pt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span
            aria-hidden
            className="mr-2.5 inline-block h-px w-6 bg-foreground align-middle"
          />
          {introLabel}
        </div>
        <p className="m-0 max-w-[42ch] text-[clamp(1.05rem,1rem+0.5vw,1.3rem)] leading-[1.55] tracking-[-0.005em]">
          {intro}
        </p>
      </div>
    </header>
  )
}
