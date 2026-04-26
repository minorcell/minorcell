'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PagefindSearch } from '@/components/common/PagefindSearch'
import StaggeredMenu, {
  type StaggeredMenuItem,
  type StaggeredMenuSocialItem,
} from '@/components/effects/reactbits/StaggeredMenu'
import { useRouteBack } from '@/hooks/useRouteBack'
import { siteContent } from '@/lib/site-content'

const navLinks = [
  { label: '文章', href: '/blog' },
  { label: '项目', href: '/projects' },
  { label: '专题', href: '/topics' },
]

function McpGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m14.557 7.875l-.055.054l-5.804 5.691a.183.183 0 0 0-.003.259l.003.003l1.192 1.17a.55.55 0 0 1 .011.776l-.01.01a.575.575 0 0 1-.803 0L7.896 14.67a1.28 1.28 0 0 1 0-1.836l5.805-5.692a1.647 1.647 0 0 0 .031-2.328l-.031-.032l-.034-.032a1.725 1.725 0 0 0-2.405-.002l-4.781 4.69h-.002l-.065.065a.575.575 0 0 1-.803 0a.55.55 0 0 1-.01-.776l.01-.01L10.46 3.96c.65-.636.663-1.678.027-2.329l-.029-.03a1.725 1.725 0 0 0-2.407 0L1.635 7.896a.575.575 0 0 1-.802 0a.55.55 0 0 1-.011-.776l.011-.01L7.25.814a2.875 2.875 0 0 1 4.01 0c.63.613.929 1.49.803 2.36c.88-.125 1.77.166 2.406.787l.034.033a2.743 2.743 0 0 1 .053 3.88m-1.691-1.553a.55.55 0 0 0 .01-.776l-.01-.01a.575.575 0 0 0-.803 0L7.317 10.19a1.725 1.725 0 0 1-2.407 0a1.647 1.647 0 0 1-.03-2.33l.031-.031l4.747-4.655a.55.55 0 0 0 .011-.776l-.011-.01a.575.575 0 0 0-.803 0L4.108 7.042a2.743 2.743 0 0 0 0 3.933a2.876 2.876 0 0 0 4.011 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function GitHubGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
      />
    </svg>
  )
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314"
      />
    </svg>
  )
}

function RssGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 19a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 4a16 16 0 0 1 16 16M4 11a9 9 0 0 1 9 9"
      />
    </svg>
  )
}

function JuejinGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="m12 14.316l7.454-5.88l-2.022-1.625L12 11.1l-.004.003l-5.432-4.288l-2.02 1.624l7.452 5.88Zm0-7.247l2.89-2.298L12 2.453l-.004-.005l-2.884 2.318l2.884 2.3Zm0 11.266l-.005.002l-9.975-7.87L0 12.088l.194.156l11.803 9.308l7.463-5.885L24 12.085l-2.023-1.624Z"
      />
    </svg>
  )
}

function BilibiliGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M235.516 616.574c16.736-.741 32.287-1.778 47.69-2.074c66.797-1.185 132.409 6.814 194.762 31.998c30.51 12.296 59.984 26.517 86.495 46.516c21.772 16.444 26.512 36.887 16.588 67.108c-6.22 18.665-18.661 32.739-34.36 45.034c-37.028 28.888-75.832 54.96-120.412 69.626c-31.251 10.37-63.687 18.222-96.27 23.259c-42.803 6.666-86.2 9.629-129.447 13.628c-8.886.89-17.92-.296-26.807-.296c-4.591 0-5.776-2.37-5.924-6.37c-1.185-19.703-2.074-39.553-3.851-59.256c-2.222-25.48-4.74-50.96-7.702-76.292c-3.999-35.406-8.442-70.663-12.885-105.92c-4.592-37.184-9.331-74.22-13.774-111.403c-4.443-36.294-8.442-72.736-13.182-109.03c-5.332-41.48-11.256-82.96-16.884-124.439c-6.665-49.033-15.848-97.623-28.437-145.473c-.592-2.074 1.185-6.666 2.962-7.259c41.915-16.889 83.978-33.331 125.892-50.071c13.922-5.63 15.107-7.26 15.255 10.37c.148 75.107.444 150.214 1.63 225.321c.592 39.11 2.073 78.218 4.739 117.18c3.258 47.552 8.294 95.106 12.589 142.659c0 2.074.889 4 1.333 5.185m83.68 218.062a74372 74372 0 0 0 114.784-86.958c-4.74-6.815-109.303-47.85-133.89-53.33c6.221 46.367 12.59 92.587 19.107 140.288m434.12-14.387C733.38 618.113 716.544 413.756 678 210.584c12.553-1.481 25.106-3.258 37.806-4.295c14.62-1.332 29.388-1.925 44.009-3.11c12.257-1.036 16.835 2.222 17.574 14.217c2.215 32.134 4.135 64.268 6.35 96.403c2.953 43.388 6.055 86.925 9.156 130.314c2.215 31.246 4.135 62.64 6.646 93.886c2.805 34.207 5.907 68.267 9.008 102.474c2.215 25.175 4.283 50.497 6.793 75.672c2.658 27.247 5.612 54.495 8.418 81.742c.738 7.849 1.624 15.697 2.215 23.546c.296 4.294-2.067 4.887-6.055 4.442c-21.709-2.221-43.418-3.85-66.603-5.627M572 527.155c17.616-2.517 34.639-5.33 51.662-7.254c12.287-1.48 24.721-1.629 37.008-2.813c6.661-.593 10.954 1.776 11.99 8.29c2.813 17.322 5.773 34.79 7.846 52.26c3.405 29.017 6.07 58.182 9.178 87.199c2.664 25.464 5.329 50.78 8.29 76.243c3.256 27.24 6.809 54.333 10.213 81.425c1.037 7.995 1.777 16.137 2.813 24.872A9507 9507 0 0 0 636.245 857C614.929 747.15 593.612 638.189 572 527.155m382 338.821c-24.084 0-47.276.148-70.468-.296c-1.933 0-5.352-3.409-5.501-5.484c-3.568-37.05-6.69-73.953-9.96-111.004l-9.367-103.149c-3.27-35.42-6.393-70.841-9.663-106.262c-.149-2.074-.595-4.001-1.041-7.113c8.623-1.038 16.8-2.668 25.125-2.668c22.449 0 44.897.593 67.495 1.186c5.798.148 8.325 4.001 8.623 9.336c.743 11.116 1.784 22.083 1.784 33.198c.148 52.167-.149 104.483.297 156.65c.446 41.646 1.784 83.439 2.676 125.084zM622.069 480c-5.307-42.568-10.614-84.102-16.069-127.409c13.857-.148 27.715-.591 41.425-.591c4.57 0 6.634 2.513 7.076 7.538c3.686 38.725 7.519 77.45 11.499 117.654c-14.3.739-29.042 1.773-43.931 2.808M901 364.066c11.937 0 24.619-.148 37.45 0c6.417.148 9.55 2.672 9.55 10.244c-.448 36.224-.15 72.449-.15 108.525V491c-15.367-.742-30.139-1.485-46.7-2.227c-.15-41.124-.15-82.396-.15-124.707M568.569 489c-7.424-41.193-14.996-82.091-22.569-124.023c13.512-2.067 27.023-4.282 40.387-5.906c5.939-.738 4.9 4.43 5.197 7.678c1.633 13.879 2.82 27.61 4.305 41.488c2.376 21.704 4.752 43.408 6.979 64.965c.297 2.805 0 5.758 0 8.859c-11.284 2.362-22.569 4.577-34.299 6.939M839 365.16c12.718 0 25.435.148 38.004-.148c5.685-.149 7.78 1.038 7.63 7.563c-.449 17.352.15 34.704.3 52.204c.15 21.505 0 43.157 0 64.513c-12.868 1.335-24.09 2.373-36.209 3.708c-3.142-41.97-6.433-83.793-9.725-127.84"
      />
    </svg>
  )
}

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

