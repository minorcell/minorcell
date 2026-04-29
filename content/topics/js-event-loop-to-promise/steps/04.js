console.log('A')

setTimeout(() => {
  console.log('B')
  Promise.resolve().then(() => console.log('C'))
}, 0)

Promise.resolve().then(() => {
  console.log('D')
  setTimeout(() => console.log('E'), 0)
})

queueMicrotask(() => console.log('F'))

console.log('G')
