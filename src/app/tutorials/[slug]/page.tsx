import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTutorialBySlug, getAllTutorials } from '@/lib/content-parser'
import { TutorialView } from '@/lib/content-renderer'
import { TutorialCover } from '@/components/tutorials/TutorialCover'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildArticleMetadata, buildPageMetadata } from '@/lib/seo'
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
} from '@/lib/structured-data'

interface TutorialPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const tutorials = getAllTutorials()
  return tutorials.map((tutorial) => ({
    slug: tutorial.slug,
  }))
}

export async function generateMetadata({
  params,
}: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params
  const tutorial = getTutorialBySlug(slug)

  if (!tutorial) {
    return buildPageMetadata({
      title: '教程不存在',
      description: '请求的教程不存在或已删除。',
      path: `/tutorials/${slug}`,
      noIndex: true,
    })
  }

  const tags = Array.isArray(tutorial.metadata.tags) ? tutorial.metadata.tags : []

  return buildArticleMetadata({
    title: `${tutorial.metadata.title} 教程`,
    description: tutorial.metadata.description ?? '',
    path: `/tutorials/${slug}`,
    keywords: [tutorial.metadata.title, '技术教程', '交互教程'],
    publishedTime: tutorial.metadata.date,
    modifiedTime: tutorial.metadata.date,
    section: 'Tutorials',
    tags,
  })
}

export default async function TutorialPage({ params }: TutorialPageProps) {
  const { slug } = await params
  const tutorial = getTutorialBySlug(slug)

  if (!tutorial || tutorial.steps.length === 0) {
    notFound()
  }

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '教程', path: '/tutorials' },
    { name: tutorial.metadata.title, path: `/tutorials/${slug}` },
  ])
  const tutorialJsonLd = createArticleJsonLd({
    type: 'TechArticle',
    title: tutorial.metadata.title,
    description: tutorial.metadata.description || tutorial.intro,
    path: `/tutorials/${slug}`,
    publishedTime: tutorial.metadata.date,
    modifiedTime: tutorial.metadata.date,
    section: 'Tutorials',
    keywords: [tutorial.metadata.title, '技术教程', '交互教程'],
  })

  const allTutorials = getAllTutorials()
  const tutorialIndex = allTutorials.findIndex((t) => t.slug === slug)
  const issueNumber = String(tutorialIndex >= 0 ? tutorialIndex + 1 : 1).padStart(
    2,
    '0',
  )

  const hasCode = tutorial.steps.some((s) => s.kind === 'code')
  const hasImage = tutorial.steps.some((s) => s.kind === 'image')
  const hasDemo = tutorial.steps.some((s) => s.kind === 'demo')
  const compositionParts = [
    hasCode ? 'CODE' : null,
    hasImage ? 'VISUAL' : null,
    hasDemo ? 'INTERACTIVE' : null,
  ].filter((p): p is string => Boolean(p))
  const composition =
    compositionParts.length > 1
      ? compositionParts.join(' · ')
      : `${compositionParts[0] ?? 'CODE'} WALKTHROUGH`

  return (
    <div>
      <JsonLd id={`tutorial-breadcrumb-${slug}`} data={breadcrumbJsonLd} />
      <JsonLd id={`tutorial-techarticle-${slug}`} data={tutorialJsonLd} />

      <TutorialCover
        title={tutorial.metadata.title}
        description={tutorial.metadata.description ?? ''}
        issueNumber={issueNumber}
        stepsCount={tutorial.steps.length}
        composition={composition}
      />

      <section className="tutorial-stage">
        <TutorialView
          tutorial={tutorial}
          discussionTerm={`tutorials/${slug}`}
        />
      </section>
    </div>
  )
}
