import { Github, Mail, Rss } from 'lucide-react'
import { siteContent } from '@/lib/site-content'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-card/55">
      <div className="type-caption mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-7 text-muted-foreground sm:px-8 lg:px-10">
        <span>&copy; {currentYear} Minor Cell</span>

        <div className="flex items-center gap-4">
          <a
            href="/feed.xml"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Rss className="h-3.5 w-3.5" />
            RSS
          </a>
          {siteContent.contact.github ? (
            <a
              href={siteContent.contact.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          ) : null}
          {siteContent.contact.email ? (
            <a
              href={`mailto:${siteContent.contact.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              邮件
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
