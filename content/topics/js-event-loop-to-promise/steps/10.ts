export {}
type State = 'pending' | 'fulfilled' | 'rejected'

class MyPromise<T = unknown> {
  private state: State = 'pending'
  private value: T | undefined
  private reason: unknown
  private onFulfilledCbs: Array<() => void> = []
  private onRejectedCbs: Array<() => void> = []

  constructor(
    executor: (resolve: (v: T) => void, reject: (e: unknown) => void) => void,
  ) {
    const resolve = (v: T) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
      this.onFulfilledCbs.forEach((cb) => cb())
    }
    const reject = (e: unknown) => {
      if (this.state !== 'pending') return
      this.state = 'rejected'
      this.reason = e
      this.onRejectedCbs.forEach((cb) => cb())
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled?: (v: T) => unknown, onRejected?: (e: unknown) => unknown) {
    const runFulfilled = () =>
      queueMicrotask(() => onFulfilled?.(this.value as T))
    const runRejected = () =>
      queueMicrotask(() => onRejected?.(this.reason))

    if (this.state === 'fulfilled') runFulfilled()
    else if (this.state === 'rejected') runRejected()
    else {
      this.onFulfilledCbs.push(runFulfilled)
      this.onRejectedCbs.push(runRejected)
    }
  }
}

console.log('A')
new MyPromise<number>((r) => r(1)).then((v) => console.log('then', v))
console.log('B')
