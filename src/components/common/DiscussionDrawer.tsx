'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { GiscusComments } from '@/components/common/GiscusComments'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { cn } from '@/lib/utils'

export interface DiscussionDrawerHandle {
  open: () => void
}

interface Props {
  discussionTerm: string
  hideTrigger?: boolean
}

export const DiscussionDrawer = forwardRef<DiscussionDrawerHandle, Props>(
  function DiscussionDrawer({ discussionTerm, hideTrigger }, ref) {
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), [])

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
      {/* Floating trigger — only when not hidden by parent */}
      {!hideTrigger && (
        <FloatingActionButton
          icon={<MessageCircle className="h-[15px] w-[15px] opacity-70" />}
          label="讨论"
          onClick={() => setOpen(true)}
          hidden={open}
        />
      )}

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
})
