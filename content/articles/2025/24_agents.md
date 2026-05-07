---
type: article
date: 2025-10-07
title: Agents.md 是什么
description: 深入解析 AGENTS.md 文件在 AI 编程工具生态中的作用，了解它与 MCP 协议的区别，以及如何为 AI 代理提供结构化项目上下文。
author: mcell
tags:
  - AI 编程
  - AGENTS.md
  - MCP
  - AI 代理
  - 代码工具
keywords:
  - AGENTS.md
  - AI 编程工具
  - MCP 协议
  - AI 代理上下文
  - 代码仓库配置
  - AI 驱动开发
  - 项目上下文文件
  - AI 开发工具
---

![056.png](https://stack-mcell.tos-cn-shanghai.volces.com/056.png)

最近，如果你关注 AI 编程工具的生态，可能会注意到两个新名词频繁出现：**MCP** 和 **Agents.md**。

MCP（Model Context Protocol）是为大语言模型（LLM）提供标准化上下文接入方式的协议，类似于让 LLM 能“看懂”外部工具、数据源和环境的一种通用语言。它试图解决的问题是：**如何让不同的 AI 工具以统一方式向模型提供上下文？**

而 Agents.md，则看起来更“朴素”——它只是一个 Markdown 文件，放在你的代码仓库根目录下，内容通常是：

```markdown
## Setup commands

- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Run tests: `pnpm test`

## Code style

- TypeScript strict mode
- Single quotes, no semicolons
- Use functional patterns where possible
```

乍一看，这不就是 README 的一部分吗？为什么还要单独搞一个 `AGENTS.md`？

## 人类看 README，Agent 看 AGENTS.md

关键区别在于**受众不同**。

- **README.md** 是写给人看的：项目简介、快速上手、贡献指南、社区链接……它追求简洁、友好、有吸引力。
- **AGENTS.md** 是写给 AI 编程代理（coding agent）看的：构建命令、测试流程、代码风格、依赖结构、CI 规则……它追求**精确、可执行、无歧义**。

![057.png](https://stack-mcell.tos-cn-shanghai.volces.com/057.png)

举个例子：人类看到“请先安装依赖”就懂了；但 AI 代理需要明确知道是 `npm install`、`yarn install` 还是 `pnpm install`。一个错字，整个自动化流程就可能崩掉。

所以，AGENTS.md 的出现，不是为了取代 README，而是**为 AI 代理提供一个专属的、结构化的操作手册**。

## 为什么不能直接用 CLAUDE.md？

确实，像 Claude Code Cli 这样的工具已经支持通过 `CLAUDE.md` 提供项目上下文。但这带来一个问题：**碎片化**。

- Claude 用 `CLAUDE.md`
- Cursor 可能用 `.cursor/config.md`
- GitHub Copilot 实验性功能可能用 `.github/copilot.md`
- 你自研的 agent 又定义了自己的格式……

每个工具一套规则，开发者疲于维护多个“上下文文件”，而项目仓库也变得杂乱。

**AGENTS.md 的野心，是成为一个开放、通用、无厂商锁定的标准**——就像 `package.json` 之于 Node.js，`.gitignore` 之于 Git。

它不隶属于 OpenAI、Anthropic 或 Google，而是由社区共建（包括 OpenAI Codex、Cursor、Google Jules 等团队参与推动）。目前已有超过 [41,000](https://github.com/search?q=path%3AAGENTS.md&type=code) 个开源项目采用。

## AGENTS.md 和 MCP：互补而非竞争

你可能会问：既然有了 MCP 这种“协议级”标准，还需要 AGENTS.md 这种“文件级”约定吗？

答案是：**它们在不同层次工作，互为补充**。

- **MCP** 是运行时协议：定义 AI 如何与工具、API、数据库等**动态交互**。比如 Github 提交一个 PR。
- **AGENTS.md** 是静态上下文：告诉 AI “在这个项目里，你应该怎么做事”。比如“用 pnpm 而不是 npm”、“测试命令是 `pnpm test`”。

可以这样类比：

- MCP 是“操作系统 API”，让程序能调用硬件；
- AGENTS.md 是“项目 README for machines”，让 AI 能理解项目约定。

一个管“能力接入”，一个管“行为规范”。

## 写 AGENTS.md，其实是在“教 AI 做人”

AGENTS.md 的真正价值，不在于技术实现，而在于**把隐性知识显性化**。

很多项目中，构建流程、测试策略、代码风格其实只存在于老员工的脑子里，或者散落在 CI 配置、PR 模板、Slack 聊天记录里。新人（无论是人类还是 AI）进来都要“踩坑学习”。

而 AGENTS.md 强制你把这些规则写下来，形成一份**可被机器理解的契约**。

更妙的是，它还能嵌套：在 monorepo 中，每个子包都可以有自己的 `AGENTS.md`，实现上下文隔离。

## 未来：AI 时代的“项目规范”

AGENTS.md 的愿景，是成为每个代码仓库的“标配文件”——就像 LICENSE、README、package.json 一样自然。

它不炫技，不复杂，只是一个简单的 Markdown 文件。但正是这种简单，让它有可能被广泛采纳。

## 结语

技术演进常常如此：先有混乱的实践，再有统一的规范。

MCP 解决了“AI 如何连接世界”的问题，  
AGENTS.md 则解决“AI 如何理解你的项目”的问题。

一个向外连接，一个向内约定。

当这两个方向都逐渐标准化，AI 编程代理才能真正从“玩具工程”变成“生产力工具”。

而作为开发者，我们能做的，就是在你的下一个有 AI 参与开发的项目里，加一个 `AGENTS.md`。

不需要多复杂，只要写清楚三件事：

1. 怎么跑起来？
2. 怎么测正确？
3. 代码怎么写？

这就够了。

> **附：AGENTS.md 示例模板**
>
> ```markdown
> # AGENTS.md
>
> ## Setup
>
> - Install: `pnpm install`
> - Dev: `pnpm dev`
>
> ## Testing
>
> - Run all tests: `pnpm test`
> - Lint: `pnpm lint`
>
> ## Code Style
>
> - TypeScript with strict mode
> - Single quotes, no semicolons
> - Prefer functional over class-based components
> ```

（完）
