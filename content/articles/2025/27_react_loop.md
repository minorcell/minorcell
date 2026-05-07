---
type: article
date: 2025-10-27
title: AI Agent ReAct 与 Loop
description: 深入解析 AI Agent 的 ReAct 架构和工作循环原理，探讨智能体如何实现自动化任务执行，从理论到实践的完整指南。
author: mcell
tags:
  - AI Agent
  - ReAct
  - Loop
  - LLM
  - 人工智能
  - 大语言模型
  - 工具调用
  - 智能体架构
  - 自动化
  - AI工程
keywords:
  - ReAct架构
  - AI Agent循环
  - 智能体工作原理
  - LLM工具调用
  - Agent自动化
  - 思考行动循环
  - AI推理执行
  - 智能体设计模式
  - 工具执行机制
  - AI Agent开发
---

![086.webp](https://stack-mcell.tos-cn-shanghai.volces.com/086.webp)

我一直在使用 ChatGPT 或通义千问这样的 AI 工具，它们很强大，但多数情况下都是“一问一答”。我提一个问题，它给一个答案。

但我注意到，像 Manus 或 Claude Code CLI 这样的“Agent”（智能体）产品，它们似乎可以**自动执行**任务。你给它一个目标，它会自己去调用工具、分析结果、继续下一步，直到任务完成。

![066](https://stack-mcell.tos-cn-shanghai.volces.com/066.png)

这到底是怎么做到的？它如何摆脱“一问一答”的限制，实现自动循环？这就是我这周探索的问题。

## 关键概念：ReAct

我读了一些资料，发现了一个关键概念：**ReAct**。

这是 2022 年一篇论文（[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)）提出的思想。它模仿了人类的工作方式：

1.  **Reason（思考）**：分析当前情况，决定下一步该做什么。
2.  **Act（行动）**：执行一个动作（比如调用工具、搜索信息）。

完成“行动”后，会得到一个新的“观察”（Observation），比如工具的返回结果。然后，Agent 带着这个新结果，回到第 1 步，再次“思考”，形成一个循环。

## 一个线索：Claude 的日志

这个“思考-行动”的循环听起来很合理。为了验证它，我做了一个小实验。

我查看了 Claude 编码助手（我在 Mac 上的路径是 `./claude/projects/*.jsonl`）的会话日志文件。这些 `.jsonl` 文件记录了我和 Agent 的完整对话。

![067](https://stack-mcell.tos-cn-shanghai.volces.com/067.png)

我发现，里面的消息（Message）并不仅仅是“我问”和“它答”，而是主要有四种类型：

- `user`：用户的消息。
- `assistant`：模型（Agent）的消息。
- `tool_call`：模型决定调用一个工具。
- `tool_result`：工具执行后返回的结果。

这揭示了一个秘密：`assistant` 的回复并不总是最终答案。它可能是一个 `tool_call`（工具调用）请求，用来告诉外部程序：“请帮我执行这个函数”。

执行完毕后，系统会把 `tool_result`（工具结果）再发给 `assistant`。

## 流程：一个循环

看到这里，我基本想通了。Agent 的自动执行，本质上就是这样一个流程：

> `[用户输入]` -\> `[LLM 思考]` -\> `[决定：调用工具 A]` -\> `[系统执行 A]` -\> `[A 的结果]` -\> `[LLM 思考]` -\> `[决定：调用工具 B]` -\> `[系统执行 B]` -\> ... -\> `[最终答案]`

这个流程的核心，就是一个**循环（Loop）**。

只要 LLM 返回的不是最终答案，而是一个 `tool_call`，系统就去执行它，然后把结果塞回去，让 LLM 继续“思考”。

## Demo 快速验证

我的逻辑很清晰：一个主函数，它负责调用 LLM。调用后，检查返回结果。

- 如果结果是普通文本（最终答案），就返回它。
- 如果结果是 `tool_call`，就去执行工具，然后把工具结果和之前的对话历史“拼”在一起，**递归调用**自己。

下面是一个简化的伪代码：

```javascript
class SimpleAgent {
  async chat(message) {
    const assistantResponse = await this.callLLM(message)
    if (assistantResponse.hasToolCall) {
      const toolResult = await this.callTool(assistantResponse.toolCall) // 递归调用，将tool result作为新消息
      return this.chat(toolResult)
    }
    return assistantResponse.content
  }
}
```

为了快速验证我的想法，我让 Claude Code 基于 Plasmo 快速开发了一个侧边栏形式的 Browser Agent，效果如下：

![068](https://stack-mcell.tos-cn-shanghai.volces.com/068.png)

> 这不是产品，只是 Demo。仅用于验证我自己所理解的 Loop。

## 我的感想

在做完这些事情以后，我豁然开朗。

Agent 的“自动执行”，其核心就是这个 **“LLM 思考 -> 工具执行 -> 结果反馈 -> LLM 再思考”** 的循环。

当然，我这个实现非常简陋。一个工业级的 Agent 框架（比如 LangChain）要复杂得多，它们需要处理：

1.  **LLM 兼容**：如何适配不同厂商（OpenAI, Anthropic, Google）的接口和 `tool_call` 格式。
2.  **工具管理**：如何动态注册、描述和安全地执行工具。
3.  **记忆（Memory）**：如何在循环中管理越来越长的对话历史，防止 Token 溢出。
4.  **路由（Router）**：当有上百个工具时，如何决定调用哪一个。

但通过亲自动手，我总算摸清了 ReAct 架构的基本原理。这对于我后续的学习，算是打下了一个很好的基础吧。

（完）
