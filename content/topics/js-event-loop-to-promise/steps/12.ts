export {}
function resolvePromise(
  promise2: any,
  x: any,
  resolve: (v: any) => void,
  reject: (e: any) => void,
) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'))
  }

  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false
    try {
      const then = x.then
      if (typeof then === 'function') {
        then.call(
          x,
          (y: any) => {
            if (called) return
            called = true
            resolvePromise(promise2, y, resolve, reject)
          },
          (e: any) => {
            if (called) return
            called = true
            reject(e)
          },
        )
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
    return
  }

  resolve(x)
}
