---
title: '第 4 章：struct、method 和 interface'
volume: 1
chapter: 4
description: '用用户资料、订单金额和通知发送示例讲清 Go 如何组织数据和行为。'
---

> 本章问题：Go 没有传统类继承，那它怎样组织后端代码里的数据和行为？

---

## struct：给业务数据一个形状

上一章我们用几个变量表示用户：

```go
name := "alice"
email := "alice@example.com"
age := 20
```

变量一多，代码很快变散。后端程序里，我们更常把一组相关字段组织成结构体：

```go
type User struct {
    ID    int64
    Name  string
    Email string
    Age   int
}
```

创建一个用户：

```go
user := User{
    ID:    1,
    Name:  "alice",
    Email: "alice@example.com",
    Age:   20,
}
```

结构体让数据有了形状。这个形状不只是给编译器看的，也是给读代码的人看的。你看到 `User`，就知道这里处理的是用户，而不是几个毫无关系的字符串和数字。

---

## 字段名大小写决定可见性

Go 用首字母大小写控制包外可见性。

```go
type User struct {
    ID    int64
    Name  string
    email string
}
```

`ID` 和 `Name` 首字母大写，包外可以访问。`email` 首字母小写，只能在当前包内访问。

这个规则适用于变量、函数、类型、字段和方法。Go 没有 `public`、`private` 关键字，而是把可见性放进命名规则里。

这对后端项目很重要。包边界不是靠目录名自动形成的，而是靠你暴露哪些名字来形成的。

---

## method：把行为放到数据旁边

前面我们已经定义过 `User`。现在把 `User` 类型、方法和调用放到同一个小程序里：

```go
package main

import "fmt"

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

func main() {
    alice := User{
        ID:    1,
        Name:  "alice",
        Email: "alice@example.com",
        Age:   20,
    }

    fmt.Println(alice.DisplayName())
}
```

运行后会输出：

```text
alice
```

`func (u User) DisplayName()` 里的 `(u User)` 叫接收者。它表示 `DisplayName` 是定义在 `User` 上的方法。

`alice.DisplayName()` 的意思是：对这个 `User` 值调用它的 `DisplayName` 方法。方法内部的 `u` 就是当前这个用户的副本，所以可以读取 `u.Name`。

Go 的方法不是类里的成员函数，但使用体验很像：你可以把和某个类型高度相关的行为放在它旁边。这里的规则是：显示名称应该由用户自己的字段决定，所以它适合放在 `User` 类型旁边。

---

## 值接收者和指针接收者

上一节的 `DisplayName` 使用的是值接收者：

```go
func (u User) IsAdult() bool {
    return u.Age >= 18
}
```

`func (u User)` 的意思是：调用方法时，Go 会把当前的 `User` 值复制一份给方法里的 `u`。所以这种接收者适合读取数据。

如果你试图在值接收者里修改字段，改到的只是副本：

```go
func (u User) RenameWrong(name string) {
    u.Name = name
}

func main() {
    alice := User{Name: "alice"}

    alice.RenameWrong("alice chen")

    fmt.Println(alice.Name)
}
```

输出仍然是：

```text
alice
```

`RenameWrong` 里的 `u.Name = name` 确实执行了，但它改的是方法里的那份副本，不是 `main` 里的 `alice`。

如果方法要修改原来的结构体，就要使用指针接收者：

```go
func (u *User) Rename(name string) {
    u.Name = name
}
```

这里的 `*User` 可以先理解成“指向某个 `User` 的位置”。方法拿到的不是 `User` 的副本，而是原来那个 `User` 的位置，所以它能修改原值。

调用时还是这样写：

```go
func main() {
    alice := User{Name: "alice"}

    alice.Rename("alice chen")

    fmt.Println(alice.Name)
}
```

这一次输出会变成：

```text
alice chen
```

虽然看起来还是 `alice.Rename(...)`，但方法接收的是 `*User`。当 `alice` 是一个可以取地址的变量时，Go 会自动帮你把它当成 `(&alice).Rename(...)` 来调用。

一个简单判断是：如果方法需要修改接收者，或者结构体比较大，使用指针接收者；如果只是读取一个小结构体，值接收者也可以。

真实项目里，同一个类型的方法最好保持一致。不要一半值接收者、一半指针接收者，除非你清楚知道为什么。

---

## JSON 标签：让 Go 字段名和接口字段名分开

后端服务经常要把结构体编码成 JSON，作为 HTTP 响应返回给前端或其他服务。

先看一个没有 JSON 标签的例子：

```go
type User struct {
    ID    int64
    Name  string
    Email string
}

data, err := json.Marshal(User{
    ID:    1,
    Name:  "alice",
    Email: "alice@example.com",
})
if err != nil {
    panic(err)
}

fmt.Println(string(data))
```

输出是：

```text
{"ID":1,"Name":"alice","Email":"alice@example.com"}
```

这段 JSON 能用，但字段名是 `ID`、`Name`、`Email`。在 Go 代码里，这些字段名首字母大写是合理的，因为大写表示字段可以被包外访问。但对 HTTP API 来说，我们通常更希望返回小写字段，比如 `id`、`name`、`email`。

这时就需要 JSON 标签：

```go
type User struct {
    ID    int64  `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}
```

再编码同一个用户：

```go
data, err := json.Marshal(User{
    ID:    1,
    Name:  "alice",
    Email: "alice@example.com",
})

if err != nil {
    panic(err)
}

