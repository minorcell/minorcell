import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  projectGroups,
  projectQuickLinks,
  type ProjectStatus,
} from '@/lib/projects'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Projects 开源项目与作品集',
  description:
    '查看 mcell 持续维护的开源项目与实验作品，涵盖 AI 工具链、前端工程、MCP 生态与效率型开发工具。',
  path: '/projects',
  keywords: [
    '开源项目',
    'GitHub projects',
    'AI 工程项目',
    '前端项目',
    'MCP 项目',
    '开发者作品集',
  ],
})

const statusLabel: Record<ProjectStatus, string> = {
  active: 'Active',
  maintained: 'Maintained',
  archived: 'Archived',
}

const isExternalLink = (href: string) => /^https?:\/\//.test(href)

const formatIsoDate = (value: Date) =>
  `${value.getFullYear()} · ${String(value.getMonth() + 1).padStart(2, '0')} · ${String(value.getDate()).padStart(2, '0')}`

const pad = (n: number) => String(n).padStart(2, '0')

function ProjectLinkInline({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  const content = (
    <>
      <span>{label}</span>
      <ArrowUpRight className="h-3 w-3 opacity-70" />
    </>
  )
  if (isExternalLink(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

export default function ProjectsPage() {
  const totalProjects = projectGroups.reduce(
    (sum, g) => sum + g.projects.length,
    0,
  )

  const orbitron = {
    fontFamily: 'var(--font-orbitron), Georgia, serif',
  } as const
  const accentBlue = 'oklch(0.86 0.05 220)'

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      {/* MASTHEAD */}
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-5">
            <span>SECTION §02 · WORKSHOP</span>
            <span className="hidden sm:inline">{totalProjects} ITEMS</span>
          </div>
          <span>{formatIsoDate(new Date())}</span>
        </div>

        <h1
          className="m-0 mt-9 text-[clamp(2.8rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em]"
          style={{ ...orbitron, fontWeight: 800, textWrap: 'balance' }}
        >
          The{' '}
          <span
            className="text-muted-foreground"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            &amp;
          </span>{' '}
          Workshop
        </h1>

        <div className="mt-7 grid gap-4 sm:mt-9 sm:grid-cols-[220px_1fr] sm:gap-10">
          <div className="pt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span
              aria-hidden
              className="mr-2.5 inline-block h-px w-6 bg-foreground align-middle"
            />
            BUILD LOG
          </div>
          <p className="m-0 max-w-[42ch] text-[clamp(1.05rem,1rem+0.5vw,1.3rem)] leading-[1.55] tracking-[-0.005em]">
            正在维护与曾经造过的轮子——从 AI
            工具链到日常效率脚手架，按主题分组，每条都附实现笔记或源码入口。
          </p>
        </div>

        {/* Quick links row */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            QUICK LINKS
          </span>
          {projectQuickLinks.map((item) => (
            <ProjectLinkInline
              key={`${item.label}-${item.href}`}
              href={item.href}
              label={item.label}
              className="inline-flex items-center gap-1.5 border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:oklch(0.86_0.05_220)] hover:text-[color:oklch(0.86_0.05_220)] hover:opacity-100"
            />
          ))}
        </div>
      </header>

      {/* PROJECT GROUPS */}
      <div className="mt-20 space-y-20 sm:mt-24 sm:space-y-24">
        {projectGroups.map((group, gIdx) => (
          <section key={group.title} className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 right-0 select-none text-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] sm:-top-14"
              style={{
                ...orbitron,
                fontWeight: 800,
                fontSize: 'clamp(3.5rem, 9vw, 7rem)',
                letterSpacing: '-0.06em',
                lineHeight: 1,
                zIndex: -1,
              }}
            >
              §{pad(gIdx + 1)}
            </span>

            <div className="mb-2 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
              <h2
                className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
                style={{ ...orbitron, fontWeight: 700 }}
              >
                {group.title}
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {group.projects.length} ITEMS
              </span>
            </div>

            {group.description && (
              <p className="mb-2 mt-4 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground">
                {group.description}
              </p>
            )}

            <ol className="m-0 mt-4 list-none p-0 md:grid md:grid-cols-2 lg:grid-cols-3">
              {group.projects.map((project, idx) => {
                const colMd = idx % 2
                const colLg = idx % 3
                return (
                  <li
                    key={project.name}
                    className={cn(
                      'border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0',
                      // md (2-col): right column has left border
                      colMd === 1 &&
                        'md:border-l md:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]',
                      // lg (3-col): override md borders
                      colLg === 0 && 'lg:border-l-0',
                      (colLg === 1 || colLg === 2) &&
                        'lg:border-l lg:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]',
                    )}
                  >
                    <article
                      className={cn(
                        'grid h-full items-start gap-4 py-7 sm:gap-5 sm:py-8',
                        // padding inside grid cells
                        colMd === 0 && 'md:pr-8 lg:pr-6',
                        colMd === 1 && 'md:pl-8 lg:pl-6 lg:pr-6',
                        colLg === 0 && 'lg:pl-0',
                        colLg === 2 && 'lg:pr-0',
                      )}
                      style={{ gridTemplateColumns: '52px 1fr' }}
                    >
                      <div
                        className="text-muted-foreground"
                        style={{
                          ...orbitron,
                          fontWeight: 500,
                          fontSize: 'clamp(1.2rem, 1.05rem + 0.5vw, 1.55rem)',
                          letterSpacing: '-0.01em',
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight: 1.1,
                        }}
                      >
                        {pad(idx + 1)}
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 flex items-baseline justify-between gap-3">
                          <h3
                            className="m-0 text-[clamp(1.15rem,1.05rem+0.4vw,1.4rem)] leading-[1.25] tracking-[-0.01em]"
                            style={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                              fontWeight: 500,
                              textWrap: 'balance',
                            }}
                          >
                            {project.name}
                          </h3>
                          <span
                            className={cn(
                              'shrink-0 font-mono text-[10px] uppercase tracking-[0.22em]',
                              project.status === 'archived'
                                ? 'text-muted-foreground/60'
                                : 'text-foreground/75',
                            )}
                          >
                            {statusLabel[project.status]}
                          </span>
                        </div>

                        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                          {project.summary}
                        </p>

                        {project.tags && project.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/80">
                            {project.tags.map((tag) => (
                              <span key={`${project.name}-${tag}`}>#{tag}</span>
                            ))}
                          </div>
                        )}

                        {project.links.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                            {project.links.map((item) => (
                              <ProjectLinkInline
                                key={`${project.name}-${item.label}-${item.href}`}
                                href={item.href}
                                label={item.label}
                                className="inline-flex items-center gap-1 border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:oklch(0.86_0.05_220)] hover:text-[color:oklch(0.86_0.05_220)] hover:opacity-100"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
