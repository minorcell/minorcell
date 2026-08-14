'use client'

import { useEffect } from 'react'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body className="bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 text-center">
          <span className="type-meta font-medium text-link-accent">
            出错了
          </span>
          <h1 className="type-page-title mt-4">页面加载失败</h1>
          <p className="type-supporting mb-0 mt-4 max-w-[38ch] text-muted-foreground">
            页面渲染时发生了意外错误，重试通常可以恢复。如果问题持续，请稍后再来。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="type-meta inline-flex h-10 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-accent-foreground"
            >
              重试
            </button>
            {/* 出错时客户端路由可能已不可用，用原生导航回首页 */}
            {/* oxlint-disable-next-line next/no-html-link-for-pages */}
            <a
              href="/"
              className="type-meta font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              返回首页
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
