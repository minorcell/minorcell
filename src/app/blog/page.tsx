import Link from 'next/link'
import type { Metadata } from 'next'
import SpotlightCard from '@/components/effects/reactbits/SpotlightCard'
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

const formatDate = (value: string) => {
  const date = new Date(value)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}.${d}`
}

export default function BlogPage() {
  const posts = getAllPosts('blog').sort(
    (a, b) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  )
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

  // Group posts by year
  const postsByYear = posts.reduce(
    (acc, post) => {
      const year = new Date(post.metadata.date).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(post)
      return acc
    },
    {} as Record<number, typeof posts>,
  )

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16">
      <JsonLd id="blog-breadcrumb" data={breadcrumbJsonLd} />
      <JsonLd id="blog-collection" data={collectionPageJsonLd} />

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-2">
          文章
        </h1>
        <p className="text-muted-foreground text-sm">共 {posts.length} 篇</p>
      </div>

      {/* Posts by Year */}
      <div className="space-y-12">
        {years.map((year) => (
          <section key={year} className="relative">
            {/* Year Watermark */}
            <div className="year-watermark">{year}</div>

            {/* Posts List */}
            <div className="relative pt-8 space-y-3">
              {postsByYear[Number(year)].map((post) => (
                <article key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block hover:opacity-100"
                  >
                    <SpotlightCard
                      spotlightColor="rgba(0, 0, 0, 0.1)"
                      className="!rounded-xl !border-border/55 !bg-background/60 !p-4 transition-colors hover:!border-border hover:!bg-muted/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="mb-0 flex-1 min-w-0 text-base font-normal text-foreground">
                          {post.metadata.title}
                        </h2>
                        <time className="article-meta shrink-0">
                          {formatDate(post.metadata.date)}
                        </time>
                      </div>
                      {post.metadata.description && (
                        <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-2">
                          · {post.metadata.description}
                        </p>
                      )}
                    </SpotlightCard>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">暂无文章</div>
      )}
    </div>
  )
}
