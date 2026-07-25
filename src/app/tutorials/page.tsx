import type { Metadata } from 'next'
import { SectionHero } from '@/components/common/SectionHero'
import { TransitionLink } from '@/components/effects/PageTransition'
import { JsonLd } from '@/components/seo/JsonLd'
import { getAllTutorials } from '@/lib/content-parser'
import { buildPageMetadata } from '@/lib/seo'
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
} from '@/lib/structured-data'

const tutorialsDescription =
  '按主题系统学习 AI Agent、JavaScript 运行机制、前端交互与可观测性，通过深度阅读和交互练习建立完整心智模型。'

export const metadata: Metadata = buildPageMetadata({
  title: '技术专题合集',
  description: tutorialsDescription,
  path: '/tutorials',
  keywords: [
    '技术专题',
    'AI Agent 教程',
    'JavaScript 教程',
    '前端交互',
    '可观测性',
    'Prometheus',
    'Grafana',
  ],
})

export default function TutorialsPage() {
  const tutorials = getAllTutorials()
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '教程', path: '/tutorials' },
  ])
  const collectionPageJsonLd = createCollectionPageJsonLd({
    title: '技术专题合集',
    description: tutorialsDescription,
    path: '/tutorials',
    items: tutorials.map((tutorial) => ({
      name: tutorial.metadata.title,
      path: `/tutorials/${tutorial.slug}`,
    })),
  })

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
      <JsonLd id="tutorials-breadcrumb" data={breadcrumbJsonLd} />
      <JsonLd id="tutorials-collection" data={collectionPageJsonLd} />

      <SectionHero
        title="教程"
        countLabel={`${tutorials.length} 个专题`}
        intro="按主题组织的深度阅读与交互练习，从一个问题逐步建立完整的心智模型。"
      />

      {tutorials.length > 0 ? (
        <ol className="mt-14 grid list-none gap-3 p-0 sm:mt-20 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <li key={tutorial.slug}>
              <TransitionLink
                href={`/tutorials/${tutorial.slug}`}
                className="block h-full rounded-lg bg-card px-6 py-7 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none sm:px-7 sm:py-8"
              >
                <span className="type-caption font-medium text-link-accent">
                  专题
                </span>
                <h2 className="type-card-title m-0 mt-3">
                  {tutorial.metadata.title}
                </h2>
                {tutorial.metadata.description ? (
                  <p className="type-supporting mb-0 mt-3 line-clamp-3 text-muted-foreground">
                    {tutorial.metadata.description}
                  </p>
                ) : null}
              </TransitionLink>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-16 text-muted-foreground">暂无专题</p>
      )}
    </div>
  )
}
