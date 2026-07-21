'use client'

import { TransitionLink } from '@/components/effects/PageTransition'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const isOverlay = variant === 'overlay'
  const isActive = isOverlay ? open : true

  useEffect(() => {
    if (!isOverlay || !open) return
    const previousFocus = document.activeElement as HTMLElement | null
    return () => previousFocus?.focus()
  }, [isOverlay, open])

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
        return
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.getClientRects().length > 0)
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
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
    const frame = requestAnimationFrame(() => void ensurePagefind())
    return () => cancelAnimationFrame(frame)
  }, [isActive, bundleState, ensurePagefind])

  useEffect(() => {
    if (!isActive) return
    if (query.trim().length < 2) return

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
    <div className="max-h-[60vh] flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
      {errorMessage && (
        <div className="type-caption mb-3 rounded-md bg-destructive/10 px-4 py-3 text-destructive">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="ml-3 font-medium underline underline-offset-2"
            onClick={resetBundleState}
          >
            重试
          </button>
        </div>
      )}

      {bundleState === 'loading' && (
        <div className="type-meta flex items-center gap-2 px-3 py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在准备搜索</span>
        </div>
      )}

      {!query && bundleState !== 'loading' && (
        <p className="type-meta mb-0 px-3 py-4 text-muted-foreground">
          输入至少 2 个字符
        </p>
      )}

      {query && !isSearching && hits.length === 0 && !errorMessage && (
        <p className="type-meta mb-0 px-3 py-4 text-muted-foreground">
          没有找到相关内容
        </p>
      )}

      {isSearching && (
        <div className="type-meta flex items-center gap-2 px-3 py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在搜索</span>
        </div>
      )}

      {hits.length > 0 && (
        <>
          <div className="type-caption mb-1 px-3 py-2 text-muted-foreground">
            {hits.length} 个结果
          </div>
          <ol className="m-0 list-none space-y-1 p-0">
            {hits.map((hit, index) => (
              <li key={`${hit.url}-${index}`}>
                <TransitionLink
                  href={hit.url}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md px-3 py-3.5 hover:bg-surface-hover"
                  onClick={onClose}
                >
                  <div className="min-w-0">
                    <p className="type-supporting m-0 font-medium">
                      {hit.title}
                    </p>
                    {hit.excerpt && (
                      <p
                        className="type-caption mb-0 mt-1 line-clamp-2 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                      />
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </TransitionLink>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )

  const content = (
    <div
      ref={dialogRef}
      role={isOverlay ? 'dialog' : undefined}
      aria-modal={isOverlay ? true : undefined}
      aria-labelledby={isOverlay ? titleId : undefined}
      className="flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-xl bg-card shadow-overlay"
    >
      <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 id={titleId} className="type-headline m-0">
          搜索
        </h2>
        {isOverlay && (
          <button
            type="button"
            aria-label="关闭搜索"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mx-4 my-4 flex items-center gap-3 rounded-lg bg-muted px-4 sm:mx-5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            if (nextQuery.trim().length < 2) setHits([])
          }}
          className="type-body h-12 w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          placeholder="搜索文章和教程"
          aria-label="全站搜索"
          autoComplete="off"
        />
      </div>
      {resultsSection}
    </div>
  )

  if (isOverlay) {
    if (!open) return null

    return createPortal(
      // Backdrop mousedown-to-close only fires when the backdrop itself is the
      // target (never the panel); keyboard users close with Escape.
      // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className="fixed inset-0 z-search flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-8 backdrop-blur-sm sm:px-6 sm:py-14"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose?.()
        }}
      >
        <div className="w-full max-w-3xl">{content}</div>
      </div>,
      document.body,
    )
  }

  return <div className="w-full">{content}</div>
}
