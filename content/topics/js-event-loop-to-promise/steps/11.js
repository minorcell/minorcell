class MyPromise {
  state = 'pending'
  value = undefined
  reason = undefined
  fcbs = []
  rcbs = []

  constructor(executor) {
    const resolve = (v) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
      this.fcbs.forEach((cb) => cb())
    }
    const reject = (e) => {
      if (this.state !== 'pending') return
      this.state = 'rejected'
      this.reason = e
      this.rcbs.forEach((cb) => cb())
    }
    try { executor(resolve, reject) } catch (e) { reject(e) }
  }

  then(onFulfilled, onRejected) {
    const fulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : (v) => v
    const rejected =
      typeof onRejected === 'function'
        ? onRejected
        : (e) => { throw e }

    const promise2 = new MyPromise((resolve, reject) => {
      const runFulfilled = () =>
        queueMicrotask(() => {
          try { resolve(fulfilled(this.value)) } catch (e) { reject(e) }
        })
      const runRejected = () =>
        queueMicrotask(() => {
          try { resolve(rejected(this.reason)) } catch (e) { reject(e) }
        })

      if (this.state === 'fulfilled') runFulfilled()
      else if (this.state === 'rejected') runRejected()
      else {
        this.fcbs.push(runFulfilled)
        this.rcbs.push(runRejected)
      }
    })

    return promise2
  }
}

new MyPromise((r) => r(1))
  .then((v) => v + 1)
  .then((v) => v * 10)
  .then(undefined)
  .then((v) => console.log(v))
