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
      <span className="text-[14px] font-medium text-[color:var(--link-accent)]">
        404
      </span>
      <h1 className="mt-4 text-[2.5rem] font-semibold leading-tight sm:text-[3.5rem]">
        页面不存在
      </h1>
      <p className="mb-0 mt-4 max-w-[38ch] text-[15px] leading-7 text-muted-foreground">
        页面可能已被移动、重命名或删除。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <TransitionLink
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-[color:var(--accent-foreground)] hover:text-primary-foreground"
        >
          返回首页
        </TransitionLink>
        <TransitionLink
          href="/articles"
          className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          浏览文章
        </TransitionLink>
      </div>
    </div>
  )
}
