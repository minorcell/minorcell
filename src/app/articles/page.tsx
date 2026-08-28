import type { Metadata } from 'next'
import { SectionHero } from '@/components/common/SectionHero'
import { TransitionLink } from '@/components/effects/PageTransition'
import { MotionSurface } from '@/components/effects/MotionPrimitives'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  getAllArticles,
  getContentHref,
  isStubArticle,
} from '@/lib/content-parser'
import { buildPageMetadata } from '@/lib/seo'
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
} from '@/lib/structured-data'

const articlesDescription =
  '浏览 minorcell 的全部技术文章，内容涵盖 AI 工程、软件开发、技术选型、工程实践与产品思考，并按发布时间归档。'

export const metadata: Metadata = buildPageMetadata({
  title: '文章归档',
  description: articlesDescription,
  path: '/articles',
  keywords: [
    '文章归档',
    'AI Agent',
    'AI 工程',
    '软件开发',
    '技术选型',
    '工程实践',
    '前端开发',
    'JavaScript',
    'React',
    'Next.js',
  ],
})

const formatShortDate = (value: string) => {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

export default function ArticlesPage() {
  const posts = getAllArticles().sort(
    (a, b) =>
      new Date(b.metadata.date ?? new Date()).getTime() -
      new Date(a.metadata.date ?? new Date()).getTime(),
  )

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '文章', path: '/articles' },
  ])
  const collectionPageJsonLd = createCollectionPageJsonLd({
    title: '文章归档',
    description: articlesDescription,
    path: '/articles',
    items: posts.map((post) => ({
      name: post.metadata.title,
      path: getContentHref(post),
    })),
  })

  const postsByYear = posts.reduce<Record<number, typeof posts>>(
    (acc, post) => {
      const year = new Date(post.metadata.date ?? new Date()).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(post)
      return acc
    },
    {},
  )
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
      <JsonLd id="articles-breadcrumb" data={breadcrumbJsonLd} />
      <JsonLd id="articles-collection" data={collectionPageJsonLd} />

      <SectionHero
        title="文章"
        countLabel={`${posts.length} 篇`}
        intro="记录 AI 工程、软件开发、技术选择和产品实践，按发布时间倒序整理。"
      />

      {years.length > 0 ? (
        <div className="mt-14 max-w-[980px] space-y-12 sm:mt-20 sm:space-y-16">
          {years.map((year) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <div className="mb-3 flex items-baseline gap-3 px-3">
                <h2 id={`year-${year}`} className="type-section-title m-0">
                  {year}
                </h2>
                <span className="type-caption text-muted-foreground">
                  {postsByYear[Number(year)].length} 篇
                </span>
              </div>

              <ol className="m-0 list-none space-y-1 p-0">
                {postsByYear[Number(year)].map((post) => (
                  <li key={post.slug}>
                    <MotionSurface>
                      <TransitionLink
                        href={getContentHref(post)}
                        className="grid gap-2 rounded-lg px-3 py-4 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-8 sm:px-4"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="type-headline m-0">
                              {post.metadata.title}
                            </h3>
                            {isStubArticle(post) ? (
                              <span className="type-caption rounded bg-accent px-1.5 py-0.5 font-medium text-accent-foreground">
                                交互
                              </span>
                            ) : null}
                          </div>
                          {post.metadata.description ? (
                            <p className="type-meta mb-0 mt-1 line-clamp-1 text-muted-foreground">
                              {post.metadata.description}
                            </p>
                          ) : null}
                        </div>
                        {post.metadata.date ? (
                          <time className="type-caption text-muted-foreground">
                            {formatShortDate(post.metadata.date)}
                          </time>
                        ) : null}
                      </TransitionLink>
                    </MotionSurface>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <p className="py-16 text-muted-foreground">暂无文章</p>
      )}
    </div>
  )
}
