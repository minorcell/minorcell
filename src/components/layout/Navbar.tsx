'use client'

import dynamic from 'next/dynamic'
import { Menu, Monitor, Moon, Rss, Search, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { TransitionLink } from '@/components/effects/PageTransition'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

type ThemePreference = 'auto' | 'light' | 'dark'

const THEME_CHANGE_EVENT = 'minorcell-theme-change'

const getThemeSnapshot = (): ThemePreference => {
  const stored = localStorage.getItem('theme')
  return stored === 'light' || stored === 'dark' ? stored : 'auto'
}

const getServerThemeSnapshot = (): ThemePreference => 'auto'

const applyTheme = (preference: ThemePreference) => {
  const useDark =
    preference === 'dark' ||
    (preference === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', useDark)
  document.documentElement.style.colorScheme = useDark ? 'dark' : 'light'
}

const subscribeToTheme = (onChange: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemThemeChange = () => {
    if (getThemeSnapshot() !== 'auto') return
    applyTheme('auto')
    onChange()
  }

  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  media.addEventListener('change', onSystemThemeChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    media.removeEventListener('change', onSystemThemeChange)
  }
}

function ThemeOptions({
  value,
  onValueChange,
}: {
  value: ThemePreference
  onValueChange: (value: ThemePreference) => void
}) {
  return (
    <DropdownMenuRadioGroup
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as ThemePreference)}
    >
      <DropdownMenuRadioItem value="auto">
        <Monitor className="h-4 w-4" />
        自动
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="light">
        <Sun className="h-4 w-4" />
        浅色
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">
        <Moon className="h-4 w-4" />
        深色
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const themePreference = useSyncExternalStore(
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
  const setThemePreference = (preference: ThemePreference) => {
    if (preference === 'auto') localStorage.removeItem('theme')
    else localStorage.setItem('theme', preference)
    applyTheme(preference)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  const ThemeIcon =
    themePreference === 'auto'
      ? Monitor
      : themePreference === 'dark'
        ? Moon
        : Sun

  return (
    <header className="navbar sticky top-0 z-nav bg-background/85 backdrop-blur-xl">
      <div className="navbar-inner mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <TransitionLink
          href="/"
          aria-label={siteContent.name}
          className="navbar-brand rounded-md font-semibold text-foreground transition-colors hover:text-link-accent"
        >
          天天学习，好好向上。
        </TransitionLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {navLinks.map((item) => (
            <TransitionLink
              key={item.href}
              href={item.href}
              data-active={isActive(item.href) || undefined}
              className="nav-link type-caption text-muted-foreground hover:text-foreground"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="选择主题"
                title="主题"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-40">
              <ThemeOptions
                value={themePreference}
                onValueChange={setThemePreference}
              />
            </DropdownMenuContent>
          </DropdownMenu>
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
              className="z-menu w-48 border-0 bg-popover p-1.5 shadow-overlay"
            >
              {navLinks.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <TransitionLink
                    href={item.href}
                    className={`type-meta flex w-full items-center rounded-md px-3 py-2.5 ${
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
                className="type-meta px-3 py-2.5"
                onSelect={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>搜索</span>
                <kbd className="type-caption ml-auto font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="type-meta px-3 py-2.5">
                  <ThemeIcon className="h-4 w-4" />
                  <span>主题</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  <ThemeOptions
                    value={themePreference}
                    onValueChange={setThemePreference}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem asChild>
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
