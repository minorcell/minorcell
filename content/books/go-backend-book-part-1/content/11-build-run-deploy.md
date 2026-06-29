---
title: '第 11 章：从本地程序到可运行服务'
volume: 1
chapter: 11
description: '讲解 go build、运行参数、环境变量、日志、优雅退出和部署前检查。'
---

> 本章问题：一个 Go 后端程序怎样从本地代码变成可以长期运行的服务？

---

## 构建二进制

Go 程序可以直接构建成二进制：

```bash
go build -o app .
```

运行：

```bash
./app
```

这一步很重要。开发时你常用 `go run .`，但部署时通常运行构建好的二进制文件。

你可以把构建命令写进脚本或 Makefile，但刚开始先记住 `go build -o app .` 就够了。

---

## 配置来自运行环境

一个服务在本地、测试环境、线上环境里的配置通常不同。不要把这些配置写死在代码里。

常见方式是环境变量：

```go
func getenv(key string, fallback string) string {
    value := os.Getenv(key)
    if value == "" {
        return fallback
    }
    return value
}

func main() {
    port := getenv("PORT", "8080")
    log.Printf("listening on :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}
```

运行：

```bash
PORT=9000 ./app
```

环境变量的好处是简单，适合容器和多数部署平台。复杂项目可以有配置文件、配置中心或密钥管理系统，但基本原则不变：代码和配置分离。

---

## 日志先做到能定位问题

入门阶段不需要一开始就接复杂日志系统，但日志至少要能回答：

- 服务什么时候启动？
- 监听在哪个端口？
- 关键请求失败了吗？
- 错误上下文是什么？

标准库 `log` 可以先用：

```go
log.Printf("create user failed: %v", err)
```

但不要把敏感信息直接打进日志，比如密码、token、身份证号、完整密钥。

日志不是越多越好。好的日志应该出现在边界和异常处：服务启动、配置加载失败、外部调用失败、请求处理失败、后台任务退出。

---

## 给 HTTP 服务设置超时

直接使用 `http.ListenAndServe` 很方便，但真实服务最好显式创建 `http.Server` 并设置超时：

```go
server := &http.Server{
    Addr:              ":" + port,
    Handler:           mux,
    ReadHeaderTimeout: 5 * time.Second,
}

log.Printf("listening on %s", server.Addr)
if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
    log.Fatal(err)
}
```

`ReadHeaderTimeout` 可以避免客户端迟迟不发送完整请求头，占住连接资源。

上册不展开所有服务端超时配置，但你应该建立意识：长期运行的服务不能完全依赖默认值。

---

## 处理退出信号

线上服务会遇到重启、发布、容器停止。程序收到退出信号时，最好给正在处理的请求一点时间结束。

简化写法：

```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

go func() {
    log.Printf("listening on %s", server.Addr)
    if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        log.Fatal(err)
    }
}()

<-ctx.Done()
log.Println("shutting down")

shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

if err := server.Shutdown(shutdownCtx); err != nil {
    log.Printf("shutdown server: %v", err)
}
```

这段代码的意思是：服务在后台运行，主 goroutine 等待退出信号；收到信号后，用最多 5 秒关闭 HTTP 服务。

这不是完整部署方案，但它让你的程序更像一个真正的服务，而不是只能在本地跑的 demo。

---

## 部署前检查

一个小 Go 服务准备部署前，可以先检查：

- `go test ./...` 是否通过
- `go build -o app .` 是否成功
- 启动时配置缺失会不会明确失败
- 端口是否来自环境变量
- 关键错误是否有日志
- HTTP 服务是否有健康检查接口
- 请求是否能超时或取消
- 是否避免把敏感配置打印到日志

这些检查不复杂，但能挡住很多低级故障。

---

## 本章小结

从本地程序到可运行服务，中间不只是 `go build`：

- 构建二进制
- 用环境变量管理运行差异
- 在关键边界记录日志
- 给 HTTP 服务设置基本超时
- 处理退出信号
- 部署前跑测试和构建

下一章是上册的收束。我们不再引入新语法，而是总结写 Go 后端时值得长期保留的习惯。
