import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTopic, getAllTopics } from '@/lib/topics.server'
import { getInteractiveTutorial } from '@/lib/interactive.server'
import { InteractiveTutorialView } from '@/components/interactive/InteractiveTutorialView'
import type { SerializedStep } from '@/components/interactive/InteractiveTutorialView'
import { TopicCover } from '@/components/topics/TopicCover'
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

      {/* COVER — full viewport, sticky; hidden behind stage as user scrolls */}
      <TopicCover
        title={tutorial.title}
        description={tutorial.description}
        issueNumber={issueNumber}
        stepsCount={tutorial.steps.length}
        composition={composition}
      />

      {/* STAGE — rises over the cover; cover already conveys topic meta,
       *         so we go directly into the interactive tutorial here. */}
      <section className="topic-stage">
        <InteractiveTutorialView
          title={tutorial.title}
          description={tutorial.description}
          intro={tutorial.intro}
          steps={serializedSteps}
        />
      </section>
    </>
  )
}
