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
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 flex items-center gap-2 rounded-3xl border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] bg-background px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-300 hover:text-[color:var(--link-accent)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:border-[color:color-mix(in_oklab,var(--link-accent)_50%,transparent)] active:scale-95',
        hidden ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
        className,
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
