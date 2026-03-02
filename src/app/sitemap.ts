import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/mdx'
import { siteContent } from '@/lib/site-content'
import { getAllTopics } from '@/lib/topics.server'

const baseUrl = siteContent.url.replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
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
  ]

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts('blog').map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const topicRoutes: MetadataRoute.Sitemap = []
  for (const topic of getAllTopics()) {
    topicRoutes.push({
      url: `${baseUrl}/topics/${topic.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })

    for (const article of topic.articles) {
      topicRoutes.push({
        url: `${baseUrl}/topics/${topic.slug}/${article.slug}`,
        lastModified: article.date ? new Date(article.date) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.65,
      })
    }
  }

  return [...staticRoutes, ...blogRoutes, ...topicRoutes]
}
