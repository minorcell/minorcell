'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Loader2, Search, X } from 'lucide-react'

type PagefindInstance = {
  search: (query: string) => Promise<{
    results: PagefindHit[]
  }>
  init?: () => Promise<unknown>
  options?: (opts: Record<string, unknown>) => Promise<unknown>
}

type PagefindResult = {
  url: string
  excerpt?: string
  content?: string
  meta?: Record<string, string>
}

type PagefindHit = {
  id?: string
  data: () => Promise<PagefindResult>
}

type SearchHit = {
  url: string
  title: string
  excerpt?: string
}

type BundleState = 'idle' | 'loading' | 'ready' | 'error'

type Props = {
  variant?: 'page' | 'overlay'
  open?: boolean
  onClose?: () => void
  autoFocus?: boolean
}

export function PagefindSearch({
  variant = 'page',
  open = true,
  onClose,
  autoFocus = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [bundleState, setBundleState] = useState<BundleState>('idle')
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pagefindRef = useRef<PagefindInstance | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  const isOverlay = variant === 'overlay'
  const isActive = isOverlay ? open : true

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isActive || !autoFocus) return
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [isActive, autoFocus])

  useEffect(() => {
    if (!isOverlay || !open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOverlay, open])

  useEffect(() => {
    if (!isOverlay || !open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOverlay, open, onClose])

  const resetBundleState = useCallback(() => {
    setBundleState('idle')
    setErrorMessage(null)
    pagefindRef.current = null
  }, [])

  const ensurePagefind =
    useCallback(async (): Promise<PagefindInstance | null> => {
      if (pagefindRef.current) return pagefindRef.current
      if (bundleState === 'loading' || bundleState === 'error') return null

      setBundleState('loading')
      setErrorMessage(null)

      try {
        const pagefindBundlePath: string = '/pagefind/pagefind.js'
        const mod = (await import(
          /* webpackIgnore: true */ pagefindBundlePath
        )) as PagefindInstance

        if (typeof mod.init === 'function') {
          await mod.init()
        }

        if (typeof mod.options === 'function') {
          await mod.options({ basePath: '/pagefind/', baseUrl: '/' })
        }

        const instance = mod as PagefindInstance

        if (!instance || typeof instance.search !== 'function') {
          throw new Error('Invalid Pagefind instance')
        }

        pagefindRef.current = instance
        setBundleState('ready')
        return instance
      } catch (error) {
        console.error('Failed to load Pagefind', error)
        setBundleState('error')
        setErrorMessage(
          '找不到 Pagefind 索引，请先运行构建（pnpm build）后再试。',
        )
        return null
      }
    }, [bundleState])

  useEffect(() => {
    if (!isActive || bundleState !== 'idle') return
    void ensurePagefind()
  }, [isActive, bundleState, ensurePagefind])

  useEffect(() => {
    if (!isActive) return
    if (query.trim().length < 2) {
      setHits([])
      return
    }

    const handle = setTimeout(async () => {
      const pagefind = await ensurePagefind()
      if (!pagefind) return

      setIsSearching(true)
      setErrorMessage(null)

      try {
        const search = await pagefind.search(query)
        const detailed = await Promise.all(
          search.results.slice(0, 20).map(async (result: PagefindHit, idx) => {
            const data = await result.data()
            return {
              url: data.url,
              title:
                (data.meta && typeof data.meta.title === 'string'
                  ? data.meta.title
                  : data.url) ?? `结果 ${idx + 1}`,
              excerpt:
                typeof data.excerpt === 'string'
                  ? data.excerpt
                  : data.content?.slice(0, 200),
            }
          }),
        )
        setHits(detailed)
      } catch (error) {
        console.error('Search failed', error)
        setErrorMessage('搜索时出错，请稍后再试。')
      } finally {
        setIsSearching(false)
      }
    }, 180)

    return () => clearTimeout(handle)
  }, [query, isActive, ensurePagefind])

  const resultsSection = (
    <div className="p-4 space-y-3 overflow-y-auto flex-1 max-h-[50vh]">
      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="ml-4 underline hover:opacity-70 transition-opacity"
            onClick={resetBundleState}
          >
            重试
          </button>
        </div>
      )}

      {bundleState === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在加载索引...</span>
        </div>
      )}

      {!query && (
        <p className="text-sm text-muted-foreground py-4">
          输入 2 个以上字符开始全站搜索。
        </p>
      )}

      {query && !isSearching && hits.length === 0 && !errorMessage && (
        <p className="text-sm text-muted-foreground py-4">
          没有找到匹配的结果。
        </p>
      )}

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>搜索中...</span>
        </div>
      )}

      {hits.length > 0 && (
        <div className="divide-y divide-border/50">
          {hits.map((hit, index) => (
            <Link
              key={`${hit.url}-${index}`}
              href={hit.url}
              className="group block py-4 hover:bg-muted/50 -mx-4 px-4 transition-colors"
              onClick={onClose}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-medium text-foreground group-hover:opacity-70 transition-opacity">
                    {hit.title}
                  </p>
                  {hit.excerpt && (
                    <p
                      className="mt-1 text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                    />
                  )}
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {hit.url}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )

  const content = (
    <div className="bg-background border border-border rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2 flex-1 bg-muted rounded-md focus-within:ring-2 focus-within:ring-ring transition-all">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="搜索博客与页面..."
            autoComplete="off"
          />
        </div>
        {isOverlay && (
          <button
            type="button"
            aria-label="关闭搜索"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {resultsSection}
    </div>
  )

  if (isOverlay) {
    if (!open || !mounted) return null

    return createPortal(
      <div className="fixed inset-0 z-[1400] flex items-start justify-center bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-10 sm:py-14 overflow-y-auto">
        <div className="w-full max-w-2xl">{content}</div>
      </div>,
      document.body,
    )
  }

  return <div className="w-full">{content}</div>
}
