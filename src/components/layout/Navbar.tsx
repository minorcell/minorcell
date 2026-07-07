'use client'

import {
  TransitionLink,
  usePageTransition,
} from '@/components/effects/PageTransition'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type {
  StaggeredMenuItem,
  StaggeredMenuSocialItem,
} from '@/components/effects/StaggeredMenu'
import { siteContent } from '@/lib/site-content'

// Lazy-load heavy / interaction-only components so they stay out of the
// initial bundle that every page ships:
//   • StaggeredMenu pulls in gsap and is only used by the mobile menu
//   • PagefindSearch pulls in the pagefind runtime and is only shown when
//     the user opens search (⌘K / clicks Search)
const StaggeredMenu = dynamic(
  () => import('@/components/effects/StaggeredMenu'),
  { ssr: false },
)
const PagefindSearch = dynamic(
  () =>
    import('@/components/common/PagefindSearch').then((m) => m.PagefindSearch),
  { ssr: false },
)

const navLinks = [
  { label: '文章', href: '/articles' },
  { label: '教程', href: '/tutorials' },
  { label: '项目', href: '/projects' },
]

/**
 * Today's date as a small "field-journal masthead" chip.
 * Renders empty on SSR to avoid hydration mismatch (date depends on client locale & TZ).
 */
function DateChip() {
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    const now = new Date()
    const weekday = now
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toUpperCase()
    const day = now.getDate()
    const month = now
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase()
    const year = now.getFullYear()
    setLabel(`${weekday} · ${day} ${month} ${year}`)
  }, [])

  return (
    <span
      aria-hidden
      suppressHydrationWarning
      className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 lg:inline"
    >
      {label}
    </span>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const { startTransition } = usePageTransition()
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Track viewport so we only mount the (gsap-heavy) mobile menu when
  // the user is actually on a small screen — desktop visitors never need
  // to download that chunk.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = (e: MediaQueryList | MediaQueryListEvent) =>
      setIsMobile(e.matches)
    apply(mq)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Scroll-state for the navbar (compresses on scroll)
  // Uses hysteresis (on > 20, off < 4) to prevent twitching from sub-pixel
  // oscillation at the boundary and scroll-anchoring feedback loops.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > 20) setScrolled(true)
      else if (y < 4) setScrolled(false)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === '/') {
        const target = event.target as HTMLElement | null
        const isTyping =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable
        if (!isTyping) {
          event.preventDefault()
          setSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Context-aware chips
  const isTopicDetail =
    pathname.startsWith('/tutorials/') && pathname !== '/tutorials'

  const mobileMenuItems: StaggeredMenuItem[] = [
    {
      label: '搜索',
      ariaLabel: '打开搜索',
      link: '#search',
      onClick: (event) => {
        event.preventDefault()
        setSearchOpen(true)
      },
    },
    ...navLinks.map((item) => ({
      label: item.label,
      ariaLabel: `前往${item.label}`,
      link: item.href,
      onClick: (event: React.MouseEvent) => {
        event.preventDefault()
        startTransition(item.href)
      },
    })),
    {
      label: 'RSS',
      ariaLabel: '前往 RSS 订阅',
      link: '/feed.xml',
    },
  ]

  const mobileSocialItems: StaggeredMenuSocialItem[] = [
    ...(siteContent.contact.github
      ? [{ label: 'GitHub', link: siteContent.contact.github }]
      : []),
    { label: 'Bilibili', link: 'https://space.bilibili.com/1410369961' },
    { label: '掘金', link: 'https://juejin.cn/user/2280829967146779' },
  ]

  return (
    <header
      className="navbar sticky top-0 z-[1200] bg-[var(--background)]"
      data-scrolled={scrolled || undefined}
    >
      <div className="navbar-inner mx-auto flex w-full items-center justify-between gap-4 px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* LEFT — date chip + brand + breadcrumb */}
        <div className="flex min-w-0 items-center gap-4">
          <DateChip />

          <TransitionLink
            href="/"
            aria-label={siteContent.name}
            className="group inline-flex items-baseline gap-2.5 opacity-100 hover:opacity-100"
          >
            <span
              className="navbar-brand text-foreground transition-colors group-hover:text-[color:var(--link-accent)]"
              style={{
                fontFamily: 'var(--font-orbitron), Georgia, serif',
                fontWeight: 500,
                letterSpacing: '-0.015em',
              }}
            >
              天天学习，好好向上。
            </span>
            <span
              aria-hidden
              className="navbar-subtitle hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline"
            >
              {isTopicDetail ? '· § TOPIC' : '· A FIELD JOURNAL'}
            </span>
          </TransitionLink>
        </div>

        {/* RIGHT — nav + search trigger */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((item) => {
            const active = isActive(item.href)
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                data-active={active || undefined}
                className={`nav-link font-mono text-[11px] uppercase tracking-[0.18em] transition-colors hover:opacity-100 ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </TransitionLink>
            )
          })}

          <span
            aria-hidden
            className="h-3 w-px bg-[color:color-mix(in_oklab,var(--border)_85%,transparent)]"
          />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="group inline-flex items-center gap-2 rounded-md border border-[color:color-mix(in_oklab,var(--border)_75%,transparent)] bg-transparent px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:color-mix(in_oklab,var(--foreground)_35%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--muted)_60%,transparent)] hover:text-foreground"
            aria-label="搜索（快捷键 / 或 Cmd/Ctrl+K）"
            title="搜索（/ 或 Cmd/Ctrl+K）"
          >
            <span>Search</span>
            <kbd className="rounded-sm border border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] px-1.5 py-px text-[9px] font-mono text-muted-foreground/80 group-hover:border-[color:color-mix(in_oklab,var(--border)_100%,transparent)]">
              ⌘K
            </kbd>
          </button>
        </nav>

        <div className="flex items-center md:hidden">
          {isMobile && (
            <StaggeredMenu
              isFixed
              showLogo={false}
              position="right"
              items={mobileMenuItems}
              socialItems={mobileSocialItems}
              displaySocials={mobileSocialItems.length > 0}
              displayItemNumbering={false}
              menuButtonColor="var(--muted-foreground)"
              openMenuButtonColor="var(--foreground)"
              changeMenuColorOnOpen={true}
              colors={['var(--muted)', 'var(--background)']}
              accentColor="var(--foreground)"
              logoUrl="/android-chrome-192x192.png"
            />
          )}
        </div>
      </div>

      {searchOpen && (
        <PagefindSearch
          variant="overlay"
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          autoFocus
        />
      )}
    </header>
  )
}
