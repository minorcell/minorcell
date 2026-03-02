import Link from 'next/link'
import { getPostBySlug } from '@/lib/mdx'
import { getTopic, getTopicArticle, getAllTopics } from '@/lib/topics.server'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { GiscusComments } from '@/components/common/GiscusComments'
import type { Metadata } from 'next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{
    slug: string
    article: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, article } = await params
  const topic = getTopic(slug)

  if (!topic) {
    return { title: '专题不存在' }
  }

  try {
    const post = getPostBySlug('topics', `${slug}/${article}`)
    return {
      title: post.metadata.title,
      description:
        (typeof post.metadata.description === 'string'
          ? post.metadata.description
          : undefined) ?? post.metadata.title,
    }
  } catch {
    return { title: '文章不存在' }
  }
}

export async function generateStaticParams() {
  const topics = getAllTopics()
  const result: { slug: string; article: string }[] = []

  for (const topic of topics) {
    for (const article of topic.articles) {
      result.push({
        slug: topic.slug,
        article: article.slug,
      })
    }
  }

  return result
}

export default async function TopicArticlePage({ params }: Props) {
  const { slug, article } = await params
  const topic = getTopic(slug)

  if (!topic) {
    notFound()
  }

  const topicArticle = getTopicArticle(slug, article)
  if (!topicArticle) {
    notFound()
  }

  let post
  try {
    post = getPostBySlug('topics', `${slug}/${article}`)
  } catch {
    notFound()
  }

  const discussionTerm = `topics/${slug}/${article}`

  // Find prev/next articles
  const sortedArticles = [...topic.articles].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  )
  const currentIndex = sortedArticles.findIndex((a) => a.slug === article)
  const prevArticle = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null
  const nextArticle =
    currentIndex < sortedArticles.length - 1
      ? sortedArticles[currentIndex + 1]
      : null

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          href="/topics"
          className="hover:text-foreground transition-colors"
        >
          专题
        </Link>
        <span>/</span>
        <Link
          href={`/topics/${slug}`}
          className="hover:text-foreground transition-colors"
        >
          {topic.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">
          第 {currentIndex + 1} / {sortedArticles.length} 篇
        </span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-4">
          {post.metadata.title}
        </h1>

        {post.metadata.description && (
          <p className="text-muted-foreground text-lg">
            {post.metadata.description}
          </p>
        )}
      </header>

      {/* Content */}
      <div>
        <MarkdownRenderer content={post.content} />
      </div>

      <hr className="section-divider" />

      {/* Navigation */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row gap-4">
          {prevArticle ? (
            <Link
              href={`/topics/${slug}/${prevArticle.slug}`}
              className="group flex-1 p-4 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <ChevronLeft className="h-4 w-4" />
                <span>上一篇</span>
              </div>
              <div className="font-medium text-foreground group-hover:opacity-70 transition-opacity">
                {prevArticle.title}
              </div>
            </Link>
          ) : (
            <div className="flex-1 p-4 rounded-lg border border-border/30 opacity-50">
              <div className="text-sm text-muted-foreground mb-2">
                这是第一篇
              </div>
            </div>
          )}

          {nextArticle ? (
            <Link
              href={`/topics/${slug}/${nextArticle.slug}`}
              className="group flex-1 p-4 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all text-right"
            >
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-2">
                <span>下一篇</span>
                <ChevronRight className="h-4 w-4" />
              </div>
              <div className="font-medium text-foreground group-hover:opacity-70 transition-opacity">
                {nextArticle.title}
              </div>
            </Link>
          ) : (
            <div className="flex-1 p-4 rounded-lg border border-border/30 opacity-50 text-right">
              <div className="text-sm text-muted-foreground mb-2">
                这是最后一篇
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Comments */}
      <section>
        <h2 className="text-lg font-medium mb-6">留言讨论</h2>
        <GiscusComments term={discussionTerm} />
      </section>
    </article>
  )
}
