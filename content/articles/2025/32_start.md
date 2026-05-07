---
type: article
title: '为什么在 Agent 时代，我选择了 Bun？'
date: 2025-12-09
description: '这不是一篇「Hello World」式的 runtime 教程，而是我作为一个写 Node/TS/Go 的开发者，为什么在 2025 年，突然决定认真学一下 Bun，并决定做一个 ReAct Agent 的记录。'
order: 3
---

![076](https://stack-mcell.tos-cn-shanghai.volces.com/076.webp)

## 一切都从那条「收购 Bun」的新闻开始

上周三，看到 Anthropic 的一则新闻：他们宣布收购 Bun，并在文中明确写到——对 Claude Code 的用户来说，这次收购意味着**更快的性能、更高的稳定性以及全新的能力**。([Anthropic][1])

简单翻译一下就是：

> 我们要把整个编码 Agent 的基础设施，换成一个更快、更顺手的 JS/TS 运行时。

这条新闻对我触动很大，至少暴露出两个事实：

1. **Agent 时代的基础设施在变化**
   以前我们写 CLI、写后端，Node 足够用了；但到了 Agent 这种「到处起小进程、到处跑工具」的场景里，**启动速度、冷启动性能、all-in-one 工具链**，突然变得非常关键。

2. **Bun 不再只是一个「新玩具」**
   它已经成为一家头部 AI 公司的底层组件之一：Anthropic 早就在内部用 Bun 跑 Claude Code，现在索性直接收购，把它当作下一代 AI 软件工程的基础设施。([bun.sh][2])

当我再去翻 Bun 的官网时，就会发现：

> 这是一个集 **JavaScript/TypeScript 运行时、包管理器、打包器、测试运行器** 于一身的 all-in-one 工具。([bun.sh][2])

这和我对「传统 JS 运行时」的印象已经完全不一样了。

![078](https://stack-mcell.tos-cn-shanghai.volces.com/078.webp)

## 先说说我的技术背景：为什么要写这个专题？

我平时写代码偏向两类技术栈：

- **TypeScript**：前端、工具脚本、Node 小服务
- **Go**：服务端、一些偏底层的活

很长一段时间里，我对 Node 的使用场景大概就是这几种：

- 写个小脚本：`ts-node` / `tsx` + 一点配置，跑完就扔
- 写个中小型服务端：Express / Nest 这一类

这些场景里，一个很明显的感受是：

- Node **够成熟**：生态庞大，资料多，出了问题很容易搜到坑
- 但 Node 也**够「厚重」**：一堆配置、各种工具组合、打包测试 lint 各种链路

直到我开始认真看 Bun 的文档，第一次有一种很强烈的对比感：

> 「哦，原来现在写 JS/TS 后端已经可以这么简单了？」

- 不用写 `tsconfig.json`（很多时候默认就很好用）
- dev / build / test 基本就是一行命令：
  `bun run` / `bun build` / `bun test`
- 起一个 HTTP server，用的还是 JS/TS，但 API 明显更简洁，很多地方甚至不需要 Node 的那一套底层 API

再加上我最近在做 Agent 相关的东西，自然就顺势产生了一个问题：

> 既然我本来就想用 TS 写一个 ReAct Agent，那为什么不干脆用 Bun 来做 runtime 呢？

## Agent CLI 的选型：为什么会想到 Bun？

在开搞之前，我特地去看了一圈现在比较热门的 Agent CLI 都是怎么选技术栈的：

- Google 的 [Gemini CLI](https://github.com/google-gemini/gemini-cli)：**Node**
- OpenAI 的 [Codex CLI](https://github.com/openai/codex)：**Rust**写核心逻辑，UI交给**Node和TypeScript**
- [Claude Code CLI](https://github.com/anthropics/claude-code) 和基础设施：**Bun**([Reuters][3])

如果你把这些信息放在一起，会大致看到一个趋势：

- Rust：更偏向**极致性能、可控性、安全性**，适合那种「我要把一套工具做到很底层、很稳」的团队。
- Node：稳定、生态成熟，但随着项目往 AI 工程、Agent 方向发展，在**冷启动、工具链整合**上没有那么「顺手」。
- Bun：尝试在 Node 的生态基础上，往前推进一步，做一个**all-in-one、性能极强的 JS/TS 运行时**。

而我这个人，有个很明显的偏好：

> 能用 TS 解决的，就先别急着上 Rust。

所以，当我看到：

- Anthropic 在 Agent 业务上，押注 Bun
- Bun 自己的定位又是：**“把你写 Node 的那套事，全部做到更快、更简单”**([bun.sh][2])

那我心里那个问题就更具体了：

> **在「写 Agent」这个具体场景里，Bun 真的比 Node 体验更好吗？**

我不太喜欢只看 benchmark，于是就决定写点实打实的东西来试试看。

## 一个不到百行的 ReAct Agent Demo

为了验证这个问题，我给自己定了一个很小的练习目标：

> 用 **Bun + TypeScript**，写一个「不到百行代码」的极简 ReAct Agent Demo。

![079](https://stack-mcell.tos-cn-shanghai.volces.com/079.webp)

这个 Agent 不追求多复杂的功能，专注这几件事：

1. 维护一个最小可用的 **ReAct loop**（思考 → 行动 → 观察 → 再思考）
2. 内置少量工具，比如：
   - `read`：读取文件内容
   - `write`：写入/更新文件

3. 整个项目尽量清爽，不做多余封装

写的过程非常「AI 化」：

- 先用 Node 写了一版最朴素的版本
- 再让 AI 帮我**改写为 Bun 的 API**
- 我负责补坑、重构、整理结构

结果出乎意料地顺畅：

- 很多原来需要 `fs` 模块、各种工具库的地方，在 Bun 里可以用自己的 API 写得更简洁，比如 `Bun.file()`、`Bun.write()` 这种。([bun.sh][2])
- dev / build / test 自己都不用纠结，直接 `bun xxx` 的那一套就行，几乎不需要额外配置。
- Agent loop 那段代码本身是比较核心的逻辑，集中精力在这里就好了，不太需要为工程化配置分心。

更关键的是：

> 整个 Demo 框架搭好后，我有一种「这个东西是可以往前认真维护」的感觉，而不是写完就丢。

这和我之前写很多 Node 小脚本的心理预期是完全不一样的。

## 再聊一句「全栈」：TS 之后，运行时是谁？

周末刷 X，看到老许的[帖子](https://x.com/xushiwei/status/1997328503985852798)，如下：

![080](https://stack-mcell.tos-cn-shanghai.volces.com/080.webp)

这句话我很认同。
前后端统一 TS 技术栈，对个人开发者来说太友好了：

- 一门语言，从浏览器跑到服务端、再到 CLI、工具链
- 类型系统本身就成为你的「文档 + 校验器」

那顺着这个思路，下一步的问题就自然来了：

> 既然语言是 TypeScript，那**运行时**呢？
> 未来的 TS 运行时，会不会从 Node，逐渐走向 Bun（一部分场景）？

我不打算在这里给出一个结论——毕竟 Node 的体量、生态、历史沉淀摆在那里，而 Bun 目前也还只是一个「两年多一点」的新 runtime。([bun.sh][2])

但从我自己的体验看，有两点很值得关注：

1. **Bun 是为「现代 JS/TS 开发」重新设计过的**
   它自带 bundler、test runner、包管理器，不再是「一个 runtime + 一堆第三方工具拼装」的模式。([bun.sh][2])

2. **Bun 和 Agent、AI 工程这类新场景的契合度异常高**
   - CLI 需要冷启动快 → Bun 做得很好
   - 项目喜欢 all-in-one 工具链 → Bun 直接内置
   - 你本来就写 TS → Bun 对 TS 原生友好

这些特性，叠加起来就会让人产生那种感觉：

> 「如果我要重写一遍现在手里这些 Node 脚本、工具、Agent，那好像真的可以考虑直接上 Bun。」

## 这个专题想写些什么？

既然已经有了实践的契机（ReAct Agent Demo），再加上我一贯「学新东西喜欢顺手写点东西」的习惯，那干脆就开一个新专题：《Bun 指南》。

**这第一篇就是引言，只回答一个问题：为什么要学 Bun？**

后面的几篇，我打算按这样的节奏展开（暂定）：

1. **安装与上手：从 Node 迁移到 Bun 有多难？**
   - 安装 Bun
   - 跑起第一个 `bun run` / `bun dev`
   - 把一个简单的 Node 脚本迁移到 Bun

2. **Bun 的 all-in-one 工具链**
   - 包管理器：`bun install` vs npm/pnpm
   - `bun test`：内置测试如何用
   - `bun build`：打包、构建、单文件可执行

3. **用 Bun 写 HTTP 服务**
   - `Bun.serve()` 的基本用法([bun.sh][2])
   - 和 Node / Express 的直观对比
   - 简单的 API 服务实战

4. **文件、进程与工具脚本：Bun 的标准库体验**
   - `Bun.file()` / `Bun.write()` 等常用 API
   - 用 Bun 写一个实用 CLI 小工具

5. **实战篇：用 Bun + TS 写一个 ReAct Agent Demo**
   - 核心 loop 逻辑拆解
   - 如何组织「工具」层（read / write / 调用外部接口）
   - 运行、调试与「AI Coding 助攻」的一些经验

6. **踩坑记录 & 迁移经验**
   - 哪些地方真的爽了
   - 哪些地方还不如 Node 成熟
   - 写给准备从 Node 迁到 Bun 的你

如果你已经会写 JavaScript / Node，这个专题不会从「什么是 Promise」讲起，而会更聚焦在：

- **从 Node 迁移到 Bun 时，大脑需要切换的那一小部分东西**
- **在 Bun 里，如何用尽量少的代码做更多事**
- **结合 Agent / AI 工程场景，感受下一代 JS/TS runtime 的味道**

## 写在最后

我并不打算把 Bun 神化成「Node 杀手」——至少短期内，它更像是：

> 一个极适合「个人开发者 / 小团队 / 新项目 / Agent 工程」尝鲜的 JS/TS 运行时。

而这个系列，就是我在这个尝试过程中的「实践笔记」：

- 一部分是 Bun 本身的能力整理
- 一部分是我做 ReAct Agent 的真实踩坑经验
- 还有一部分，是在这个过程中我对「全栈 / TS / runtime 演进」的一些小思考

如果你：

- 已经会 Node / TS
- 正在关注 Agent / AI 工程
- 又对「更快、更简洁的 JS/TS 运行时」有点好奇

那欢迎一起把这个系列看下去，也欢迎你在实践中告诉我：
**在你的场景里，Bun 到底是不是一个更好的选择？**

- [Reuters](https://www.reuters.com/business/media-telecom/anthropic-acquires-developer-tool-startup-bun-scale-ai-coding-2025-12-02/)

[1]: https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone 'Anthropic acquires Bun as Claude Code reaches $1B milestone'
[2]: https://bun.sh/ 'Bun — A fast all-in-one JavaScript runtime'
[3]: https://www.reuters.com/business/media-telecom/anthropic-acquires-developer-tool-startup-bun-scale-ai-coding-2025-12-02/ 'Anthropic acquires developer tool startup Bun to scale AI coding'
