'use client'

import { CSSProperties, ReactNode, useEffect, useRef } from 'react'
import { cursorBus } from '@/lib/cursor-bus'

/**
 * MagneticTitle — Hero 大标题字重跟随鼠标
 *
 * 把 `text` 拆成单字符 span，订阅全局 cursor-bus，每帧根据每个字到鼠标的距离
 * 把 font-variation-settings 的 wght 轴在 400–900 间插值。
 *
 * 字符串中的 `&` 会被识别为斜体连字号（ampersand），可单独应用 ampClassName /
 * ampStyle，并随光标做轻微旋转 / 缩放（呼应 Minor Cell 的活字气质）。
 *
 * 仅在 (hover: hover) and (pointer: fine) 且未启用 reduced-motion 的设备上生效，
 * 其他设备上仅静态渲染（字重落在 style.fontWeight 默认值）。
 */
type Props = {
  text: string
  className?: string
  style?: CSSProperties
  ampClassName?: string
  ampStyle?: CSSProperties
}

export function MagneticTitle({
  text,
  className,
  style,
  ampClassName,
  ampStyle,
}: Props) {
  const containerRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fineHover.matches || reduced.matches) return

    const chars = Array.from(
      container.querySelectorAll<HTMLSpanElement>('.fx-ch'),
    )
    const amp = container.querySelector<HTMLSpanElement>('.fx-amp')

    let lastX = window.innerWidth / 2
    let lastY = window.innerHeight / 2
    let raf = 0

    const update = () => {
      raf = 0
      const maxD = Math.hypot(window.innerWidth, window.innerHeight) * 0.45

      chars.forEach((ch) => {
        const r = ch.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const d = Math.hypot(cx - lastX, cy - lastY)
        const t = Math.max(0, 1 - d / maxD) // 0..1
        const w = Math.round(400 + 500 * t) // 400..900
        ch.style.fontVariationSettings = `"wght" ${w}`
      })

      if (amp) {
        const r = amp.getBoundingClientRect()
        const adx = lastX - (r.left + r.width / 2)
        const ady = lastY - (r.top + r.height / 2)
        const ad = Math.hypot(adx, ady)
        const at = Math.max(0, 1 - ad / 600)
        amp.style.transform = `rotate(${
          (adx / window.innerWidth) * 6 * at
        }deg) scale(${1 + at * 0.06})`
      }
    }

    const unsub = cursorBus.subscribe((x, y) => {
      lastX = x
      lastY = y
      if (!raf) raf = requestAnimationFrame(update)
    })

    return () => {
      unsub()
      if (raf) cancelAnimationFrame(raf)
      // Reset inline styles so non-FX state is clean on remount
      chars.forEach((ch) => {
        ch.style.fontVariationSettings = ''
      })
      if (amp) amp.style.transform = ''
    }
  }, [text])

  // Build per-char nodes; preserve spaces; identify '&' as the italic ampersand.
  const nodes: ReactNode[] = []
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === ' ') {
      nodes.push(<span key={`s-${i}`}>{'\u00A0'}</span>)
    } else if (ch === '&') {
      nodes.push(
        <span
          key={`a-${i}`}
          className={`fx-amp ${ampClassName ?? ''}`.trim()}
          style={ampStyle}
        >
          &amp;
        </span>,
      )
    } else {
      nodes.push(
        <span key={`c-${i}`} className="fx-ch">
          {ch}
        </span>,
      )
    }
  }

  return (
    <h1 ref={containerRef} className={className} style={style}>
      {nodes}
    </h1>
  )
}
