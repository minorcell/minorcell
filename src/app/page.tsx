import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { TransitionLink } from '@/components/effects/PageTransition'
import {
  getAllContent,
  getContentHref,
  getStubTargetSlug,
  isStubArticle,
} from '@/lib/content-parser'
import { buildPageMetadata } from '@/lib/seo'
import { siteContent } from '@/lib/site-content'

const homeMetadata = buildPageMetadata({
  title: 'Minor Cell | AI 工程、软件开发与技术判断',
  description:
    'Minor Cell 是 mcell 的个人技术站，记录 AI 工程、软件开发与产品实践中的真实问题、技术选择和工程判断。',
  path: '/',
  keywords: [
    'AI Agent',
    'AI 工程',
    '软件开发',
    '工程实践',
    '技术判断',
    '产品开发',
    '前端开发',
    '全栈开发',
  ],
})

export const metadata: Metadata = {
  ...homeMetadata,
  title: {
    absolute: 'Minor Cell | AI 工程、软件开发与技术判断',
  },
}

const formatDate = (value: string) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

export default function HomePage() {
  const allContent = getAllContent()
  const stubbedSlugs = new Set(
    allContent.filter(isStubArticle).map(getStubTargetSlug).filter(Boolean),
  )
  const posts = allContent
    .filter(
      (item) => !(item.type === 'tutorial' && stubbedSlugs.has(item.slug)),
    )
    .sort(
      (a, b) =>
        new Date(b.metadata.date ?? new Date()).getTime() -
        new Date(a.metadata.date ?? new Date()).getTime(),
    )
    .slice(0, 7)

  const [featuredPost, ...recentPosts] = posts

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
      <header className="flex min-h-[360px] max-w-[900px] flex-col justify-center py-16 sm:min-h-[440px] sm:py-24">
        <h1 className="m-0 text-[3.5rem] font-bold leading-none text-foreground sm:text-[5.5rem]">
          Minor Cell
        </h1>
        <p className="mb-0 mt-7 max-w-[42ch] text-[1.1875rem] leading-8 text-muted-foreground sm:text-[1.375rem] sm:leading-9">
          写代码，也写判断。记录真实问题、技术选择，以及把想法做成产品的过程。
        </p>
      </header>

      <section aria-labelledby="latest-heading">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="latest-heading" className="m-0 text-[1.5rem] font-semibold">
            最新发布
          </h2>
          <TransitionLink
            href="/articles"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[color:var(--link-accent)]"
          >
            全部文章
            <ArrowRight className="h-4 w-4" />
          </TransitionLink>
        </div>

        {featuredPost ? (
          <TransitionLink
            href={getContentHref(featuredPost)}
            className="block rounded-lg bg-card p-6 hover:bg-[color:var(--surface-hover)] sm:p-9"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
              <span className="font-medium text-[color:var(--link-accent)]">
                {featuredPost.type === 'tutorial' || isStubArticle(featuredPost)
                  ? '教程'
                  : '文章'}
              </span>
              {featuredPost.metadata.date ? (
                <time>{formatDate(featuredPost.metadata.date)}</time>
              ) : null}
            </div>
            <h3
              className="m-0 mt-4 max-w-[24ch] text-[1.875rem] font-medium leading-[1.25] sm:text-[2.5rem]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {featuredPost.metadata.title}
            </h3>
            {featuredPost.metadata.description ? (
              <p className="mb-0 mt-4 max-w-[62ch] text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
                {featuredPost.metadata.description}
              </p>
            ) : null}
          </TransitionLink>
        ) : (
          <p className="py-12 text-muted-foreground">暂无内容</p>
        )}

        {recentPosts.length > 0 ? (
          <ol className="mt-4 grid list-none gap-2 p-0 md:grid-cols-2">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <TransitionLink
                  href={getContentHref(post)}
                  className="block h-full rounded-lg px-5 py-5 hover:bg-[color:var(--surface-hover)] sm:px-6 sm:py-6"
                >
                  <div className="text-[13px] text-muted-foreground">
                    {post.metadata.date ? formatDate(post.metadata.date) : null}
                  </div>
                  <h3
                    className="m-0 mt-2 text-[1.1875rem] font-medium leading-[1.4]"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {post.metadata.title}
                  </h3>
                  {post.metadata.description ? (
                    <p className="mb-0 mt-2 line-clamp-2 text-[14px] leading-6 text-muted-foreground">
                      {post.metadata.description}
                    </p>
                  ) : null}
                </TransitionLink>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <nav
        aria-label="栏目导航"
        className="mt-20 grid gap-3 sm:mt-24 sm:grid-cols-2 lg:grid-cols-4"
      >
        {siteContent.sections.map((section) => (
          <TransitionLink
            key={section.path}
            href={section.path}
            className="rounded-lg bg-card px-5 py-5 hover:bg-[color:var(--surface-hover)]"
          >
            <h2 className="m-0 text-[1.0625rem] font-semibold">
              {section.label}
            </h2>
            <p className="mb-0 mt-2 line-clamp-2 text-[14px] leading-6 text-muted-foreground">
              {section.description}
            </p>
          </TransitionLink>
        ))}
      </nav>
    </div>
  )
}
