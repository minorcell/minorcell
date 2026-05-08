import type { Metadata } from 'next'
import { TransitionLink } from '@/components/effects/PageTransition'
import { ArrowUpRight } from 'lucide-react'
import { SectionHero } from '@/components/common/SectionHero'
import { cn } from '@/lib/utils'
import { projectGroups, type ProjectLink, type ProjectStatus } from '@/lib/projects'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Projects 开源项目与作品集',
  description:
    '查看 mcell 持续维护的开源项目与实验作品，涵盖 AI 工具链、前端工程与效率型开发工具。',
  path: '/projects',
  keywords: [
    '开源项目',
    'GitHub projects',
    'AI 工程项目',
    '前端项目',
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

function getPrimaryLink(links: ProjectLink[]): ProjectLink | null {
  if (links.length === 0) return null
  const open = links.find((l) => l.label === 'Open')
  if (open) return open
  const github = links.find((l) => l.label === 'GitHub')
  if (github) return github
  return links[0]
}

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
    <TransitionLink href={href} className={className}>
      {content}
    </TransitionLink>
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

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      <SectionHero
        sectionLabel="SECTION §02 · WORKSHOP"
        sectionCountLabel={`${totalProjects} ITEMS`}
        dateLabel={formatIsoDate(new Date())}
        introLabel="BUILD LOG"
        title="The & Workshop"
        intro="正在维护与曾经造过的轮子——从 AI 工具链到日常效率脚手架，按主题分组，每条都附实现笔记或源码入口。"
      />

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
                      'group relative cursor-pointer border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] transition-colors duration-200 hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] last:border-b-0',
                      // md (2-col): right column has left border
                      colMd === 1 &&
                        'md:border-l md:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]',
                      // lg (3-col): override md borders
                      colLg === 0 && 'lg:border-l-0',
                      (colLg === 1 || colLg === 2) &&
                        'lg:border-l lg:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]',
                    )}
                  >
                    {/* Card overlay link — Open > GitHub > first link */}
                    {(() => {
                      const primary = getPrimaryLink(project.links)
                      if (!primary) return null
                      const isExternal = /^https?:\/\//.test(primary.href)
                      const link = (
                        <a
                          href={primary.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noreferrer' : undefined}
                          className="absolute inset-0 z-10"
                          aria-label={project.name}
                        />
                      )
                      return link
                    })()}

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
                        className="text-muted-foreground transition-colors duration-200 group-hover:text-[color:var(--link-accent)]"
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
                            className="m-0 text-[clamp(1.15rem,1.05rem+0.4vw,1.4rem)] leading-[1.25] tracking-[-0.01em] text-pretty transition-colors duration-200 group-hover:text-[color:var(--link-accent)] sm:text-balance"
                            style={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                              fontWeight: 500,
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
                          <div className="relative z-20 mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                            {project.links.map((item) => (
                              <ProjectLinkInline
                                key={`${project.name}-${item.label}-${item.href}`}
                                href={item.href}
                                label={item.label}
                                className="inline-flex items-center gap-1 border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:var(--link-accent)] hover:text-[color:var(--link-accent)] hover:opacity-100"
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
