import { siteContent } from '@/lib/site-content'
import { siteAuthor, toAbsoluteUrl } from '@/lib/seo'

interface BreadcrumbItem {
  name: string
  path: string
}

interface ArticleJsonLdOptions {
  type: 'BlogPosting' | 'TechArticle'
  title: string
  description: string
  path: string
  publishedTime?: string
  modifiedTime?: string
  image?: string
  section?: string
  keywords?: string[]
}

interface CollectionPageJsonLdOptions {
  title: string
  description: string
  path: string
  items: Array<{
    name: string
    path: string
  }>
}

const websiteUrl = siteContent.url.replace(/\/$/, '')

export function createWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteContent.name,
    alternateName: siteContent.title,
    url: websiteUrl,
    inLanguage: siteContent.locale,
    description: siteContent.description,
    publisher: {
      '@type': 'Person',
      name: siteAuthor.name,
      url: siteAuthor.github,
    },
  }
}

export function createPersonJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteAuthor.name,
    url: websiteUrl,
    sameAs: [siteAuthor.github],
    email: siteAuthor.email,
  }
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  }
}

export function createArticleJsonLd({
  type,
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  image = '/logo.svg',
  section,
  keywords = [],
}: ArticleJsonLdOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    mainEntityOfPage: toAbsoluteUrl(path),
    headline: title,
    description,
    inLanguage: siteContent.locale,
    datePublished: publishedTime,
    dateModified: modifiedTime ?? publishedTime,
    image: [toAbsoluteUrl(image)],
    articleSection: section,
    keywords,
    author: {
      '@type': 'Person',
      name: siteAuthor.name,
      url: siteAuthor.github,
    },
    publisher: {
      '@type': 'Person',
      name: siteAuthor.name,
      url: siteAuthor.github,
    },
  }
}

export function createCollectionPageJsonLd({
  title,
  description,
  path,
  items,
}: CollectionPageJsonLdOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: toAbsoluteUrl(path),
    inLanguage: siteContent.locale,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: toAbsoluteUrl(item.path),
      })),
    },
  }
}
