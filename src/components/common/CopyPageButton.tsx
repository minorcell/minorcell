'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyPageButtonProps {
  content: string
  className?: string
}

type CopyStatus = 'idle' | 'copied' | 'error'

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

export function CopyPageButton({ content, className }: CopyPageButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
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
    }, 1800)
  }

  const onCopy = async () => {
    try {
      await writeToClipboard(content)
      setStatus('copied')
    } catch (err) {
      console.error('Copy failed', err)
      setStatus('error')
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
    status === 'idle' ? '' : status === 'copied' ? '正文已复制' : '正文复制失败'

  return (
    <div className={cn('inline-flex', className)}>
      <span className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
        aria-label="复制正文"
        title="复制正文"
        onClick={() => void onCopy()}
      >
        {status === 'copied' ? (
          <Check className="h-4 w-4 text-link-accent" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
