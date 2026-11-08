'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  icon: React.ReactNode
  /** Accessible name. The visible control is icon-only. */
  label: string
  /** Force hidden (e.g. when drawer is open) */
  hidden?: boolean
}

export const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(function FloatingActionButton(
  { icon, label, onClick, hidden, className, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      onClick={onClick}
      className={cn(
        'floating-action-button fixed right-5 bottom-5 flex h-11 w-11 items-center justify-center rounded-full sm:right-8 sm:bottom-8',
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
        className,
      )}
    >
      {icon}
    </button>
  )
})
