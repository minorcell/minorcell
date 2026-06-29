---
title: '第 8 章：用标准库写一个 HTTP 服务'
volume: 1
chapter: 8
description: '用 net/http 写一个小型 JSON API，讲解 handler、路由、请求解析、响应和错误状态码。'
---

> 本章问题：不用框架时，一个 Go HTTP 服务的骨架长什么样？

---

## 最小 HTTP 服务

Go 标准库里的 `net/http` 可以直接启动 HTTP 服务：

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "ok")
    })

    log.Println("listening on :8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatal(err)
    }
}
```

运行：

```bash
go run .
```

访问：

```bash
curl http://localhost:8080/healthz
```

输出：

```text
ok
```

这就是一个最小 HTTP 服务。`http.HandleFunc` 注册路由，`http.ListenAndServe` 启动监听。

---

## handler 的两个参数

HTTP handler 的函数签名通常是：

```go
func(w http.ResponseWriter, r *http.Request)
```

`r` 是请求，里面有方法、路径、查询参数、请求体、header 和 context。

`w` 是响应写入器，你通过它设置响应头、状态码和响应体。

例如返回 JSON：

```go
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}
```

注意顺序：先设置 header，再写状态码，再写响应体。一旦开始写响应体，状态码和部分 header 就可能已经发送出去了。

---

## 写一个用户查询接口

定义响应结构体：

```go
type User struct {
    ID    int64  `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}
```

写一个 JSON 辅助函数：

```go
func writeJSON(w http.ResponseWriter, status int, value any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)

    if err := json.NewEncoder(w).Encode(value); err != nil {
        log.Printf("write json response: %v", err)
    }
}
```

handler：

```go
func userHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
            "error": "method not allowed",
        })
        return
    }

    id := r.URL.Query().Get("id")
    if id == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{
            "error": "id is required",
        })
        return
    }

    user := User{
        ID:    1,
        Name:  "alice",
        Email: "alice@example.com",
    }

    writeJSON(w, http.StatusOK, user)
}
```

注册：

```go
func main() {
    http.HandleFunc("/healthz", healthHandler)
    http.HandleFunc("/users", userHandler)

    log.Println("listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

访问：

```bash
curl 'http://localhost:8080/users?id=1'
```

输出：

```json
{ "id": 1, "name": "alice", "email": "alice@example.com" }
```

---

## 请求解析不要散落

现在 `id` 还是字符串。如果要转成整数：

```go
rawID := r.URL.Query().Get("id")
id, err := strconv.ParseInt(rawID, 10, 64)
if err != nil {
    writeJSON(w, http.StatusBadRequest, map[string]string{
        "error": "invalid id",
    })
    return
}
```

这段代码很常见。请求参数来自用户，不能信任。你要解析它，检查错误，然后把内部错误翻译成合适的 HTTP 状态码。

一个原则是：handler 可以负责 HTTP 相关的解析和响应，但不要把太多业务逻辑堆在 handler 里。

比较好的边界是：

```go
user, err := service.FindUser(r.Context(), id)
```

handler 负责从 HTTP 请求里拿到 `id`，service 负责根据 `id` 查用户。

---

## 解析 JSON 请求体

创建用户通常是 POST JSON：

```go
type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}
```

handler：

```go
func createUserHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
            "error": "method not allowed",
        })
        return
    }

    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{
            "error": "invalid json body",
        })
        return
    }

    if req.Name == "" || req.Email == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{
            "error": "name and email are required",
        })
        return
    }

    user := User{
        ID:    2,
        Name:  req.Name,
        Email: req.Email,
    }

    writeJSON(w, http.StatusCreated, user)
}
```

测试请求：

```bash
curl -X POST http://localhost:8080/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"bob","email":"bob@example.com"}'
```

---

## 状态码也是接口的一部分

HTTP 状态码不是装饰。它是你的 API 契约的一部分。

常见映射：

- 参数非法：`400 Bad Request`
- 未认证：`401 Unauthorized`
- 无权限：`403 Forbidden`
- 资源不存在：`404 Not Found`
- 方法不允许：`405 Method Not Allowed`
- 创建成功：`201 Created`
- 服务内部错误：`500 Internal Server Error`

不要所有失败都返回 `200`，然后在 JSON 里写 `"success": false`。这样会让调用方、网关、监控和日志分析都更难判断真实状态。

---

## 本章小结

这一章我们用标准库写了一个小 HTTP 服务：

- `http.HandleFunc` 注册 handler
- `http.Request` 表示请求
- `http.ResponseWriter` 写响应
- 用 `encoding/json` 编码和解码 JSON
- 在 handler 层把错误翻译成 HTTP 状态码
- 避免把业务逻辑全部塞进 handler

下一章，我们给这些代码写测试。后端程序能不能放心修改，很大程度取决于测试是否跟得上。
