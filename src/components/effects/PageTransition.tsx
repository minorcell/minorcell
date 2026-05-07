'use client'

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ComponentProps,
  type MouseEvent,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

/* ──────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────── */
type Phase = 'idle' | 'exiting' | 'loading' | 'entering'
type AnimTick = 'init' | 'active'

/**
 * Timing & Easing
 *
 * Total ≈ 200 + 400 + 800 + 600 = 2000 ms (2s)
 */
const EXIT_DUR = 200
const LOAD_IN = 400
const LOAD_HOLD = 800
const LOAD_OUT = 600 // iris closes
const LOAD_TOTAL = LOAD_IN + LOAD_HOLD

const EASE = 'cubic-bezier(0.33, 0, 0, 1)'
const IRIS_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)' // slower start, dramatic finish

/* ──────────────────────────────────────────────
 *  Context
 * ────────────────────────────────────────────── */
interface PageTransitionCtx {
  startTransition: (path: string) => void
  phase: Phase
}

const PageTransitionCtx = createContext<PageTransitionCtx>({
  startTransition: () => {},
  phase: 'idle',
})

export function usePageTransition() {
  return useContext(PageTransitionCtx)
}

/* ──────────────────────────────────────────────
 *  Provider
 * ────────────────────────────────────────────── */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('idle')
  const [anim, setAnim] = useState<AnimTick>('init')
  const [mounted, setMounted] = useState(false)

  const targetPath = useRef<string | null>(null)
  const savedChildren = useRef(children)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ── Track / swap saved children ──
  // During idle: keep a live snapshot.
  // During exiting/loading: freeze on old page (overlay isn't fully covering
  // yet — clip-path starts at circle(0%) and would reveal new content).
  // During entering: overlay is at circle(100%), safe to swap; iris then
  // closes to reveal the new page.
  if (phase === 'idle') {
    savedChildren.current = children
  } else if (phase === 'entering' && children !== savedChildren.current) {
    savedChildren.current = children
  }

  const startTransition = useCallback((path: string) => {
    targetPath.current = path
    setPhase('exiting')
    setAnim('init')
  }, [])

  // ── anim tick: init → active (one rAF for CSS transition to engage) ──
  useEffect(() => {
    if (anim !== 'init') return
    const id = requestAnimationFrame(() => setAnim('active'))
    return () => cancelAnimationFrame(id)
  }, [anim])

  // ── Phase progression ──
  useEffect(() => {
    if (phase === 'idle') return

    if (phase === 'exiting') {
      const t = setTimeout(() => {
        const path = targetPath.current
        if (path) {
          window.scrollTo({ top: 0 })
          router.push(path, { scroll: false })
        }
        setPhase('loading')
        setAnim('init')
      }, EXIT_DUR + 20)
      return () => clearTimeout(t)
    }

    if (phase === 'loading') {
      const t = setTimeout(() => {
        setPhase('entering')
        setAnim('init')
      }, LOAD_TOTAL + 20)
      return () => clearTimeout(t)
    }

    if (phase === 'entering') {
      const t = setTimeout(() => {
        setPhase('idle')
        setAnim('init')
        targetPath.current = null
      }, LOAD_OUT + 20)
      return () => clearTimeout(t)
    }
  }, [phase, router])

  /* ── Exit style (subtle scale + monochrome fade) ── */
  // During 'loading': content must stay at opacity 0. If we let exitStyle
  // return {} here, the opacity snaps back to 1 while the overlay is still
  // at clip-path circle(0%) — this is the flash that makes the page appear
  // to switch instantly before the iris animation covers the screen.
  const exitStyle: React.CSSProperties = (() => {
    if (phase === 'exiting') {
      return anim === 'active'
        ? {
            opacity: 0,
            filter: 'grayscale(1) brightness(1.08)',
            transform: 'scale(0.97)',
            transition: `opacity ${EXIT_DUR}ms ${EASE}, filter ${EXIT_DUR}ms ${EASE}, transform ${EXIT_DUR}ms ${EASE}`,
            transformOrigin: 'center top',
          }
        : {}
    }
    if (phase === 'loading') {
      return { opacity: 0 }
    }
    return {}
  })()

  /* ── Overlay position / dimension (always ready) ── */
  const showOverlay = phase === 'loading' || phase === 'entering'

  // clip-path: circle(X at center)
  const overlayClip = (() => {
    if (!showOverlay) return 'circle(0% at 50% 50%)'
    if (phase === 'loading') {
      return anim === 'active'
        ? 'circle(100% at 50% 50%)'
        : 'circle(0% at 50% 50%)'
    }
    // entering
    return anim === 'active'
      ? 'circle(0% at 50% 50%)'
      : 'circle(100% at 50% 50%)'
  })()

  const overlayTrans =
    showOverlay && anim === 'active'
      ? `clip-path ${phase === 'loading' ? LOAD_IN : LOAD_OUT}ms ${IRIS_EASE}`
      : 'none'

  const overlayStyle: React.CSSProperties = showOverlay
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        clipPath: overlayClip,
        transition: overlayTrans,
        color: 'var(--foreground)',
        userSelect: 'none',
      }
    : {}

  /* ── Loading screen content (magazine-style) ── */
  const loadingContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* Brand title — site display font + serif italic ampersand */}
      <div
        style={{
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: '-0.025em',
          fontFamily: 'var(--font-orbitron, Georgia, serif)',
          color: 'var(--foreground)',
        }}
      >
        Minor Cell
      </div>

      {/* Thin decorative rule */}
      <div
        style={{
          width: 28,
          height: 1,
          background: 'var(--foreground)',
          opacity: 0.15,
          margin: '22px 0 18px',
        }}
      />

      {/* Subtitle — matches the navbar › A FIELD JOURNAL */}
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          color:
            'color-mix(in oklab, var(--muted-foreground) 60%, transparent)',
          fontWeight: 500,
          marginBottom: 32,
        }}
      >
        A Field Journal
      </div>

      {/* Loading bar — thin horizontal track with animated fill */}
      <div
        style={{
          width: 120,
          height: 1,
          background: 'color-mix(in oklab, var(--foreground) 8%, transparent)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={
            phase === 'loading' && anim === 'active'
              ? {
                  height: '100%',
                  background: 'var(--foreground)',
                  opacity: 0.25,
                  animation: `pt-bar ${LOAD_TOTAL}ms ${EASE} forwards`,
                }
              : {
                  height: '100%',
                  width: phase === 'entering' ? '100%' : '0%',
                  background: 'var(--foreground)',
                  opacity: 0.25,
                }
          }
        />
      </div>
    </div>
  )

  return (
    <PageTransitionCtx.Provider value={{ startTransition, phase }}>
      {/* Content area */}
      <div style={{ ...exitStyle, minHeight: 'inherit' }}>
        {savedChildren.current}
      </div>

      {/* Overlay */}
      {mounted && showOverlay && (
        <div style={overlayStyle}>{loadingContent}</div>
      )}

      {/* Keyframe injection */}
      {showOverlay && (
        <style>{`
          @keyframes pt-bar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      )}
    </PageTransitionCtx.Provider>
  )
}

/* ──────────────────────────────────────────────
 *  TransitionLink
 * ──────────────────────────────────────────────
 *  Uses a plain <a> tag + router.push() instead of next/link,
 *  because next/link's internal click handler calls router.push()
 *  immediately, bypassing the transition state machine. */
type LinkProps = ComponentProps<typeof Link>

export function TransitionLink({
  href,
  replace: _replace,
  scroll: _scroll,
  prefetch = true,
  children,
  onClick,
  onMouseEnter,
  ...props
}: LinkProps) {
  const router = useRouter()
  const { startTransition, phase } = usePageTransition()

  const hrefStr = typeof href === 'string' ? href : ''
  const isExternal = hrefStr.startsWith('http') || hrefStr.startsWith('//')
  const isAnchor = hrefStr.startsWith('#')
  const isSpecial =
    hrefStr.endsWith('.xml') ||
    hrefStr.endsWith('.rss') ||
    hrefStr.startsWith('/feed')
  const skip = isExternal || isAnchor || isSpecial

  // Prefetch on hover (mimics next/link's prefetch behaviour)
  const handlePrefetch = useCallback(() => {
    if (prefetch && hrefStr && !skip && router.prefetch) {
      router.prefetch(hrefStr)
    }
  }, [hrefStr, prefetch, router, skip])

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Allow modifier clicks (open in new tab, etc.)
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      onClick?.(e)
      return
    }

    if (skip || phase !== 'idle' || !hrefStr) {
      onClick?.(e)
      return
    }

    e.preventDefault()
    startTransition(hrefStr)
    onClick?.(e)
  }

  // Skipped links (external, anchor, RSS) render as simple <a> tags
  if (skip) {
    return (
      <a
        href={hrefStr}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <a
      href={hrefStr}
      onClick={handleClick}
      onMouseEnter={(e) => {
        handlePrefetch()
        onMouseEnter?.(e)
      }}
      {...props}
    >
      {children}
    </a>
  )
}
