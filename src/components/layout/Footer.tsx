import { Github, Mail, Rss } from 'lucide-react'
import { siteContent } from '@/lib/site-content'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-10">
        <div>
          <div className="swiss-label flex items-center gap-2 text-foreground">
            <span aria-hidden="true" className="swiss-mark !h-1.5 !w-1.5" />
            minorcell
          </div>
          <p className="type-caption mt-3 max-w-[28ch] text-muted-foreground">
            {siteContent.subtitle}
          </p>
        </div>

        <div>
          <div className="swiss-label text-muted-foreground">索引</div>
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {siteContent.sections.map((section, i) => (
              <li key={section.path}>
                {/* oxlint-disable-next-line next/no-html-link-for-pages */}
                <a
                  href={section.path}
                  className="type-caption inline-flex items-baseline gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="text-[0.5625rem] font-medium text-muted-foreground/60">
                    0{i + 1}
                  </span>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="swiss-label text-muted-foreground">联系</div>
          <div className="type-caption mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
            {/* feed.xml is a static public file, not a Next.js page — Link does not apply */}
            {/* oxlint-disable-next-line next/no-html-link-for-pages */}
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
      </div>

      <div className="border-t border-border">
        <div className="type-caption mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2 px-5 py-4 text-muted-foreground sm:px-8 lg:px-10">
          <span>
            &copy; {currentYear} minorcell — 天天学习，好好向上。
          </span>
          <span className="swiss-label !text-[0.5625rem] text-muted-foreground/60">
            Z&uuml;rich &middot; Grid &middot; Helvetica
          </span>
        </div>
      </div>
    </footer>
  )
}
