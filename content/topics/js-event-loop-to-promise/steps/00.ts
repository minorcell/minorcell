console.log('start')

const start = Date.now()
while (Date.now() - start < 3000) {}

console.log('end after blocking')
