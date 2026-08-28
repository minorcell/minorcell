'use client'

import dynamic from 'next/dynamic'
import { Menu, Rss, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MotionActiveIndicator,
  MotionButton,
  MotionLink,
} from '@/components/effects/MotionPrimitives'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { siteContent } from '@/lib/site-content'

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

export function Navbar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemTheme = () => {
      document.documentElement.classList.toggle('dark', systemTheme.matches)
      document.documentElement.style.colorScheme = systemTheme.matches
        ? 'dark'
        : 'light'
    }
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

    applySystemTheme()
    systemTheme.addEventListener('change', applySystemTheme)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      systemTheme.removeEventListener('change', applySystemTheme)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <header className="navbar sticky top-0 z-nav bg-background/85 backdrop-blur-xl">
      <div className="navbar-inner mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <MotionLink
          href="/"
          prefetch={false}
          aria-label={siteContent.name}
          className="navbar-brand rounded-md font-semibold text-foreground transition-colors hover:text-link-accent"
        >
          天天学习，好好向上。
        </MotionLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {navLinks.map((item) => (
            <MotionLink
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={isActive(item.href) ? 'page' : undefined}
              data-active={isActive(item.href) || undefined}
              className="nav-link type-caption text-muted-foreground hover:text-foreground active:bg-muted active:text-foreground"
            >
              {item.label}
              {isActive(item.href) ? (
                <MotionActiveIndicator layoutId="site-nav-active" />
              ) : null}
            </MotionLink>
          ))}

          <MotionButton
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground"
            aria-label="搜索"
            title="搜索（⌘K）"
          >
            <Search className="h-4 w-4" />
          </MotionButton>
        </nav>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MotionButton
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground"
                aria-label="打开导航菜单"
              >
                <Menu className="h-5 w-5" />
              </MotionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="z-menu w-48 border-0 bg-popover p-1.5 shadow-overlay"
            >
              {navLinks.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <MotionLink
                    href={item.href}
                    prefetch={false}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`type-meta flex w-full items-center rounded-md px-3 py-2.5 ${
                      isActive(item.href)
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </MotionLink>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                className="type-meta px-3 py-2.5"
                onSelect={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>搜索</span>
                <kbd className="type-caption ml-auto font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                {/* feed.xml is a static public file, not a Next.js page */}
                {/* oxlint-disable-next-line next/no-html-link-for-pages */}
                <a
                  href="/feed.xml"
                  className="type-meta flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-foreground"
                >
                  <Rss className="h-4 w-4" />
                  RSS
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PagefindSearch
        variant="overlay"
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        // Modal search palette: focusing the input on open is intended
        // focus management, not page-load autofocus.
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
    </header>
  )
}
