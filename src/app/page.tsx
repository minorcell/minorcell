import type { Metadata } from 'next'
import Link from 'next/link'
import { siteContent } from '@/lib/site-content'
import { getAllPosts } from '@/lib/mdx'
import { buildPageMetadata } from '@/lib/seo'
import { MagneticTitle } from '@/components/effects/MagneticTitle'

const homeMetadata = buildPageMetadata({
  title: 'Cell Stack | AI Agent 与全栈开发技术博客',
  description:
    'Cell Stack 聚焦 AI Agent、JavaScript、TypeScript、React、Next.js 与工程实践，持续分享教程、专题文章、项目复盘与可落地代码示例。',
  path: '/',
  keywords: [
    'AI Agent 教程',
    'JavaScript 教程',
    'TypeScript 教程',
    'React 教程',
    'Next.js 教程',
    '全栈开发博客',
  ],
})

export const metadata: Metadata = {
  ...homeMetadata,
  title: {
    absolute: 'Cell Stack | AI Agent 与全栈开发技术博客',
  },
}

const formatShortDate = (value: string) => {
  const date = new Date(value)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}.${d}`
}

const formatIsoDate = (value: Date) => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${d}`
}

const padIssue = (n: number) => String(n).padStart(2, '0')

const SECTION_KICKERS = ['§ 01 · Features', '§ 02 · Workshop', '§ 03 · Series']

