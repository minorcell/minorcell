'use client'

import { useRef, useState, useEffect } from 'react'

/**
 * Tracks a continuous progress float (0 to count-1) based on which prose
 * step element's center is closest to the viewport midpoint.
 * Returns both the progress value and a ref-setter to attach to step elements.
 */
export function useScrollProgress(count: number) {
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const compute = () => {
      const mid = window.innerHeight / 2
      const centers = stepsRef.current.map((el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return r.top + r.height / 2
      })
      const valid = centers.filter((c): c is number => c !== null)
      if (!valid.length) return
      if (mid <= valid[0]) {
        setProgress(0)
        return
      }
      if (mid >= valid[valid.length - 1]) {
        setProgress(valid.length - 1)
        return
      }
      for (let i = 0; i < valid.length - 1; i++) {
        if (mid >= valid[i] && mid < valid[i + 1]) {
          setProgress(i + (mid - valid[i]) / (valid[i + 1] - valid[i]))
          return
        }
      }
    }
    window.addEventListener('scroll', compute, { passive: true })
    compute()
    return () => window.removeEventListener('scroll', compute)
  }, [count])

  const setRefFns = useRef<((el: HTMLDivElement | null) => void)[]>([])
  const setRef = (i: number) => {
    if (!setRefFns.current[i]) {
      setRefFns.current[i] = (el: HTMLDivElement | null) => {
        stepsRef.current[i] = el
      }
    }
    return setRefFns.current[i]
  }

  return { progress, setRef }
}
