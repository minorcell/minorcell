import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { getAllTopics } from '@/lib/topics.server'
import { buildPageMetadata } from '@/lib/seo'
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
} from '@/lib/structured-data'

export const metadata: Metadata = buildPageMetadata({
  title: '技术专题合集',
  description:
    '按主题系统学习前端与 AI 工程内容，包含 React 深入解析、Hooks 指南、Agent 开发与提示词工程等专题。',
  path: '/topics',
  keywords: [
    '技术专题',
    'React 专题',
    'Hooks 教程',
    'Agent 开发',
    '系统提示词',
    '前端进阶',
  ],
})

const formatIsoDate = (value: Date) =>
  `${value.getFullYear()} · ${String(value.getMonth() + 1).padStart(2, '0')} · ${String(value.getDate()).padStart(2, '0')}`

const pad = (n: number) => String(n).padStart(2, '0')

export default function TopicsPage() {
  const topics = getAllTopics()
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '专题', path: '/topics' },
  ])
  const collectionPageJsonLd = createCollectionPageJsonLd({
    title: '技术专题合集',
    description:
      '按主题系统学习前端与 AI 工程内容，包含 React 深入解析、Hooks 指南、Agent 开发与提示词工程等专题。',
    path: '/topics',
    items: topics.map((topic) => ({
      name: topic.title,
      path: `/topics/${topic.slug}`,
    })),
  })

  const orbitron = {
    fontFamily: 'var(--font-orbitron), Georgia, serif',
  } as const
  const accentBlue = 'oklch(0.86 0.05 220)'

  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      <JsonLd id="topics-breadcrumb" data={breadcrumbJsonLd} />
      <JsonLd id="topics-collection" data={collectionPageJsonLd} />

      {/* MASTHEAD */}
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-5">
            <span>SECTION §03 · SERIES</span>
            <span className="hidden sm:inline">{topics.length} TOPICS</span>
          </div>
          <span>{formatIsoDate(new Date())}</span>
        </div>

        <h1
          className="m-0 mt-9 text-[clamp(2.8rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em] text-pretty sm:text-balance"
          style={{ ...orbitron, fontWeight: 800 }}
        >
          The{' '}
          <span
            className="text-muted-foreground"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            &amp;
          </span>{' '}
          Series
        </h1>

        <div className="mt-7 grid gap-4 sm:mt-9 sm:grid-cols-[220px_1fr] sm:gap-10">
          <div className="pt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span
              aria-hidden
              className="mr-2.5 inline-block h-px w-6 bg-foreground align-middle"
            />
            READING SERIES
          </div>
          <p className="m-0 max-w-[42ch] text-[clamp(1.05rem,1rem+0.5vw,1.3rem)] leading-[1.55] tracking-[-0.005em]">
            按主题串成系列的深度阅读：从一篇出发到一整套心智模型——优先从专题首页进入，按步骤完成交互教程，再回到目录继续下一个主题。
          </p>
        </div>
      </header>

      {/* SERIES LINEUP */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-2 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
            style={{ ...orbitron, fontWeight: 700 }}
          >
            All Series
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            INDEX · 全部专题
          </span>
        </div>

        {topics.length > 0 ? (
          <ol className="m-0 list-none p-0 lg:grid lg:grid-cols-2">
            {topics.map((topic, idx) => {
              const isLeftCol = idx % 2 === 0
              return (
                <li
                  key={topic.slug}
                  className={`border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0 ${
                    !isLeftCol
                      ? 'lg:border-l lg:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]'
                      : ''
                  }`}
                >
                  <Link
                    href={`/topics/${topic.slug}`}
                    className={`group grid items-start gap-5 py-7 hover:opacity-100 sm:gap-7 sm:py-9 ${
                      !isLeftCol ? 'lg:pl-10' : 'lg:pr-10'
                    }`}
                    style={{ gridTemplateColumns: '64px 1fr' }}
                  >
                    <span
                      className="text-muted-foreground transition-[color,transform] duration-200 group-hover:-translate-x-1"
                      style={{
                        ...orbitron,
                        fontWeight: 500,
                        fontSize: 'clamp(1.4rem, 1.2rem + 0.6vw, 1.9rem)',
                        letterSpacing: '-0.01em',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.05,
                      }}
                    >
                      {pad(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="mb-2.5 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        <span>§ /{topic.slug}</span>
                        <span
                          className="transition-transform duration-200 group-hover:translate-x-1"
                          style={{ color: accentBlue }}
                        >
                          阅读 →
                        </span>
                      </div>
                      <h3
                        className="m-0 text-[clamp(1.35rem,1.1rem+0.9vw,1.85rem)] leading-[1.2] tracking-[-0.015em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontWeight: 500,
                        }}
                      >
                        {topic.title}
                      </h3>
                      {topic.description && (
                        <p className="mt-3 line-clamp-3 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground">
                          {topic.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            暂无专题数据
          </div>
        )}
      </section>

      {/* READING NOTE */}
      <section className="mt-20 grid gap-4 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-8 sm:mt-24 sm:grid-cols-[220px_1fr] sm:gap-10">
        <h2 className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Reading Note
        </h2>
        <p className="m-0 leading-relaxed text-foreground/85">
          每个专题都按"从一个想法出发，到一整套可以复用的心智模型"的顺序排列。如果你时间有限，建议先看{' '}
          <span className="text-foreground">§01</span>
          ，再按目录顺序往下走——后面的篇章会引用前文的概念。
        </p>
      </section>
    </div>
  )
}