export default function HomePage() {
  const allPosts = getAllPosts('blog').sort(
    (a, b) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  )

  const posts = allPosts.slice(0, 5)
  const latestDate = allPosts[0]?.metadata.date
    ? new Date(allPosts[0].metadata.date)
    : new Date()
  const volumeYear = latestDate.getFullYear()
  const issueNo = padIssue(allPosts.length)

  return (
    <div className="mx-auto w-full px-6 pb-24 sm:px-10 sm:pb-32 lg:px-16 xl:px-24">
      {/* ─────────── MASTHEAD — fills first viewport ─────────── */}
      <header
        data-section="HERO"
        className="flex min-h-[calc(100dvh-3.5rem)] flex-col justify-between pt-10 pb-8 sm:pt-14 sm:pb-10"
      >
        {/* Top — issue bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--link-accent)]"
              />
              ISSUE №{issueNo} · VOL. {volumeYear}
            </span>
            <span className="hidden sm:inline">持续刊行</span>
          </div>
          <span>{formatIsoDate(latestDate)}</span>
        </div>

        {/* Middle — title block, vertically centred in remaining space */}
        <div className="flex flex-col justify-center py-8">
          <MagneticTitle
            text="Cell & Stack"
            className="m-0 text-[clamp(3.4rem,11vw,9rem)] leading-[0.92] tracking-[-0.04em] text-pretty sm:text-balance"
            style={{
              fontFamily: 'var(--font-orbitron), Georgia, serif',
              fontWeight: 800,
              fontVariationSettings: '"wght" 800',
            }}
            ampClassName="text-muted-foreground"
            ampStyle={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          />

          <div className="mt-7 grid gap-4 sm:mt-9 sm:grid-cols-[220px_1fr] sm:gap-10">
            <div className="pt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span
                aria-hidden
                className="mr-2.5 inline-block h-px w-6 align-middle bg-foreground"
              />
              A FIELD JOURNAL
            </div>
            <p className="m-0 max-w-[38ch] text-[clamp(1.15rem,1.05rem+0.6vw,1.45rem)] leading-[1.5] tracking-[-0.005em]">
              一份关于{' '}
              <em className="not-italic text-muted-foreground italic">
                AI Agent、全栈工程与日常实践
              </em>{' '}
              的个人刊物——记录想法、复盘项目、整理那些值得被写下来的代码。
            </p>
          </div>
        </div>

        {/* Bottom — scroll cue */}
        <div className="flex items-center justify-between gap-4 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>EDITOR&rsquo;S NOTE · IN THIS ISSUE</span>
          <span aria-hidden>SCROLL ↓</span>
        </div>
      </header>

      {/* ─────────── EDITOR'S NOTE ─────────── */}
      <section
        data-section="EDITOR'S NOTE"
        className="mt-20 grid gap-4 sm:mt-24 sm:grid-cols-[220px_1fr] sm:gap-10"
      >
        <h2 className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Editor&rsquo;s Note
        </h2>
        <div className="space-y-4">
          <p className="m-0 leading-relaxed text-foreground/92">
            我是
            <a
              href={siteContent.contact.github}
              target="_blank"
              rel="noreferrer"
              className="mx-1 underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              mcell
            </a>
            。这里不追热点，只把工作中真实碰到的问题、读过的代码、做过的判断写下来。
          </p>
          <p className="m-0 leading-relaxed text-foreground/92">
            愿某一篇能在某个深夜帮你少绕一个弯。
          </p>
        </div>
      </section>

      {/* ─────────── IN THIS ISSUE ─────────── */}
      <section data-section="IN THIS ISSUE" className="relative mt-24 sm:mt-28">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-14 right-0 select-none text-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] sm:-top-20"
          style={{
            fontFamily: 'var(--font-orbitron), serif',
            fontWeight: 800,
            fontSize: 'clamp(5rem, 12vw, 11rem)',
            letterSpacing: '-0.06em',
            lineHeight: 1,
            zIndex: -1,
          }}
        >
          {volumeYear}
        </span>

        <div className="flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
            style={{
              fontFamily: 'var(--font-orbitron), Georgia, serif',
              fontWeight: 700,
            }}
          >
            In This Issue
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            本期 {posts.length} 篇 · LATEST
          </span>
        </div>

        {posts.length > 0 ? (
          <>
            {/* HERO: №01 */}
            <Link
              href={`/blog/${posts[0].slug}`}
              className="row-link group block border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] px-3 py-8 hover:opacity-100 sm:px-5 sm:py-12"
            >
              <div className="grid items-start gap-5 sm:grid-cols-[120px_1fr_140px] sm:gap-10">
                <span
                  className="text-muted-foreground transition-colors duration-200 ease-out group-hover:text-[color:var(--link-accent)]"
                  style={{
                    fontFamily: 'var(--font-orbitron), serif',
                    fontWeight: 500,
                    fontSize: 'clamp(2.2rem, 1.6rem + 1.6vw, 3.2rem)',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {padIssue(1)}
                </span>
                <div className="min-w-0">
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    LEADING ARTICLE · 本期主推
                  </div>
                  <h3
                    className="m-0 text-[clamp(1.6rem,1.2rem+1.6vw,2.8rem)] leading-[1.12] tracking-[-0.015em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontWeight: 500,
                    }}
                  >
                    {posts[0].metadata.title}
                  </h3>
                  {posts[0].metadata.description && (
                    <p className="mt-4 line-clamp-2 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
                      {posts[0].metadata.description}
                    </p>
                  )}
                </div>
                <div className="flex items-baseline gap-3 whitespace-nowrap font-mono text-[12px] tracking-[0.12em] text-muted-foreground sm:justify-end">
                  <time>{formatShortDate(posts[0].metadata.date)}</time>
                  <span aria-hidden className="row-link-arrow text-[14px]">
                    →
                  </span>
                </div>
              </div>
            </Link>

            {/* 02-05: 2-col grid on lg */}
            {posts.length > 1 && (
              <ol className="m-0 list-none p-0 lg:grid lg:grid-cols-2">
                {posts.slice(1).map((post, i) => {
                  const idx = i + 1
                  const isLeftCol = i % 2 === 0
                  return (
                    <li
                      key={post.slug}
                      className={`border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0 ${
                        !isLeftCol
                          ? 'lg:border-l lg:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]'
                          : ''
                      }`}
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className={`row-link group grid items-start gap-5 px-3 py-7 hover:opacity-100 sm:gap-7 sm:px-4 ${
                          !isLeftCol ? 'lg:pl-10' : 'lg:pr-10'
                        }`}
                        style={{ gridTemplateColumns: '64px 1fr auto' }}
                      >
                        <span
                          className="text-muted-foreground transition-colors duration-200 ease-out group-hover:text-[color:var(--link-accent)]"
                          style={{
                            fontFamily: 'var(--font-orbitron), serif',
                            fontWeight: 500,
                            fontSize: 'clamp(1.3rem, 1.1rem + 0.5vw, 1.7rem)',
                            letterSpacing: '-0.01em',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {padIssue(idx + 1)}
                        </span>
                        <div className="min-w-0">
                          <span
                            className="text-[clamp(1.05rem,1rem+0.4vw,1.35rem)] leading-[1.28] tracking-[-0.005em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
                            style={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                            }}
                          >
                            {post.metadata.title}
                          </span>
                          {post.metadata.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground/80">
                              {post.metadata.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-baseline justify-end gap-2 whitespace-nowrap font-mono text-[12px] tracking-[0.12em] text-muted-foreground">
                          <time>{formatShortDate(post.metadata.date)}</time>
                          <span
                            aria-hidden
                            className="row-link-arrow text-[13px]"
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">暂无文章</p>
        )}

        <div className="mt-7 flex justify-end">
          <Link
            href="/blog"
            className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-1 font-mono text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-200 hover:border-[color:var(--link-accent)] hover:text-[color:var(--link-accent)] hover:opacity-100"
          >
            查看全部归档 →
          </Link>
        </div>
      </section>

      {/* ─────────── DIRECTORY ─────────── */}
      <nav
        aria-label="栏目导航"
        data-section="DIRECTORY"
        className="mt-24 grid gap-7 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-8 sm:mt-28 sm:grid-cols-3 sm:gap-0"
      >
        {siteContent.sections.map((section, idx) => (
          <Link
            key={section.path}
            href={section.path}
            className="group block py-2 sm:px-8 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] sm:first:pl-0 sm:last:pr-0 hover:opacity-100"
          >
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {SECTION_KICKERS[idx] ?? `§ 0${idx + 1}`}
            </div>
            <h3
              className="m-0 mb-2.5 text-[clamp(1.35rem,1.1rem+0.8vw,1.7rem)] tracking-[-0.02em]"
              style={{
                fontFamily: 'var(--font-orbitron), Georgia, serif',
                fontWeight: 700,
              }}
            >
              <span data-cursor-underline>{section.label}</span>
            </h3>
            <p className="mb-4 text-[0.96rem] text-foreground/70">
              {section.description}
            </p>
            <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--link-accent)] transition-transform duration-200 group-hover:translate-x-1">
              进入 →
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