fmt.Println(string(data))
```

输出：

```text
{"id":1,"name":"alice","email":"alice@example.com"}
```

这些反引号里的内容叫 struct tag。`json:"id"` 表示：Go 代码里字段仍然叫 `ID`，但编码成 JSON 时字段名使用 `id`。

这里有一个容易混淆的点：JSON 标签不能替代 Go 的导出规则。`encoding/json` 只能访问导出的结构体字段，也就是首字母大写的字段。

下面这个写法不会得到你想要的结果：

```go
type User struct {
    ID   int64  `json:"id"`
    name string `json:"name"`
}
```

即使 `name` 写了 `json:"name"`，它仍然是小写字段，`encoding/json` 不能访问它。编码时只会输出 `ID` 对应的字段：

```text
{"id":1}
```

所以结论是：

- 字段首字母大写，是给 Go 的包可见性规则看的。
- `json:"..."` 标签，是给 JSON 编码和解码规则看的。
- 后端响应结构体通常两者都要写：Go 字段保持导出，JSON 字段保持接口习惯。

---

## interface：把函数需要的能力说清楚

Go 的 interface 容易被讲得很抽象。第一次接触时，可以先把它理解成一句话：**interface 描述的是“我需要你会做什么”。**

继续看一个后端场景：新用户注册后，系统要发送欢迎消息。

下面的代码沿用前面的 `User` 类型；示例里的 `fmt.Printf` 来自标准库 `fmt` 包。

先不使用 interface，直接写一个具体的发送器：

```go
type ConsoleEmailSender struct{}

func (ConsoleEmailSender) Send(to string, subject string, body string) error {
    fmt.Printf("send email to %s: %s\n", to, subject)
    return nil
}
```

`ConsoleEmailSender` 现在有一个 `Send` 方法。我们可以让欢迎函数直接依赖它：

```go
func WelcomeUser(sender ConsoleEmailSender, user User) error {
    return sender.Send(
        user.Email,
        "Welcome",
        "Hello "+user.DisplayName(),
    )
}
```

这段代码能工作。但它把 `WelcomeUser` 和 `ConsoleEmailSender` 绑死了。

问题是，`WelcomeUser` 真正在乎的并不是“你必须是 `ConsoleEmailSender`”。它只在乎一件事：你能不能发送一条消息。

这时就可以把“需要的能力”写成 interface：

```go
type EmailSender interface {
    Send(to string, subject string, body string) error
}
```

这个接口只描述一个能力：有一个 `Send` 方法，参数是收件人、标题和正文，返回一个 `error`。

现在 `WelcomeUser` 可以依赖这个能力，而不是依赖某个具体类型：

```go
func WelcomeUser(sender EmailSender, user User) error {
    return sender.Send(
        user.Email,
        "Welcome",
        "Hello "+user.DisplayName(),
    )
}
```

这就是 interface 最核心的用法：函数不用知道对方具体是什么类型，只要知道对方具备自己需要的方法。

`ConsoleEmailSender` 不需要写“我实现了 EmailSender”。在 Go 里，只要一个类型拥有接口要求的方法，它就自动满足这个接口。

所以这个值可以传给 `WelcomeUser`：

```go
sender := ConsoleEmailSender{}
user := User{
    Name:  "alice",
    Email: "alice@example.com",
}

if err := WelcomeUser(sender, user); err != nil {
    panic(err)
}
```

以后如果你真的接入邮件服务，也可以写另一个类型：

```go
type APIEmailSender struct {
    Endpoint string
}

func (s APIEmailSender) Send(to string, subject string, body string) error {
    // 这里可以调用真实邮件 API
    return nil
}
```

只要 `APIEmailSender` 也有同样的 `Send` 方法，它也能传给 `WelcomeUser`。

这就是 interface 带来的松动：`WelcomeUser` 只绑定“发送能力”，不绑定“具体发送器”。

测试时可以写一个假 sender：

```go
type FakeEmailSender struct {
    SentTo string
}

func (f *FakeEmailSender) Send(to string, subject string, body string) error {
    f.SentTo = to
    return nil
}
```

这个假 sender 不会真的发邮件，只记录发送给了谁。因为它也有 `Send` 方法，所以它同样满足 `EmailSender`。

把这件事放回后端开发里，interface 常用于隔离这些东西：

- 发邮件、发短信、推送消息
- 调用第三方 API
- 访问数据库或缓存
- 读取外部配置
- 测试时替换真实依赖

先记住一个结论：**interface 不是“类的另一种写法”，而是一组方法要求。某个类型只要满足这组方法要求，就可以被当作这个 interface 使用。**

---

## 不要为了抽象而抽象

前面我们提取了 `EmailSender`，因为 `WelcomeUser` 确实需要替换发送器来测试。这个接口是有理由的。

但你可能会想：是不是每个类型都应该有对应接口？比如给 `User` 也写一个 `UserStorer`，给日志也写一个 `Logger`？

先不急。`EmailSender` 有用，是因为你已经遇到了需要替换实现的场景。如果你写的类型只有一个实现，也没有测试替换需求，加一个接口只是多了一层名字。

更好的习惯是：先写具体类型。当你真的需要替换实现、隔离外部依赖、或者缩小调用方需要知道的能力时，再提取接口。

一个实用原则是：**接口通常由使用方定义，而不是由实现方提前定义。**

谁需要这组能力，谁就定义最小接口。

---

## 本章小结

Go 用几个简单机制组织数据和行为：

- `struct` 给业务数据一个明确形状
- method 把行为放到类型旁边
- 指针接收者用于修改对象或避免复制
- 字段首字母大小写决定包外可见性
- struct tag 让结构体能和 JSON 等外部格式对应
- interface 用来描述调用方真正需要的能力

下一章，我们进入 Go 最有争议也最重要的习惯：错误处理。
