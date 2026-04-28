export {}
declare class MyPromise {
  constructor(executor: (resolve: (v: any) => void, reject: (e: any) => void) => void)
}

const adapter = {
  deferred() {
    let resolve: any, reject: any
    const promise = new MyPromise((res: any, rej: any) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  },
  resolved(value: any) {
    return new MyPromise((resolve: any) => resolve(value))
  },
  rejected(reason: any) {
    return new MyPromise((_: any, reject: any) => reject(reason))
  },
}

export default adapter
