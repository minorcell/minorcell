import type { Metadata } from 'next'
import { ArrowUpRight, Github } from 'lucide-react'
import { SectionHero } from '@/components/common/SectionHero'
import { projectGroups, type ProjectStatus } from '@/lib/projects'
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
                const openLink = project.links.find(
                  (link) => link.label === 'Open',
                )
                const githubLink = project.links.find(
                  (link) => link.label === 'GitHub',
                )

                return (
                  <li key={project.name} className="rounded-lg bg-card">
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

                      {openLink || githubLink ? (
                        <div className="mt-auto flex items-center gap-1 pt-4">
                          {openLink ? (
                            <a
                              href={openLink.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="type-caption inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 font-medium text-foreground transition-colors hover:bg-muted"
                            >
                              打开项目
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                          {githubLink ? (
                            <a
                              href={githubLink.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label={`在 GitHub 查看 ${project.name}`}
                              title="GitHub"
                            >
                              <Github className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
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
