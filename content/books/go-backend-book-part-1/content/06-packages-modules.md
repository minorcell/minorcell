---
title: '第 6 章：包、模块和项目组织'
volume: 1
chapter: 6
description: '解释 go.mod、包名、导入路径、internal 目录和小项目的克制组织方式。'
---

> 本章问题：一个 Go 后端项目应该怎么放代码，才不会一开始就变复杂？

---

## 当一个文件开始变乱

到这里，我们已经写了不少东西：`User` 结构体和方法、`EmailSender` 接口和实现、`WelcomeUser`、`CreateUserRequest` 和校验函数。如果把它们都放在 `main.go` 里，大概长这样：

```go
package main

import (
    "errors"
    "fmt"
)

type User struct {
    ID    int64
    Name  string
    Email string
    Age   int
}

func (u User) DisplayName() string {
    if u.Name == "" {
        return "anonymous"
    }
    return u.Name
}

type EmailSender interface {
    Send(to string, subject string, body string) error
}

type ConsoleEmailSender struct{}

func (ConsoleEmailSender) Send(to string, subject string, body string) error {
    fmt.Printf("send email to %s: %s\n", to, subject)
    return nil
}

type CreateUserRequest struct {
    Name  string
    Email string
    Age   int
}

func ValidateCreateUser(req CreateUserRequest) error {
    if req.Name == "" {
        return errors.New("name is required")
    }
    if req.Email == "" {
        return errors.New("email is required")
    }
    return nil
}

func WelcomeUser(sender EmailSender, user User) error {
    if err := sender.Send(user.Email, "Welcome", "Hello "+user.DisplayName()); err != nil {
        return fmt.Errorf("welcome user %s: %w", user.Name, err)
    }
    return nil
}

func main() {
    sender := ConsoleEmailSender{}
    user := User{Name: "alice", Email: "alice@example.com"}
    if err := WelcomeUser(sender, user); err != nil {
        fmt.Println(err)
    }
}
```

这个文件还能读。但如果你继续加 HTTP handler、配置读取、更多业务逻辑，它很快就会变成谁都怕碰的"上帝文件"。

问题不是代码写错了，而是所有东西挤在同一个地方。我们需要一种方式把代码分到不同的职责区域里。

---

## module 是项目边界

第二章里我们运行过：

```bash
go mod init example.com/hello-go
```

它生成的 `go.mod` 大概长这样：

```go
module example.com/hello-go

go 1.23
```

`module` 定义模块路径。一个模块通常对应一个代码仓库，也就是一个项目边界。

当你在项目里导入自己的包时，会从这个模块路径开始：

```go
import "example.com/hello-go/internal/user"
```

刚开始不要把 `go.mod` 想得太复杂。它主要回答两个问题：这个项目叫什么，它依赖哪些模块。

---

## package 是代码组织单位

每个 Go 文件开头都有包声明：

```go
package main
```

同一个目录下的 Go 文件必须属于同一个包。目录通常就是包的物理边界。

我们可以把前面那堆代码拆开。比如把用户相关的类型和方法放到 `user` 包里：

```text
hello-go/
  go.mod
  main.go
  internal/
    user/
      user.go
      email.go
```

`internal/user/user.go`：

```go
package user

type User struct {
    ID    int64
    Name  string
    Email string
    Age   int
}

func (u User) DisplayName() string {
    if u.Name == "" {
        return "anonymous"
    }
    return u.Name
}

type CreateUserRequest struct {
    Name  string
    Email string
}
```

`internal/user/email.go`：

```go
package user

import "fmt"

type EmailSender interface {
    Send(to string, subject string, body string) error
}

type ConsoleEmailSender struct{}

func (ConsoleEmailSender) Send(to string, subject string, body string) error {
    fmt.Printf("send email to %s: %s\n", to, subject)
    return nil
}

func WelcomeUser(sender EmailSender, u User) error {
    if err := sender.Send(u.Email, "Welcome", "Hello "+u.DisplayName()); err != nil {
        return fmt.Errorf("welcome user %s: %w", u.Name, err)
    }
    return nil
}
```

在 `main.go` 里导入：

```go
package main

import (
    "fmt"

    "example.com/hello-go/internal/user"
)

func main() {
    sender := user.ConsoleEmailSender{}
    u := user.User{Name: "alice", Email: "alice@example.com"}
    if err := user.WelcomeUser(sender, u); err != nil {
        fmt.Println(err)
    }
}
```

代码没变少，但职责清楚了：`main` 负责启动，`user` 包负责用户相关的类型和行为。

包名通常使用短小的单词，比如 `user`、`config`、`server`。不要用 `utils` 作为默认垃圾桶。`utils` 这个名字往往说明你还没想清楚这些函数属于哪个概念。

---

## main 包应该薄一点

`package main` 是程序入口，但不应该承载太多业务逻辑。

比较好的习惯是让 `main` 做几件事：

- 读取配置
- 初始化依赖
- 注册 HTTP 路由
- 启动服务
- 处理退出

业务逻辑放到其他包里。这样你可以单独测试一个校验函数，而不需要启动整个程序。

---

## internal 的意义

Go 有一个特殊目录名：`internal`。

放在 `internal` 下面的包，只能被父目录及其子目录里的代码导入。模块外部不能直接导入它。

例如：

```text
example.com/hello-go/internal/user
```

这个包适合放项目内部实现。它告诉别人：这些代码不是公共 API，不承诺给外部项目使用。

对后端应用来说，大多数包都可以放在 `internal` 下。除非你真的在写一个给别人复用的库，否则不要急着设计公共 API。

---

## 包的名字应该表达职责

不要按技术层随便命名：

```text
handlers/
services/
models/
utils/
```

这种分法在很多项目里能工作，但新人很容易把所有业务都切成横向薄片，结果一次改动要跨很多目录。

小项目可以先按业务概念组织：

```text
internal/
  user/
    user.go
    email.go
  config/
    config.go
```

这样和用户相关的东西在一个地方。等项目变大，再根据实际复杂度拆分。

Go 社区没有唯一项目结构。不要为了"看起来专业"复制大型项目模板。对入门阶段来说，少目录、清边界，比套模板更重要。

---

## 循环依赖是设计提醒

Go 不允许包之间循环导入。

例如：

```text
user -> order -> user
```

这会编译失败。

循环依赖经常说明两个包边界切得不好。解决方式通常不是找技巧绕过，而是重新思考职责：

- 是不是有一个共享类型应该放到更底层的包？
- 是不是某个包知道得太多？
- 是不是接口应该由调用方定义？
- 是不是拆包太早了？

Go 在这里比较"硬"。它不会让循环依赖悄悄存在。这有时烦，但能逼你保持结构清楚。

---

## 本章小结

Go 项目组织先记住几件事：

- module 是项目边界
- package 是代码组织单位，目录通常对应包
- 当一个文件开始变乱，按职责拆包
- `main` 包应该尽量薄
- `internal` 适合放应用内部实现
- 包名要表达职责，不要默认扔进 `utils`
- 不要过早复制复杂项目结构

下一章，我们给 `config` 包写一个真正的配置加载器：读取文件、解析 JSON，并从环境变量拿配置。
