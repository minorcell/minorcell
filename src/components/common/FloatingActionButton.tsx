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
      onClick={onClick}
      className={cn(
        'floating-action-button fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-3xl px-5 py-2.5 font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-300 active:scale-95 sm:right-10 sm:bottom-10',
        hidden
          ? 'pointer-events-none translate-y-3 opacity-0'
          : 'translate-y-0 opacity-100',
        className,
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
