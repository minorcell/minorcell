export {}
type State = 'pending' | 'fulfilled' | 'rejected'

class MyPromise<T = unknown> {
  private state: State = 'pending'
  private value: T | undefined
  private reason: unknown
  private onFulfilledCbs: Array<(v: T) => void> = []
  private onRejectedCbs: Array<(e: unknown) => void> = []

  constructor(
    executor: (resolve: (v: T) => void, reject: (e: unknown) => void) => void,
  ) {
    const resolve = (v: T) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
      this.onFulfilledCbs.forEach((cb) => cb(v))
    }
    const reject = (e: unknown) => {
      if (this.state !== 'pending') return
      this.state = 'rejected'
      this.reason = e
      this.onRejectedCbs.forEach((cb) => cb(e))
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled?: (v: T) => unknown, onRejected?: (e: unknown) => unknown) {
    if (this.state === 'fulfilled') onFulfilled?.(this.value as T)
    else if (this.state === 'rejected') onRejected?.(this.reason)
    else {
      if (onFulfilled) this.onFulfilledCbs.push(onFulfilled as (v: T) => void)
      if (onRejected) this.onRejectedCbs.push(onRejected as (e: unknown) => void)
    }
  }
}

new MyPromise<number>((res) => setTimeout(() => res(42), 50))
  .then((v) => console.log(v))
