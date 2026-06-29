---
title: '第 10 章：goroutine、channel 和 context'
volume: 1
chapter: 10
description: '用后端并行调用、超时取消和请求生命周期讲解 Go 的基础并发模型。'
---

> 本章问题：Go 的并发能力在后端服务里应该怎样使用，什么时候又不该使用？

---

## goroutine：启动一个并发任务

在 Go 里，用 `go` 关键字启动 goroutine：

```go
go func() {
    log.Println("run in background")
}()
```

goroutine 很轻，但不是免费。你可以轻松启动很多 goroutine，但仍然要关心它们什么时候结束、错误怎么处理、是否会泄漏。

新手常见误区是：看到可以 `go`，就到处 `go`。后端代码里，并发应该服务于明确目标，比如并行调用多个下游服务、后台处理耗时任务、控制请求超时，而不是为了显得高级。

---

## 等待多个任务完成

用 `sync.WaitGroup` 等待多个 goroutine：

```go
var wg sync.WaitGroup

for _, id := range []int64{1, 2, 3} {
    wg.Add(1)

    go func(id int64) {
        defer wg.Done()
        log.Printf("load user %d", id)
    }(id)
}

wg.Wait()
```

注意这里把 `id` 作为参数传进匿名函数。这样每个 goroutine 拿到的是本次循环的值，避免闭包变量带来的混乱。

`WaitGroup` 只负责等待，不负责收集结果，也不负责取消任务。如果任务会失败，你还需要设计错误传递方式。

---

## channel：在 goroutine 之间传值

channel 可以让 goroutine 之间传递数据：

```go
ch := make(chan string)

go func() {
    ch <- "done"
}()

msg := <-ch
fmt.Println(msg)
```

`ch <- "done"` 是发送，`<-ch` 是接收。

一个小例子：并发加载两个信息，然后收集结果。

```go
type Result struct {
    Name string
    Err  error
}

func load(name string) Result {
    return Result{Name: name}
}

func main() {
    ch := make(chan Result, 2)

    go func() { ch <- load("profile") }()
    go func() { ch <- load("orders") }()

    for i := 0; i < 2; i++ {
        result := <-ch
        if result.Err != nil {
            log.Println(result.Err)
            continue
        }
        log.Println(result.Name)
    }
}
```

这里 channel 有缓冲，大小是 2。两个 goroutine 发送结果时，即使主 goroutine 还没开始接收，也不会立刻阻塞。

---

## 不要把 channel 当成唯一工具

Go 有一句常被引用的话，大意是通过通信共享内存，而不是通过共享内存通信。这句话有启发性，但不代表所有并发问题都应该用 channel。

有些情况用 `sync.Mutex` 更直接，有些情况用 `WaitGroup` 更清楚，有些情况根本不需要并发。

入门阶段先记住：

- goroutine 用来并发执行
- channel 用来传递结果或信号
- `WaitGroup` 用来等待多个任务结束
- `context` 用来传播取消和超时

不要为了使用 channel 而使用 channel。

---

## context：请求什么时候该停

后端服务里，`context.Context` 非常重要。

一个 HTTP 请求进来时，`r.Context()` 代表这个请求的生命周期。如果客户端断开连接，或者服务端超时，请求的 context 会被取消。

业务函数应该接收 context：

```go
func FindUser(ctx context.Context, id int64) (User, error) {
    // 查询数据库或调用外部服务时，把 ctx 传下去
    return User{ID: id, Name: "alice"}, nil
}
```

handler 调用：

```go
user, err := FindUser(r.Context(), id)
```

这样做的意义是：当请求已经取消时，下游操作有机会停止，而不是继续浪费资源。

---

## 给操作加超时

你可以从一个 context 派生出带超时的 context：

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

user, err := FindUser(ctx, 1)
if err != nil {
    log.Println(err)
}
_ = user
```

`defer cancel()` 很重要。即使操作提前完成，也要释放和这个 context 相关的资源。

在 HTTP handler 里，通常从请求 context 派生：

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

user, err := service.FindUser(ctx, id)
```

这样它既继承了请求取消，也增加了自己的超时限制。

---

## select：等待多个事件

`select` 可以同时等待多个 channel：

```go
select {
case result := <-resultCh:
    fmt.Println(result)
case <-ctx.Done():
    return ctx.Err()
}
```

这在并发任务和超时控制里很常见。`ctx.Done()` 返回一个 channel，当 context 被取消时，这个 channel 会被关闭。

一个简化例子：

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

如果 context 先超时，函数返回 `context deadline exceeded`。

---

## 本章小结

Go 的并发能力很强，但上册只需要建立基础判断：

- goroutine 能启动并发任务，但要知道它什么时候结束
- `WaitGroup` 适合等待多个任务
- channel 适合传递结果或信号
- 不要把 channel 当成所有问题的答案
- 后端函数应该接收 `context.Context`
- 超时和取消是请求生命周期的一部分

下一章，我们把程序从本地开发带到“可以运行”的状态：构建、配置、日志和退出。
