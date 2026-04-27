'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type {
  StaggeredMenuItem,
  StaggeredMenuSocialItem,
} from '@/components/effects/reactbits/StaggeredMenu'
import { siteContent } from '@/lib/site-content'

// Lazy-load heavy / interaction-only components so they stay out of the
// initial bundle that every page ships:
//   • StaggeredMenu pulls in gsap and is only used by the mobile menu
//   • PagefindSearch pulls in the pagefind runtime and is only shown when
//     the user opens search (⌘K / clicks Search)
const StaggeredMenu = dynamic(
  () => import('@/components/effects/reactbits/StaggeredMenu'),
  { ssr: false },
)
const PagefindSearch = dynamic(
  () =>
    import('@/components/common/PagefindSearch').then((m) => m.PagefindSearch),
  { ssr: false },
)

const navLinks = [
  { label: '文章', href: '/blog' },
  { label: '项目', href: '/projects' },
  { label: '专题', href: '/topics' },
]

function MoonGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M20.742 13.045a8 8 0 0 1-2.077.271c-2.135 0-4.14-.83-5.646-2.336a8.03 8.03 0 0 1-2.064-7.723A1 1 0 0 0 9.73 2.034a10 10 0 0 0-4.489 2.582c-3.898 3.898-3.898 10.243 0 14.143a9.94 9.94 0 0 0 7.072 2.93a9.93 9.93 0 0 0 7.07-2.929a10 10 0 0 0 2.583-4.491a1 1 0 0 0-1.224-1.224m-2.772 4.301a7.95 7.95 0 0 1-5.656 2.343a7.95 7.95 0 0 1-5.658-2.344c-3.118-3.119-3.118-8.195 0-11.314a8 8 0 0 1 2.06-1.483a10.03 10.03 0 0 0 2.89 7.848a9.97 9.97 0 0 0 7.848 2.891a8 8 0 0 1-1.484 2.059"
      />
    </svg>
  )
}

function SunGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </g>
    </svg>
  )
}

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

/**
 * Reading-progress strip at the bottom of the nav (article + topic detail pages).
 * Uses requestAnimationFrame-throttled scroll listener; transform-only animation.
 */
function ReadingProgress({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) return

    let raf = 0
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setProgress(p)
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        update()
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active])

  if (!active) return null

  return (
    <span
      aria-hidden
      className="navbar-progress"
      style={{ transform: `scaleX(${progress})` }}
    />
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
  }, [])

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
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4)
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', newTheme)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Context-aware chips
  const isTopicDetail =
    pathname.startsWith('/topics/') && pathname !== '/topics'
  const isArticleOrTopic = isTopicDetail || pathname.startsWith('/blog/')

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
    })),
    {
      label: 'RSS',
      ariaLabel: '前往 RSS 订阅',
      link: '/feed.xml',
    },
    {
      label: theme === 'light' ? '夜间模式' : '日间模式',
      ariaLabel: '切换主题',
      link: '#theme',
      onClick: (event) => {
        event.preventDefault()
        toggleTheme()
      },
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
      className="navbar paper-surface sticky top-0 z-[1200]"
      data-scrolled={scrolled || undefined}
    >
      <div className="navbar-inner mx-auto flex w-full items-center justify-between gap-4 px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* LEFT — date chip + brand + breadcrumb */}
        <div className="flex min-w-0 items-center gap-4">
          <DateChip />

          <Link
            href="/"
            aria-label={siteContent.name}
            className="group inline-flex items-baseline gap-2.5 opacity-100 hover:opacity-100"
          >
            <span
              className="navbar-brand text-foreground transition-colors group-hover:text-[color:var(--link-accent)]"
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                fontWeight: 500,
                letterSpacing: '-0.015em',
              }}
            >
              Cell{' '}
              <span
                className="text-muted-foreground"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                &amp;
              </span>{' '}
              Stack
            </span>
            <span
              aria-hidden
              className="navbar-subtitle hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline"
            >
              {isTopicDetail ? '· § TOPIC' : '· A FIELD JOURNAL'}
            </span>
          </Link>
        </div>

        {/* RIGHT — nav + search trigger + theme toggle */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[11px] uppercase tracking-[0.18em] transition-colors hover:opacity-100 ${
                isActive(item.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <span
            aria-hidden
            className="h-3 w-px bg-[color:color-mix(in_oklab,var(--border)_85%,transparent)]"
          />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            aria-label="搜索（快捷键 / 或 Cmd/Ctrl+K）"
            title="搜索（/ 或 Cmd/Ctrl+K）"
          >
            <span>Search</span>
            <kbd className="rounded-sm border border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] px-1.5 py-px text-[9px] font-mono text-muted-foreground/80 group-hover:border-[color:color-mix(in_oklab,var(--border)_100%,transparent)]">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <MoonGlyph className="h-4 w-4" />
            ) : (
              <SunGlyph className="h-4 w-4" />
            )}
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

      <ReadingProgress active={isArticleOrTopic} />

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
