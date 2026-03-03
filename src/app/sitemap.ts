import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/mdx'
import { siteContent } from '@/lib/site-content'
import { getAllTopics } from '@/lib/topics.server'

const baseUrl = siteContent.url.replace(/\/$/, '')
export const dynamic = 'force-static'

const toDate = (value?: string | Date) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getLatestDate = (values: Array<string | Date | undefined>) => {
  const dates = values
    .map((value) => toDate(value))
    .filter((date): date is Date => Boolean(date))
  if (dates.length === 0) return new Date()

  return dates.reduce((latest, current) =>
    latest.getTime() >= current.getTime() ? latest : current,
  )
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts('blog')
  const topics = getAllTopics()

  const latestBlogDate = getLatestDate(posts.map((post) => post.metadata.date))
  const latestTopicDate = getLatestDate(
    topics.flatMap((topic) => topic.articles.map((article) => article.date)),
  )

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestBlogDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestBlogDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: latestTopicDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/stack-mcp`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/feed.xml`,
      lastModified: latestBlogDate,
      changeFrequency: 'daily',
      priority: 0.65,
    },
  ]

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  const topicRoutes: MetadataRoute.Sitemap = []
  for (const topic of topics) {
    const topicLatestDate = getLatestDate(
      topic.articles.map((article) => article.date),
    )

    topicRoutes.push({
      url: `${baseUrl}/topics/${topic.slug}`,
      lastModified: topicLatestDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    })

    for (const article of topic.articles) {
      topicRoutes.push({
        url: `${baseUrl}/topics/${topic.slug}/${article.slug}`,
        lastModified: article.date ? new Date(article.date) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.68,
      })
    }
  }

  return [...staticRoutes, ...blogRoutes, ...topicRoutes]
}
