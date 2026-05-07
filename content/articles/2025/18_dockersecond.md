---
type: article
date: 2025-08-08
title: Docker 进阶指南
description: Docker 进阶教程，深入学习容器生命周期管理、网络通信、数据持久化和 Docker Compose 多服务编排。通过实战案例掌握 Go 应用与 PostgreSQL 数据库的容器化部署和服务间通信。
tags:
  - Docker
  - Docker Compose
  - 容器管理
  - 数据持久化
  - 容器网络
  - PostgreSQL
  - Go
  - 微服务
  - DevOps
  - 容器编排
author: mCell
---

![085.webp](https://stack-mcell.tos-cn-shanghai.volces.com/085.webp)

在上一篇文章里，我们用 `docker build` 和 `docker run` 命令，成功地将一个应用放进了容器里并运行起来。这感觉很棒，就像 hello world 一样。

但是，hello world 之后，我们总会好奇背后的秘密。而且，只靠这两个命令，还远远无法应对真实的工作场景。你可能马上就会遇到一连串新的问题：

- 容器在后台运行，我怎么知道它里面发生了什么？如何查看日志？
- 如果应用卡死了，或者我想暂时关闭它，该怎么操作？
- 我的应用不是孤立的，它需要连接数据库。数据库也放在容器里吗？两个容器如何“对话”？
- 每次启动应用都要敲一长串 `docker run` 命令，参数又多又难记，有没有更简单的方法？

这些问题，才是我们日常工作的核心。今天，我们就来逐一攻克它们，让 Docker 从一个“有趣的玩具”变成我们手中“可靠的工具”。

## **掌控容器：生命周期管理**

首先，我们要学会如何管理一个正在运行的容器。

假设我们用上一篇的命令启动了一个 Go 服务器：
`$ docker run -d -p 8080:8080 --name go-server go-hello-server:1.0`

1.  **查看正在运行的容器**
    `docker ps` 命令会列出所有正在运行的容器，就像任务管理器一样。

    ```bash
    $ docker ps
    CONTAINER ID   IMAGE                 COMMAND                  CREATED          STATUS          PORTS                    NAMES
    f8b3a0c4a4e1   go-hello-server:1.0   "/app/main"              2 minutes ago    Up 2 minutes    0.0.0.0:8080->8080/tcp   go-server
    ```

    这里包含了容器 ID、所用镜像、运行状态、端口映射等关键信息。

2.  **查看容器日志**
    应用在容器里运行，`fmt.Println` 或 `console.log` 的输出会去哪里？答案是 Docker 日志。

    ```bash
    # docker logs [容器名或容器ID]
    $ docker logs go-server
    Server starting on port 8080...

    # 加上 -f 参数，可以像 tail -f 一样持续跟踪日志
    $ docker logs -f go-server
    ```

3.  **停止、启动和重启容器**
    这就像操作服务一样简单。

    ```bash
    $ docker stop go-server   # 停止
    $ docker start go-server  # 再次启动
    $ docker restart go-server # 重启
    ```

    停止后，`docker ps` 就看不到它了，但容器并没有被删除。使用 `docker ps -a` 可以看到包括已停止在内的所有容器。

4.  **进入容器内部**
    有时我们需要进入容器内部进行调试，比如查看文件、检查环境。`docker exec` 命令可以做到。

    ```bash
    # -it 参数让你可以在容器里进行交互式操作
    # /bin/sh 是我们想在容器里执行的命令，这里是启动一个 shell
    $ docker exec -it go-server /bin/sh

    # 进入容器后，你就得到了一个 shell 提示符
    /app # ls
    main
    /app # exit
    ```

5.  **删除容器**
    如果一个容器你不再需要了，可以用 `docker rm` 删除它。注意，必须先停止容器才能删除。

    ```bash
    $ docker stop go-server
    $ docker rm go-server
    ```

现在，你已经掌握了容器的“生老病死”全过程管理，这是进行下一步的基础。

## **连接容器：网络与数据**

真实的应用很少是孤立的。一个 Go 后端服务，通常需要一个数据库（如 PostgreSQL），一个前端应用可能需要调用这个后端服务。

**1. 容器间的通信**

默认情况下，Docker 会创建一个名为 `bridge` 的虚拟网络。所有通过 `docker run` 启动的容器都会连接到这个网络上。**在同一个网络内，容器之间可以通过容器名直接通信。**

让我们来验证一下。首先，我们启动一个 PostgreSQL 数据库容器：

```bash
$ docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  postgres:13
```

- `-e` 参数用来设置环境变量，这里是设置数据库的密码。

现在，PostgreSQL 数据库正在名为 `my-postgres` 的容器中运行。你的 Go 应用如何连接它？

在你的 Go 代码里，数据库的连接地址**不再是 `localhost`**，而应该是数据库容器的名称 `my-postgres`。

```go
// 数据库连接字符串
// host=localhost:5432  =>  host=my-postgres:5432
const connStr = "host=my-postgres user=postgres password=mysecretpassword dbname=postgres sslmode=disable"
```

Docker 内置了 DNS 服务，它会自动把容器名 `my-postgres` 解析成该容器的内部 IP 地址。这是 Docker 网络一个非常优雅的设计。

**2. 数据的持久化：数据卷 (Volume)**

我们刚刚启动的数据库容器，数据是保存在哪里的？答案是保存在容器内部的文件系统中。

这是一个巨大的隐患：**如果容器被删除，数据就永远丢失了。**

为了解决这个问题，Docker 提供了**数据卷（Volume）**。你可以把数据卷想象成一个外接的 U 盘。我们将这个“U 盘”插到容器上，让应用把数据写到“U 盘”里。这样，即便容器这个“读卡器”坏了、被扔掉了，数据还在“U 盘”上，安然无恙。

使用数据卷非常简单，只需要在 `run` 命令里加一个 `-v` 参数。

```bash
# 完整地启动一个带数据卷的 postgres 容器
$ docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -v pgdata:/var/lib/postgresql/data \
  postgres:13
```

- `-v pgdata:/var/lib/postgresql/data` 的意思是：
  - 创建一个名为 `pgdata` 的数据卷（如果它不存在的话）。
  - 将这个数据卷“挂载”到容器内部的 `/var/lib/postgresql/data` 目录上（这是 PostgreSQL 默认的数据存储路径）。

现在，所有数据库文件都会被写入 `pgdata` 这个数据卷里。你可以通过 `docker volume ls` 查看已有的数据卷。即使你删除了 `my-postgres` 容器，数据卷 `pgdata` 和里面的数据依然存在。

## **Docker Compose**

现在，我们有了 Go 应用和 PostgreSQL 数据库。每次启动它们，需要执行两条长长的 `docker run` 命令，还要注意启动顺序。如果服务更多，比如加上 Redis、Nginx，手动管理将成为一场噩梦。

`Docker Compose` 就是来解决这个问题的。它是一个用于定义和运行多容器 Docker 应用程序的工具。你只需要在一个 YAML 文件中（默认为 `docker-compose.yml`），描述清楚你的应用由哪些服务构成，然后用一条命令就能同时启动或关闭所有服务。

在你的项目根目录下，创建一个 `docker-compose.yml` 文件：

```yaml
# docker-compose.yml

# 版本号
version: '3.8'

# 定义一系列服务
services:
  # 这是我们的 Go 后端服务
  backend:
    build: . # 使用当前目录的 Dockerfile 来构建镜像
    ports:
      - '8080:8080' # 端口映射
    depends_on:
      - db # 表明 backend 服务依赖于 db 服务，Compose 会先启动 db

  # 这是我们的数据库服务
  db:
    image: postgres:13 # 直接使用官方镜像
    environment:
      POSTGRES_PASSWORD: mysecretpassword
    volumes:
      - pgdata:/var/lib/postgresql/data # 使用数据卷

# 定义数据卷
volumes:
  pgdata:
```

这个文件清晰地定义了 `backend` 和 `db` 两个服务，以及它们之间的关系和配置。现在，管理整个应用只需要两条命令：

- **启动所有服务：**

  ```bash
  # -d 表示在后台运行
  $ docker-compose up -d
  ```

  Compose 会自动构建镜像、创建网络、创建数据卷，并按依赖顺序启动所有容器。

- **关闭并删除所有服务：**

  ```bash
  $ docker-compose down
  ```

  它会帮你停止并删除所有相关的容器、网络。默认情况下，数据卷会被保留。

有了 Docker Compose，复杂的应用环境变得前所未有地简单和清晰。

## **总结**

至此，你掌握的 Docker 知识已经足以应对绝大部分的日常开发和测试工作。你会发现，无论是搭建开发环境、进行集成测试，还是确保团队成员环境一致，Docker 都将成为你的得力助手。

Docker 的世界依然广阔，下一步你可以去了解 Dockerfile 的最佳实践（比如多阶段构建），或者探索容器的终极舞台——Kubernetes。但无论走多远，今天所学的这些核心概念，都将是你坚实的基础。
