'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface HeadingItem {
  id: string
  text: string
  level: 2 | 3
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseHeadings(rawMarkdown: string): HeadingItem[] {
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings: HeadingItem[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(rawMarkdown)) !== null) {
    const level = match[1].length as 2 | 3
    const text = match[2].trim()
    headings.push({ id: slugify(text), text, level })
  }
  return headings
}

function scrollToHeading(id: string, behavior: ScrollBehavior = 'smooth') {
  const target = document.getElementById(id)
  if (!target) return
  const top = target.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior })
}

interface Props {
  rawContent: string
}

export function TableOfContents({ rawContent }: Props) {
  const headings = useMemo(() => parseHeadings(rawContent), [rawContent])
  const [activeId, setActiveId] = useState<string | null>(null)

  // Inject stable IDs into rendered markdown headings.
  useEffect(() => {
    if (headings.length === 0) return
    const articleBody = document.querySelector('.article-markdown')
    if (!articleBody) return
    const domHeadings = articleBody.querySelectorAll('h2, h3')
    domHeadings.forEach((el, i) => {
      if (i >= headings.length) return
      el.id = headings[i].id
    })

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
    // Small delay so DOM IDs from the effect above are in place
    const timer = setTimeout(onScroll, 100)

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="文章目录" className="hidden w-56 xl:ml-16 xl:block">
      <div className="sticky top-24">
        <div className="type-caption mb-2 px-3 font-medium text-muted-foreground">
          目录
        </div>
        <ol className="m-0 list-none space-y-0.5 p-0">
          {headings.map((h) => {
            const isActive = activeId === h.id
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
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
