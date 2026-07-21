import { TransitionLink } from '@/components/effects/PageTransition'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 · 页面不存在',
  description: '您访问的页面不存在或已移动。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-6 text-center">
      <span className="type-meta font-medium text-link-accent">404</span>
      <h1 className="type-page-title mt-4">页面不存在</h1>
      <p className="type-supporting mb-0 mt-4 max-w-[38ch] text-muted-foreground">
        页面可能已被移动、重命名或删除。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <TransitionLink
          href="/"
          className="type-meta inline-flex h-10 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-accent-foreground hover:text-primary-foreground"
        >
          返回首页
        </TransitionLink>
        <TransitionLink
          href="/articles"
          className="type-meta font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          浏览文章
        </TransitionLink>
      </div>
    </div>
  )
}
