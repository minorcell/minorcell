'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import dynamic from 'next/dynamic'
import { MessageCircle, X } from 'lucide-react'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { cn } from '@/lib/utils'

const GiscusComments = dynamic(
  () =>
    import('@/components/common/GiscusComments').then(
      (module) => module.GiscusComments,
    ),
  { ssr: false },
)

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
    const [hasOpened, setHasOpened] = useState(false)
    const openRef = useRef(open)

    useEffect(() => {
      openRef.current = open
    }, [open])

    const openDrawer = useCallback(() => {
      setHasOpened(true)
      setOpen(true)
    }, [])

    useImperativeHandle(ref, () => ({ open: openDrawer }), [openDrawer])

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
            onClick={openDrawer}
            hidden={open}
          />
        )}

        {/* Overlay — above navbar (z-nav). Click-to-close is a pointer-only
         * convenience; keyboard users close via Escape or the close button. */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={cn(
            'fixed inset-0 z-drawer bg-black/25 transition-opacity duration-200 dark:bg-black/55',
            open
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0',
          )}
          onClick={close}
        />

        {/* Drawer panel — above overlay. Kept as role="dialog" instead of the
         * native <dialog> element: the slide-in transition and fixed edge
         * positioning fight <dialog>'s UA styles. */}
        <div
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="dialog"
          aria-modal="true"
          aria-label="讨论"
          aria-hidden={!open}
          className={cn(
            'fixed right-0 top-0 bottom-0 z-drawer-panel flex w-[560px] max-w-full flex-col bg-background shadow-overlay transition-transform duration-200 ease-out',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-8">
            <h2 className="type-card-title m-0">讨论</h2>
            <button
              type="button"
              aria-label="关闭讨论"
              onClick={close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 pb-7 sm:px-8">
            {hasOpened && <GiscusComments term={discussionTerm} />}
          </div>
        </div>
      </>
    )
  },
)
