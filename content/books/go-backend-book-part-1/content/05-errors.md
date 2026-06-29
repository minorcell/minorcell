---
title: '第 5 章：Go 为什么这样处理错误'
volume: 1
chapter: 5
description: '用配置读取、参数校验和外部调用场景解释 error、错误包装和失败路径可见性。'
---

> 本章问题：`if err != nil` 看起来重复，为什么 Go 仍然坚持显式错误处理？

---

## 先看一个会失败的函数

读取文件可能失败：

```go
data, err := os.ReadFile("config.json")
if err != nil {
    return err
}
fmt.Println(string(data))
```

`os.ReadFile` 返回两个值：文件内容和错误。如果读取成功，`err` 是 `nil`；如果失败，`err` 里会包含失败原因。

这就是 Go 错误处理最常见的形状：

```go
value, err := DoSomething()
if err != nil {
    return err
}
```

很多新人会觉得这很重复。确实，它不短。但它有一个明显优点：失败路径就在眼前。

你不用跳到异常处理器里找错误会被谁接住，也不用猜一个函数可能抛出什么异常。调用一个可能失败的函数时，你要当场决定失败后怎么办。

---

## error 只是一个接口

Go 里的 `error` 是内置接口，形状可以理解为：

```go
type error interface {
    Error() string
}
```

任何实现了 `Error() string` 方法的类型，都可以当作错误。

最简单的错误可以这样创建：

```go
return errors.New("email is required")
```

也可以带上动态信息：

```go
return fmt.Errorf("invalid age: %d", age)
```

后端代码里，错误信息应该帮助定位问题。`failed` 这种信息太弱，`read config config.json: no such file or directory` 就有用得多。

---

## 参数校验：错误是业务边界的一部分

写一个创建用户的校验函数：

```go
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
    if req.Age < 0 {
        return fmt.Errorf("age must be positive: %d", req.Age)
    }
    return nil
}
```

使用：

```go
if err := ValidateCreateUser(req); err != nil {
    return err
}
```

这里的错误不是系统异常，而是业务边界的一部分。请求参数不可信，校验失败很正常。Go 让你把这种正常失败写成返回值，而不是把它藏进异常流。

---

## 包装错误：保留上下文

假设你写了一个读取配置的函数：

```go
func LoadConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }
    return data, nil
}
```

调用方收到错误时，可能只知道“没有这个文件”，但不知道是在读取哪个配置时失败。

更好的写法是包装错误：

```go
func LoadConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config %s: %w", path, err)
    }
    return data, nil
}
```

`%w` 会包装原始错误。这样错误信息会带上上下文，同时调用方仍然可以用 `errors.Is` 或 `errors.As` 检查底层错误。

例如：

```go
data, err := LoadConfig("config.json")
if err != nil {
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("config file does not exist")
    }
    return err
}
_ = data
```

包装错误的目标不是堆叠废话，而是在每一层补上那一层才知道的信息。

---

## 什么时候直接返回，什么时候处理

不是每个地方都应该把错误打印出来。

一个常见坏习惯是：

```go
data, err := os.ReadFile(path)
if err != nil {
    log.Println(err)
    return err
}
```

如果上层也打印这个错误，日志里就会出现重复信息。更好的做法通常是：底层函数补上下文并返回错误，入口层统一决定如何记录和响应。

例如在 HTTP handler 里：

```go
user, err := service.FindUser(r.Context(), id)
if err != nil {
    http.Error(w, "user not found", http.StatusNotFound)
    return
}
```

这里 handler 负责把内部错误翻译成 HTTP 响应。它不一定要把原始错误直接暴露给用户。

---

## panic 不是普通错误处理

Go 有 `panic`，但它不应该用来处理普通业务错误。

适合返回 `error` 的情况：

- 文件不存在
- 请求参数非法
- 数据库查询失败
- 外部接口超时
- 用户没有权限

可能适合 `panic` 的情况：

- 程序启动时关键配置完全不合法
- 代码进入了理论上不可能到达的状态
- 初始化阶段发现依赖无法满足，继续运行没有意义

在后端服务里，绝大多数失败都应该变成 `error`，由调用链决定如何处理。

---

## 本章小结

Go 的错误处理不追求隐藏失败，而是要求你正面处理失败。

你需要建立几个习惯：

- 调用可能失败的函数后，立即检查 `err`
- 错误信息要包含有用上下文
- 用 `%w` 包装底层错误
- 底层少打印日志，多返回错误
- 在边界层把错误翻译成用户能理解的响应
- 不要用 `panic` 处理普通业务失败

下一章，我们会把函数和类型放进包里，看看一个小 Go 项目应该如何组织。
