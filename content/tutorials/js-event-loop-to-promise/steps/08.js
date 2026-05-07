class MyPromise {
  state = 'pending'
  value = undefined
  reason = undefined

  constructor(executor) {
    const resolve = (v) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
    }
    const reject = (e) => {
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

  then(onFulfilled, onRejected) {
    if (this.state === 'fulfilled') onFulfilled?.(this.value)
    if (this.state === 'rejected') onRejected?.(this.reason)
  }
}

new MyPromise((res) => res(1)).then((v) => console.log(v))
