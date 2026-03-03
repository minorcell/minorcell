import type { MetadataRoute } from 'next'
import { siteContent } from '@/lib/site-content'

const baseUrl = siteContent.url.replace(/\/$/, '')
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/private/'],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`],
    host: baseUrl,
  }
}
