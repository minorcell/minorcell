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
      this.onFulfilledCbs.forEach((cb) => cb(v))
    }
    const reject = (e) => {
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

  then(onFulfilled, onRejected) {
    if (this.state === 'fulfilled') onFulfilled?.(this.value)
    else if (this.state === 'rejected') onRejected?.(this.reason)
    else {
      if (onFulfilled) this.onFulfilledCbs.push(onFulfilled)
      if (onRejected) this.onRejectedCbs.push(onRejected)
    }
  }
}

new MyPromise((res) => setTimeout(() => res(42), 50))
  .then((v) => console.log(v))
