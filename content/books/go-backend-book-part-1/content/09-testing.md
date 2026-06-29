---
title: '第 9 章：测试后端代码'
volume: 1
chapter: 9
description: '讲解 Go 的 testing 包、表格驱动测试、临时文件测试和 HTTP handler 测试。'
---

> 本章问题：如何用 Go 自带的测试工具，让后端代码可以放心修改？

---

## 测试文件长什么样

Go 测试文件以 `_test.go` 结尾。测试函数以 `Test` 开头：

```go
func TestOffset(t *testing.T) {
    got := Offset(2, 20)
    want := 20

    if got != want {
        t.Fatalf("Offset() = %d, want %d", got, want)
    }
}
```

运行：

```bash
go test ./...
```

测试失败时，`t.Fatalf` 会停止当前测试并输出信息。测试信息要写得能定位问题，不要只写 `failed`。

---

## 表格驱动测试

后端代码经常要测试多组输入。Go 常用表格驱动测试：

```go
func TestOffset(t *testing.T) {
    tests := []struct {
        name     string
        page     int
        pageSize int
        want     int
    }{
        {name: "first page", page: 1, pageSize: 20, want: 0},
        {name: "second page", page: 2, pageSize: 20, want: 20},
        {name: "invalid page", page: 0, pageSize: 20, want: 0},
        {name: "invalid size", page: 2, pageSize: 0, want: 20},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Offset(tt.page, tt.pageSize)
            if got != tt.want {
                t.Fatalf("Offset() = %d, want %d", got, tt.want)
            }
        })
    }
}
```

这种写法有几个好处：新增用例很轻，失败时能看到具体用例名，输入和期望放在一起。

不要为了形式写表格。只有当你确实有多组输入输出时，它才有价值。

---

## 测试错误路径

只测成功路径是不够的。Go 的错误处理显式，测试也应该覆盖关键错误路径。

例如校验函数：

```go
func ValidateCreateUser(req CreateUserRequest) error {
    if req.Name == "" {
        return errors.New("name is required")
    }
    if req.Email == "" {
        return errors.New("email is required")
    }
    return nil
}
```

测试：

```go
func TestValidateCreateUser(t *testing.T) {
    tests := []struct {
        name    string
        req     CreateUserRequest
        wantErr bool
    }{
        {
            name: "valid",
            req:  CreateUserRequest{Name: "alice", Email: "a@example.com"},
        },
        {
            name:    "missing name",
            req:     CreateUserRequest{Email: "a@example.com"},
            wantErr: true,
        },
        {
            name:    "missing email",
            req:     CreateUserRequest{Name: "alice"},
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateCreateUser(tt.req)
            if (err != nil) != tt.wantErr {
                t.Fatalf("error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

这里不强行匹配完整错误字符串。很多时候，测试是否有错误就够了。只有当错误内容本身是对外契约时，才需要更精确地检查。

---

## 测试文件读取

测试配置读取时，不要依赖你电脑上的固定路径。Go 的测试包提供临时目录：

```go
func TestLoadConfig(t *testing.T) {
    dir := t.TempDir()
    path := filepath.Join(dir, "config.json")

    content := []byte(`{"app_name":"demo","port":"9000"}`)
    if err := os.WriteFile(path, content, 0644); err != nil {
        t.Fatalf("write temp config: %v", err)
    }

    cfg, err := Load(path)
    if err != nil {
        t.Fatalf("Load() error = %v", err)
    }

    if cfg.Port != "9000" {
        t.Fatalf("Port = %q, want %q", cfg.Port, "9000")
    }
}
```

`t.TempDir()` 会创建临时目录，测试结束后自动清理。这样测试不依赖本机环境，也不会污染项目目录。

---

## 测试 HTTP handler

标准库提供 `httptest`，可以不用真的启动端口就测试 handler。

```go
func TestHealthHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
    rr := httptest.NewRecorder()

    healthHandler(rr, req)

    if rr.Code != http.StatusOK {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK)
    }

    got := strings.TrimSpace(rr.Body.String())
    want := `{"status":"ok"}`
    if got != want {
        t.Fatalf("body = %q, want %q", got, want)
    }
}
```

`httptest.NewRequest` 构造请求，`httptest.NewRecorder` 记录响应。handler 执行完后，你可以检查状态码、响应头和响应体。

这比手动启动服务再用 curl 测稳定得多，也更适合放进持续集成。

---

## 哪些代码优先测试

不是每一行代码都需要同等力度测试。入门阶段可以优先测：

- 参数校验
- 数据转换
- 错误分支
- HTTP 状态码
- 配置加载
- 不依赖外部服务的业务规则

不要一开始就追求复杂 mock。先把纯函数和 handler 测起来，收益已经很高。

测试的目标不是让数字好看，而是让你敢改代码。

---

## 本章小结

Go 的测试工具很朴素，但足够覆盖后端入门阶段的大部分需要：

- 测试文件以 `_test.go` 结尾
- 测试函数以 `Test` 开头
- 表格驱动测试适合多组输入输出
- 错误路径要有测试
- `t.TempDir()` 适合文件相关测试
- `httptest` 适合测试 HTTP handler

下一章，我们进入 Go 最有辨识度的主题：goroutine、channel 和 context。
