'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import GradualBlur from '@/components/effects/reactbits/GradualBlur'
import { PagefindSearch } from '@/components/common/PagefindSearch'
import StaggeredMenu, {
  type StaggeredMenuItem,
  type StaggeredMenuSocialItem,
} from '@/components/effects/reactbits/StaggeredMenu'
import TextPressure from '@/components/effects/reactbits/TextPressure'
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
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      >
        <path d="M9.096 21.25v-3.146a3.33 3.33 0 0 1 .758-2.115c-3.005-.4-5.28-1.859-5.28-5.798c0-1.666 1.432-3.89 1.432-3.89c-.514-1.13-.5-3.084.06-3.551c0 0 1.95.175 3.847 1.75c1.838-.495 3.764-.554 5.661 0c1.897-1.575 3.848-1.75 3.848-1.75c.558.467.573 2.422.06 3.551c0 0 1.432 2.224 1.432 3.89c0 3.94-2.276 5.398-5.28 5.798a3.33 3.33 0 0 1 .757 2.115v3.146" />
        <path d="M3.086 16.57c.163.554.463 1.066.878 1.496c.414.431.932.77 1.513.988a4.46 4.46 0 0 0 3.62-.216" />
      </g>
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
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16l5 5" />
      </g>
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
        strokeWidth={1.5}
        d="M6 11.25A6.75 6.75 0 0 1 12.75 18M6 6a12 12 0 0 1 12 12m-11.5-.146l.354-.354"
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

export function Navbar() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const iconButtonClass =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-colors hover:text-foreground hover:bg-muted/60 hover:opacity-100'

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
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

  useEffect(() => {
    setSearchOpen(false)
  }, [pathname])

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

  const mobileSocialItems: StaggeredMenuSocialItem[] = siteContent.contact
    .github
    ? [{ label: 'GitHub', link: siteContent.contact.github }]
    : []

  return (
    <header className="sticky top-0 z-[1200] bg-background/80">
      <GradualBlur
        position="top"
        target="parent"
        exponential
        strength={2}
        divCount={5}
        opacity={1}
        zIndex={0}
        className="pointer-events-none"
      />
      <div className="relative z-20 flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={siteContent.name}
          className="inline-flex items-center opacity-100 hover:opacity-100"
        >
          <div className="h-8 w-36 sm:w-40">
            <TextPressure
              text={siteContent.name}
              flex={false}
              stroke={false}
              alpha={false}
              width={false}
              weight={true}
              italic={true}
              textColor="var(--foreground)"
              minFontSize={24}
              className="select-none"
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-4 sm:gap-5">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-opacity ${
                isActive(item.href)
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}

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

            <Link
              href="/feed.xml"
              className={iconButtonClass}
              aria-label="RSS 订阅"
              title="RSS 订阅"
            >
              <RssGlyph className="w-4 h-4" />
            </Link>

            {mounted && (
              <button
                onClick={toggleTheme}
                className={iconButtonClass}
                aria-label="切换主题"
              >
                {theme === 'light' ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>
            )}
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
            openMenuButtonColor="#111111"
            changeMenuColorOnOpen={true}
            colors={['#e9eaee', '#ffffff']}
            accentColor="#0f172a"
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
