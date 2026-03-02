import Link from 'next/link'
import { getPostBySlug, getPostSlugs } from '@/lib/mdx'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { GiscusComments } from '@/components/common/GiscusComments'
import { CopyPageButton } from '@/components/common/CopyPageButton'
import type { Metadata } from 'next'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const slugString = slug.join('/')
  const post = getPostBySlug('blog', slugString)

  return {
    title: post.metadata.title,
    description:
      (typeof post.metadata.description === 'string'
        ? post.metadata.description
        : undefined) ?? post.metadata.title,
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

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link
            href="/blog"
            className="hover:text-foreground transition-colors"
          >
            ← 返回
          </Link>
          <span>·</span>
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
