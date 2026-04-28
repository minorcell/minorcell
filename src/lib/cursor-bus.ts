/**
 * cursor-bus — 轻量的全局光标坐标分发
 *
 * 由 <CursorTracker /> 在每个 RAF 调用 emit(x, y) 推送一次坐标，
 * 其他交互组件（MagneticTitle 等）通过 subscribe 订阅，避免每个组件
 * 各自 attach mousemove 监听导致重复计算。
 */
type Listener = (x: number, y: number) => void

const listeners = new Set<Listener>()

export const cursorBus = {
  subscribe(fn: Listener) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  emit(x: number, y: number) {
    listeners.forEach((fn) => fn(x, y))
  },
}
