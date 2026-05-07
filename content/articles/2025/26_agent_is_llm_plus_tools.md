---
type: article
date: 2025-10-17
title: Agent = LLM + Tools
description: 深入浅出地讲解 AI Agent 的本质，从 LLM 到 Tools，从宿主环境到执行机制，用一个简洁的公式帮你理解 Claude Code、Codex 等智能体的工作原理。
author: mcell
tags:
  - AI Agent
  - LLM
  - Claude Code
  - 人工智能
  - 大语言模型
  - Tools
  - 智能体
  - AI工程
keywords:
  - AI Agent教程
  - LLM应用
  - Claude Code原理
  - 智能体开发
  - Agent工作原理
  - 大语言模型工具
  - AI Agent架构
  - 宿主环境
  - ReAct框架
  - 提示词工程
---

![064.png](https://stack-mcell.tos-cn-shanghai.volces.com/064.png)

最近，AI Agent 这个词非常火。

比如 Claude Code CLI、Codex，它能像个程序员一样，在你的命令行里读写文件、执行代码。很多人觉得很神奇，它到底是怎么做到的？

今天，我想谈谈我的理解。一句话就能概括。

## 核心公式

我的观点是，AI Agent 的核心，就是下面这个公式：

**Agent = LLM + Tools**

Agent（智能体），等于 LLM（大语言模型），加上 Tools（工具）。

为什么这么说？我们来拆解一下。

## LLM：思考的大脑

LLM，比如 GPT-5 或 Claude 4.5，是 Agent 的“大脑”。

它非常聪明，擅长阅读、理解、思考、推理和做决策。你给它一个复杂的目标，它能帮你拆解成一步步的计划。

但是，LLM 本身有一个巨大的限制：**它是一个封闭的“黑盒”**。

它无法感知外部世界。你问它“我的桌面上有什么文件？”，它不知道。你让它“帮我把 A 文件的内容复制到 B 文件”，它也做不到。

它只能“想”，不能“做”。

## Tools：连接世界的手脚

要让 LLM “做”起来，就需要 Tools（工具）。

Tools，就是 Agent 的“手脚”和“感官”。它们是 LLM 连接外部世界的桥梁。

LLM 决定“做什么”（比如“读取 A 文件”），它不自己去读，而是去“调用”一个叫 `Read Tool` 的工具。这个工具负责真正执行操作，然后把结果（文件内容）返回给 LLM。

所以，常见的工具可能包括：

- `Read Tool`：读取文件或网页内容。
- `Edit Tool`：修改或写入文件。
- `Delete Tool`：删除文件。
- `Find Tool`：搜索信息。
- `Execute Tool`：执行一段代码或命令。

LLM 负责决策，Tools 负责执行。两者结合，Agent 就能感知和操作外部世界了。

## 关键抽象：宿主环境

Tools 到底是什么？

我们可以再抽象一点：**Tools 是“宿主环境”能力的封装。**

这句话是关键。

1.  在 Claude Code CLI 这个例子里，“宿主环境”就是你的**操作系统 (OS)**。
    Tools 封装的就是 `shell` 命令（比如 `ls`, `cat`, `sed`），让 LLM 能够操作你的本地文件。

2.  如果我们想做一个“浏览器 Agent”呢？
    “宿主环境”就是**浏览器**。
    我们就需要封装浏览器提供的能力作为 Tools。

## Agent 的本质

所以，Agent 的创造逻辑就清晰了：

理论上，**任何一个宿主环境，只要它提供的能力可以被封装成 Tools，我们就能基于它创造 Agent。**

- 宿主环境是 OS，Agent 就是 OS 助手。
- 宿主环境是浏览器，Agent 就是浏览器助手。
- 宿主环境是数据库，Tools 就是 SQL 执行器，Agent 就是数据分析师。
- 宿主环境是 API 服务（比如天气、股票），Agent 就是你的生活助理。

## 不可或缺的“脚手架”

当然，一个真正好用的 Agent，光有 `LLM + Tools` 还不够。

它还需要很多“脚手架”来支撑运转，比如：

- **上下文管理 (Context Management)**：LLM 的“记忆”有限（即上下文窗口），如何只把最关键的信息喂给它？
- **记忆 (Memory)**：如何让 Agent 拥有短期记忆和长期记忆，从过去的经验中学习？
- **执行机制 (Execution Mechanism)**：如何设计一个循环（Loop），让“思考”和“行动”能交替往复、持续运行？（比如 ReAct 框架）
- **提示词工程 (Prompt Engineering)**：如何写好 Prompt，让 LLM 知道自己的目标、角色和手头有哪些工具可用？

但万变不离其宗，这些机制都是为了让 `LLM + Tools` 这个核心公式更高效、更稳定地工作。

## 总结

`Agent = LLM + Tools`。

这个简洁的公式，为我们定义了一种新的软件范式。它告诉我们，如何将 LLM 的“智能”与现实世界的“能力”结合起来，创造出能自主感知和操作的智能体。

（完）
