---
title: '第 11 章：从本地程序到可运行服务'
volume: 1
chapter: 11
description: '讲解 go build、交叉编译、运行配置、日志、HTTP 超时、优雅退出和部署前准备。'
---

> 本章问题：一个 Go 后端程序怎样从本地代码变成可以长期运行的服务？

---

## 构建二进制

前面几章我们一直用 `go run .` 开发。这对本地调试很方便，但部署时通常运行构建好的二进制文件：

```bash
go build -o app .
```

运行：

```bash
./app
```

后端服务经常在一个操作系统上开发，在另一个操作系统上运行。比如你在 Mac 上写代码，服务跑在 Linux 服务器上。Go 支持交叉编译：

```bash
GOOS=linux GOARCH=amd64 go build -o app .
```

这条命令会在 Mac 上直接生成 Linux 可执行的二进制。不需要在目标机器上安装 Go，也不需要安装任何运行时依赖。这是 Go 后端的一个实际优势。

你可以把构建命令写进脚本或 Makefile，但刚开始先记住 `go build -o app .` 就够了。

---

## 配置来自运行环境

第七章我们写了一个配置加载器，支持 JSON 文件、默认值和环境变量。部署时这套机制直接就能用：

```go
func main() {
    cfg, err := config.Load("config.json")
    if err != nil {
        log.Fatal(err)
    }

    log.Printf("starting %s on :%s", cfg.AppName, cfg.Port)
}
```

同一份代码在不同环境跑，只需要换配置文件或环境变量：

```bash
# 本地
./app

# 线上，用环境变量覆盖端口
PORT=9000 APP_NAME=hello-go-prod ./app
```

环境变量的好处是简单，适合容器和多数部署平台。复杂项目可以有配置文件、配置中心或密钥管理系统，但基本原则不变：代码和配置分离。

---

## 日志先做到能定位问题

入门阶段不需要一开始就接复杂日志系统，但日志至少要能回答：服务什么时候启动？监听在哪个端口？关键请求失败了吗？错误上下文是什么？

看一个对比。差的日志：

```go
log.Println("error")
```

好的日志：

```go
log.Printf("create user name=%s failed: %v", req.Name, err)
```

差的日志让你知道"出了事"，但你不知道什么事、跟谁有关。好的日志让你不用调试就能定位问题。

标准库 `log` 可以先用：

```go
log.Printf("create user id=%d failed: %v", id, err)
```

但不要把敏感信息直接打进日志，比如密码、token、身份证号、完整密钥。

日志不是越多越好。好的日志应该出现在边界和异常处：服务启动、配置加载失败、外部调用失败、请求处理失败、后台任务退出。正常请求不需要每条都打印。

---

## 给 HTTP 服务设置超时

第八章我们用了 `http.ListenAndServe`。它很方便，但真实服务最好显式创建 `http.Server` 并设置超时：

```go
server := &http.Server{
    Addr:              ":" + cfg.Port,
    Handler:           mux,
    ReadHeaderTimeout: 5 * time.Second,
}

log.Printf("listening on %s", server.Addr)
if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
    log.Fatal(err)
}
```

`ReadHeaderTimeout` 可以避免客户端迟迟不发送完整请求头，占住连接资源。

上册不展开所有服务端超时配置（还有 `ReadTimeout`、`WriteTimeout`、`IdleTimeout`），但你应该建立意识：长期运行的服务不能完全依赖默认值。

---

## 处理退出信号

线上服务会遇到重启、发布、容器停止。程序收到退出信号时，最好给正在处理的请求一点时间结束，而不是直接杀掉进程。

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

这段代码的意思是：服务在后台运行，主 goroutine 等待退出信号；收到信号后，调用 `server.Shutdown` 用最多 5 秒关闭 HTTP 服务。

`Shutdown` 会停止接收新请求，同时等待正在处理的请求完成。这就是为什么第十章的 context 很重要——如果 handler 里的操作监听了 context 取消，它能在超时到来前主动停止，释放资源。

这不是完整部署方案，但它让你的程序更像一个真正的服务，而不是只能在本地跑的 demo。

---

## 关于容器

实际部署时，你的 Go 二进制通常会被放进一个容器镜像（比如 Docker）。容器做的事情很简单：打包你的二进制和运行环境，让它在任何机器上以相同方式启动。

对 Go 来说这特别自然，因为 `go build` 生成的是一个静态二进制——不依赖外部库，不需要安装运行时。容器的 Dockerfile 可以非常简单：把二进制复制进去，执行它。

上册不展开容器和编排，但你只需要记住一件事：构建和服务化这两步，我们已经都走过了。

---

## 部署前检查

一个小 Go 服务准备部署前，可以先检查：

- `go test ./...` 是否通过
- `go build -o app .` 是否成功
- 启动时配置缺失会不会明确失败
- 端口是否来自环境变量或配置文件
- 关键错误是否有日志，日志是否包含上下文
- HTTP 服务是否有健康检查接口
- 请求是否能超时或取消
- 是否避免把敏感配置打印到日志
- 程序收到退出信号时是否能优雅关闭

这些检查不复杂，但能挡住很多低级故障。

---

## 本章小结

从本地程序到可运行服务，中间不只是 `go build`：

- 构建二进制，支持交叉编译
- 用环境变量和配置文件管理运行差异
- 在关键边界记录有意义的日志
- 给 HTTP 服务设置基本超时
- 处理退出信号，等待请求完成
- 部署前跑测试和构建

下一章是上册的收束。我们不再引入新语法，而是总结写 Go 后端时值得长期保留的习惯，并看看接下来可以往哪走。
