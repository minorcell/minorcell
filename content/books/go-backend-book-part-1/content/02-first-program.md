---
title: '第 2 章：跑起来：环境、模块和第一个程序'
volume: 1
chapter: 2
description: '完成 Go 后端学习的第一个闭环：安装、创建模块、运行程序、测试和构建。'
---

> 本章问题：一个 Go 项目从空目录到可运行二进制，中间最少需要哪些步骤？

---

## 从一个空目录开始

先创建一个目录：

```bash
mkdir hello-go
cd hello-go
```

然后初始化模块：

```bash
go mod init example.com/hello-go
```

这条命令会生成一个 `go.mod` 文件。它描述当前项目的模块路径和 Go 版本信息。你可以暂时把模块路径理解成“这个项目在 Go 世界里的名字”。

刚开始学习时，`example.com/hello-go` 这样的名字就够了。真实项目里，它通常会是代码仓库地址，例如 `github.com/yourname/project`。

---

## 写第一个 main.go

创建 `main.go`：

```go
package main

import "fmt"

func main() {
    fmt.Println("hello, go backend")
}
```

运行它：

```bash
go run .
```

你应该看到：

```text
hello, go backend
```

这段代码里有三个关键点。

第一，`package main` 表示这是一个可执行程序。Go 代码总是属于某个包。名为 `main` 的包比较特殊，它可以被构建成可运行的程序。

第二，`import "fmt"` 引入标准库里的 `fmt` 包。`fmt.Println` 用来打印文本。

第三，`func main()` 是程序入口。运行这个程序时，Go 会从 `main` 函数开始执行。

---

## go run、go build 和 go test

学习 Go 时，先记住三个命令：

```bash
go run .
go build .
go test ./...
```

`go run .` 会编译并运行当前目录下的程序。它适合开发时快速验证。

`go build .` 会构建当前目录。如果是 `package main`，它会生成一个二进制文件。二进制文件的名字通常来自当前目录。

`go test ./...` 会运行当前模块下所有包的测试。`./...` 的意思是当前目录和所有子目录。

你现在还没有测试文件，运行 `go test ./...` 可能会看到类似输出：

```text
?    example.com/hello-go    [no test files]
```

这不是错误，只是说明还没有测试。

---

## 写一个可以测试的函数

把 `main.go` 改成这样：

```go
package main

import "fmt"

func Greeting(name string) string {
    return "hello, " + name
}

func main() {
    fmt.Println(Greeting("go backend"))
}
```

现在我们把拼接问候语的逻辑放进了 `Greeting` 函数。这个函数接收一个 `string`，返回一个 `string`。

接着创建 `main_test.go`：

```go
package main

import "testing"

func TestGreeting(t *testing.T) {
    got := Greeting("mcell")
    want := "hello, mcell"

    if got != want {
        t.Fatalf("Greeting() = %q, want %q", got, want)
    }
}
```

运行：

```bash
go test ./...
```

如果测试通过，你会看到类似：

```text
ok    example.com/hello-go    0.2s
```

这是一个很小的闭环：写函数，运行程序，写测试，构建项目。

---

## Go 的格式化不是建议，是习惯

Go 有一个很重要的工具：

```bash
gofmt -w .
```

它会格式化当前目录下的 Go 文件。Go 社区非常强调统一格式，因为统一格式能减少大量无意义争论。

很多编辑器会在保存时自动运行 `gofmt`。如果你看到别人的 Go 代码缩进和空格几乎都长得一样，这不是巧合，而是工具链的一部分。

对新人来说，这是好事。你不用花太多时间纠结代码风格，先把精力放在命名、边界和错误处理上。

---

## 一个小小的后端味道

把程序改成读取环境变量：

```go
package main

import (
    "fmt"
    "os"
)

func Greeting(name string) string {
    if name == "" {
        name = "guest"
    }
    return "hello, " + name
}

func main() {
    name := os.Getenv("APP_USER")
    fmt.Println(Greeting(name))
}
```

运行：

```bash
APP_USER=mcell go run .
```

输出：

```text
hello, mcell
```

这已经有一点后端程序的味道了：程序不把所有信息写死在代码里，而是从运行环境读取配置。

---

## 本章小结

这一章我们完成了一个最小 Go 项目：

- 用 `go mod init` 创建模块
- 写 `package main`
- 用 `go run .` 运行程序
- 用 `go test ./...` 运行测试
- 用 `go build .` 构建程序
- 用 `gofmt` 保持统一格式

下一章，我们开始补上 Go 的基本语法。但我们不会按语法表背概念，而是从后端程序最常见的数据处理开始。
