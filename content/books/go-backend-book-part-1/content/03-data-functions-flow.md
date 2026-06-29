---
title: '第 3 章：用 Go 表达业务数据'
volume: 1
chapter: 3
description: '用后端请求参数、金额计算和状态判断讲解变量、类型、函数、切片、map 和控制流。'
---

> 本章问题：后端程序里常见的数据处理，如何用 Go 的基本语法表达？

---

## 从一个请求参数开始

假设我们要处理一个创建用户的请求。请求里有用户名、邮箱和年龄。先不用 HTTP，也不用 JSON，只看数据本身：

```go
package main

import "fmt"

func main() {
    name := "alice"
    email := "alice@example.com"
    age := 20

    fmt.Println(name, email, age)
}
```

`:=` 是 Go 里常用的短变量声明。它会根据右侧的值推断类型。上面的 `name` 和 `email` 是 `string`，`age` 是 `int`。

如果你想显式写出类型，也可以这样：

```go
var name string = "alice"
var age int = 20
```

日常代码里，局部变量常用 `:=`。当你需要强调类型，或者变量先声明后赋值时，再用 `var`。

---

## Go 的类型不会随便替你转换

Go 不会自动把整数变成字符串，也不会自动把 `int` 变成 `int64`。这有时麻烦，但能减少隐式错误。

例如：

```go
count := 3
message := "count: " + count
```

这段代码不能通过编译，因为 `string` 不能直接和 `int` 相加。你需要明确转换或格式化：

```go
message := fmt.Sprintf("count: %d", count)
```

后端代码里，这种明确性很重要。请求参数、数据库字段、金额、时间戳、状态码，都不应该在隐式转换里悄悄改变含义。

---

## 函数：把规则从流程里拿出来

现在写一个简单校验函数：

```go
func IsAdult(age int) bool {
    return age >= 18
}
```

调用它：

```go
if IsAdult(age) {
    fmt.Println("adult user")
} else {
    fmt.Println("minor user")
}
```

函数的价值不只是复用，还包括命名。`age >= 18` 是一个判断，`IsAdult(age)` 是一个业务含义。后端代码里，很多可维护性来自这种小命名。

再写一个带多个返回值的函数：

```go
func Discount(price int, vip bool) (int, bool) {
    if !vip {
        return price, false
    }
    return price * 80 / 100, true
}
```

Go 函数可以返回多个值。后面讲错误处理时，你会经常看到这种形式：

```go
value, err := DoSomething()
```

这不是语法炫技，而是 Go 用来显式表达“结果”和“失败原因”的基础方式。

---

## if 和 for：够用的控制流

Go 没有 `while`，主要用 `for`。

遍历一个切片：

```go
names := []string{"alice", "bob", "carol"}

for i, name := range names {
    fmt.Println(i, name)
}
```

只要值，不要索引：

```go
for _, name := range names {
    fmt.Println(name)
}
```

`_` 表示忽略这个值。Go 不允许声明了变量却不用，所以当你确实不需要索引时，要用 `_` 明确丢弃。

普通循环：

```go
for i := 0; i < 3; i++ {
    fmt.Println(i)
}
```

类似 `while` 的循环：

```go
for running {
    // ...
    if someValue > 10 {
        running = false
    }
}
```

无限循环：

```go
for {
    // ...
}
```

后端程序里，`for range` 最常见。你会用它遍历请求列表、数据库结果、配置项和任务队列。

---

## slice：后端里最常用的集合

Go 里的切片写作 `[]T`。例如 `[]string` 表示字符串切片。

```go
users := []string{"alice", "bob"}
users = append(users, "carol")
```

`append` 会返回新的切片，所以要把结果接住。

你可以写一个过滤函数：

```go
func ActiveUsers(users []string, disabled map[string]bool) []string {
    active := make([]string, 0, len(users))

    for _, user := range users {
        if disabled[user] {
            continue
        }
        active = append(active, user)
    }

    return active
}
```

这里出现了 `map[string]bool`。它表示 key 是 `string`、value 是 `bool` 的映射。用它判断一个用户是否被禁用：

```go
disabled := map[string]bool{
    "bob": true,
    "carol": true,
}
```

---

## map 查询要注意零值

查询 map：

```go
disabled := map[string]bool{
    "bob": true,
}

blocked := disabled["alice"]
fmt.Println(blocked)
```

如果 key 不存在，Go 会返回 value 类型的零值。`bool` 的零值是 `false`，`int` 的零值是 `0`，`string` 的零值是空字符串。

如果你需要区分“不存在”和“存在但值是零值”，要使用第二个返回值：

```go
blocked, ok := disabled["alice"]
if !ok {
    fmt.Println("user not found in disabled map")
}
fmt.Println(blocked)
```

后端代码里，这个细节很常见。比如库存数量为 `0` 和商品不存在，不一定是同一回事。

---

## 一个小练习：请求分页

写一个函数，根据 `page` 和 `pageSize` 计算偏移量：

```go
func Offset(page int, pageSize int) int {
    if page < 1 {
        page = 1
    }
    if pageSize <= 0 {
        pageSize = 20
    }
    return (page - 1) * pageSize
}
```

它很普通，但很后端。分页参数来自请求，不能完全信任。你需要给非法值一个默认处理。

后面写 HTTP 服务时，我们会再次遇到这种逻辑。

---

## 本章小结

这一章我们没有完整展开 Go 的所有语法，而是围绕后端数据处理走了一圈：

- 用 `:=` 和 `var` 声明变量
- 用函数命名业务规则
- 用多返回值表达多个结果
- 用 `if` 和 `for range` 控制流程
- 用 slice 表示列表
- 用 map 表示快速查询
- 注意 map 查询时的零值问题

下一章，我们把散落的数据组织成结构体，并用 method 和 interface 表达行为边界。
