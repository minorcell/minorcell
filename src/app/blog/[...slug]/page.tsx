import { TransitionLink } from '@/components/effects/PageTransition'
import { getPostBySlug, getPostSlugs, getTopicSlug } from '@/lib/mdx'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { GiscusComments } from '@/components/common/GiscusComments'
import { CopyPageButton } from '@/components/common/CopyPageButton'
import { TopicRedirect } from '@/components/common/TopicRedirect'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import { buildArticleMetadata, buildPageMetadata } from '@/lib/seo'
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
} from '@/lib/structured-data'

const formatIsoDate = (value: string) => {
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${d}`
}

const readingMinutes = (text: string) => {
  const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const enWords = text
    .replace(/[\u4e00-\u9fa5]/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(cnChars / 400 + enWords / 220))
}

interface Props {
  params: Promise<{
    slug: string[]
  }>
}

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : []

const resolveModifiedTime = (
  metadata: Record<string, unknown>,
  publishedTime: string,
) => {
  const candidates = [
    metadata.updatedAt,
    metadata.updated,
    metadata.modifiedAt,
    metadata.modified,
    metadata.lastModified,
    metadata.lastmod,
  ]

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    const parsed = new Date(candidate)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return publishedTime
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const slugString = slug.join('/')

  try {
    const post = getPostBySlug('blog', slugString)
    const description =
      (typeof post.metadata.description === 'string'
        ? post.metadata.description
        : undefined) ?? post.metadata.title
    const tags = [
      ...toStringArray(post.metadata.keywords),
      ...toStringArray(post.metadata.tags),
    ]
    const modifiedTime = resolveModifiedTime(post.metadata, post.metadata.date)
    const image =
      typeof post.metadata.image === 'string' && post.metadata.image.trim()
        ? post.metadata.image
        : '/og-image.png'

    const topicSlug = getTopicSlug(post.metadata)
    if (topicSlug) {
      // Stub post: canonical points to the interactive topic, page is
      // marked noindex so search engines consolidate signals on the topic.
      return buildPageMetadata({
        title: post.metadata.title,
        description,
        path: `/topics/${topicSlug}`,
        image,
        noIndex: true,
      })
    }

    return buildArticleMetadata({
      title: post.metadata.title,
      description,
      path: `/blog/${slugString}`,
      image,
      publishedTime: post.metadata.date,
      modifiedTime,
      section: 'Blog',
      tags,
      keywords: ['AI Agent', '全栈工程', '编程教程'],
    })
  } catch {
    return buildPageMetadata({
      title: '文章不存在',
      description: '请求的文章不存在或已删除。',
      path: `/blog/${slugString}`,
      noIndex: true,
    })
  }
}

export async function generateStaticParams() {
  const slugs = getPostSlugs('blog')
  return slugs.map((slug) => ({
    slug: slug.replace(/\.mdx?$/, '').split('/'),
  }))
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const slugString = slug.join('/')
  const post = getPostBySlug('blog', slugString)
  const topicSlug = getTopicSlug(post.metadata)
  if (topicSlug) {
    return <TopicStubView post={post} topicSlug={topicSlug} />
  }
  const discussionTerm = `blog/${slugString}`
  const description =
    (typeof post.metadata.description === 'string'
      ? post.metadata.description
      : undefined) ?? post.metadata.title
  const tags = [
    ...toStringArray(post.metadata.keywords),
    ...toStringArray(post.metadata.tags),
  ]
  const modifiedTime = resolveModifiedTime(post.metadata, post.metadata.date)
  const image =
    typeof post.metadata.image === 'string' && post.metadata.image.trim()
      ? post.metadata.image
      : '/og-image.png'
  const articleJsonLd = createArticleJsonLd({
    type: 'BlogPosting',
    title: post.metadata.title,
    description,
    path: `/blog/${slugString}`,
    publishedTime: post.metadata.date,
    modifiedTime,
    image,
    section: 'Blog',
    keywords: tags,
  })
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '文章', path: '/blog' },
    { name: post.metadata.title, path: `/blog/${slugString}` },
  ])

  const minutes = readingMinutes(post.content)

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      <JsonLd id={`blog-posting-${slugString}`} data={articleJsonLd} />
      <JsonLd id={`blog-breadcrumb-${slugString}`} data={breadcrumbJsonLd} />

      <article className="mx-auto w-full max-w-[920px]">
        {/* MASTHEAD */}
        <header>
          <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <div className="flex items-center gap-5">
              <span>SECTION §01 · ARTICLE</span>
              <span className="hidden sm:inline">{minutes} MIN READ</span>
            </div>
            <time>{formatIsoDate(post.metadata.date)}</time>
          </div>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/85">
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}

          <h1
            className="m-0 mt-7 text-[clamp(1.85rem,1.4rem+2vw,3.4rem)] leading-[1.08] tracking-[-0.02em] text-pretty sm:text-balance"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 500,
            }}
          >
            {post.metadata.title}
          </h1>

          {typeof post.metadata.description === 'string' && (
            <p
              className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1rem+0.45vw,1.3rem)] leading-[1.55] tracking-[-0.005em] text-muted-foreground"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
              }}
            >
              {post.metadata.description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>BYLINE · MCELL</span>
            <CopyPageButton
              pageContent={post.rawContent}
              bodyContent={post.content}
            />
          </div>
        </header>

        {/* Content */}
        <div className="mt-14 sm:mt-16">
          <MarkdownRenderer content={post.content} />
        </div>

        <hr className="section-divider" />

        {/* Comments */}
        <section className="mt-12">
          <div className="mb-6 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
            <h2
              className="m-0 text-[clamp(1.25rem,1.05rem+0.8vw,1.6rem)] tracking-[-0.02em]"
              style={{
                fontFamily: 'var(--font-orbitron), Georgia, serif',
                fontWeight: 700,
              }}
            >
              Discussion
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              留言区
            </span>
          </div>
          <GiscusComments term={discussionTerm} />
        </section>
      </article>
    </div>
  )
}

interface TopicStubViewProps {
  post: ReturnType<typeof getPostBySlug>
  topicSlug: string
}

function TopicStubView({ post, topicSlug }: TopicStubViewProps) {
  const topicHref = `/topics/${topicSlug}`
  const description =
    typeof post.metadata.description === 'string'
      ? post.metadata.description
      : undefined

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      {/* React 19 hoists meta into <head>; works for static export. */}
      <meta httpEquiv="refresh" content={`0; url=${topicHref}`} />
      <link rel="canonical" href={topicHref} />
      <TopicRedirect topicHref={topicHref} />

      <article className="mx-auto w-full max-w-[920px]">
        <header>
          <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>SECTION §01 · INTERACTIVE TOPIC</span>
            <time>{formatIsoDate(post.metadata.date)}</time>
          </div>

          <h1
            className="m-0 mt-7 text-[clamp(1.85rem,1.4rem+2vw,3.4rem)] leading-[1.08] tracking-[-0.02em] text-pretty sm:text-balance"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 500,
            }}
          >
            {post.metadata.title}
          </h1>

          {description && (
            <p
              className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1rem+0.45vw,1.3rem)] leading-[1.55] tracking-[-0.005em] text-muted-foreground"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
              }}
            >
              {description}
            </p>
          )}
        </header>

        <div className="mt-12 rounded-md border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] px-6 py-7 sm:px-8 sm:py-8">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            REDIRECT NOTICE · 即将跳转
          </p>
          <p className="m-0 mt-3 leading-relaxed text-foreground/92">
            这篇内容以「交互式专题」的形态呈现：左侧代码、右侧文档，滚动同步。我们已自动把你转到对应专题；如果没有自动跳转，请点击下方按钮。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <TransitionLink
              href={topicHref}
              className="inline-flex items-center gap-2 border border-[color:var(--link-accent)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--link-accent)] transition-colors duration-200 hover:bg-[color:var(--link-accent)] hover:text-background"
            >
              前往专题 →
            </TransitionLink>
            <TransitionLink
              href="/blog"
              className="inline-flex items-center gap-2 border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-1 font-mono text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-200 hover:border-[color:var(--link-accent)] hover:text-[color:var(--link-accent)]"
            >
              返回归档
            </TransitionLink>
          </div>
        </div>
      </article>
    </div>
  )
}
