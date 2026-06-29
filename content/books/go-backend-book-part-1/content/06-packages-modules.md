---
title: '第 6 章：包、模块和项目组织'
volume: 1
chapter: 6
description: '解释 go.mod、包名、导入路径、internal 目录和小项目的克制组织方式。'
---

> 本章问题：一个 Go 后端项目应该怎么放代码，才不会一开始就变复杂？

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
import "example.com/hello-go/internal/config"
```

刚开始不要把 `go.mod` 想得太复杂。它主要回答两个问题：这个项目叫什么，它依赖哪些模块。

---

## package 是代码组织单位

每个 Go 文件开头都有包声明：

```go
package main
```

同一个目录下的 Go 文件必须属于同一个包。目录通常就是包的物理边界。

比如：

```text
hello-go/
  go.mod
  main.go
  internal/
    config/
      config.go
```

`internal/config/config.go` 可以这样写：

```go
package config

type Config struct {
    Port string
}

func Load() Config {
    return Config{Port: "8080"}
}
```

在 `main.go` 里导入：

```go
package main

import (
    "fmt"

    "example.com/hello-go/internal/config"
)

func main() {
    cfg := config.Load()
    fmt.Println(cfg.Port)
}
```

包名通常使用短小的单词，比如 `config`、`user`、`server`。不要用 `utils` 作为默认垃圾桶。`utils` 这个名字往往说明你还没想清楚这些函数属于哪个概念。

---

## main 包应该薄一点

`package main` 是程序入口，但不应该承载太多业务逻辑。

比较好的习惯是让 `main` 做几件事：

- 读取配置
- 初始化依赖
- 注册 HTTP 路由
- 启动服务
- 处理退出

业务逻辑放到其他包里。

一个小项目可以这样组织：

```text
hello-go/
  go.mod
  main.go
  internal/
    config/
      config.go
    user/
      service.go
    server/
      server.go
```

这不是标准答案，只是一个起点。项目越小，越不需要复杂分层。先让代码清楚，再考虑架构漂亮。

---

## internal 的意义

Go 有一个特殊目录名：`internal`。

放在 `internal` 下面的包，只能被父目录及其子目录里的代码导入。模块外部不能直接导入它。

例如：

```text
example.com/hello-go/internal/config
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
    handler.go
    service.go
    model.go
  config/
    config.go
```

这样和用户相关的东西在一个地方。等项目变大，再根据实际复杂度拆分。

Go 社区没有唯一项目结构。不要为了“看起来专业”复制大型项目模板。对入门阶段来说，少目录、清边界，比套模板更重要。

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

Go 在这里比较“硬”。它不会让循环依赖悄悄存在。这有时烦，但能逼你保持结构清楚。

---

## 本章小结

Go 项目组织先记住几件事：

- module 是项目边界
- package 是代码组织单位
- 目录通常对应包
- `main` 包应该尽量薄
- `internal` 适合放应用内部实现
- 包名要表达职责，不要默认扔进 `utils`
- 不要过早复制复杂项目结构

下一章，我们开始做更具体的后端任务：读取文件、解析 JSON，并从环境变量里拿配置。
