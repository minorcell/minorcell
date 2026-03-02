import type { Metadata } from 'next'
import Link from 'next/link'
import SpotlightCard from '@/components/effects/reactbits/SpotlightCard'
import { getAllTopics } from '@/lib/topics.server'

export const metadata: Metadata = {
  title: '专题',
  description: '精选技术专题合集，深入探讨各类技术主题',
}

export default function TopicsPage() {
  const topics = getAllTopics()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-2">
          专题
        </h1>
        <p className="text-muted-foreground text-sm">
          按主题深入阅读，共 {topics.length} 个专题
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}`}
            className="block hover:opacity-100"
          >
            <SpotlightCard
              spotlightColor="rgba(0, 0, 0, 0.12)"
              className="h-full !rounded-xl !border-border/60 !bg-background/65 !p-5 transition-colors hover:!border-border hover:!bg-muted/20"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-medium text-foreground">{topic.title}</h2>
                <span className="text-xs text-muted-foreground shrink-0">
                  {topic.articles.length} 篇
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {topic.description}
              </p>
            </SpotlightCard>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          暂无专题数据
        </div>
      )}
    </div>
  )
}
