'use client'

import { useEffect, useRef, useState } from 'react'
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

interface Props {
  rawContent: string
}

export function TableOfContents({ rawContent }: Props) {
  const headings = useRef(parseHeadings(rawContent)).current
  const [activeId, setActiveId] = useState<string | null>(null)

  // Inject IDs and anchor links into DOM heading elements
  useEffect(() => {
    if (headings.length === 0) return
    const articleBody = document.querySelector('.article-markdown')
    if (!articleBody) return
    const domHeadings = articleBody.querySelectorAll('h2, h3')
    domHeadings.forEach((el, i) => {
      if (i >= headings.length) return
      el.id = headings[i].id

      if (!el.querySelector('.heading-anchor')) {
        const a = document.createElement('a')
        a.href = `#${headings[i].id}`
        a.className = 'heading-anchor'
        a.setAttribute('aria-label', `Link to: ${headings[i].text}`)
        a.textContent = '#'
        a.addEventListener('click', (e) => {
          e.preventDefault()
          window.history.pushState(null, '', `#${headings[i].id}`)
          el.scrollIntoView({ behavior: 'smooth' })
        })
        el.appendChild(a)
      }
    })

    // Scroll to hash on initial load
    const hash = window.location.hash.slice(1)
    if (hash) {
      const target = document.getElementById(hash)
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 150)
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
    <nav
      aria-label="Table of Contents"
      className="hidden xl:block xl:ml-12"
    >
      <div className="sticky top-[120px]">
        <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          On this page
        </div>
        <ol className="m-0 list-none border-l border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] p-0">
          {headings.map((h) => {
            const isActive = activeId === h.id
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    window.history.pushState(null, '', `#${h.id}`)
                    document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={cn(
                    'block -ml-px py-1.5 pl-4 text-[13px] leading-[1.5] transition-all duration-200',
                    h.level === 3 && 'pl-7 text-[12.5px]',
                    isActive
                      ? 'border-l-[2px] border-l-[color:var(--link-accent)] font-medium text-foreground'
                      : 'border-l-[1.5px] border-l-transparent text-muted-foreground hover:border-l-[color:color-mix(in_oklab,var(--border)_70%,transparent)] hover:text-foreground',
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
