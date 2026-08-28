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
import { useLenis } from 'lenis/react'
import { MessageCircle, X } from 'lucide-react'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import {
  MotionDrawer,
  MotionLoading,
} from '@/components/effects/MotionPrimitives'

const GiscusComments = dynamic(
  () =>
    import('@/components/common/GiscusComments').then(
      (module) => module.GiscusComments,
    ),
  {
    ssr: false,
    loading: () => <MotionLoading label="正在加载讨论" />,
  },
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
    const lenis = useLenis()

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
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        lenis?.stop()
        return () => {
          document.body.style.overflow = previousOverflow
          if (previousOverflow !== 'hidden') lenis?.start()
        }
      }
    }, [open, lenis])

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

        <MotionDrawer
          open={open}
          onBackdropPointerDown={close}
          className="fixed inset-0 z-drawer bg-black/25 dark:bg-black/55"
          panelClassName="fixed right-0 top-0 bottom-0 z-drawer-panel flex w-[560px] max-w-full flex-col bg-background shadow-overlay"
          panelProps={{
            // The native <dialog> element conflicts with the fixed edge
            // positioning used by this drawer.
            role: 'dialog',
            'aria-modal': true,
            'aria-label': '讨论',
            'aria-hidden': !open,
          }}
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
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto px-6 pb-7 sm:px-8"
          >
            {hasOpened && <GiscusComments term={discussionTerm} />}
          </div>
        </MotionDrawer>
      </>
    )
  },
)
