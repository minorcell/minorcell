'use client'

import { useEffect } from 'react'

const REPLACED_ELEMENT = 'img, svg, video, canvas'

function toPixels(delta: number, mode: number, size: number) {
  if (mode === WheelEvent.DOM_DELTA_LINE) return delta * 16
  if (mode === WheelEvent.DOM_DELTA_PAGE) return delta * size
  return delta
}

function canConsume(element: Element, deltaY: number, deltaX: number) {
  const style = getComputedStyle(element)
  const scrolls = (value: string) =>
    value === 'auto' || value === 'scroll' || value === 'overlay'

  if (
    deltaY !== 0 &&
    scrolls(style.overflowY) &&
    element.scrollHeight > element.clientHeight + 1
  ) {
    if (
      deltaY > 0 &&
      element.scrollTop + element.clientHeight < element.scrollHeight - 1
    ) {
      return true
    }
    if (deltaY < 0 && element.scrollTop > 0) return true
  }

  if (
    deltaX !== 0 &&
    scrolls(style.overflowX) &&
    element.scrollWidth > element.clientWidth + 1
  ) {
    if (
      deltaX > 0 &&
      element.scrollLeft + element.clientWidth < element.scrollWidth - 1
    ) {
      return true
    }
    if (deltaX < 0 && element.scrollLeft > 0) return true
  }

  return false
}

/**
 * Chrome and Safari drop the wheel's default action when the pointer is over
 * a replaced element and the document has `overscroll-behavior: none`.
 * If nothing scrolled, move the nearest scrollport by the same delta.
 */
export function DocumentWheelScroll() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const replaced = target.closest(REPLACED_ELEMENT)
      if (!replaced) return

      let port: Element | null = replaced.parentElement
      while (port && !canConsume(port, event.deltaY, event.deltaX)) {
        port = port.parentElement
      }
      const scroller = port ?? document.scrollingElement
      if (!scroller) return

      const beforeTop = scroller.scrollTop
      const beforeLeft = scroller.scrollLeft
      const top = toPixels(event.deltaY, event.deltaMode, scroller.clientHeight)
      const left = toPixels(event.deltaX, event.deltaMode, scroller.clientWidth)

      requestAnimationFrame(() => {
        if (
          scroller.scrollTop !== beforeTop ||
          scroller.scrollLeft !== beforeLeft
        ) {
          return
        }
        scroller.scrollBy({ top, left })
      })
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  return null
}
