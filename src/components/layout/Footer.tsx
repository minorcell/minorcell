import Link from 'next/link'
import { siteContent } from '@/lib/site-content'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto">
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] py-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>&copy; {currentYear} · MCELL</span>
            <span className="hidden sm:inline">STACK.MCELL.TOP</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/blog"
              className="transition-colors hover:text-foreground hover:opacity-100"
            >
              文章
            </Link>
            <Link
              href="/projects"
              className="transition-colors hover:text-foreground hover:opacity-100"
            >
              项目
            </Link>
            <Link
              href="/topics"
              className="transition-colors hover:text-foreground hover:opacity-100"
            >
              专题
            </Link>
            <Link
              href="/feed.xml"
              className="transition-colors hover:text-foreground hover:opacity-100"
            >
              RSS
            </Link>
            <span aria-hidden className="text-foreground/30">
              ·
            </span>
            {siteContent.contact.github && (
              <a
                href={siteContent.contact.github}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[color:var(--link-accent)] hover:opacity-100"
              >
                GITHUB ↗
              </a>
            )}
            <a
              href="https://juejin.cn/user/2280829967146779"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[color:var(--link-accent)] hover:opacity-100"
            >
              掘金 ↗
            </a>
            <a
              href="https://space.bilibili.com/1410369961"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[color:var(--link-accent)] hover:opacity-100"
            >
              BILIBILI ↗
            </a>
            {siteContent.contact.email && (
              <a
                href={`mailto:${siteContent.contact.email}`}
                className="transition-colors hover:text-[color:var(--link-accent)] hover:opacity-100"
              >
                EMAIL ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
