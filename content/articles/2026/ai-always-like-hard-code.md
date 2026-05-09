---
type: article
title: 'AI 编程的隐形陷阱：被 Hardcode 淹没的代码库'
date: 2026-02-10
updated: 2026-02-10
description: '建议各位用 AI 跑代码的朋友，现在就去检查一下你的代码库。别让 AI 的便利，变成未来重构时的眼泪。'
keywords: [AI编程, Hardcode, 代码质量, AI Agent, 重构]
order: 39
---

![202605](https://stack-mcell.tos-cn-shanghai.volces.com/202605.png)

最近重度依赖 AI Agent（比如 Claude Code/Codex）做开发，本以为效率原地起飞 🚀。直到这两天为了加新功能，我不得不去通读了一遍它写的代码。

看完直接一身冷汗 😓。

我发现目前的 AI 在写代码时，有一个极其隐蔽但致命的通病：**疯狂 Hardcode (硬编码)。**

在 TypeScript 的世界里，我们追求的是类型安全和重构友好。但 AI 似乎只想走捷径。举个例子，明明定义了枚举，AI 却偏要在逻辑判断里写魔术字符串 `if (task.result === 'error')`，而不是类型安全的 `if (task.result === TaskStatus.Error)`。

这看起来是小事，实际上是个超级大坑：

- **安全感假象**：硬编码字符串直接绕过了 TS 编译器检查。
- **重构灾难**：当你修改状态名时，`tsc` 不会报错，漏改的死字符串成了埋在系统里的“定时炸弹” 💣。
- **技术债堆积**：AI 这种“能跑就行”的思维惰性，是对项目架构的慢性自杀。

既然 AI 喜欢偷懒，我只能给它“上强度”了 🔥。

我的解决办法简单粗暴，直接在项目根目录的 `AGENTS.md`（System Prompt）里追加了铁律：

- **严禁 Hardcode**：任何状态、配置必须使用常量或枚举，严禁使用原始字符串。
- **闭环自检**：每一轮修改后，必须自动执行并通过 `tsc` / `go build`。报错了自己改完再说话。

（完）
