setTimeout(() => console.log('macro'), 0)

Promise.resolve().then(() => console.log('micro'))
