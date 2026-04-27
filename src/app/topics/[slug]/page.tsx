import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTopic, getAllTopics } from '@/lib/topics.server'
import { getInteractiveTutorial } from '@/lib/interactive.server'
import { InteractiveTutorialView } from '@/components/interactive/InteractiveTutorialView'
import type { SerializedStep } from '@/components/interactive/InteractiveTutorialView'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildPageMetadata } from '@/lib/seo'
import { createBreadcrumbJsonLd } from '@/lib/structured-data'

interface TopicPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const topics = getAllTopics()
  return topics.map((topic) => ({
    slug: topic.slug,
  }))
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopic(slug)

  if (!topic) {
    return buildPageMetadata({
      title: '专题不存在',
      description: '请求的专题不存在或已删除。',
      path: `/topics/${slug}`,
      noIndex: true,
    })
  }

  return buildPageMetadata({
    title: `${topic.title} 专题`,
    description: topic.description,
    path: `/topics/${slug}`,
    keywords: [topic.title, '技术专题', '交互教程'],
  })
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params
  const topic = getTopic(slug)

  if (!topic) {
    notFound()
  }

  const tutorial = getInteractiveTutorial(slug)
  if (!tutorial || tutorial.steps.length === 0) {
    notFound()
  }

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '专题', path: '/topics' },
    { name: topic.title, path: `/topics/${slug}` },
  ])

  const serializedSteps: SerializedStep[] = tutorial.steps.map((s) => {
    if (s.kind === 'code') {
      return {
        kind: 'code' as const,
        code: s.code,
        language: s.language,
        highlightLines: s.highlightLines,
        fileName: s.fileName,
        prose: s.prose,
      }
    }
    return {
      kind: 'image' as const,
      src: s.src,
      alt: s.alt,
      prose: s.prose,
    }
  })

  // Compute issue number for masthead from topic order
  const allTopics = getAllTopics()
  const topicIndex = allTopics.findIndex((t) => t.slug === slug)
  const issueNumber = String(topicIndex >= 0 ? topicIndex + 1 : 1).padStart(
    2,
    '0',
  )

  // Detect tutorial composition (code / image / mixed)
  const hasCode = tutorial.steps.some((s) => s.kind === 'code')
  const hasImage = tutorial.steps.some((s) => s.kind === 'image')
  const composition =
    hasCode && hasImage
      ? 'CODE & VISUAL'
      : hasCode
        ? 'CODE WALKTHROUGH'
        : 'VISUAL WALKTHROUGH'

  return (
    <>
      <JsonLd id={`topic-breadcrumb-${slug}`} data={breadcrumbJsonLd} />

      {/* MASTHEAD — magazine style */}
      <header className="mx-auto w-full px-6 pb-10 pt-14 sm:px-10 sm:pt-20 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[920px]">
          <div className="flex items-center justify-between gap-4 border-b border-[color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <div className="flex items-center gap-5">
              <span>TOPIC §{issueNumber}</span>
              <span className="hidden sm:inline">INTERACTIVE TUTORIAL</span>
            </div>
            <span>
              {tutorial.steps.length} STEPS · {composition}
            </span>
          </div>

          <h1
            className="m-0 mt-7 text-[clamp(1.85rem,1.4rem+2vw,3.4rem)] leading-[1.08] tracking-[-0.02em] text-pretty sm:text-balance"
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 500,
            }}
          >
            {tutorial.title}
          </h1>

          {tutorial.description && (
            <p
              className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1rem+0.45vw,1.3rem)] leading-[1.55] tracking-[-0.005em] text-muted-foreground"
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              {tutorial.description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[color-mix(in_oklab,var(--border)_85%,transparent)] pt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>BYLINE · MCELL</span>
            <span aria-hidden>SCROLL TO BEGIN ↓</span>
          </div>
        </div>
      </header>

      <InteractiveTutorialView
        title={tutorial.title}
        description={tutorial.description}
        intro={tutorial.intro}
        steps={serializedSteps}
      />
    </>
  )
}
