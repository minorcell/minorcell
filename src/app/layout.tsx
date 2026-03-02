import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import DotGrid from '@/components/effects/reactbits/DotGrid'
import { ExternalLinkGuard } from '@/components/layout/ExternalLinkGuard'
import { siteContent } from '@/lib/site-content'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-orbitron',
})

export const metadata: Metadata = {
  title: {
    default: siteContent.name,
    template: `%s | ${siteContent.name}`,
  },
  description: siteContent.description,
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/logo-light.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml',
      },
      {
        url: '/logo-dark.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml',
      },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: [
      {
        url: '/logo-light.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml',
      },
      {
        url: '/logo-dark.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml',
      },
    ],
    apple: [{ url: '/logo-light.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
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
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <DotGrid
            className="p-0! h-full w-full opacity-35"
            dotSize={5}
            gap={15}
            baseColor="var(--dotgrid-base)"
            activeColor="var(--dotgrid-active)"
            proximity={120}
            speedTrigger={100}
            shockRadius={250}
            shockStrength={5}
            maxSpeed={5000}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 relative" data-pagefind-body>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
