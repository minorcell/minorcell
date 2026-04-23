'use client'

import { useRef, useState, useEffect } from 'react'

/**
 * Tracks the active step index using IntersectionObserver with a narrow
 * center-band rootMargin (matching the site's scroller.js approach).
 * Only fires when a step element actually crosses the viewport midpoint —
 * never on every scroll pixel. Observer is recreated on viewport resize.
 */
export function useScrollProgress(count: number) {
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    function createObserver() {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      const vh = document.documentElement.clientHeight
      const margin = Math.round(vh / 2) - 2

      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio > 0) {
              const idx = Number(
                (entry.target as HTMLElement).dataset.stepIndex,
              )
              if (!isNaN(idx)) setCurrentIndex(idx)
            }
          })
        },
        { rootMargin: `-${margin}px 0px`, threshold: 0.000001 },
      )

      stepsRef.current.forEach((el) => {
        if (el) obs.observe(el)
      })

      observerRef.current = obs
    }

    createObserver()
    window.addEventListener('resize', createObserver)

    return () => {
      window.removeEventListener('resize', createObserver)
      observerRef.current?.disconnect()
    }
  }, [count])

  const setRefFns = useRef<((el: HTMLDivElement | null) => void)[]>([])

  const setRef = (i: number) => {
    if (!setRefFns.current[i]) {
      setRefFns.current[i] = (el: HTMLDivElement | null) => {
        const prev = stepsRef.current[i]
        if (prev === el) return
        if (prev && observerRef.current) observerRef.current.unobserve(prev)
        stepsRef.current[i] = el
        if (el) {
          el.dataset.stepIndex = String(i)
          observerRef.current?.observe(el)
        }
      }
    }
    return setRefFns.current[i]
  }

  return { currentIndex, setRef }
}
