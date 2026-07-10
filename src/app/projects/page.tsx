import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { SectionHero } from '@/components/common/SectionHero'
import { TransitionLink } from '@/components/effects/PageTransition'
import {
  projectGroups,
  type ProjectLink,
  type ProjectStatus,
} from '@/lib/projects'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: '开源项目与开发工具',
  description:
    '查看 mcell 持续维护的开源项目与实验作品，涵盖 AI Agent 工具链、开发者工具、前端工程与 Web 应用。',
  path: '/projects',
  keywords: [
    '开源项目',
    'GitHub projects',
    'AI Agent 工具链',
    '开发者工具',
    '前端项目',
    'Web 应用',
    '开发者作品集',
  ],
})

const statusLabel: Record<ProjectStatus, string> = {
  active: '进行中',
  maintained: '维护中',
  archived: '已归档',
}

function getPrimaryLink(links: ProjectLink[]): ProjectLink | null {
  if (links.length === 0) return null
  return (
    links.find((link) => link.label === 'Open') ??
    links.find((link) => link.label === 'GitHub') ??
    links[0]
  )
}

function ProjectOverlayLink({
  link,
  label,
}: {
  link: ProjectLink
  label: string
}) {
  const className = 'absolute inset-0 z-10 rounded-lg'
  const isExternal = /^https?:\/\//.test(link.href)

  if (isExternal) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={label}
      />
    )
  }

  return (
    <TransitionLink href={link.href} className={className} aria-label={label} />
  )
}

export default function ProjectsPage() {
  const totalProjects = projectGroups.reduce(
    (sum, group) => sum + group.projects.length,
    0,
  )

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
      <SectionHero
        title="项目"
        countLabel={`${totalProjects} 个`}
        intro="持续维护的开源项目与实验作品，主要围绕 AI Agent 工具链、开发者工具、前端工程和 Web 应用。"
      />

      <div className="mt-14 space-y-14 sm:mt-20 sm:space-y-20">
        {projectGroups.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title}`}>
            <div className="mb-5 max-w-[680px]">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2
                  id={`group-${group.title}`}
                  className="type-section-title m-0"
                >
                  {group.title}
                </h2>
                <span className="type-caption text-muted-foreground">
                  {group.projects.length} 个
                </span>
              </div>
              {group.description ? (
                <p className="type-meta mb-0 mt-2 text-muted-foreground">
                  {group.description}
                </p>
              ) : null}
            </div>

            <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 lg:grid-cols-3">
              {group.projects.map((project) => {
                const primaryLink = getPrimaryLink(project.links)

                return (
                  <li
                    key={project.name}
                    className="relative rounded-lg bg-card hover:bg-[color:var(--surface-hover)]"
                  >
                    {primaryLink ? (
                      <ProjectOverlayLink
                        link={primaryLink}
                        label={`打开 ${project.name}`}
                      />
                    ) : null}

                    <article className="flex h-full min-h-[210px] flex-col px-6 py-6">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="type-card-title m-0">{project.name}</h3>
                        <span
                          className={`type-caption shrink-0 font-medium ${
                            project.status === 'archived'
                              ? 'text-muted-foreground'
                              : 'text-[color:var(--link-accent)]'
                          }`}
                        >
                          {statusLabel[project.status]}
                        </span>
                      </div>

                      <p className="type-supporting mb-0 mt-3 text-muted-foreground">
                        {project.summary}
                      </p>

                      {primaryLink ? (
                        <span className="type-caption mt-auto inline-flex items-center gap-1.5 pt-5 font-medium text-foreground">
                          {primaryLink.label}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
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