export function Navbar() {
  const pathname = usePathname()
  const { previousLabel, goBack, shouldShowBackButton } = useRouteBack()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
  }, [])
  const [searchOpen, setSearchOpen] = useState(false)
  const iconButtonClass =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-colors hover:text-foreground hover:bg-muted/60 hover:opacity-100'

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
      label: 'Stack MCP',
      ariaLabel: '前往 Stack MCP 页面',
      link: '/stack-mcp',
    },
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
  ]

  return (
    <header className="paper-surface sticky top-0 z-[1200] border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]">
      <div className="relative z-20 mx-auto flex h-14 w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24">
        {shouldShowBackButton ? (
          <button
            type="button"
            onClick={goBack}
            className="group inline-flex items-center gap-2 hover:opacity-100"
            aria-label={previousLabel ? `返回${previousLabel}` : '返回上一页'}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-[color,transform] duration-200 group-hover:-translate-x-1 group-hover:text-foreground">
              ← BACK
            </span>
          </button>
        ) : (
          <Link
            href="/"
            aria-label={siteContent.name}
            className="group inline-flex items-baseline gap-2.5 opacity-100 hover:opacity-100"
          >
            <span
              className="select-none text-foreground transition-colors group-hover:text-[color:oklch(0.86_0.05_220)]"
              style={{
                fontFamily: 'var(--font-orbitron), Georgia, serif',
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.02em',
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
              className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline"
            >
              · A FIELD JOURNAL
            </span>
          </Link>
        )}

        <nav className="hidden md:flex items-center gap-5 sm:gap-6">
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

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`${iconButtonClass} ${
                searchOpen ? 'text-foreground bg-muted/40' : ''
              }`}
              aria-label="搜索（快捷键 / 或 Cmd/Ctrl+K）"
              title="搜索（/ 或 Cmd/Ctrl+K）"
            >
              <SearchGlyph className="w-4 h-4" />
            </button>

            <Link
              href="/stack-mcp"
              className={`${iconButtonClass} ${
                isActive('/stack-mcp') ? 'text-foreground bg-muted/40' : ''
              }`}
              aria-label="Stack MCP"
              title="Stack MCP"
            >
              <McpGlyph className="w-4 h-4" />
            </Link>

            {siteContent.contact.github && (
              <a
                href={siteContent.contact.github}
                target="_blank"
                rel="noreferrer"
                className={iconButtonClass}
                aria-label="GitHub"
                title="GitHub"
              >
                <GitHubGlyph className="w-4 h-4" />
              </a>
            )}

            <a
              href="https://juejin.cn/user/2280829967146779"
              target="_blank"
              rel="noreferrer"
              className={iconButtonClass}
              aria-label="掘金"
              title="掘金"
            >
              <JuejinGlyph className="w-4 h-4" />
            </a>

            <a
              href="https://space.bilibili.com/1410369961"
              target="_blank"
              rel="noreferrer"
              className={iconButtonClass}
              aria-label="Bilibili"
              title="Bilibili"
            >
              <BilibiliGlyph className="w-4 h-4" />
            </a>

            <Link
              href="/feed.xml"
              className={iconButtonClass}
              aria-label="RSS 订阅"
              title="RSS 订阅"
            >
              <RssGlyph className="w-4 h-4" />
            </Link>

            <button
              onClick={toggleTheme}
              className={iconButtonClass}
              aria-label="切换主题"
            >
              {theme === 'light' ? (
                <MoonGlyph className="w-4 h-4" />
              ) : (
                <SunGlyph className="w-4 h-4" />
              )}
            </button>
          </div>
        </nav>

        <div className="md:hidden flex items-center">
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
            logoUrl="/logo.svg"
          />
        </div>
      </div>
      <PagefindSearch
        variant="overlay"
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        autoFocus
      />
    </header>
  )
}
