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
 * If that wheel never moves a scrollport, apply the same delta ourselves.
 * A passive listener can run after the browser has already scrolled, so the
 * baseline stays one frame behind and is not treated as "nothing happened".
 */
export function DocumentWheelScroll() {
  useEffect(() => {
    const baselines = new WeakMap<Element, { top: number; left: number }>()

    const baselineOf = (element: Element) => {
      let value = baselines.get(element)
      if (!value) {
        value = { top: element.scrollTop, left: element.scrollLeft }
        baselines.set(element, value)
      }
      return value
    }

    if (document.scrollingElement) baselineOf(document.scrollingElement)

    const onScroll = (event: Event) => {
      const element =
        event.target === document ? document.scrollingElement : event.target
      if (!(element instanceof Element)) return
      const baseline = baselineOf(element)
      requestAnimationFrame(() => {
        baseline.top = element.scrollTop
        baseline.left = element.scrollLeft
      })
    }

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

      const baseline = baselineOf(scroller)
      const topNow = scroller.scrollTop
      const leftNow = scroller.scrollLeft
      if (topNow !== baseline.top || leftNow !== baseline.left) return

      const top = toPixels(event.deltaY, event.deltaMode, scroller.clientHeight)
      const left = toPixels(event.deltaX, event.deltaMode, scroller.clientWidth)

      window.setTimeout(() => {
        if (scroller.scrollTop !== topNow || scroller.scrollLeft !== leftNow) {
          return
        }
        scroller.scrollBy({ top, left })
      }, 40)
    }

    document.addEventListener('scroll', onScroll, {
      capture: true,
      passive: true,
    })
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  return null
}
