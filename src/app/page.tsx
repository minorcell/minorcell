import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
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

const padIndex = (n: number) => String(n).padStart(2, '0')

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
      {/* ——— Poster hero ——— */}
      <header className="border-b border-border pb-12 pt-14 sm:pb-16 sm:pt-20">
        <div className="flex items-baseline justify-between gap-4">
          <span className="swiss-label text-muted-foreground">
            Personal Publication — Est. 2024
          </span>
          <span className="swiss-label hidden text-muted-foreground sm:block">
            47.37&deg;N / 8.54&deg;E
          </span>
        </div>

        <h1 className="type-display m-0 mt-8">minorcell</h1>

        <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-12">
          <p className="type-intro m-0 max-w-[46ch] text-muted-foreground sm:col-span-7">
            <MotionGreeting />
            ，我是
            <span> </span>
            <a
              href="https://github.com/minorcell"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-link-accent"
            >
              minorcell
            </a>
            ，这是我的个人站点，这里写代码，也写判断。记录真实问题、技术选择，以及把想法做成产品的过程。
          </p>
          <div className="swiss-label flex flex-col gap-3 text-muted-foreground sm:col-span-5 sm:items-end">
            <span>写代码，也写判断</span>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="swiss-mark !h-1.5 !w-1.5" />
              {posts.length}+ Publications
            </span>
          </div>
        </div>
      </header>

      {/* ——— Latest index ——— */}
      <section aria-labelledby="latest-heading" className="mt-14 sm:mt-20">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h2 id="latest-heading" className="swiss-label text-foreground">
            01 — 最新发布
          </h2>
          <TransitionLink
            href="/articles"
            className="swiss-label inline-flex items-center gap-1 text-link-accent"
          >
            全部文章
            <ArrowUpRight className="h-3 w-3" />
          </TransitionLink>
        </div>
        <div className="swiss-rule" />

        {featuredPost ? (
          <MotionSurface>
            <TransitionLink
              href={getContentHref(featuredPost)}
              className="group grid gap-4 border-b border-border px-2 py-8 sm:grid-cols-12 sm:gap-6 sm:px-4 sm:py-10"
            >
              <div className="swiss-label text-muted-foreground sm:col-span-2">
                {featuredPost.metadata.date
                  ? formatDate(featuredPost.metadata.date)
                  : '——'}
              </div>
              <div className="sm:col-span-9">
                <h3 className="type-feature-title m-0 max-w-[22ch] tracking-tight transition-colors group-hover:text-link-accent">
                  {featuredPost.metadata.title}
                </h3>
                {featuredPost.metadata.description ? (
                  <p className="type-supporting m-0 mt-4 max-w-[58ch] text-muted-foreground">
                    {featuredPost.metadata.description}
                  </p>
                ) : null}
              </div>
              <div className="hidden justify-end sm:col-span-1 sm:flex">
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-link-accent" />
              </div>
            </TransitionLink>
          </MotionSurface>
        ) : (
          <p className="py-12 text-muted-foreground">暂无内容</p>
        )}

        {recentPosts.length > 0 ? (
          <ol className="m-0 list-none p-0">
            {recentPosts.map((post, i) => (
              <li key={post.slug}>
                <MotionSurface>
                  <TransitionLink
                    href={getContentHref(post)}
                    className="swiss-index-row group !px-2 sm:!px-4"
                  >
                    <span className="swiss-label text-muted-foreground/60">
                      {padIndex(i + 2)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="type-headline m-0 transition-colors group-hover:text-link-accent">
                        {post.metadata.title}
                      </h3>
                      {post.metadata.description ? (
                        <p className="type-meta m-0 mt-1 line-clamp-1 text-muted-foreground">
                          {post.metadata.description}
                        </p>
                      ) : null}
                    </div>
                    <time className="swiss-label shrink-0 text-muted-foreground">
                      {post.metadata.date
                        ? formatDate(post.metadata.date)
                        : null}
                    </time>
                  </TransitionLink>
                </MotionSurface>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {/* ——— Sections ——— */}
      <nav
        aria-label="栏目导航"
        className="mt-20 grid gap-px border border-border bg-border sm:mt-24 sm:grid-cols-3"
      >
        {siteContent.sections.map((section, i) => (
          <MotionSurface key={section.path} className="h-full">
            <TransitionLink
              href={section.path}
              className="group block h-full bg-background px-5 py-6 transition-colors hover:bg-surface-hover"
            >
              <div className="flex items-center justify-between">
                <span className="swiss-label text-muted-foreground/60">
                  0{i + 1}
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-link-accent" />
              </div>
              <h2 className="type-section-title m-0 mt-6 tracking-tight">
                {section.label}
              </h2>
              <p className="type-meta m-0 mt-2 text-muted-foreground">
                {section.description}
              </p>
            </TransitionLink>
          </MotionSurface>
        ))}
      </nav>
    </div>
  )
}
