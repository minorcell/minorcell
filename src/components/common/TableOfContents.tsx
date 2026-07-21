'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface HeadingItem {
  id: string
  text: string
  level: 2 | 3
}

function scrollToHeading(id: string, behavior: ScrollBehavior = 'smooth') {
  const target = document.getElementById(id)
  if (!target) return
  const top = target.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior })
}

interface Props {
  headings: HeadingItem[]
}

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const activeLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (headings.length === 0) return

    // Scroll to hash on initial load
    const hash = window.location.hash.slice(1)
    if (hash) {
      const timer = window.setTimeout(() => scrollToHeading(hash, 'auto'), 150)
      return () => window.clearTimeout(timer)
    }
  }, [headings])

  // Scroll-spy: find the heading whose top is just above the viewport threshold
  useEffect(() => {
    if (headings.length === 0) return

    const onScroll = () => {
      const threshold = window.scrollY + 100

      let current: string | null = null
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id)
        if (el && el.offsetTop < threshold) {
          current = headings[i].id
          break
        }
      }
      if (!current) current = headings[0].id
      setActiveId(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Wait for the initial layout before reading heading offsets.
    const timer = setTimeout(onScroll, 100)

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [headings])

  // Keep the active entry visible when a long table of contents scrolls.
  useEffect(() => {
    const list = listRef.current
    const activeLink = activeLinkRef.current
    if (!list || !activeLink) return

    const listRect = list.getBoundingClientRect()
    const linkRect = activeLink.getBoundingClientRect()
    const edgePadding = 8

    if (linkRect.top < listRect.top + edgePadding) {
      list.scrollTop -= listRect.top + edgePadding - linkRect.top
    } else if (linkRect.bottom > listRect.bottom - edgePadding) {
      list.scrollTop += linkRect.bottom - listRect.bottom + edgePadding
    }
  }, [activeId])

  if (headings.length === 0) return null

  return (
    <nav
      aria-label="文章目录"
      className="hidden w-56 shrink-0 xl:ml-16 xl:block"
    >
      <div className="sticky top-24 flex max-h-[calc(100dvh-8rem)] min-h-0 flex-col">
        <div className="type-caption mb-2 shrink-0 px-3 font-medium text-muted-foreground">
          目录
        </div>
        <ol
          ref={listRef}
          className="m-0 min-h-0 list-none space-y-0.5 overflow-y-auto overscroll-contain p-0 pr-1 [scrollbar-gutter:stable]"
        >
          {headings.map((h) => {
            const isActive = activeId === h.id
            return (
              <li key={h.id}>
                <a
                  ref={isActive ? activeLinkRef : undefined}
                  href={`#${h.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    window.history.pushState(null, '', `#${h.id}`)
                    scrollToHeading(h.id)
                  }}
                  className={cn(
                    'type-caption block rounded-md px-3 py-2 transition-colors duration-150',
                    h.level === 3 && 'pl-6',
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {h.text}
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
