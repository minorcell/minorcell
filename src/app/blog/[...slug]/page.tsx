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
