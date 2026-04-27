import type { Metadata } from 'next'
import { siteContent } from '@/lib/site-content'

const baseUrl = siteContent.url.replace(/\/$/, '')
const defaultSocialImage = '/logo.svg'

export const siteAuthor = {
  name: 'mcell',
  github: siteContent.contact.github ?? 'https://github.com/minorcell',
  email: siteContent.contact.email,
}

export const defaultSeoKeywords = Array.from(
  new Set([
    ...siteContent.keywords,
    'Cell Stack',
    'mcell',
    '技术博客',
    '前端开发',
    '全栈开发',
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'AI Agent',
  ]),
)

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value)

const normalizePath = (path = '/') => {
  if (isHttpUrl(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

export const toAbsoluteUrl = (path = '/') => {
  const normalized = normalizePath(path)
  if (isHttpUrl(normalized)) return normalized
  return `${baseUrl}${normalized}`
}

const dedupeKeywords = (keywords: string[] = []) =>
  Array.from(
    new Set(
      [...defaultSeoKeywords, ...keywords]
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0),
    ),
  )

interface BuildMetadataOptions {
  title: string
  description: string
  path?: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
}

export function buildPageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  image = defaultSocialImage,
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const canonical = normalizePath(path)
  const ogImage = toAbsoluteUrl(image)
  const keywordList = dedupeKeywords(keywords)

  return {
    title,
    description,
    keywords: keywordList,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: siteContent.name,
      locale: siteContent.locale.replace('-', '_'),
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            'max-image-preview': 'none',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  }
}

interface BuildArticleMetadataOptions extends BuildMetadataOptions {
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

export function buildArticleMetadata({
  title,
  description,
  path,
  keywords = [],
  image = defaultSocialImage,
  noIndex = false,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
}: BuildArticleMetadataOptions): Metadata {
  const pageMetadata = buildPageMetadata({
    title,
    description,
    path,
    keywords: [...keywords, ...tags, section ?? ''],
    image,
    noIndex,
  })
  const canonical = normalizePath(path)

  return {
    ...pageMetadata,
    category: section,
    authors: [{ name: siteAuthor.name, url: siteAuthor.github }],
    openGraph: {
      ...pageMetadata.openGraph,
      type: 'article',
      url: canonical,
      publishedTime,
      modifiedTime,
      section,
      tags,
    },
  }
}
