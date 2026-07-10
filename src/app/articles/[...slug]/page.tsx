import { TransitionLink } from '@/components/effects/PageTransition'
import {
  getArticleBySlug,
  getAllArticles,
  getStubTargetSlug,
} from '@/lib/content-parser'
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
  const modifiedTime = resolveModifiedTime(
    post.metadata,
    post.metadata.date ?? '',
  )
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
    keywords: ['技术文章'],
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
  const modifiedTime = resolveModifiedTime(
    post.metadata,
    post.metadata.date ?? '',
  )
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
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
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
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
      <meta httpEquiv="refresh" content={`0; url=${tutorialHref}`} />
      <link rel="canonical" href={tutorialHref} />
      <TutorialRedirect tutorialHref={tutorialHref} />

      <article className="mx-auto w-full max-w-[780px] pt-8 sm:pt-14">
        <header>
          <h1
            className="m-0 text-[2.25rem] font-medium leading-[1.18] sm:text-[3.25rem]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {post.metadata.title}
          </h1>

          {description ? (
            <p
              className="mb-0 mt-5 max-w-[58ch] text-[1.0625rem] leading-7 text-muted-foreground sm:text-[1.1875rem] sm:leading-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {description}
            </p>
          ) : null}
        </header>

        <div className="mt-10 rounded-lg bg-card px-6 py-6 sm:px-7">
          <p className="m-0 font-medium">正在打开交互教程</p>
          <p className="mb-0 mt-2 text-[14px] leading-6 text-muted-foreground">
            页面会自动跳转；如果没有跳转，可以手动继续。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <TransitionLink
              href={tutorialHref}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-[color:var(--accent-foreground)] hover:text-primary-foreground"
            >
              前往教程
            </TransitionLink>
            <TransitionLink
              href="/articles"
              className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              返回归档
            </TransitionLink>
          </div>
        </div>
      </article>
    </div>
  )
}
