/** Follow growing output until the reader scrolls up; resume at the bottom. */
export function observeChatScroll(viewport: HTMLElement, content: HTMLElement) {
  let following = true
  let disposed = false
  let frame: number | null = null
  let lastTop = viewport.scrollTop
  let touchY: number | null = null
  const atBottom = () =>
    viewport.scrollHeight -
      viewport.clientHeight -
      Math.max(0, viewport.scrollTop) <=
    16

  const schedule = () => {
    if (disposed || !following || frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      if (disposed || !following) return
      viewport.scrollTop = viewport.scrollHeight
      lastTop = viewport.scrollTop
    })
  }

  const onScroll = () => {
    const top = Math.max(0, viewport.scrollTop)
    if (top < lastTop && !atBottom()) following = false
    else if (top > lastTop && atBottom()) following = true
    lastTop = top
  }

  // Pause before the browser scrolls, so a queued frame cannot fight the gesture.
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return
    if (event.deltaY < 0) following = false
    else if (event.deltaY > 0 && atBottom()) {
      following = true
      schedule()
    }
  }
  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0]?.clientY ?? null
  }
  const onTouchMove = (event: TouchEvent) => {
    const nextY = event.touches[0]?.clientY ?? null
    if (touchY !== null && nextY !== null && nextY > touchY) following = false
    touchY = nextY
  }

  const observer = new ResizeObserver(schedule)
  observer.observe(content)
  observer.observe(viewport)
  viewport.addEventListener('scroll', onScroll, { passive: true })
  viewport.addEventListener('wheel', onWheel, { passive: true })
  viewport.addEventListener('touchstart', onTouchStart, { passive: true })
  viewport.addEventListener('touchmove', onTouchMove, { passive: true })
  schedule()

  return {
    follow() {
      following = true
      schedule()
    },
    dispose() {
      if (disposed) return
      disposed = true
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      observer.disconnect()
      viewport.removeEventListener('scroll', onScroll)
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
    },
  }
}
