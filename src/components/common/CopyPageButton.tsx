'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
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

  const copiedLabel =
    status === 'copied' && target === 'page'
      ? 'Copy page'
      : status === 'copied' && target === 'body'
        ? 'Copy body only'
        : null

  const statusAnnouncement =
    status === 'idle' || target === null
      ? ''
      : status === 'copied'
        ? `${target === 'page' ? 'Copy page' : 'Copy body only'} copied`
        : `${target === 'page' ? 'Copy page' : 'Copy body only'} failed`

  return (
    <div className={cn('inline-flex', className)}>
      <span className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void onCopy('page')}>
            <span>Copy page</span>
            {copiedLabel === 'Copy page' && <Check className="ml-auto h-3.5 w-3.5" />}
            {status === 'error' && target === 'page' && (
              <span className="ml-auto text-xs text-muted-foreground">
                Copy failed
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void onCopy('body')}>
            <span>Copy body only</span>
            {copiedLabel === 'Copy body only' && (
              <Check className="ml-auto h-3.5 w-3.5" />
            )}
            {status === 'error' && target === 'body' && (
              <span className="ml-auto text-xs text-muted-foreground">
                Copy failed
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
