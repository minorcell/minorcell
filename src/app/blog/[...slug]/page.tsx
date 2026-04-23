import { getPostBySlug, getPostSlugs } from '@/lib/mdx'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { GiscusComments } from '@/components/common/GiscusComments'
import { CopyPageButton } from '@/components/common/CopyPageButton'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import { buildArticleMetadata, buildPageMetadata } from '@/lib/seo'
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
} from '@/lib/structured-data'

const formatDate = (value: string) => {
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
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
    const image =
      typeof post.metadata.image === 'string' && post.metadata.image.trim()
        ? post.metadata.image
        : '/logo.svg'

    return buildArticleMetadata({
      title: post.metadata.title,
      description,
      path: `/blog/${slugString}`,
      image,
      publishedTime: post.metadata.date,
      modifiedTime: post.metadata.date,
      section: 'Blog',
      tags,
      keywords: ['技术博客', '编程教程', '工程实践'],
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
  const discussionTerm = `blog/${slugString}`
  const description =
    (typeof post.metadata.description === 'string'
      ? post.metadata.description
      : undefined) ?? post.metadata.title
  const tags = [
    ...toStringArray(post.metadata.keywords),
    ...toStringArray(post.metadata.tags),
  ]
  const image =
    typeof post.metadata.image === 'string' && post.metadata.image.trim()
      ? post.metadata.image
      : '/logo.svg'
  const articleJsonLd = createArticleJsonLd({
    type: 'BlogPosting',
    title: post.metadata.title,
    description,
    path: `/blog/${slugString}`,
    publishedTime: post.metadata.date,
    modifiedTime: post.metadata.date,
    image,
    section: 'Blog',
    keywords: tags,
  })
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '文章', path: '/blog' },
    { name: post.metadata.title, path: `/blog/${slugString}` },
  ])

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <JsonLd id={`blog-posting-${slugString}`} data={articleJsonLd} />
      <JsonLd id={`blog-breadcrumb-${slugString}`} data={breadcrumbJsonLd} />

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <time>{formatDate(post.metadata.date)}</time>
          <CopyPageButton
            pageContent={post.rawContent}
            bodyContent={post.content}
            className="ml-auto"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-4">
          {post.metadata.title}
        </h1>

        {typeof post.metadata.description === 'string' && (
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

      {/* Comments */}
      <section>
        <h2 className="text-lg font-medium mb-6">留言讨论</h2>
        <GiscusComments term={discussionTerm} />
      </section>
    </article>
  )
}
