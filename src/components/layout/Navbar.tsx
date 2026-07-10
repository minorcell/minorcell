'use client'

import dynamic from 'next/dynamic'
import { Menu, Moon, Rss, Search, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { TransitionLink } from '@/components/effects/PageTransition'
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

type Theme = 'light' | 'dark'

const THEME_CHANGE_EVENT = 'minorcell-theme-change'

const getThemeSnapshot = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

const getServerThemeSnapshot = (): Theme => 'light'

const subscribeToTheme = (onChange: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemThemeChange = () => {
    if (localStorage.getItem('theme')) return
    document.documentElement.classList.toggle('dark', media.matches)
    document.documentElement.style.colorScheme = media.matches
      ? 'dark'
      : 'light'
    onChange()
  }

  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  media.addEventListener('change', onSystemThemeChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    media.removeEventListener('change', onSystemThemeChange)
  }
}

export function Navbar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  )

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

  const isActive = (href: string) => pathname.startsWith(href)
  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.style.colorScheme = nextTheme
    localStorage.setItem('theme', nextTheme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <header className="navbar sticky top-0 z-[1200] bg-background/85 backdrop-blur-xl">
      <div className="navbar-inner mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <TransitionLink
          href="/"
          aria-label={siteContent.name}
          className="navbar-brand rounded-md font-semibold text-foreground transition-colors hover:text-[color:var(--link-accent)]"
        >
          天天学习，好好向上。
        </TransitionLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {navLinks.map((item) => (
            <TransitionLink
              key={item.href}
              href={item.href}
              data-active={isActive(item.href) || undefined}
              className="nav-link text-[13px] text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </TransitionLink>
          ))}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="搜索"
            title="搜索（⌘K）"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={theme === 'dark' ? '浅色模式' : '深色模式'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </nav>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="打开导航菜单"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="z-[1250] w-48 border-0 bg-popover p-1.5 shadow-[var(--shadow-overlay)]"
            >
              {navLinks.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <TransitionLink
                    href={item.href}
                    className={`flex w-full items-center rounded-md px-3 py-2.5 text-[14px] ${
                      isActive(item.href)
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </TransitionLink>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                className="px-3 py-2.5 text-[14px]"
                onSelect={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>搜索</span>
                <kbd className="ml-auto font-mono text-[11px] text-muted-foreground">
                  ⌘K
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="px-3 py-2.5 text-[14px]"
                onSelect={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href="/feed.xml"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-[14px] text-foreground"
                >
                  <Rss className="h-4 w-4" />
                  RSS
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
