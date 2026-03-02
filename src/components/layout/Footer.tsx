'use client'

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} CellStack</p>

          <div className="flex items-center gap-6">
            <Link
              href="/blog"
              className="hover:text-foreground transition-colors"
            >
              文章
            </Link>
            <Link
              href="/topics"
              className="hover:text-foreground transition-colors"
            >
              专题
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
