export {}
declare class MyPromise {
  constructor(executor: (resolve: (v: any) => void, reject: (e: any) => void) => void)
  then(onFulfilled?: any, onRejected?: any): MyPromise
  static all: (xs: MyPromise[]) => MyPromise
  static race: (xs: MyPromise[]) => MyPromise
  static allSettled: (xs: MyPromise[]) => MyPromise
  static any: (xs: MyPromise[]) => MyPromise
}

MyPromise.all = (xs) => new MyPromise((resolve, reject) => {
  const out: any[] = []
  let done = 0
  if (xs.length === 0) return resolve(out)
  xs.forEach((p, i) => {
    p.then(
      (v: any) => {
        out[i] = v
        if (++done === xs.length) resolve(out)
      },
      reject,
    )
  })
})

MyPromise.race = (xs) => new MyPromise((resolve, reject) => {
  xs.forEach((p) => p.then(resolve, reject))
})

MyPromise.allSettled = (xs) => new MyPromise((resolve) => {
  const out: any[] = []
  let done = 0
  if (xs.length === 0) return resolve(out)
  xs.forEach((p, i) => {
    p.then(
      (v: any) => {
        out[i] = { status: 'fulfilled', value: v }
        if (++done === xs.length) resolve(out)
      },
      (e: any) => {
        out[i] = { status: 'rejected', reason: e }
        if (++done === xs.length) resolve(out)
      },
    )
  })
})

MyPromise.any = (xs) => new MyPromise((resolve, reject) => {
  const errs: any[] = []
  let failed = 0
  if (xs.length === 0) {
    return reject(new AggregateError([], 'All promises were rejected'))
  }
  xs.forEach((p, i) => {
    p.then(resolve, (e: any) => {
      errs[i] = e
      if (++failed === xs.length) {
        reject(new AggregateError(errs, 'All promises were rejected'))
      }
    })
  })
})
