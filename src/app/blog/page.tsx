import Link from 'next/link'
import type { Metadata } from 'next'
import { SectionHero } from '@/components/common/SectionHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { getAllPosts } from '@/lib/mdx'
import { buildPageMetadata } from '@/lib/seo'
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
} from '@/lib/structured-data'

export const metadata: Metadata = buildPageMetadata({
  title: '技术博客文章列表',
  description:
    '浏览 Cell Stack 最新技术文章，覆盖 AI Agent、JavaScript、TypeScript、React、Next.js、Node.js 与工程化实践。',
  path: '/blog',
  keywords: [
    '技术博客',
    '编程文章',
    'AI Agent 实战',
    'JavaScript 博客',
    'React 博客',
    'Next.js 博客',
  ],
})

const formatShortDate = (value: string) => {
  const d = new Date(value)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatIsoDate = (value: Date) =>
  `${value.getFullYear()} · ${String(value.getMonth() + 1).padStart(2, '0')} · ${String(value.getDate()).padStart(2, '0')}`

const pad = (n: number) => String(n).padStart(2, '0')

export default function BlogPage() {
  const posts = getAllPosts('blog').sort(
    (a, b) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  )
  const [featuredPost, ...remainingPosts] = posts
  const secondaryPosts = remainingPosts.slice(0, 2)
  const archivePosts = remainingPosts.slice(2)
  const listPosts = archivePosts.length > 0 ? archivePosts : posts

  const latestDate = featuredPost?.metadata.date
    ? new Date(featuredPost.metadata.date)
    : new Date()

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '文章', path: '/blog' },
  ])
  const collectionPageJsonLd = createCollectionPageJsonLd({
    title: '技术博客文章列表',
    description:
      '浏览 Cell Stack 最新技术文章，覆盖 AI Agent、JavaScript、TypeScript、React、Next.js、Node.js 与工程化实践。',
    path: '/blog',
    items: posts.map((post) => ({
      name: post.metadata.title,
      path: `/blog/${post.slug}`,
    })),
  })

  const postsByYear = listPosts.reduce<Record<number, typeof posts>>(
    (acc, post) => {
      const year = new Date(post.metadata.date).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(post)
      return acc
    },
    {},
  )
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a))

  const orbitron = {
    fontFamily: 'var(--font-orbitron), Georgia, serif',
  } as const
  const accentBlue = 'var(--link-accent)'

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      <JsonLd id="blog-breadcrumb" data={breadcrumbJsonLd} />
      <JsonLd id="blog-collection" data={collectionPageJsonLd} />

      <SectionHero
        sectionLabel="SECTION §01 · ARCHIVE"
        sectionCountLabel={`${posts.length} ENTRIES`}
        dateLabel={formatIsoDate(latestDate)}
        introLabel="THE ARCHIVE"
        title="Articles & Notes"
        intro={
          <>
            按时间倒序整理的全部文章——最新一篇推到最前，往下是历年归档。当前共{' '}
            <span className="text-muted-foreground">{posts.length} 篇</span>。
          </>
        }
      />

      {/* EDITOR'S PICK */}
      {featuredPost && (
        <section className="mt-20 sm:mt-24">
          <div className="mb-8 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
            <h2
              className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
              style={{ ...orbitron, fontWeight: 700 }}
            >
              Editor&rsquo;s Pick
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              FEATURE · 本期主推
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-stretch lg:gap-14">
            {/* Feature 头条 */}
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="row-link group flex h-full flex-col px-3 py-2 hover:opacity-100 sm:px-4 lg:border-r lg:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] lg:pr-14"
            >
              {/* Featured — underline only; the "№ 01" text isn't a numeric
                  badge, so we skip the magnetic target here. */}
              <div className="mb-5 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <span>№ 01 · LEADING ARTICLE</span>
                <time>
                  {formatIsoDate(new Date(featuredPost.metadata.date))}
                </time>
              </div>
              <h3
                className="m-0 text-[clamp(1.7rem,1.4rem+1.6vw,3rem)] leading-[1.1] tracking-[-0.02em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 500,
                }}
              >
                {featuredPost.metadata.title}
              </h3>
              {featuredPost.metadata.description && (
                <p className="mt-5 line-clamp-4 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground">
                  {featuredPost.metadata.description}
                </p>
              )}
              <span
                className="mt-auto inline-flex items-center gap-2 border-t border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pt-5 font-mono text-[12px] uppercase tracking-[0.18em]"
                style={{ color: accentBlue }}
              >
                <span aria-hidden>§</span>
                阅读主文 →
              </span>
            </Link>

            {/* Secondary 堆叠列 */}
            {secondaryPosts.length > 0 && (
              <ol className="m-0 list-none border-t border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] p-0 lg:border-t-0">
                <li className="mb-3 hidden font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground lg:block">
                  ALSO IN THIS ISSUE
                </li>
                {secondaryPosts.map((post, idx) => (
                  <li
                    key={post.slug}
                    className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="row-link group block px-3 py-5 hover:opacity-100 sm:px-4 sm:py-6"
                    >
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        <span
                          style={{
                            ...orbitron,
                            fontWeight: 500,
                            fontSize: '1rem',
                            letterSpacing: '-0.01em',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {pad(idx + 2)}
                        </span>
                        <span className="inline-flex items-baseline gap-2">
                          <time className="text-[12px] tracking-[0.12em]">
                            {formatShortDate(post.metadata.date)}
                          </time>
                          <span
                            aria-hidden
                            className="row-link-arrow text-[13px]"
                          >
                            →
                          </span>
                        </span>
                      </div>
                      <span
                        className="block text-[clamp(1.05rem,1rem+0.3vw,1.25rem)] leading-[1.3] tracking-[-0.005em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
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
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}

      {/* ARCHIVE BY YEAR */}
      <section className="mt-24 sm:mt-28">
        {years.map((year) => (
          <section key={year} className="relative mb-20 last:mb-0">
            <div className="mb-6 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
              <h2
                className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
                style={{ ...orbitron, fontWeight: 700 }}
              >
                Archive · {year}
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {postsByYear[Number(year)].length} ENTRIES
              </span>
            </div>

            <span
              aria-hidden
              className="pointer-events-none absolute -top-12 right-0 select-none text-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] sm:-top-16"
              style={{
                ...orbitron,
                fontWeight: 800,
                fontSize: 'clamp(4.5rem, 11vw, 9rem)',
                letterSpacing: '-0.06em',
                lineHeight: 1,
                zIndex: -1,
              }}
            >
              {year}
            </span>

            <ol className="m-0 list-none p-0">
              {postsByYear[Number(year)].map((post, idx) => (
                <li
                  key={post.slug}
                  className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="row-link group grid items-baseline gap-5 px-3 py-4 hover:opacity-100 sm:gap-7 sm:px-4 sm:py-5"
                    style={{ gridTemplateColumns: '56px 1fr auto' }}
                  >
                    <span
                      className="text-muted-foreground transition-colors duration-200 group-hover:text-[color:var(--link-accent)]"
                      style={{
                        ...orbitron,
                        fontWeight: 500,
                        fontSize: '1.05rem',
                        letterSpacing: '-0.01em',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pad(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <span
                        className="text-[clamp(1rem,0.98rem+0.25vw,1.18rem)] leading-[1.35] tracking-[-0.005em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                        }}
                      >
                        {post.metadata.title}
                      </span>
                      {post.metadata.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground/75">
                          · {post.metadata.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-baseline justify-end gap-2 whitespace-nowrap font-mono text-[12px] tracking-[0.12em] text-muted-foreground">
                      <time>{formatShortDate(post.metadata.date)}</time>
                      <span aria-hidden className="row-link-arrow text-[13px]">
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>

      {posts.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">暂无文章</div>
      )}
    </div>
  )
}
