---
title: '第 9 章：测试后端代码'
volume: 1
chapter: 9
description: '用前几章写的校验函数、配置加载和 HTTP handler 讲解 Go 的 testing 包和常见测试模式。'
---

> 本章问题：如何用 Go 自带的测试工具，让你在前面写的代码可以放心修改？

---

## 测试文件长什么样

前面几章我们写了 `ValidateCreateUser`、`config.Load`、HTTP handler。它们现在能工作，但你怎么知道改了之后不会坏？

Go 测试文件以 `_test.go` 结尾。测试函数以 `Test` 开头：

```go
func TestValidateCreateUser_Valid(t *testing.T) {
    req := CreateUserRequest{
        Name:  "alice",
        Email: "alice@example.com",
    }

    err := ValidateCreateUser(req)
    if err != nil {
        t.Fatalf("ValidateCreateUser() = %v, want nil", err)
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

`ValidateCreateUser` 有多种合法输入。逐个写测试函数很快会重复。Go 常用表格驱动测试：

```go
func TestValidateCreateUser_Valid(t *testing.T) {
    tests := []struct {
        name string
        req  CreateUserRequest
    }{
        {
            name: "basic user",
            req:  CreateUserRequest{Name: "alice", Email: "a@example.com"},
        },
        {
            name: "with age",
            req:  CreateUserRequest{Name: "bob", Email: "b@example.com", Age: 25},
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if err := ValidateCreateUser(tt.req); err != nil {
                t.Fatalf("ValidateCreateUser() = %v, want nil", err)
            }
        })
    }
}
```

这种写法有几个好处：新增用例很轻，失败时能看到具体用例名，输入和期望放在一起。

不要为了形式写表格。只有当你确实有多组输入输出时，它才有价值。

---

## 测试错误路径

只测成功路径是不够的。第五章我们花了整章讲错误处理，测试也应该覆盖关键的错误分支：

```go
func TestValidateCreateUser_Invalid(t *testing.T) {
    tests := []struct {
        name    string
        req     CreateUserRequest
        wantErr bool
    }{
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
        {
            name:    "negative age",
            req:     CreateUserRequest{Name: "alice", Email: "a@example.com", Age: -1},
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

## 测试配置读取

第七章我们写了 `config.Load`，它从 JSON 文件读取配置。测试时不要依赖你电脑上的固定路径。Go 的测试包提供临时目录：

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

你也可以测试配置文件不存在的场景：

```go
func TestLoadConfig_NotExist(t *testing.T) {
    _, err := Load("/nonexistent/config.json")
    if err == nil {
        t.Fatal("Load() should return error for missing file")
    }
}
```

这验证了第五章的错误包装是否正常工作——文件不存在时，错误应该被清楚地传递出来。

---

## 测试 HTTP handler

第八章我们写了 `userHandler` 和 `createUserHandler`。标准库提供 `httptest`，可以不用真的启动端口就测试 handler：

```go
func TestUserHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/users?id=1", nil)
    rr := httptest.NewRecorder()

    userHandler(rr, req)

    if rr.Code != http.StatusOK {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK)
    }
}
```

`httptest.NewRequest` 构造请求，`httptest.NewRecorder` 记录响应。handler 执行完后，你可以检查状态码、响应头和响应体。

再测试创建用户的 handler：

```go
func TestCreateUserHandler(t *testing.T) {
    body := strings.NewReader(`{"name":"alice","email":"a@example.com"}`)
    req := httptest.NewRequest(http.MethodPost, "/users", body)
    req.Header.Set("Content-Type", "application/json")
    rr := httptest.NewRecorder()

    createUserHandler(rr, req)

    if rr.Code != http.StatusCreated {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusCreated)
    }
}
```

也可以测试错误场景——缺少必填字段时应该返回 400：

```go
func TestCreateUserHandler_MissingFields(t *testing.T) {
    body := strings.NewReader(`{"name":""}`)
    req := httptest.NewRequest(http.MethodPost, "/users", body)
    rr := httptest.NewRecorder()

    createUserHandler(rr, req)

    if rr.Code != http.StatusBadRequest {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusBadRequest)
    }
}
```

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
