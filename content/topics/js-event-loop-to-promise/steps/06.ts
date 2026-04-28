function getUser(id: string, cb: (err: Error | null, user?: any) => void) {
  setTimeout(() => cb(null, { id, name: 'mcell' }), 100)
}
function getOrders(userId: string, cb: (err: Error | null, list?: any[]) => void) {
  setTimeout(() => cb(null, [{ id: 'o1' }]), 100)
}
function getDetail(orderId: string, cb: (err: Error | null, detail?: any) => void) {
  setTimeout(() => cb(null, { id: orderId, total: 99 }), 100)
}

getUser('u1', (err, user) => {
  if (err) return console.error(err)
  getOrders(user!.id, (err, orders) => {
    if (err) return console.error(err)
    getDetail(orders![0].id, (err, detail) => {
      if (err) return console.error(err)
      console.log(detail)
    })
  })
})
