'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CopyPageButtonProps {
  pageContent: string
  bodyContent: string
  className?: string
}

type CopyStatus = 'idle' | 'copied' | 'error'
type CopyTarget = 'page' | 'body'

async function writeToClipboard(value: string) {
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!ok) {
    throw new Error('Copy failed')
  }
}

export function CopyPageButton({
  pageContent,
  bodyContent,
  className,
}: CopyPageButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const [target, setTarget] = useState<CopyTarget | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  const clearResetTimer = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }

  const scheduleReset = () => {
    clearResetTimer()
    resetTimerRef.current = window.setTimeout(() => {
      setStatus('idle')
      setTarget(null)
    }, 1800)
  }

  const onCopy = async (copyTarget: CopyTarget) => {
    const value = copyTarget === 'page' ? pageContent : bodyContent

    try {
      await writeToClipboard(value)
      setStatus('copied')
      setTarget(copyTarget)
    } catch (err) {
      console.error('Copy failed', err)
      setStatus('error')
      setTarget(copyTarget)
    } finally {
      scheduleReset()
    }
  }

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const statusAnnouncement =
    status === 'idle' || target === null
      ? ''
      : status === 'copied'
        ? `${target === 'page' ? '完整页面' : '正文'}已复制`
        : `${target === 'page' ? '完整页面' : '正文'}复制失败`

  return (
    <div className={cn('inline-flex', className)}>
      <span className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="复制页面"
            title="复制页面"
          >
            {status === 'copied' ? (
              <Check className="h-4 w-4 text-[color:var(--link-accent)]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-0 shadow-[var(--shadow-overlay)]"
        >
          <DropdownMenuItem onSelect={() => void onCopy('page')}>
            <span>复制完整页面</span>
            {status === 'copied' && target === 'page' && (
              <Check className="ml-auto h-3.5 w-3.5" />
            )}
            {status === 'error' && target === 'page' && (
              <span className="type-caption ml-auto text-muted-foreground">
                失败
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void onCopy('body')}>
            <span>只复制正文</span>
            {status === 'copied' && target === 'body' && (
              <Check className="ml-auto h-3.5 w-3.5" />
            )}
            {status === 'error' && target === 'body' && (
              <span className="type-caption ml-auto text-muted-foreground">
                失败
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
