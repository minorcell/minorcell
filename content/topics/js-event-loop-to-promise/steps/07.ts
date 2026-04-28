const p = new Promise<number>((resolve, reject) => {
  resolve(1)
  resolve(2)
  reject(new Error('x'))
})

p.then((v) => console.log(v))
