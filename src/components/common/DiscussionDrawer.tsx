'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import dynamic from 'next/dynamic'
import { useLenis } from 'lenis/react'
import { MessageCircle, X } from 'lucide-react'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { MotionLoading } from '@/components/effects/MotionPrimitives'

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
    const dialogRef = useRef<HTMLDialogElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const wasOpenRef = useRef(false)
    const titleId = useId()
    const lenis = useLenis()

    const openDrawer = useCallback(() => {
      setOpen(true)
    }, [])

    useImperativeHandle(ref, () => ({ open: openDrawer }), [openDrawer])

    const close = useCallback(() => {
      dialogRef.current?.close()
    }, [])

    useEffect(() => {
      const dialog = dialogRef.current
      if (!dialog || !open) return

      if (!dialog.open) dialog.showModal()

      let active = true
      const onClose = () => {
        if (active) setOpen(false)
      }
      const onClick = (event: MouseEvent) => {
        if (event.target === dialog) dialog.close()
      }
      dialog.addEventListener('close', onClose)
      dialog.addEventListener('click', onClick)
      return () => {
        active = false
        dialog.removeEventListener('close', onClose)
        dialog.removeEventListener('click', onClick)
        if (dialog.open) dialog.close()
      }
    }, [open])

    useEffect(() => {
      if (!open) return
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      lenis?.stop()
      return () => {
        document.body.style.overflow = previousOverflow
        if (previousOverflow !== 'hidden') lenis?.start()
      }
    }, [open, lenis])

    useEffect(() => {
      if (wasOpenRef.current && !open) {
        triggerRef.current?.focus()
      }
      wasOpenRef.current = open
    }, [open])

    return (
      <>
        {!hideTrigger && (
          <FloatingActionButton
            ref={triggerRef}
            icon={<MessageCircle className="h-[15px] w-[15px] opacity-70" />}
            label="讨论"
            onClick={openDrawer}
            hidden={open}
          />
        )}

        <dialog
          ref={dialogRef}
          className="discussion-dialog"
          aria-labelledby={titleId}
        >
          {open ? (
            <>
              <div className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-8">
                <h2 id={titleId} className="type-card-title m-0">
                  讨论
                </h2>
                <button
                  type="button"
                  aria-label="关闭讨论"
                  onClick={close}
                  className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto px-6 pb-7 sm:px-8"
              >
                <GiscusComments term={discussionTerm} />
              </div>
            </>
          ) : null}
        </dialog>
      </>
    )
  },
)
