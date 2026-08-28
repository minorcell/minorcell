import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { TransitionLink } from '@/components/effects/PageTransition'
import {
  MotionGreeting,
  MotionSurface,
} from '@/components/effects/MotionPrimitives'
import {
  getAllContent,
  getContentHref,
  getStubTargetSlug,
  isStubArticle,
} from '@/lib/content-parser'
import { buildPageMetadata } from '@/lib/seo'
import { siteContent } from '@/lib/site-content'

const homeMetadata = buildPageMetadata({
  title: 'minorcell | 天天学习，好好向上。',
  description:
    '👋，我是 minorcell，这是我的个人站点，这里写代码，也写判断。记录真实问题、技术选择，以及把想法做成产品的过程。',
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
    absolute: 'minorcell | 天天学习，好好向上。',
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
      <header className="grid min-h-[440px] items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-10 lg:py-20">
        <div className="flex flex-col justify-center">
          <h1 className="type-display m-0 text-foreground">minorcell</h1>
          <p className="type-intro mb-0 mt-7 max-w-[42ch] text-muted-foreground">
            <MotionGreeting />
            ，我是
            <span> </span>
            <a
              href="https://github.com/minorcell"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link-accent hover:underline"
            >
              minorcell
            </a>
            ，这是我的个人站点，这里写代码，也写判断。记录真实问题、技术选择，以及把想法做成产品的过程。
          </p>
        </div>
      </header>

      <section aria-labelledby="latest-heading">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="latest-heading" className="type-section-title m-0">
            最新发布
          </h2>
          <TransitionLink
            href="/articles"
            className="type-meta inline-flex items-center gap-1.5 font-medium text-link-accent"
          >
            全部文章
            <ArrowRight className="h-4 w-4" />
          </TransitionLink>
        </div>

        {featuredPost ? (
          <MotionSurface>
            <TransitionLink
              href={getContentHref(featuredPost)}
              className="group relative isolate block overflow-hidden rounded-lg bg-card p-6 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none sm:p-9"
            >
              {featuredPost.metadata.image ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden md:block md:w-[48%] md:opacity-85 lg:w-[46%]"
                  style={{
                    maskImage:
                      'linear-gradient(108deg, transparent 0%, transparent 15%, rgba(0, 0, 0, 0.5) 31%, #000 46%)',
                    WebkitMaskImage:
                      'linear-gradient(108deg, transparent 0%, transparent 15%, rgba(0, 0, 0, 0.5) 31%, #000 46%)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPost.metadata.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                </div>
              ) : null}

              <div className="relative z-10 md:max-w-[62%] lg:max-w-[60%]">
                <div className="type-caption flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                  <span className="font-medium text-link-accent">
                    {featuredPost.type === 'tutorial' ||
                    isStubArticle(featuredPost)
                      ? '教程'
                      : '文章'}
                  </span>
                  {featuredPost.metadata.date ? (
                    <time>{formatDate(featuredPost.metadata.date)}</time>
                  ) : null}
                </div>
                <h3 className="type-feature-title m-0 mt-4 max-w-[24ch]">
                  {featuredPost.metadata.title}
                </h3>
                {featuredPost.metadata.description ? (
                  <p className="type-supporting mb-0 mt-4 max-w-[62ch] text-muted-foreground">
                    {featuredPost.metadata.description}
                  </p>
                ) : null}
              </div>
            </TransitionLink>
          </MotionSurface>
        ) : (
          <p className="py-12 text-muted-foreground">暂无内容</p>
        )}

        {recentPosts.length > 0 ? (
          <ol className="mt-4 grid list-none gap-2 p-0 md:grid-cols-2">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <MotionSurface className="h-full">
                  <TransitionLink
                    href={getContentHref(post)}
                    className="block h-full rounded-lg px-5 py-5 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none sm:px-6 sm:py-6"
                  >
                    <div className="type-caption text-muted-foreground">
                      {post.metadata.date
                        ? formatDate(post.metadata.date)
                        : null}
                    </div>
                    <h3 className="type-headline m-0 mt-2">
                      {post.metadata.title}
                    </h3>
                    {post.metadata.description ? (
                      <p className="type-meta mb-0 mt-2 line-clamp-2 text-muted-foreground">
                        {post.metadata.description}
                      </p>
                    ) : null}
                  </TransitionLink>
                </MotionSurface>
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
          <MotionSurface key={section.path} className="h-full">
            <TransitionLink
              href={section.path}
              className="block h-full rounded-lg bg-card px-5 py-5 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none"
            >
              <h2 className="type-headline m-0">{section.label}</h2>
              <p className="type-meta mb-0 mt-2 line-clamp-2 text-muted-foreground">
                {section.description}
              </p>
            </TransitionLink>
          </MotionSurface>
        ))}
      </nav>
    </div>
  )
}
