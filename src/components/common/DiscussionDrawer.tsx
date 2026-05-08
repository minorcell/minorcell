'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { GiscusComments } from '@/components/common/GiscusComments'
import { cn } from '@/lib/utils'

interface Props {
  discussionTerm: string
}

export function DiscussionDrawer({ discussionTerm }: Props) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    const onScroll = () => {
      if (openRef.current) return
      const pct =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight)
      setVisible(pct > 0.2)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openRef.current) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        aria-label="Open discussion"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-9 right-9 z-50 flex items-center gap-2 rounded-3xl border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] bg-background px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-300 hover:text-[color:var(--link-accent)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:border-[color:color-mix(in_oklab,var(--link-accent)_50%,transparent)] active:scale-95 sm:bottom-10 sm:right-10',
          visible && !open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
        )}
      >
        <MessageCircle className="h-[15px] w-[15px] opacity-70" />
        <span>Discussion</span>
      </button>

      {/* Overlay — above navbar (z-[1200]) */}
      <div
        className={cn(
          'fixed inset-0 z-[1300] bg-black/30 transition-opacity duration-300 dark:bg-black/55',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        onClick={close}
      />

      {/* Drawer panel — above overlay */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-[1310] flex w-[560px] max-w-full flex-col border-l border-border bg-background shadow-[-12px_0_48px_rgba(0,0,0,0.15)] transition-transform duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header — publication-style masthead */}
        <div className="flex shrink-0 items-end justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] px-8 pb-5 pt-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              SECTION §02 · ENGAGE
            </div>
            <h3
              className="m-0 mt-3 text-[clamp(1.4rem,1.1rem+0.7vw,1.8rem)] leading-[1.08] tracking-[-0.02em]"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 500,
              }}
            >
              Discussion
            </h3>
            <p
              className="m-0 mt-2 text-[14px] leading-[1.55] text-muted-foreground"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
              }}
            >
              留言区 · GitHub-powered comments via Giscus
            </p>
          </div>
          <button
            type="button"
            aria-label="Close discussion"
            onClick={close}
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] bg-transparent text-muted-foreground transition-colors duration-200 hover:text-foreground hover:border-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          <GiscusComments term={discussionTerm} />
        </div>
      </div>
    </>
  )
}
