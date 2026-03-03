import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getTopic,
  getTopicWithContent,
  getAllTopics,
} from '@/lib/topics.server'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildPageMetadata } from '@/lib/seo'
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
} from '@/lib/structured-data'

interface TopicPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const topics = getAllTopics()
  return topics.map((topic) => ({
    slug: topic.slug,
  }))
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopic(slug)

  if (!topic) {
    return buildPageMetadata({
      title: '专题不存在',
      description: '请求的专题不存在或已删除。',
      path: `/topics/${slug}`,
      noIndex: true,
    })
  }

  return buildPageMetadata({
    title: `${topic.title} 专题`,
    description: topic.description,
    path: `/topics/${slug}`,
    keywords: [topic.title, '技术专题', '编程教程'],
  })
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params
  const topicWithContent = getTopicWithContent(slug)

  if (!topicWithContent) {
    notFound()
  }

  const sortedArticles = [...topicWithContent.articles].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  )
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '专题', path: '/topics' },
    { name: topicWithContent.title, path: `/topics/${slug}` },
  ])
  const collectionPageJsonLd = createCollectionPageJsonLd({
    title: `${topicWithContent.title} 专题`,
    description: topicWithContent.description,
    path: `/topics/${slug}`,
    items: sortedArticles.map((article) => ({
      name: article.title,
      path: `/topics/${slug}/${article.slug}`,
    })),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <JsonLd id={`topic-breadcrumb-${slug}`} data={breadcrumbJsonLd} />
      <JsonLd id={`topic-collection-${slug}`} data={collectionPageJsonLd} />

      {/* Back Link */}
      <Link
        href="/topics"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block"
      >
        ← 返回专题列表
      </Link>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-3">
          {topicWithContent.title}
        </h1>
        <p className="text-muted-foreground">{topicWithContent.description}</p>

        {/* 渲染 index.md 的正文内容 */}
        {topicWithContent.content && (
          <div className="mt-8">
            <MarkdownRenderer content={topicWithContent.content} />
          </div>
        )}
      </header>

      <hr className="section-divider" />

      {/* Articles Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-muted-foreground">
            文章列表 · {sortedArticles.length} 篇
          </h2>
        </div>

        <div className="space-y-1">
          {sortedArticles.map((article, index) => (
            <Link
              key={article.slug}
              href={`/topics/${slug}/${article.slug}`}
              className="group flex items-start gap-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
            >
              <span className="text-sm text-muted-foreground w-6 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground group-hover:opacity-70 transition-opacity">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {article.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {sortedArticles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            该专题下暂无文章
          </div>
        )}
      </section>
    </div>
  )
}
