import { TransitionLink } from '@/components/effects/PageTransition'
import { getArticleBySlug, getAllArticles, getStubTargetSlug } from '@/lib/content-parser'
import type { ArticleContent } from '@/lib/content-parser'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/lib/content-renderer'
import { TutorialRedirect } from '@/components/common/TutorialRedirect'
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

  const post = getArticleBySlug(slugString)
  if (!post) {
    return buildPageMetadata({
      title: '文章不存在',
      description: '请求的文章不存在或已删除。',
      path: `/articles/${slugString}`,
      noIndex: true,
    })
  }
  const description =
    (typeof post.metadata.description === 'string'
      ? post.metadata.description
      : undefined) ?? post.metadata.title
  const tags = [
    ...toStringArray(post.metadata.keywords),
    ...toStringArray(post.metadata.tags),
  ]
  const modifiedTime = resolveModifiedTime(post.metadata, post.metadata.date ?? '')
  const image =
    typeof post.metadata.image === 'string' && post.metadata.image.trim()
      ? post.metadata.image
      : '/og-image.png'

  const topicSlug = getStubTargetSlug(post)
  if (topicSlug) {
    return buildPageMetadata({
      title: post.metadata.title,
      description,
      path: `/tutorials/${topicSlug}`,
      image,
      noIndex: true,
    })
  }

  return buildArticleMetadata({
    title: post.metadata.title,
    description,
    path: `/articles/${slugString}`,
    image,
    publishedTime: post.metadata.date ?? '',
    modifiedTime,
    section: 'Articles',
    tags,
    keywords: ['AI Agent', '全栈工程', '编程教程'],
  })
}

export async function generateStaticParams() {
  const slugs = getAllArticles().map((p) => p.slug)
  return slugs.map((slug) => ({
    slug: slug.replace(/\.mdx?$/, '').split('/'),
  }))
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const slugString = slug.join('/')
  const post = getArticleBySlug(slugString)
  if (!post) notFound()

  const topicSlug = getStubTargetSlug(post)
  if (topicSlug) {
    return <TutorialStubView post={post} topicSlug={topicSlug} />
  }

  const discussionTerm = `articles/${slugString}`
  const description =
    (typeof post.metadata.description === 'string'
      ? post.metadata.description
      : undefined) ?? post.metadata.title
  const tags = [
    ...toStringArray(post.metadata.keywords),
    ...toStringArray(post.metadata.tags),
  ]
  const modifiedTime = resolveModifiedTime(post.metadata, post.metadata.date ?? '')
  const image =
    typeof post.metadata.image === 'string' && post.metadata.image.trim()
      ? post.metadata.image
      : '/og-image.png'
  const articleJsonLd = createArticleJsonLd({
    type: 'BlogPosting',
    title: post.metadata.title,
    description,
    path: `/articles/${slugString}`,
    publishedTime: post.metadata.date ?? '',
    modifiedTime,
    image,
    section: 'Articles',
    keywords: tags,
  })
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '文章', path: '/articles' },
    { name: post.metadata.title, path: `/articles/${slugString}` },
  ])

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      <JsonLd id={`article-posting-${slugString}`} data={articleJsonLd} />
      <JsonLd id={`article-breadcrumb-${slugString}`} data={breadcrumbJsonLd} />
      <ArticleView article={post} discussionTerm={discussionTerm} />
    </div>
  )
}

interface TutorialStubViewProps {
  post: ArticleContent
  topicSlug: string
}

function TutorialStubView({ post, topicSlug }: TutorialStubViewProps) {
  const tutorialHref = `/tutorials/${topicSlug}`
  const description =
    typeof post.metadata.description === 'string'
      ? post.metadata.description
      : undefined

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      <meta httpEquiv="refresh" content={`0; url=${tutorialHref}`} />
      <link rel="canonical" href={tutorialHref} />
      <TutorialRedirect tutorialHref={tutorialHref} />

      <article className="mx-auto w-full max-w-[920px]">
        <header>
          <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>SECTION §01 · INTERACTIVE TUTORIAL</span>
            <time>{formatIsoDate(post.metadata.date ?? '')}</time>
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
            这篇内容以「交互式教程」的形态呈现：左侧代码、右侧文档，滚动同步。我们已自动把你转到对应教程；如果没有自动跳转，请点击下方按钮。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <TransitionLink
              href={tutorialHref}
              className="inline-flex items-center gap-2 border border-[color:var(--link-accent)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--link-accent)] transition-colors duration-200 hover:bg-[color:var(--link-accent)] hover:text-background"
            >
              前往教程 →
            </TransitionLink>
            <TransitionLink
              href="/articles"
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
