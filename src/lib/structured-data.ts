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
const websiteId = `${websiteUrl}/#website`
const personId = `${websiteUrl}/#person`
const organizationId = `${websiteUrl}/#organization`
const logoUrl = toAbsoluteUrl('/android-chrome-512x512.png')

const organizationJsonLd = {
  '@type': 'Organization',
  '@id': organizationId,
  name: siteContent.name,
  alternateName: siteAuthor.name,
  url: websiteUrl,
  logo: {
    '@type': 'ImageObject',
    url: logoUrl,
    width: 512,
    height: 512,
  },
}

export function createWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: siteContent.name,
    alternateName: siteAuthor.name,
    url: websiteUrl,
    inLanguage: siteContent.locale,
    description: siteContent.description,
    publisher: organizationJsonLd,
  }
}

export function createOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    ...organizationJsonLd,
  }
}

export function createPersonJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: siteAuthor.name,
    alternateName: siteAuthor.alternateName,
    url: toAbsoluteUrl(siteAuthor.aboutPath),
    description: siteAuthor.description,
    image: logoUrl,
    sameAs: [siteAuthor.github],
    email: siteAuthor.email,
    knowsAbout: siteContent.keywords,
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
  image = '/og-image.png',
  section,
  keywords = [],
}: ArticleJsonLdOptions) {
  const articleUrl = toAbsoluteUrl(path)

  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${articleUrl}#article`,
    url: articleUrl,
    mainEntityOfPage: articleUrl,
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
      '@id': personId,
      name: siteAuthor.name,
      url: toAbsoluteUrl(siteAuthor.aboutPath),
    },
    publisher: organizationJsonLd,
    isPartOf: {
      '@type': 'WebSite',
      '@id': websiteId,
      name: siteContent.name,
      url: websiteUrl,
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
