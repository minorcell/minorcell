---
title: '第 7 章：文件、JSON 和配置'
volume: 1
chapter: 7
description: '通过读取配置文件和环境变量，讲解 os、encoding/json、结构体标签和配置默认值。'
---

> 本章问题：一个后端程序如何从文件和环境变量读取配置，并把失败处理清楚？

---

## 配置不应该散落在代码里

后端程序通常需要配置：

- 监听端口
- 数据库地址
- 日志级别
- 外部接口地址
- 超时时间

学习阶段我们先不接数据库，只处理两个配置：服务名和端口。

创建一个 `config.json`：

```json
{
  "app_name": "hello-go",
  "port": "8080"
}
```

对应的 Go 结构体：

```go
type Config struct {
    AppName string `json:"app_name"`
    Port    string `json:"port"`
}
```

字段首字母大写，是为了让 `encoding/json` 能设置它们。JSON tag 负责把 `app_name` 映射到 `AppName`。

---

## 读取并解析 JSON

写一个加载函数：

```go
package config

import (
    "encoding/json"
    "fmt"
    "os"
)

type Config struct {
    AppName string `json:"app_name"`
    Port    string `json:"port"`
}

func Load(path string) (Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return Config{}, fmt.Errorf("read config %s: %w", path, err)
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return Config{}, fmt.Errorf("parse config %s: %w", path, err)
    }

    return cfg, nil
}
```

这里有几个值得看清的点。

`os.ReadFile` 负责读取文件。它可能失败，所以要返回错误。

`json.Unmarshal` 负责把 JSON 字节解析进结构体。第二个参数是 `&cfg`，因为解析器需要修改这个变量。

失败时我们没有直接返回 `err`，而是用 `fmt.Errorf` 加上上下文。以后看到日志时，你能知道到底是读文件失败，还是解析 JSON 失败。

---

## 给配置补默认值

配置文件可能没有写端口。我们可以给默认值：

```go
func (c Config) WithDefaults() Config {
    if c.AppName == "" {
        c.AppName = "go-backend"
    }
    if c.Port == "" {
        c.Port = "8080"
    }
    return c
}
```

在 `Load` 里使用：

```go
return cfg.WithDefaults(), nil
```

这里使用值接收者，因为我们返回的是补完默认值后的新配置。也可以用指针接收者直接修改原配置。对小结构体来说，这两种都能工作，关键是保持一致。

---

## 环境变量覆盖配置文件

线上环境常用环境变量覆盖配置文件。比如同一份镜像在不同环境使用不同端口。

```go
func (c Config) WithEnv() Config {
    if port := os.Getenv("PORT"); port != "" {
        c.Port = port
    }
    if appName := os.Getenv("APP_NAME"); appName != "" {
        c.AppName = appName
    }
    return c
}
```

组合起来：

```go
func Load(path string) (Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return Config{}, fmt.Errorf("read config %s: %w", path, err)
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return Config{}, fmt.Errorf("parse config %s: %w", path, err)
    }

    return cfg.WithDefaults().WithEnv(), nil
}
```

现在配置优先级是：环境变量高于配置文件，配置文件高于默认值。

这是一条常见规则。重要的是把规则写清楚，不要让配置来源变成猜谜。

---

## 什么时候配置错误应该让程序退出

如果配置文件路径错了，程序能不能继续运行？

多数后端服务不能。服务端口、数据库地址、外部依赖这些配置缺失时，继续启动只会制造更隐蔽的问题。

所以在 `main` 里可以这样处理：

```go
func main() {
    cfg, err := config.Load("config.json")
    if err != nil {
        log.Fatal(err)
    }

    log.Printf("starting %s on :%s", cfg.AppName, cfg.Port)
}
```

`log.Fatal` 会打印日志并退出程序。这里放在程序入口是合理的，因为配置加载失败意味着程序无法进入正常服务状态。

注意：底层 `config.Load` 没有调用 `log.Fatal`，它只返回错误。是否退出，是入口层的决定。

---

## 小练习：解析超时时间

真实服务里常有超时配置：

```json
{
  "timeout_seconds": 5
}
```

你可以这样表示：

```go
type Config struct {
    TimeoutSeconds int `json:"timeout_seconds"`
}

func (c Config) Timeout() time.Duration {
    if c.TimeoutSeconds <= 0 {
        return 5 * time.Second
    }
    return time.Duration(c.TimeoutSeconds) * time.Second
}
```

这里不要直接在业务代码里到处写 `time.Duration(cfg.TimeoutSeconds) * time.Second`。把转换放进配置类型的方法里，调用方更清楚。

---

## 本章小结

这一章我们完成了一个小但真实的后端任务：

- 用结构体表达配置
- 用 JSON tag 对齐外部字段名
- 用 `os.ReadFile` 读取文件
- 用 `json.Unmarshal` 解析 JSON
- 用错误包装保留上下文
- 用默认值和环境变量形成配置优先级
- 在入口层决定配置失败时退出程序

下一章，我们终于把这些东西接到 HTTP 服务上。
