---
title: '第 10 章：goroutine、channel 和 context'
volume: 1
chapter: 10
description: '用后端并行调用、超时取消和请求生命周期讲解 Go 的基础并发模型。'
---

> 本章问题：Go 的并发能力在后端服务里应该怎样使用，什么时候又不该使用？

---

## 一个需要同时做两件事的场景

上一章我们给 handler 写了测试，它们都能通过。但假设现在有一个用户详情页，需要同时返回用户信息和用户的订单列表。按顺序写：

```go
func userProfileHandler(w http.ResponseWriter, r *http.Request) {
    user := loadUser(1)       // 假设耗时 100ms
    orders := loadOrders(1)   // 假设耗时 150ms

    // 总耗时约 250ms
    writeJSON(w, http.StatusOK, map[string]any{
        "user":   user,
        "orders": orders,
    })
}
```

两个加载互不依赖，但总耗时是两者之和。如果能同时加载，总耗时取决于更慢的那个——150ms 而不是 250ms。

这就是并发在后端服务里最朴素的用途：同时做几件独立的事，减少总等待时间。

---

## goroutine：启动一个并发任务

在 Go 里，用 `go` 关键字启动 goroutine：

```go
go func() {
    orders := loadOrders(1)
    log.Printf("loaded %d orders", len(orders))
}()
```

goroutine 很轻，但不是免费。你可以轻松启动很多 goroutine，但仍然要关心它们什么时候结束、错误怎么处理、是否会泄漏。

新手常见误区是：看到可以 `go`，就到处 `go`。后端代码里，并发应该服务于明确目标，比如并行调用多个下游服务、后台处理耗时任务、控制请求超时，而不是为了显得高级。

---

## 等待多个任务完成

把 `loadOrders` 放进 goroutine 后，`main` 或 handler 不能直接往下走——它需要等加载完成。用 `sync.WaitGroup` 等待多个 goroutine：

```go
var wg sync.WaitGroup

var user User
var orders []Order

wg.Add(2)

go func() {
    defer wg.Done()
    user = loadUser(1)
}()

go func() {
    defer wg.Done()
    orders = loadOrders(1)
}()

wg.Wait()
// 到这里，user 和 orders 都已经加载完成
```

`wg.Add(2)` 表示有两个任务要等。每个 goroutine 结束时调用 `wg.Done()`。`wg.Wait()` 会阻塞直到所有任务完成。

注意这里把结果写入外层变量是安全的，因为每个 goroutine 写入不同的变量，不存在竞争。但如果多个 goroutine 写同一个变量，就需要 `sync.Mutex` 来保护。

`WaitGroup` 只负责等待，不负责收集结果，也不负责取消任务。如果任务会失败，你还需要设计错误传递方式。

---

## channel：在 goroutine 之间传值

除了写入外层变量，还可以用 channel 在 goroutine 之间传递数据：

```go
ch := make(chan string)

go func() {
    ch <- "done"
}()

msg := <-ch
fmt.Println(msg)
```

`ch <- "done"` 是发送，`<-ch` 是接收。

用 channel 重写前面的并行加载：

```go
type UserResult struct {
    User User
    Err  error
}

type OrdersResult struct {
    Orders []Order
    Err    error
}

userCh := make(chan UserResult, 1)
ordersCh := make(chan OrdersResult, 1)

go func() { userCh <- UserResult{User: loadUser(1)} }()
go func() { ordersCh <- OrdersResult{Orders: loadOrders(1)} }()

ur := <-userCh
or := <-ordersCh
```

这里 channel 有缓冲，大小是 1。goroutine 发送结果时，即使主 goroutine 还没开始接收，也不会立刻阻塞。

channel 的好处是结果和错误一起传递，数据流向很清楚。

---

## 不要把 channel 当成唯一工具

Go 有一句常被引用的话，大意是通过通信共享内存，而不是通过共享内存通信。这句话有启发性，但不代表所有并发问题都应该用 channel。

前面的例子就展示了：如果只需要等待任务完成，`WaitGroup` 比 channel 更直接。如果需要传递结果，channel 更合适。如果多个 goroutine 要修改同一个变量，`sync.Mutex` 更合适。

入门阶段先记住：

- goroutine 用来并发执行
- channel 用来传递结果或信号
- `WaitGroup` 用来等待多个任务结束
- `context` 用来传播取消和超时

不要为了使用 channel 而使用 channel。

---

## context：请求什么时候该停

并行加载确实变快了。但如果 `loadUser` 或 `loadOrders` 特别慢呢？用户不可能一直等下去。

后端服务里，`context.Context` 非常重要。一个 HTTP 请求进来时，`r.Context()` 代表这个请求的生命周期。如果客户端断开连接，或者服务端超时，请求的 context 会被取消。

业务函数应该接收 context：

```go
func loadUser(ctx context.Context, id int64) (User, error) {
    // 查询数据库或调用外部服务时，把 ctx 传下去
    return User{ID: id, Name: "alice"}, nil
}

func loadOrders(ctx context.Context, userID int64) ([]Order, error) {
    return []Order{}, nil
}
```

handler 调用：

```go
user, err := loadUser(r.Context(), 1)
```

这样做的意义是：当请求已经取消时，下游操作有机会停止，而不是继续浪费资源。

---

## 给操作加超时

你可以从一个 context 派生出带超时的 context：

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

user, err := loadUser(ctx, 1)
if err != nil {
    log.Println(err)
}
_ = user
```

`defer cancel()` 很重要。即使操作提前完成，也要释放和这个 context 相关的资源。

在 HTTP handler 里，通常从请求 context 派生。这样它既继承了请求取消，也增加了自己的超时限制。

---

## select：等待多个事件

回到并行加载的场景。现在每个加载都接受 context，我们需要等待结果或者超时——谁先到就响应谁：

```go
select {
case result := <-userCh:
    // 用户加载完成
case <-ctx.Done():
    // 超时或请求取消
    writeJSON(w, http.StatusGatewayTimeout, map[string]string{
        "error": "request timeout",
    })
    return
}
```

`select` 可以同时等待多个 channel。`ctx.Done()` 返回一个 channel，当 context 被取消或超时时，这个 channel 会被关闭。

一个更完整的例子：

```go
func SlowWork(ctx context.Context) error {
    done := make(chan struct{})

    go func() {
        time.Sleep(3 * time.Second)
        close(done)
    }()

    select {
    case <-done:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

如果 context 先超时，函数返回 `context.DeadlineExceeded`。如果任务先完成，函数正常返回 `nil`。

在后端服务里，`select` + `context` 是处理超时和取消的标准模式。大多数中间件、长轮询 handler 和外部调用超时控制都用到了这个组合。

---

## 本章小结

Go 的并发能力很强，但上册只需要建立基础判断：

- goroutine 能启动并发任务，但要知道它什么时候结束
- `WaitGroup` 适合等待多个任务
- channel 适合传递结果或信号
- 不要把 channel 当成所有问题的答案
- 后端函数应该接收 `context.Context`
- 超时和取消是请求生命周期的一部分
- `select` + `context` 是处理超时的标准模式

下一章，我们把程序从本地开发带到"可以运行"的状态：构建、配置、日志和退出。
