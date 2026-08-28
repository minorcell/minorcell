'use client'

import {
  AnimatePresence,
  motion,
  type MotionValue,
  useReducedMotion,
} from 'framer-motion'
import Link from 'next/link'
import { forwardRef } from 'react'
import type { ComponentProps, ReactNode } from 'react'

const contentEase = [0.22, 1, 0.36, 1] as const
const MotionNextLink = motion.create(Link)

interface MotionSurfaceProps extends Omit<
  ComponentProps<typeof motion.div>,
  'children'
> {
  children: ReactNode
}

export function MotionSurface({ children, ...props }: MotionSurfaceProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface MotionButtonProps extends Omit<
  ComponentProps<typeof motion.button>,
  'children'
> {
  children: ReactNode
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  function MotionButton({ children, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.94, opacity: 0.72 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.button>
    )
  },
)
MotionButton.displayName = 'MotionButton'

interface MotionLinkProps extends Omit<
  ComponentProps<typeof MotionNextLink>,
  'children'
> {
  children: ReactNode
}

export const MotionLink = forwardRef<HTMLAnchorElement, MotionLinkProps>(
  function MotionLink({ children, ...props }, ref) {
    return (
      <MotionNextLink
        ref={ref}
        whileTap={{ scale: 0.96, opacity: 0.72 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </MotionNextLink>
    )
  },
)
MotionLink.displayName = 'MotionLink'

interface MotionOverlayProps {
  open: boolean
  children: ReactNode
  className?: string
  panelClassName?: string
  panelProps?: Omit<ComponentProps<typeof motion.div>, 'children' | 'className'>
  preventScroll?: boolean
  variant?: 'dialog' | 'drawer'
  onBackdropPointerDown?: () => void
}

export function MotionOverlay({
  open,
  children,
  className = '',
  panelClassName = '',
  panelProps,
  preventScroll = false,
  variant = 'dialog',
  onBackdropPointerDown,
}: MotionOverlayProps) {
  const isDrawer = variant === 'drawer'

  return (
    <AnimatePresence>
      {open ? (
        // The backdrop only closes when the backdrop itself is the target.
        // Keyboard users close overlays through their explicit close action.
        <motion.div
          key="motion-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={className}
          data-lenis-prevent={preventScroll || undefined}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onBackdropPointerDown?.()
          }}
        >
          <motion.div
            key="motion-overlay-panel"
            initial={
              isDrawer ? { x: '100%' } : { opacity: 0, y: -12, scale: 0.98 }
            }
            animate={isDrawer ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isDrawer ? { x: '100%' } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.24, ease: contentEase }}
            className={panelClassName}
            {...panelProps}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function MotionDrawer(props: Omit<MotionOverlayProps, 'variant'>) {
  return <MotionOverlay {...props} variant="drawer" />
}

interface MotionListItemProps extends Omit<
  ComponentProps<typeof motion.li>,
  'children'
> {
  children: ReactNode
}

export function MotionListItem({ children, ...props }: MotionListItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.li>
  )
}

export function MotionList({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {children}
    </AnimatePresence>
  )
}

export function MotionActiveIndicator({ layoutId }: { layoutId: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden="true"
      className="pointer-events-none absolute right-2.5 bottom-0.5 left-2.5 h-0.5 rounded-full bg-link-accent"
      transition={{ duration: 0.18, ease: contentEase }}
    />
  )
}

export function MotionHighlight({
  layoutId,
  className = '',
}: {
  layoutId: string
  className?: string
}) {
  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 rounded-md bg-accent ${className}`}
      transition={{ duration: 0.2, ease: contentEase }}
    />
  )
}

export { LayoutGroup as MotionLayoutGroup } from 'framer-motion'

export function MotionProgress({ value }: { value: MotionValue<number> }) {
  return (
    <motion.div
      className="reading-progress h-full origin-left bg-link-accent"
      style={{ scaleX: value }}
    />
  )
}

export function MotionLoading({ label }: { label: string }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <output
      aria-live="polite"
      className="type-meta flex items-center gap-3 py-8 text-muted-foreground"
    >
      <motion.span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-link-accent"
        animate={
          shouldReduceMotion ? { opacity: 0.65 } : { opacity: [0.35, 1, 0.35] }
        }
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span>{label}</span>
    </output>
  )
}

export function MotionGreeting() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.span
      aria-hidden="true"
      className="inline-block origin-[70%_80%]"
      animate={
        shouldReduceMotion ? { rotate: 0 } : { rotate: [0, 14, -7, 12, 0] }
      }
      transition={{
        duration: 1.6,
        repeat: Infinity,
        repeatDelay: 3.2,
        ease: 'easeInOut',
      }}
    >
      👋
    </motion.span>
  )
}
