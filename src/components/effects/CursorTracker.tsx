'use client'

import { useEffect, useState } from 'react'
import { cursorBus } from '@/lib/cursor-bus'

/**
 * CursorTracker — 全站鼠标交互总控
 *
 * 单点监听 mousemove，每帧 RAF 内统一处理：
 *   1. 发布坐标给 MagneticTitle（cursorBus）
 *   2. [data-cursor-underline] hover 时按鼠标 x 位置展开下划线（写 --ux）
 */
export function CursorTracker() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compute = () => setEnabled(fineHover.matches && !reduced.matches)
    compute()
    fineHover.addEventListener('change', compute)
    reduced.addEventListener('change', compute)
    return () => {
      fineHover.removeEventListener('change', compute)
      reduced.removeEventListener('change', compute)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let raf = 0

    const tick = () => {
      raf = 0

      const elAtPoint = document.elementFromPoint(mx, my)

      // FX 2 · publish to magnetic-title subscribers
      cursorBus.emit(mx, my)

      // FX 3 · cursor-position underline (--ux)
      const underlineTarget = (elAtPoint?.closest('[data-cursor-underline]') ??
        null) as HTMLElement | null
      if (underlineTarget) {
        const r = underlineTarget.getBoundingClientRect()
        const px = ((mx - r.left) / Math.max(1, r.width)) * 100
        underlineTarget.style.setProperty(
          '--ux',
          `${Math.max(0, Math.min(100, px))}%`,
        )
      }

      // Bonus · magnetic issue numbers
      const magnetParent = (elAtPoint?.closest('.article-magnet') ??
        null) as HTMLElement | null
      document
        .querySelectorAll<HTMLElement>('.article-magnet')
        .forEach((parent) => {
          const target = parent.querySelector<HTMLElement>(
            '[data-magnet-target]',
          )
          if (!target) return
          if (parent === magnetParent) {
            const r = parent.getBoundingClientRect()
            const dx = (mx - (r.left + r.width / 2)) * 0.04
            const dy = (my - (r.top + r.height / 2)) * 0.04
            target.style.transform = `translate(${dx}px, ${dy}px)`
          } else if (target.style.transform) {
            target.style.transform = ''
          }
        })
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [enabled])

  if (!enabled) return null

  return null
}
