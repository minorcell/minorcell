import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { projectGroups, projectQuickLinks, type ProjectStatus } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Projects',
  description: '我创建或长期维护的一些项目。',
}

const statusLabel: Record<ProjectStatus, string> = {
  active: 'Active',
  maintained: 'Maintained',
  archived: 'Archived',
}

const isExternalLink = (href: string) => /^https?:\/\//.test(href)

function ProjectLink({
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
      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
    </>
  )

  if (isExternalLink(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
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
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16">
      <header className="mb-14 text-center">
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight mb-3">
          Projects
        </h1>
        <p className="text-muted-foreground text-lg">
          Projects that I created or maintain.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {projectQuickLinks.map((item) => (
            <ProjectLink
              key={`${item.label}-${item.href}`}
              href={item.href}
              label={item.label}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            />
          ))}
        </div>
      </header>

      <div className="space-y-14">
        {projectGroups.map((group) => (
          <section key={group.title}>
            <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground/10 leading-none mb-2">
              {group.title}
            </h2>

            {group.description && (
              <p className="text-sm text-muted-foreground mb-6">
                {group.description}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {group.projects.map((project) => (
                <article
                  key={project.name}
                  className="rounded-xl border border-border/60 bg-background/70 p-5 transition-colors hover:border-border hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-medium text-foreground">
                      {project.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] uppercase tracking-wide',
                        project.status === 'archived'
                          ? 'text-muted-foreground'
                          : 'text-foreground/80',
                      )}
                    >
                      {statusLabel[project.status]}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed min-h-[3rem]">
                    {project.summary}
                  </p>

                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={`${project.name}-${tag}`}
                          className="inline-flex items-center rounded-full border border-border/50 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.links.map((item) => (
                      <ProjectLink
                        key={`${project.name}-${item.label}-${item.href}`}
                        href={item.href}
                        label={item.label}
                        className="inline-flex items-center gap-1 rounded-md border border-border/55 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
