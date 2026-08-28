'use client'

import { cancelFrame, frame } from 'framer-motion'
import { ReactLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'

const preventNestedScroll = (node: HTMLElement) =>
  node.closest('[data-lenis-prevent]') !== null

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const lenisRef = useRef<LenisRef>(null)
  const isInteractiveTutorial = pathname.startsWith('/tutorials/')
  const options = useMemo(
    () => ({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
      allowNestedScroll: false,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: preventNestedScroll,
    }),
    [],
  )

  useEffect(() => {
    if (isInteractiveTutorial) return

    const update = ({ timestamp }: { timestamp: number }) => {
      lenisRef.current?.lenis?.raf(timestamp)
    }

    frame.update(update, true)
    return () => cancelFrame(update)
  }, [isInteractiveTutorial])

  if (isInteractiveTutorial) return children

  return (
    <ReactLenis root ref={lenisRef} options={options}>
      {children}
    </ReactLenis>
  )
}
