/** Show the first token immediately, then coalesce snapshots between UI updates. */
export function createStreamBuffer(
  publish: (content: string) => void,
  interval = 50,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: string | null = null
  let started = false
  let cancelled = false

  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (pending === null) return
    const content = pending
    pending = null
    publish(content)
  }

  return {
    push(content: string) {
      if (cancelled) return
      pending = content
      if (!started) {
        started = true
        flush()
      } else if (timer === undefined) {
        timer = setTimeout(flush, interval)
      }
    },
    flush,
    cancel() {
      cancelled = true
      clearTimeout(timer)
      timer = undefined
      pending = null
    },
  }
}
