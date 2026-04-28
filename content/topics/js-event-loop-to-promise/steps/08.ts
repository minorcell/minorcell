export {}
type State = 'pending' | 'fulfilled' | 'rejected'

class MyPromise<T = unknown> {
  private state: State = 'pending'
  private value: T | undefined
  private reason: unknown

  constructor(
    executor: (resolve: (v: T) => void, reject: (e: unknown) => void) => void,
  ) {
    const resolve = (v: T) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
    }
    const reject = (e: unknown) => {
      if (this.state !== 'pending') return
      this.state = 'rejected'
      this.reason = e
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled?: (v: T) => unknown, onRejected?: (e: unknown) => unknown) {
    if (this.state === 'fulfilled') onFulfilled?.(this.value as T)
    if (this.state === 'rejected') onRejected?.(this.reason)
  }
}

new MyPromise<number>((res) => res(1)).then((v) => console.log(v))
