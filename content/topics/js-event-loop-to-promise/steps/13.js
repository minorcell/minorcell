MyPromise.all = (xs) => new MyPromise((resolve, reject) => {
  const out = []
  let done = 0
  if (xs.length === 0) return resolve(out)
  xs.forEach((p, i) => {
    p.then(
      (v) => {
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
  const out = []
  let done = 0
  if (xs.length === 0) return resolve(out)
  xs.forEach((p, i) => {
    p.then(
      (v) => {
        out[i] = { status: 'fulfilled', value: v }
        if (++done === xs.length) resolve(out)
      },
      (e) => {
        out[i] = { status: 'rejected', reason: e }
        if (++done === xs.length) resolve(out)
      },
    )
  })
})

MyPromise.any = (xs) => new MyPromise((resolve, reject) => {
  const errs = []
  let failed = 0
  if (xs.length === 0) {
    return reject(new AggregateError([], 'All promises were rejected'))
  }
  xs.forEach((p, i) => {
    p.then(resolve, (e) => {
      errs[i] = e
      if (++failed === xs.length) {
        reject(new AggregateError(errs, 'All promises were rejected'))
      }
    })
  })
})
