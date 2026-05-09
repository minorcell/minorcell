import type { MetadataRoute } from 'next'
import { getAllArticles, getAllTutorials } from '@/lib/content-parser'
import { getAllBooks } from '@/lib/book-parser'
import { siteContent } from '@/lib/site-content'

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
  const posts = getAllArticles()
  const tutorials = getAllTutorials()

  const latestBlogDate = getLatestDate(posts.map((post) => post.metadata.date))
  const latestTopicDate = getLatestDate(
    tutorials.flatMap((tutorial) => tutorial.metadata.date),
  )
  const latestSiteDate = getLatestDate([latestBlogDate, latestTopicDate])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestBlogDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: latestBlogDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tutorials`,
      lastModified: latestTopicDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: latestSiteDate,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/feed.xml`,
      lastModified: latestBlogDate,
      changeFrequency: 'daily',
      priority: 0.65,
    },
  ]

  const articleRoutes: MetadataRoute.Sitemap = posts
    // Skip stub posts that defer to an interactive tutorial — their canonical URL
    // is the tutorial page, surfaced via tutorialRoutes below.
    .filter((post) => !post.metadata.topicSlug)
    .map((post) => ({
      url: `${baseUrl}/articles/${post.slug}`,
      lastModified: new Date(post.metadata.date ?? ''),
      changeFrequency: 'weekly',
      priority: 0.75,
    }))

  const tutorialRoutes: MetadataRoute.Sitemap = []
  for (const tutorial of tutorials) {
    const topicLatestDate = getLatestDate(
      [tutorial.metadata.date],
    )

    tutorialRoutes.push({
      url: `${baseUrl}/tutorials/${tutorial.slug}`,
      lastModified: topicLatestDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    })

  }

  const books = getAllBooks()
  const bookRoutes: MetadataRoute.Sitemap = []

  for (const book of books) {
    bookRoutes.push({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: latestSiteDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    })

    for (const vol of book.volumes) {
      for (const ch of vol.chapters) {
        if (ch.chapter > 0) {
          bookRoutes.push({
            url: `${baseUrl}/books/${book.slug}/${ch.slug}`,
            lastModified: latestSiteDate,
            changeFrequency: 'monthly',
            priority: 0.6,
          })
        }
      }
    }
  }

  if (books.length > 0) {
    bookRoutes.push({
      url: `${baseUrl}/books`,
      lastModified: latestSiteDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return [...staticRoutes, ...articleRoutes, ...tutorialRoutes, ...bookRoutes]
}
