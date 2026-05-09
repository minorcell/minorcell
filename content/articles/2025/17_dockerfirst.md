---
type: article
date: 2025-07-29
updated: 2025-07-29
title: Docker 入门教程
description: 全面的 Docker 入门指南，通过实战案例学会容器化部署。涵盖 Docker 核心概念、Dockerfile 编写、静态网站部署、Go 服务器容器化等内容，帮助前端和后端工程师快速掌握容器技术。
tags:
  - Docker
  - 容器化
  - Dockerfile
  - 前端部署
  - Go
  - Nginx
  - 微服务
  - DevOps
  - 容器技术
  - 部署优化
author: mCell
---

![085.webp](https://stack-mcell.tos-cn-shanghai.volces.com/085.webp)

## **为什么我们需要 Docker？**

在开发中，你是否遇到过这些问题？

- "我的电脑上明明是好的，怎么到服务器上就出错了？"
- 新同事入职，花了一整天时间配置开发环境，安装各种依赖。
- 项目依赖 Node.js v14，而另一个项目需要 v18，版本切换很麻烦。
- 部署应用时，需要在服务器上手动执行一长串命令，容易出错。

这些问题的本质是 **环境不一致**。Docker 就是为了解决这个问题而生的。

你可以把 Docker 想象成一个标准化的“集装箱”。我们把应用程序以及它运行所需的一切（代码、运行时、库、环境变量）都打包到这个集装箱里。然后，这个集装箱可以在任何安装了 Docker 的机器上运行，无论是你的笔记本、同事的电脑，还是云服务器，表现都完全一样。

对我们工程师来说，Docker 的好处是：

- **环境一致性**：彻底告别“在我电脑上是好的”。
- **快速部署**：应用的启动和部署变得极其简单和迅速。
- **轻松迁移**：应用可以轻松地从一个环境迁移到另一个环境。
- **隔离性**：不同项目的环境互不干扰。

## **Docker 的核心概念**

Docker 有三个核心概念，理解了它们，你就理解了 Docker 的一半。

1.  **镜像 (Image)**
    - **是什么**：一个只读的模板，包含了运行应用程序所需的一切。比如，一个 Ubuntu 操作系统、一个 Node.js 运行时、你的应用代码等。
    - **好比是**：一张系统安装光盘，或者一个类的定义。

2.  **容器 (Container)**
    - **是什么**：镜像的运行实例。一个镜像可以创建出很多个容器。
    - **好比是**：用光盘安装好的系统，或者通过类 `new` 出来的对象实例。容器是独立、可运行的。

3.  **Dockerfile**
    - **是什么**：一个文本文件，用来定义如何构建一个镜像。里面包含了一系列指令，比如“基于哪个基础镜像”、“拷贝哪些文件进去”、“执行什么命令”等。
    - **好比是**：一张“菜谱”，Docker 根据这张菜谱就能做出“镜像”这道菜。

它们的关系是：我们通过 `Dockerfile` 来创建 `镜像`，然后通过 `镜像` 来运行 `容器`。

## **动手实践：第一个 Docker 容器**

首先，请确保你已经安装了 Docker。可以从 [Docker 官网](https://www.docker.com/products/docker-desktop/) 下载。

安装完成后，打开命令行工具，运行你的第一个容器：

```bash
$ docker run hello-world
```

如果一切顺利，你会看到 Docker 下载 `hello-world` 镜像，并运行它，然后输出一段欢迎信息。这证明你的 Docker 环境已经就绪。

## **前端工程师实战：打包一个静态网站**

假设你有一个简单的静态网站项目，目录结构如下：

```
/my-static-site
  |-- index.html
  |-- style.css
```

我们希望用 Nginx 服务器来运行它。

**第一步：编写 Dockerfile**

在项目根目录下，创建一个名为 `Dockerfile` 的文件（没有扩展名），内容如下：

```dockerfile
# 步骤1：选择一个基础镜像，这里我们选择官方的 Nginx 镜像
FROM nginx:alpine

# 步骤2：将我们项目中的文件，拷贝到镜像里 Nginx 的默认网站根目录
COPY . /usr/share/nginx/html

# Nginx 镜像默认会启动 Nginx 服务，并监听 80 端口，所以这里不需要额外指令
```

这个 Dockerfile 非常简单，只有两行：

- `FROM`：指定基础镜像。我们不需要从零开始，直接站在 Nginx 的肩膀上。`alpine` 是一个极简的 Linux 发行版，让我们的镜像体积更小。
- `COPY`：将当前目录（`.`）下的所有文件，复制到镜像的 `/usr/share/nginx/html` 目录下。

**第二步：构建镜像**

在项目根目录下，执行以下命令：

```bash
# -t 参数给镜像取一个名字，格式是 repository:tag
# . 表示 Dockerfile 在当前目录
$ docker build -t my-static-site:1.0 .
```

构建完成后，你可以用 `docker images` 命令查看本地已有的镜像。

**第三步：运行容器**

现在，用我们刚创建的镜像来启动一个容器：

```bash
# -d 参数表示在后台运行
# -p 8080:80 将主机的 8080 端口映射到容器的 80 端口
# --name 给容器取一个名字
$ docker run -d -p 8080:80 --name my-site my-static-site:1.0
```

现在，打开浏览器访问 `http://localhost:8080`，你应该能看到你的网站了！

你可以用 `docker ps` 查看正在运行的容器，用 `docker stop my-site` 停止它。

## **Golang 工程师实战：打包一个 Web 服务器**

现在我们来看一个 Golang 的例子。假设你有一个简单的 `main.go` 文件：

```go
// main.go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from Golang Docker!")
	})
	fmt.Println("Server starting on port 8080...")
	http.ListenAndServe(":8080", nil)
}
```

**第一步：编写 Dockerfile**

这次我们使用“多阶段构建”（multi-stage build），这是一个非常实用的技巧，可以让最终的镜像体积变得极小。

```dockerfile
# --- 第一阶段：构建阶段 ---
# 使用官方的 Golang 镜像作为构建环境
FROM golang:1.22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 Go 模块文件并下载依赖
COPY go.mod ./
COPY go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建 Go 应用，CGO_ENABLED=0 是为了静态编译，不依赖 C 库
# -o /app/main 表示将编译产物输出到 /app/main
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main .

# --- 第二阶段：运行阶段 ---
# 使用一个极简的空白镜像 scratch，或者 alpine
FROM alpine:latest

# 设置工作目录
WORKDIR /app

# 从构建阶段（builder）复制编译好的二进制文件到当前阶段
COPY --from=builder /app/main .

# 暴露 8080 端口
EXPOSE 8080

# 容器启动时执行的命令
CMD ["/app/main"]
```

这个 Dockerfile 分为两个阶段：

1.  **`builder` 阶段**：使用完整的 Go 环境编译代码，生成一个二进制文件 `/app/main`。
2.  **运行阶段**：使用一个非常干净、轻量的 `alpine` 镜像，只把上个阶段编译好的二进制文件复制进来。最终我们得到的镜像不包含任何 Go 编译工具和源代码，只有那个可执行文件，非常小。

**第二步：构建和运行**

构建和运行的命令与前端例子类似：

```bash
# 构建镜像
$ docker build -t go-hello-server:1.0 .

# 运行容器
$ docker run -d -p 8080:8080 --name go-server go-hello-server:1.0
```

现在访问 `http://localhost:8080`，你将看到来自 Go 服务器的问候。

## **总结**

这只是一个开始，Docker 的世界还有很多值得探索的功能，比如 `Docker Compose` 用于编排多个容器，`Docker Hub` 用于分享镜像等。
