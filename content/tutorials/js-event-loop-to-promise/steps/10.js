class MyPromise {
  state = 'pending'
  value = undefined
  reason = undefined
  onFulfilledCbs = []
  onRejectedCbs = []

  constructor(executor) {
    const resolve = (v) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
      this.onFulfilledCbs.forEach((cb) => cb())
    }
    const reject = (e) => {
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

  then(onFulfilled, onRejected) {
    const runFulfilled = () =>
      queueMicrotask(() => onFulfilled?.(this.value))
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
new MyPromise((r) => r(1)).then((v) => console.log('then', v))
console.log('B')
