const adapter = {
  deferred() {
    let resolve
    let reject
    const promise = new MyPromise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  },
  resolved(value) {
    return new MyPromise((resolve) => resolve(value))
  },
  rejected(reason) {
    return new MyPromise((_, reject) => reject(reason))
  },
}

export default adapter
