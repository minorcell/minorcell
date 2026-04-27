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
    <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 max-h-[60vh]">
      {errorMessage && (
        <div className="mb-4 border-l border-destructive/40 px-4 py-3 font-mono text-[12px] text-destructive">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="ml-3 border-b border-destructive/40 pb-0.5 uppercase tracking-[0.18em] hover:opacity-70 transition-opacity"
            onClick={resetBundleState}
          >
            RETRY
          </button>
        </div>
      )}

      {bundleState === 'loading' && (
        <div className="flex items-center gap-2 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>LOADING INDEX…</span>
        </div>
      )}

      {!query && (
        <p className="py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          —  输入 2 个以上字符以检索全站
        </p>
      )}

      {query && !isSearching && hits.length === 0 && !errorMessage && (
        <p className="py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          NO RESULTS · 未找到匹配项
        </p>
      )}

      {isSearching && (
        <div className="flex items-center gap-2 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>SEARCHING…</span>
        </div>
      )}

      {hits.length > 0 && (
        <>
          <div className="mb-3 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>RESULTS</span>
            <span>{hits.length} HITS</span>
          </div>
          <ol className="m-0 list-none p-0">
            {hits.map((hit, index) => (
              <li
                key={`${hit.url}-${index}`}
                className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0"
              >
                <Link
                  href={hit.url}
                  className="group grid items-start gap-4 py-4 hover:opacity-100"
                  style={{ gridTemplateColumns: '44px 1fr 18px' }}
                  onClick={onClose}
                >
                  <span
                    className="text-muted-foreground transition-[color,transform] duration-200 group-hover:-translate-x-0.5 group-hover:text-[color:oklch(0.86_0.05_220)]"
                    style={{
                      fontFamily: 'var(--font-orbitron), serif',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      letterSpacing: '-0.01em',
                      fontVariantNumeric: 'tabular-nums',
                      paddingTop: '2px',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="m-0 text-[15px] leading-[1.35] tracking-[-0.005em] transition-opacity duration-200 group-hover:opacity-60 text-pretty sm:text-balance"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontWeight: 500,
                      }}
                    >
                      {hit.title}
                    </p>
                    {hit.excerpt && (
                      <p
                        className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/85"
                        dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                      />
                    )}
                    <p className="mt-1.5 truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/60">
                      {hit.url}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )

  const content = (
    <div className="flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] bg-background">
      {/* Masthead bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] px-6 py-3 sm:px-8">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:oklch(0.86_0.05_220)]"
          />
          SEARCH · 全站检索
        </div>
        {isOverlay && (
          <button
            type="button"
            aria-label="关闭搜索"
            onClick={onClose}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ESC <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="flex items-baseline gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] px-6 py-6 sm:px-8 sm:py-8">
        <Search className="h-5 w-5 shrink-0 self-center text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent text-[clamp(1.4rem,1.1rem+1vw,2rem)] tracking-[-0.015em] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 500,
          }}
          placeholder="查找一篇文章、一个词、一句代码…"
          autoComplete="off"
        />
      </div>
      {resultsSection}
    </div>
  )

  if (isOverlay) {
    if (!open || !mounted) return null

    return createPortal(
      <div className="fixed inset-0 z-[1400] flex items-start justify-center overflow-y-auto bg-background/85 px-4 py-12 backdrop-blur-md sm:px-6 sm:py-16">
        <div className="w-full max-w-3xl">{content}</div>
      </div>,
      document.body,
    )
  }

  return <div className="w-full">{content}</div>
}
