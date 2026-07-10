'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  /** Lucide icon component */
  icon: React.ReactNode
  /** Label shown next to icon (hidden on mobile) */
  label: string
  /** Click handler */
  onClick: () => void
  /** Force hidden (e.g. when drawer is open) */
  hidden?: boolean
  /** Additional class names */
  className?: string
}

export function FloatingActionButton({
  icon,
  label,
  onClick,
  hidden,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'floating-action-button fixed right-5 bottom-5 z-50 flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,color,opacity,transform] duration-200 active:scale-95 sm:right-8 sm:bottom-8',
        hidden
          ? 'pointer-events-none translate-y-3 opacity-0'
          : 'translate-y-0 opacity-100',
        className,
      )}
    >
      {icon}
    </button>
  )
}
