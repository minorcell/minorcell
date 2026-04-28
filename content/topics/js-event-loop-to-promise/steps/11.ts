export {}
type State = 'pending' | 'fulfilled' | 'rejected'

class MyPromise {
  state: State = 'pending'
  value: any
  reason: any
  private fcbs: Array<() => void> = []
  private rcbs: Array<() => void> = []

  constructor(
    executor: (resolve: (v: any) => void, reject: (e: any) => void) => void,
  ) {
    const resolve = (v: any) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = v
      this.fcbs.forEach((cb) => cb())
    }
    const reject = (e: any) => {
      if (this.state !== 'pending') return
      this.state = 'rejected'
      this.reason = e
      this.rcbs.forEach((cb) => cb())
    }
    try { executor(resolve, reject) } catch (e) { reject(e) }
  }

  then(onFulfilled?: any, onRejected?: any): MyPromise {
    const fulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : (v: any) => v
    const rejected =
      typeof onRejected === 'function'
        ? onRejected
        : (e: any) => { throw e }

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
  .then((v: number) => v + 1)
  .then((v: number) => v * 10)
  .then(undefined)
  .then((v: number) => console.log(v))
