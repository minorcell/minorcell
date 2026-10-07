'use client'

import { TransitionLink } from '@/components/effects/PageTransition'
import { MotionOverlay } from '@/components/effects/MotionPrimitives'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/icon'

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
  type?: string
}

type BundleState = 'idle' | 'loading' | 'ready' | 'error'

const pagefindBasePath =
  process.env.NODE_ENV === 'development' ? '/pagefind-dev/' : '/pagefind/'

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
  const [resultCount, setResultCount] = useState(0)
  const [bundleState, setBundleState] = useState<BundleState>('idle')
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const lenis = useLenis()
  const pagefindRef = useRef<PagefindInstance | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRequestRef = useRef(0)
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
    lenis?.stop()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousOverflow !== 'hidden') lenis?.start()
    }
  }, [isOverlay, open, lenis])

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
        const pagefindBundlePath: string = `${pagefindBasePath}pagefind.js`
        const mod = (await import(
          /* webpackIgnore: true */ pagefindBundlePath
        )) as PagefindInstance

        if (typeof mod.init === 'function') {
          await mod.init()
        }

        if (typeof mod.options === 'function') {
          await mod.options({ basePath: pagefindBasePath, baseUrl: '/' })
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
          process.env.NODE_ENV === 'development'
            ? '搜索索引加载失败，请确认通过 pnpm dev 启动后刷新页面。'
            : '找不到 Pagefind 索引，请先运行构建（pnpm build）后再试。',
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
    const normalizedQuery = query.trim().replace(/\s+/g, ' ')
    if (!isActive) {
      searchRequestRef.current += 1
      setIsSearching(false)
      return
    }
    if (!normalizedQuery) {
      searchRequestRef.current += 1
      setHits([])
      setResultCount(0)
      setIsSearching(false)
      setErrorMessage(null)
      return
    }

    const requestId = ++searchRequestRef.current

    const handle = setTimeout(async () => {
      const pagefind = await ensurePagefind()
      if (!pagefind) return

      if (requestId !== searchRequestRef.current) return
      setIsSearching(true)
      setErrorMessage(null)

      try {
        const search = await pagefind.search(normalizedQuery)
        const detailed = (
          await Promise.allSettled(
            search.results
              .slice(0, 20)
              .map(async (result: PagefindHit, idx) => {
                const data = await result.data()
                return {
                  url: data.url,
                  title:
                    data.meta && typeof data.meta.title === 'string'
                      ? data.meta.title
                      : data.url || `结果 ${idx + 1}`,
                  excerpt:
                    typeof data.excerpt === 'string'
                      ? data.excerpt
                      : data.content?.slice(0, 200),
                  type:
                    data.meta && typeof data.meta.type === 'string'
                      ? data.meta.type
                      : data.url.includes('/tutorials/')
                        ? '教程'
                        : '文章',
                }
              }),
          )
        ).flatMap((result) =>
          result.status === 'fulfilled' ? [result.value] : [],
        )

        if (requestId !== searchRequestRef.current) return
        setHits(detailed)
        setResultCount(search.results.length)
      } catch (error) {
        if (requestId !== searchRequestRef.current) return
        console.error('Search failed', error)
        setErrorMessage('搜索时出错，请稍后再试。')
      } finally {
        if (requestId === searchRequestRef.current) setIsSearching(false)
      }
    }, 180)

    return () => clearTimeout(handle)
  }, [query, isActive, ensurePagefind])

  const clearQuery = () => {
    setQuery('')
    setHits([])
    setResultCount(0)
    inputRef.current?.focus()
  }

  const resultsSection = (
    <div
      data-lenis-prevent
      className="max-h-[60vh] flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5"
    >
      {errorMessage && (
        <div className="type-caption mb-3 rounded-md bg-destructive/10 px-4 py-3 text-destructive">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="pressable ml-3 inline-flex min-h-11 items-center font-medium underline underline-offset-2"
            onClick={resetBundleState}
          >
            重试
          </button>
        </div>
      )}

      {bundleState === 'loading' && (
        <div className="type-meta flex items-center gap-2 px-3 py-4 text-muted-foreground">
          <Icon name="loader-4-line" className="h-4 w-4 animate-spin" />
          <span>正在准备搜索</span>
        </div>
      )}

      {!query.trim() && bundleState !== 'loading' && (
        <p className="type-meta mb-0 px-3 py-4 text-muted-foreground">
          输入关键词开始搜索
        </p>
      )}

      {query.trim() && !isSearching && hits.length === 0 && !errorMessage && (
        <p className="type-meta mb-0 px-3 py-4 text-muted-foreground">
          没有找到相关内容
        </p>
      )}

      {isSearching && (
        <div
          className="type-meta flex items-center gap-2 px-3 py-4 text-muted-foreground"
          aria-live="polite"
        >
          <Icon name="loader-4-line" className="h-4 w-4 animate-spin" />
          <span>正在搜索</span>
        </div>
      )}

      {hits.length > 0 && (
        <>
          <div
            className="type-caption mb-1 px-3 py-2 tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            找到 {resultCount} 个结果
            {resultCount > hits.length ? `，显示前 ${hits.length} 个` : ''}
          </div>
          <ol className="m-0 list-none space-y-1 p-0">
            {hits.map((hit, index) => (
              <li key={`${hit.url}-${index}`}>
                <TransitionLink
                  href={hit.url}
                  className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md px-3 py-3.5 transition-colors duration-150 ease-out hover:bg-surface-hover motion-reduce:transition-none"
                  onClick={onClose}
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      {hit.type && (
                        <span className="type-caption shrink-0 text-link-accent">
                          {hit.type}
                        </span>
                      )}
                      <p className="type-supporting m-0 min-w-0 truncate font-medium">
                        {hit.title}
                      </p>
                    </div>
                    {hit.excerpt && (
                      <p
                        className="type-caption mb-0 mt-1 line-clamp-2 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                      />
                    )}
                  </div>
                  <Icon name="arrow-up-right-line" className="h-4 w-4 shrink-0 text-muted-foreground" />
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
            className="pressable inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="close-line" className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mx-4 my-4 flex items-center gap-3 rounded-lg bg-muted px-4 sm:mx-5">
        <Icon name="search-line" className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            setErrorMessage(null)
            if (!nextQuery.trim()) {
              setHits([])
              setResultCount(0)
            }
          }}
          className="type-body h-12 w-full bg-transparent pr-8 text-foreground placeholder:text-muted-foreground"
          placeholder="搜索文章和教程，可输入标题或关键词"
          aria-label="全站搜索"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={clearQuery}
            aria-label="清空搜索"
            title="清空搜索"
          >
            <Icon name="close-line" className="h-4 w-4" />
          </button>
        )}
      </div>
      {resultsSection}
    </div>
  )

  if (isOverlay) {
    return createPortal(
      <MotionOverlay
        open={open}
        onBackdropPointerDown={onClose}
        preventScroll
        className="fixed inset-0 z-search flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-8 backdrop-blur-sm sm:px-6 sm:py-14"
        panelClassName="w-full max-w-3xl"
      >
        {content}
      </MotionOverlay>,
      document.body,
    )
  }

  return <div className="w-full">{content}</div>
}
