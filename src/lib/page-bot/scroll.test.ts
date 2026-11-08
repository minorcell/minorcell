import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { observeChatScroll } from './scroll.ts'

class Viewport extends EventTarget {
  scrollHeight = 1000
  clientHeight = 200
  top = 0
  writes = 0

  get scrollTop() {
    return this.top
  }

  set scrollTop(value: number) {
    this.writes++
    this.top = Math.max(
      0,
      Math.min(value, this.scrollHeight - this.clientHeight),
    )
  }

  userScroll(top: number) {
    this.top = top
    this.dispatchEvent(new Event('scroll'))
  }

  gesture(type: string, properties: object) {
    this.dispatchEvent(Object.assign(new Event(type), properties))
  }
}

function setup(t: TestContext) {
  const frames = new Map<number, FrameRequestCallback>()
  let nextFrame = 0
  let resize: () => void = () => {}
  let disconnected = false
  const originals = new Map<string, PropertyDescriptor | undefined>()
  const globals = {
    requestAnimationFrame(callback: FrameRequestCallback) {
      frames.set(++nextFrame, callback)
      return nextFrame
    },
    cancelAnimationFrame(id: number) {
      frames.delete(id)
    },
    ResizeObserver: class {
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this as unknown as ResizeObserver)
      }
      observe() {}
      disconnect() {
        disconnected = true
      }
    },
  }
  for (const [key, value] of Object.entries(globals)) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true })
  }

  const viewport = new Viewport()
  const scroll = observeChatScroll(
    viewport as unknown as HTMLElement,
    {} as HTMLElement,
  )
  t.after(() => {
    scroll.dispose()
    for (const [key, original] of originals) {
      if (original) Object.defineProperty(globalThis, key, original)
      else Reflect.deleteProperty(globalThis, key)
    }
  })
  return {
    viewport,
    scroll,
    resize: () => resize(),
    get disconnected() {
      return disconnected
    },
    get pendingFrames() {
      return frames.size
    },
    frame() {
      const callbacks = [...frames.values()]
      frames.clear()
      for (const callback of callbacks) callback(0)
    },
  }
}

test('follows actual content growth and batches resize notifications into one frame', (t) => {
  const ui = setup(t)
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 800)
  ui.viewport.scrollHeight = 1200
  ui.resize()
  ui.resize()
  assert.equal(ui.pendingFrames, 1)
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 1000)
  assert.equal(ui.viewport.writes, 2)
})

test('an upward wheel gesture wins over an already queued output update', (t) => {
  const ui = setup(t)
  ui.frame()
  ui.viewport.scrollHeight = 1200
  ui.resize()
  ui.viewport.gesture('wheel', { deltaY: -80 })
  ui.viewport.userScroll(720)
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 720)
  ui.viewport.scrollHeight = 1400
  ui.resize()
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 720)
  assert.equal(ui.viewport.writes, 1)
})

test('manual scrollbar or keyboard scrolling pauses following until the reader returns to the bottom', (t) => {
  const ui = setup(t)
  ui.frame()
  ui.viewport.userScroll(400)
  ui.viewport.scrollHeight = 1200
  ui.resize()
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 400)
  ui.viewport.userScroll(1000)
  ui.viewport.scrollHeight = 1400
  ui.resize()
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 1200)
})

test('a touch gesture pauses a queued scroll before native scrolling happens', (t) => {
  const ui = setup(t)
  ui.frame()
  ui.viewport.scrollHeight = 1200
  ui.resize()
  ui.viewport.gesture('touchstart', { touches: [{ clientY: 100 }] })
  ui.viewport.gesture('touchmove', { touches: [{ clientY: 150 }] })
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 800)
})

test('sending a new question explicitly resumes following after reading history', (t) => {
  const ui = setup(t)
  ui.frame()
  ui.viewport.userScroll(200)
  ui.scroll.follow()
  ui.viewport.scrollHeight = 1200
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 1000)
})

test('a downward gesture at the bottom resumes even when there was no room to scroll', (t) => {
  const ui = setup(t)
  ui.frame()
  ui.viewport.gesture('wheel', { deltaY: -10 })
  ui.viewport.gesture('wheel', { deltaY: 10 })
  ui.viewport.scrollHeight = 1200
  ui.resize()
  ui.frame()
  assert.equal(ui.viewport.scrollTop, 1000)
})

test('closing the panel cancels pending work and disconnects observation', (t) => {
  const ui = setup(t)
  ui.scroll.dispose()
  assert.equal(ui.disconnected, true)
  assert.equal(ui.pendingFrames, 0)
  ui.resize()
  ui.scroll.follow()
  ui.frame()
  assert.equal(ui.viewport.writes, 0)
})
