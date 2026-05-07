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
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        ERROR 404
      </span>
      <h1
        className="mt-6 text-[clamp(2.5rem,2rem+2vw,4rem)] leading-[1.05] tracking-[-0.03em]"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 500,
        }}
      >
        页面不存在
      </h1>
      <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">
        您访问的页面可能已被移动、重命名或删除。请检查 URL 是否输入正确，或从以下入口重新开始。
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <TransitionLink
          href="/"
          className="border border-[color:var(--link-accent)] px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--link-accent)] transition-colors hover:bg-[color:var(--link-accent)] hover:text-background"
        >
          返回首页
        </TransitionLink>
        <TransitionLink
          href="/articles"
          className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-1 font-mono text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:var(--link-accent)] hover:text-[color:var(--link-accent)]"
        >
          浏览文章
        </TransitionLink>
        <TransitionLink
          href="/tutorials"
          className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-1 font-mono text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:var(--link-accent)] hover:text-[color:var(--link-accent)]"
        >
          查看教程
        </TransitionLink>
      </div>
    </div>
  )
}
