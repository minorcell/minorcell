import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PaperGrain } from '@/components/effects/PaperGrain'
import { CursorTracker } from '@/components/effects/CursorTracker'
import { ExternalLinkGuard } from '@/components/layout/ExternalLinkGuard'
import { PageTransitionProvider } from '@/components/effects/PageTransition'
import { JsonLd } from '@/components/seo/JsonLd'
import { siteContent } from '@/lib/site-content'
import { buildPageMetadata, defaultSeoKeywords, siteAuthor } from '@/lib/seo'
import { createPersonJsonLd, createWebsiteJsonLd } from '@/lib/structured-data'

// Variable axis (wght 400–900) — needed for MagneticTitle's smooth
// font-variation-settings interpolation. Static cuts would jump.
const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
})

const rootMetadata = buildPageMetadata({
  title: siteContent.title,
  description: siteContent.description,
  path: '/',
  keywords: defaultSeoKeywords,
})

export const metadata: Metadata = {
  metadataBase: new URL(siteContent.url),
  applicationName: siteContent.name,
  title: {
    default: siteContent.title,
    template: `%s | ${siteContent.name}`,
  },
  description: rootMetadata.description,
  keywords: rootMetadata.keywords,
  authors: [{ name: siteAuthor.name, url: siteAuthor.github }],
  creator: siteAuthor.name,
  publisher: siteAuthor.name,
  category: 'technology',
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: rootMetadata.openGraph,
  twitter: rootMetadata.twitter,
  robots: rootMetadata.robots,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const websiteJsonLd = createWebsiteJsonLd()
  const personJsonLd = createPersonJsonLd()

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <JsonLd id="website-jsonld" data={websiteJsonLd} />
        <JsonLd id="person-jsonld" data={personJsonLd} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light'
                if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                }
              })()
            `,
          }}
        />
      </head>
      <body
        className={`${orbitron.variable} min-h-screen bg-background text-foreground relative`}
      >
        <ExternalLinkGuard />
        <PaperGrain />
        <CursorTracker />
        <div className="relative z-10 flex min-h-screen flex-col">
          <PageTransitionProvider>
            <Navbar />
            <main className="flex-1 relative" data-pagefind-body>
              {children}
            </main>
            <Footer />
          </PageTransitionProvider>
        </div>
      </body>
    </html>
  )
}
