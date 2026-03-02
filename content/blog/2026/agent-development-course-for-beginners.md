---
title: '从零构建一个 Mini Claude Code：面向初学者的 Agent 开发实战指南'
description: '这篇文章源自前两天我做的一次 Agent 开发实战公开课。面向零基础讲清楚"Agent 是什么"比写代码本身难得多——你不能一上来就甩论文，也不能全程只讲故事。'
date: '2026-03-02'
order: 46
---

![202624](https://stack-mcell.tos-cn-shanghai.volces.com/202624.png)

> 本次课程相关链接：
>
> 源代码仓库：[mini-claude-code](https://github.com/minorcell/mini-claude-code)
>
> Issues 风格教案（本文总结自此）：[mini-claude-code/issues](https://github.com/minorcell/mini-claude-code/issues2)
>
> Mini Claude Code: [mini-claude-code](https://github.com/minorcell/mini-claude-code/tree/main/projects/mini-claude-code)
>
> Vercel AI SDK 快速上手：[Vercel AI SDK 最小用法](https://github.com/minorcell/mini-claude-code/issues/3)
>
> Memo Code：[Github/minorcell/memo-code](https://github.com/minorcell/memo-code)

这篇文章源自前两天我做的一次 Agent 开发实战公开课。面向零基础讲清楚"Agent 是什么"比写代码本身难得多——你不能一上来就甩论文，也不能全程只讲故事。

最终的效果还不错，至少最后同学们人手一个能跑起来的Mini Claude Code。本文把整个教学内容重新整理成这篇博客，方便没去现场的朋友回顾，也给想自己动手的朋友们一个完整的指引。

## 课程目标

在开始之前，先明确一下我们希望达成的学习目标：

- 理解为什么 Agent 可以做事情，而 ChatBot 不能
- 听得懂 ReAct 与 Agent 的基本架构
- 能跑通最小 TypeScript Agent
- 带走工程落地的实际经验

这四个目标也是我们整篇文章的脉络。接下来逐一展开。

## 为什么 Agent 和 ChatBot 不一样？

![202629](https://stack-mcell.tos-cn-shanghai.volces.com/202629.png)

这是个关键问题。澄清了这个，后面很多东西就自然通了。

### Agents 的例子

先来看一些 Agent 的实际例子：

- 春节期间的千问："帮我点一杯奶茶"
- Manus："帮我做一个个人博客网站"
- Claude Code CLI / Cursor IDE："帮我修复这个 Bug..."
- OpenClaw："帮我整理一下谷歌邮件"
- ......

可以看到明显的几个共同点：

1. Agent 能**做事情**
2. Agent 能**持续执行任务，直到完成目标**
3. Agent 能**和外部系统交互**

### 从 ChatBot 到 Agent 的演进

早期大模型产品，最经典的是 ChatGPT 的网页版本。用户输入提示词，ChatGPT 回复一段文字，这就是"ChatBot"。那时候它**可以短暂记住前后说了什么**。

比较有意思的是，如果你告诉大模型，让它**扮演什么角色、能干什么、不能干什么**，它确实会这么做，比如：

- "你是一个小红书博主，你的核心工作是...."
- "你是一个资深的 Web 前端高手，....."

后来，网页版的 ChatGPT 又支持了查询天气、支持网络搜索。比如："明日上海天气如何？"，它便会去**查询上海的天气**，然后告诉你它查到的结果，并且是用自然语言回复（而不是天气查询接口的原始 JSON 输出）："明天上海天气晴朗，气温约在 16-23 摄氏度，可以穿卫衣出行～"。

### 三个关键要素

其实到这里就已经不是简单的 ChatBot 了，而是"Agent"。用技术术语来说，这三个要素构成了 **LLM-based Agent 的最小 viable architecture（最小可行架构）**：

| 用户感知                   | 技术术语                          | 技术本质                                                                                                       |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **记住前后说了什么**       | **上下文窗口**或 **对话状态管理** | 维护一个消息数组，包含 system/user/assistant/tool 角色的历史消息，作为模型的输入上下文                         |
| **扮演什么角色、能干什么** | **系统提示词**或 **角色注入**     | 在请求体最前端的 `system` 消息中定义行为边界、能力范围、输出格式约束，通过 **Prompt Engineering** 对齐模型行为 |
| **查询上海的天气**         | **工具调用**或 **外部能力扩展**   | 模型生成结构化输出（JSON/XML）触发外部 API，将结果以 `tool`/`function` 角色回注上下文                          |

怎么实现的？比较成熟的一种方式是 [ReAct](https://arxiv.org/abs/2210.03629)。

> 时至今日，Agent 开发范式不止 ReAct 一种。`Plan-and-Execute`、`Function/Tool Calling + Loop(ReAct Like)` 等多种模式也有较多的应用。但 ReAct 是最经典、最容易理解的一种，非常适合作为入门。

## ReAct——让模型"边想边做"

**ReAct**（**Re**asoning + **Act**ing）是 Agent 架构的一种核心范式。它不再是大模型单次输入输出的"问答"，而是一个**"观察 → 思考 → 行动 → 再观察"**的循环过程。

### 一个例子

想象你让 Manus "帮我做一个个人博客网站"。如果是传统 ChatBot，它会给你一段代码和教程，然后结束对话，你需要手动复制粘贴代码到本地测试，有问题之后再把错误发给它，让它再次修复。

但 ReAct 模式下，Agent 会这样执行：

```bash
[思考 Thought]
用户需要一个博客网站，需求是：简洁风格、支持 Markdown、部署到线上。
我需要：1) 先创建项目结构 2) 编写 HTML/CSS  3) 添加交互逻辑  4) 部署到服务器。
第一步应该是初始化 Next.js 项目。

[行动 Action]
执行 shell 命令：
px create-next-app@latest my-blog --typescript --tailwind

[观察 Observation]
命令执行成功，项目目录已创建，但终端提示需要安装依赖。

[思考 Thought]
依赖安装是下一步，然后我需要创建首页组件。等等，用户要求简洁风格，我应该先查看默认生成的文件结构，决定保留哪些。

[行动 Action]
执行：cd my-blog && ls -la（查看目录结构）

...（循环继续，直到网站部署完成）
```

### 技术实现：控制流的转移

不难看出，ReAct 的关键在于**控制流**从我们转移到了模型：

| 阶段            | 控制方 | 交互方式                                                  |
| --------------- | ------ | --------------------------------------------------------- |
| **ChatBot**     | 人类   | 人问 → 模型答 → **人决定下一步**                          |
| **ReAct Agent** | 模型   | 模型观察 → 模型决策 → **模型自主执行** → 模型根据反馈调整 |

具体实现时，一个简单的 Agent 系统提示词可能会包含这样的指令框架：

```xml
你是一个xxx的助手。
...
你可以使用以下工具：[文件操作、命令执行、网络搜索...]

每次回复必须遵循以下格式：
<observation>当前环境状态/工具返回结果</observation>
<thought>分析当前状况，决定下一步行动</thought>
<action>{"tool": "tool_name", "params": {...}}</action>
```

当模型输出 `<action>` 时，Agent 框架（如 Claude Code CLI 的运行时）会**解析这段 JSON，实际调用对应的工具（落地到代码就是执行一段函数）**，然后将工具返回的结果以 `<observation>` 的形式**重新注入上下文**，再次请求模型，形成闭环。

### 为什么这能实现"持续执行"？

**自我修正能力**：如果某一步行动报错（比如代码编译失败），这个错误会作为新的 Observation 回到模型，模型会在 Thought 中分析错误原因，调整 Action（比如修改代码），而不是像 ChatBot 那样等待用户手动修复。

**任务分解**：面对"帮我修复这个 Bug"这样的复杂指令，模型会在 Thought 中自动拆解：先定位文件 → 阅读相关代码 → 理解逻辑 → 修改 → 测试验证，而不是一次性尝试解决（那样往往失败）。

**状态持久**：每一轮循环的 Observation 和 Thought 都追加到上下文中，Agent 不会"遗忘"已经完成的步骤（比如已经创建了哪个文件、修改了哪行代码），确保任务连续性。

这正是早期 ChatBot 与现在 Agent 的本质区别：**前者是"一次性建议"，后者是"闭环执行"**。

## ReAct Agent 最小架构

![202628](https://stack-mcell.tos-cn-shanghai.volces.com/202628.png)

把上面的东西组装起来，Agent 的最小架构可以用一个公式概括：

```bash
Agent = ReAct + Tools + UI
```

或者更详细点：

```
Agent = ReAct(LLM + Context(System + User + LLM + Tool)) + Tools + UI
```

- **UI**：用户交互界面，CLI、Web、APP 都行
- **Tools**：让 Agent 支持哪些功能，就需要对应的工具支持
- **ReAct**：如上文所说，它核心是个 Loop 循环

> 注解：
> **LLM**: 大模型本身，作为整个 Agent 的"脑子"
> **System**：系统提示词，通常包含基础提示词、人格设定、工具使用指南等

一个最小可行的 Agent 便是如此。

## 最小 Agent 实战——天气查询（Bun + TypeScript）

![202627](https://stack-mcell.tos-cn-shanghai.volces.com/202627.png)

光说不练假把式。我们来动手做一个最小的 Agent。

### 项目初始化

用 Bun + TypeScript，零依赖：

```bash
mkdir agent-loop && cd agent-loop
bun init -y
bun add axios
```

完整的项目结构如下：

```
agent-loop/
├── main.ts      # 核心 Agent Loop
├── tools.ts     # 工具定义
├── prompt.md    # 系统提示词
└── package.json
```

### 工具定义（tools.ts）

首先定义两个最小集的工具：获取当前时间和查询天气。

```typescript
// tools.ts
export type ToolName = 'getCurrentTime' | 'getWeather'

export const TOOLKIT: Record<ToolName, (input: string) => Promise<string>> = {
  getCurrentTime: async () => {
    return new Date().toISOString()
  },

  getWeather: async (input: string) => {
    // 解析城市名称（简单粗暴，实际项目请用更好的解析）
    const city = input.trim()
    // 这里调用免费的天气 API，实际使用请替换为真实的 API
    try {
      const response = await fetch(`https://wttr.in/${city}?format=j1`)
      const data = await response.json()
      const current = data.current_condition[0]
      return `${city} 当前天气：${current.weatherDesc[0].value}，温度 ${current.temp_C}°C`
    } catch {
      return `无法获取 ${city} 的天气，请检查城市名称是否正确。`
    }
  },
}
```

### 系统提示词（prompt.md）

系统提示词告诉模型如何使用这两个工具，以及输出的格式要求。

```markdown
你是天气查询的工具型助手，回答要简洁。
可用工具（action 的 tool 属性需与下列名称一致）：

- getTime: 返回当前 time 字符串，参数为空。
- getWeather: 返回模拟天气信息字符串，参数为 JSON，如 {"city":"上海","time":"2026-02-27 10:00"}。

回复格式（严格使用 XML，小写标签）：
<thought>对问题的简短思考</thought>
<action tool="工具名">工具输入</action> <!-- 若需要工具 -->
等待 <observation> 后再继续思考。
如果已可直接回答，则输出：
<final>最终回答（中文，必要时引用数据来源）</final>

规则：

- 每次仅调用一个工具；工具输入要尽量具体。
- 当用户只问“现在几点”时，优先调用 getTime。
- 查询天气时，必须调用 getWeather，并提供 city 和 time 两个字段。
- 如果拿到 observation 后有了答案，应输出 <final> 而不是重复调用。
- 未知工具时要说明，但仍用 XML 格式。
- 避免幻觉，不确定时请说明。
```

### 核心 Loop 代码（main.ts）

这是整个 Agent 的核心——40 行代码实现 ReAct 循环。

```typescript
// main.ts
import { TOOLKIT, type ToolName } from './tools'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 解析模型输出，提取工具调用或最终回答
function parseAssistant(text: string): {
  action?: { tool: string; input: string }
  final?: string
} {
  const toolCallMatch = text.match(
    /\[TOOL_CALL\]\s*tool:\s*(\w+)\s*input:\s*(.+)/s,
  )
  if (toolCallMatch) {
    return {
      action: {
        tool: toolCallMatch[1],
        input: toolCallMatch[2].trim(),
      },
    }
  }

  const finalMatch = text.match(/\[FINAL\]\s*(.+)/s)
  if (finalMatch) {
    return { final: finalMatch[1].trim() }
  }

  return {}
}

// 调用 LLM（这里以 OpenAI 兼容接口为例）
async function callLLMs(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(
    process.env.LLM_API_URL || 'https://api.deepseek.com/v1',
    'POST',
    {
      model: process.env.LLM_MODEL || 'deepseek-chat',
      messages,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const data = await response.json()
  return data.choices[0].message.content
}

// 核心 Agent Loop
async function AgentLoop(question: string) {
  const systemPrompt = await Bun.file('prompt.md').text()

  const history: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ]

  for (let step = 0; step < 10; step++) {
    const assistantText = await callLLMs(history)
    console.log(`\n[LLM 第 ${step + 1} 轮输出]\n${assistantText}\n`)
    history.push({ role: 'assistant', content: assistantText })

    const parsed = parseAssistant(assistantText)
    if (parsed.final) {
      return parsed.final
    }

    if (parsed.action) {
      const toolFn = TOOLKIT[parsed.action.tool as ToolName]
      let observation: string

      if (toolFn) {
        observation = await toolFn(parsed.action.input)
      } else {
        observation = `未知工具: ${parsed.action.tool}`
      }

      console.log(`<observation>${observation}</observation>\n`)

      history.push({
        role: 'user',
        content: `<observation>${observation}</observation>`,
      })
      continue
    }

    break // 未产生 action 或 final
  }

  return '未能生成最终回答，请重试或调整问题。'
}

// 主入口
const question = process.argv[2] || '上海今天天气怎么样？'
console.log(`\n用户问题: ${question}`)
console.log('─'.repeat(50))

AgentLoop(question).then((answer) => {
  console.log('─'.repeat(50))
  console.log(`\n最终回答: ${answer}\n`)
})
```

### 运行效果

![202625](https://stack-mcell.tos-cn-shanghai.volces.com/202625.png)

```bash
➜  agent-loop git:(main) bun main.ts
用户问题: 上海现在天气如何？

[LLM 第 1 轮输出]
<thought>用户询问上海现在的天气，需要获取当前时间，然后查询天气。</thought>
<action tool="getTime">获取当前时间</action>

<observation>2026-03-02T02:41:33.898Z</observation>


[LLM 第 2 轮输出]
<thought>已获得当前时间，需要调用getWeather工具查询上海此时的天气。</thought>
<action tool="getWeather">{"city":"上海","time":"2026-03-02 02:41"}</action>

<observation>天气信息：上海 在 2026-03-02 02:41 的天气为小雨，气温 15°C，北风 1 级，湿度 43%。</observation>


[LLM 第 3 轮输出]
<final>上海现在（2026-03-02 02:41）的天气为小雨，气温15°C，北风1级，湿度43%。</final>


=== 最终回答 ===
上海现在（2026-03-02 02:41）的天气为小雨，气温15°C，北风1级，湿度43%。
➜  agent-loop git:(main)
```

### 代码解读

这个 40 行的核心循环其实很简单：

1. **加载系统提示词**——从 prompt.md 文件读取
2. **维护一个 history 消息数组**——作为 Agent 的上下文记忆
3. **循环最多 10 轮**：
   - 调用大模型，获取输出
   - 解析输出：是最终回答就返回，是工具调用就执行工具并把结果填回上下文
   - 如果既不是最终回答也不是工具调用，就退出循环

这就是一个最小 Agent 的全部。没有任何复杂的框架，就是一个 `for` 循环 + 消息数组维护。

## Mini Claude Code 设计

有了最小版做基础，我们来做一个更完整的——Mini Claude Code。

### 先拆 Claude Code CLI

Claude Code CLI 是个超成熟的 Code Agent 范例。要搞 Mini 版，先来简单拆一拆它的核心：

#### 内置工具

- **文件系统**：Read File, write_file File, edit_file File, Search Files...
- **Bash/Shell**：最常用，查 Git、跑复杂命令、执行 Python/Node 代码
- **网络**：WebFetch
- **上下文管理**：Plan/Todo
- **MCP Client**
- **子 Agents**：进程间交互

#### 上下文

- 压缩机制
- 会话历史：`.claude/sessions/*.jsonl`
- Skills 系统

> 为什么会把 Skills 看作是上下文的一种？实际上在 Agent 中，我们的通常做法是在初始化时把 Skills 的索引一同注入到系统提示词里，让模型在需要时调用。它本质上是一个"工具使用指南"，一种渐进式纰漏的提示词，但又不是传统意义上的工具，所以我把它归类到上下文管理里。

#### TUI/CLI

- `claude mcp ...`, `claude -c`, `claude -p`, `claude -dangerous` 等用法
- 终端交互：slash 命令、IO 流等

### Mini 版精简设计

#### 工具设计

Mini 版工具精简到 4 个核心，够用不乱：

- **read_file / write_file / edit_file**（文件三件套）
- **bash**（Shell 执行）
- **WebFetch**（网络请求）

> 原则：工具别贪多。每多一个，模型负担就加重。Unix 哲学——一工具一事，但组合无限。

### 技术选型：为什么用 Vercel AI SDK？

之前天气 Demo 用原生 fetch 调用 LLM，手动解析 SSE。零依赖好理解，但生产级有几个问题：

**问题 1：多 Provider 适配成本高**
换一个模型提供商（OpenAI → Anthropic → Gemini），就要重写请求 URL、Header 格式、响应解析逻辑。

**问题 2：工具调用状态机要自己维护**
`agent-loop` 里的 `for` 循环、`parseAssistant()`、往 `history` 里推 observation，这些都是在手写一个工具调用的状态机。稍有差错，模型就会丢失上下文。

**问题 3：没有类型安全**
工具的输入参数是一个裸字符串，解析 JSON 要靠 `try/catch`，参数字段靠字符串 key 访问，TypeScript 无法帮你检查。

Vercel AI SDK 解决了这三个问题：

- 用 `createOpenAI` 创建 Provider，**换模型只改一行**
- `generateText` + `maxSteps` 内置了工具调用状态机，自动处理多轮循环
- 用 `zod` 定义参数 schema，工具的 `execute` 函数拿到的是**已解析、有类型的对象**

> Vercel AI SDK 的详细用法请见：[Vercel AI SDK 最小用法](https://github.com/minorcell/mini-claude-code/issues/3)

> 为什么不用 LangChain / LangGraph？可以思考一下——它们很强大，但对于"理解 Agent 核心原理"这个目标来说，引入的复杂度可能大于带来的价值。

### Mini Claude Code 实际代码

来看 Mini Claude Code 的实际项目结构：

```
mini-claude-code/
├── src/
│   ├── agent/
│   │   ├── loop.ts      # Agent 循环核心
│   │   ├── context.ts   # 上下文管理
│   │   ├── prompt.ts    # 提示词组装
│   │   └── provider.ts  # 模型提供商配置
│   ├── tools/
│   │   ├── index.ts     # 工具注册
│   │   ├── read-file.ts
│   │   ├── write-file.ts
│   │   ├── edit-file.ts
│   │   ├── bash.ts
│   │   └── web-fetch.ts
│   ├── index.ts         # 入口
│   └── SYSTEM_PROMPT.md # 系统提示词
├── package.json
└── .env.example
```

> 详细代码在仓库：[mini-claude-code](https://github.com/minorcell/mini-claude-code/tree/main/projects/mini-claude-code)

#### Provider 配置（provider.ts）

```typescript
import { createOpenAI } from '@ai-sdk/openai'

const qiniu = createOpenAI({
  apiKey: process.env.QINIU_API_KEY!,
  baseURL: process.env.QINIU_API_URL || 'https://api.deepseek.com/v1',
})

export const model = qiniu('claude-4.6-sonnat')
```

换模型只需要改一行：

```typescript
import { openai } from '@ai-sdk/openai'

// 换成 OpenAI
export const model = openai('openai/gpt-5.3-codex')
```

#### 工具定义（tools/index.ts）

用 Vercel AI SDK 的 `tool()` + `zod` 定义工具：

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import { readFile } from './read-file'
import { writeFile } from './write-file'
import { editFile } from './edit-file'
import { bash } from './bash'
import { webFetch } from './web-fetch'

export const tools = {
  read_file: tool({
    description: '读取文件内容',
    parameters: z.object({
      path: z.string().describe('文件路径'),
    }),
    execute: async ({ path }) => readFile(path),
  }),

  write_file: tool({
    description: '写入文件内容',
    parameters: z.object({
      path: z.string().describe('文件路径'),
      content: z.string().describe('文件内容'),
    }),
    execute: async ({ path, content }) => writeFile(path, content),
  }),

  edit_file: tool({
    description: '编辑文件内容',
    parameters: z.object({
      path: z.string().describe('文件路径'),
      oldText: z.string().describe('需要替换的旧文本'),
      newText: z.string().describe('新文本'),
    }),
    execute: async ({ path, oldText, newText }) =>
      editFile(path, oldText, newText),
  }),

  bash: tool({
    description: '执行 Shell 命令',
    parameters: z.object({
      command: z.string().describe('要执行的命令'),
    }),
    execute: async ({ command }) => bash(command),
  }),

  web_fetch: tool({
    description: '获取网页内容',
    parameters: z.object({
      url: z.string().describe('网页 URL'),
    }),
    execute: async ({ url }) => webFetch(url),
  }),
}
```

注意这里的**类型安全**：参数由 zod schema 定义，SDK 自动解析，`execute` 函数拿到的 `{ path, content }` 是有类型的对象，不是字符串。

#### 核心 Loop（agent/loop.ts）

```typescript
import { generateText } from 'ai'
import { model } from './provider'
import { tools } from '../tools'
import { buildSystemPrompt } from './prompt'

export async function* runAgent(question: string) {
  const systemPrompt = await buildSystemPrompt()

  const result = await generateText({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    tools,
    maxSteps: 10,

    onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
      // 这里可以观察每一步的执行过程
      console.log('── 步骤完成 ──────────────')
      if (text) console.log('模型输出:', text)
      for (const call of toolCalls || []) {
        console.log(`调用工具: ${call.toolName}`, call.args)
      }
      for (const result of toolResults || []) {
        console.log(`工具结果: ${result.toolName}`, result.result)
      }
      console.log('结束原因:', finishReason)
    },
  })

  return result.text
}
```

很魔法的一点，**SDK 自动处理了工具调用循环**。我们只需要：

1. 配置 model
2. 注册 tools
3. 设置 maxSteps

SDK 就会自动完成：调用模型 → 检测到工具调用 → 执行工具 → 填回结果 → 再次调用模型 → ... → 直到生成最终回答。

### 运行效果

这里我们问 Mini Claude Code 这是什么项目，效果如下：

![202631](https://stack-mcell.tos-cn-shanghai.volces.com/202631.png)

比较有意思的是，还让他给自己写了一个介绍网页：

![202632](https://stack-mcell.tos-cn-shanghai.volces.com/202632.png)

### 与手写版本的对比

|              | agent-loop（手写）               | mini-claude-code（SDK） |
| ------------ | -------------------------------- | ----------------------- |
| 调用模型     | 手写 `fetch` + 解析 JSON         | `generateText()`        |
| 工具参数     | JSON.parse + 手动校验            | zod schema 自动解析     |
| 工具调用循环 | 手写 `for` 循环 + `history.push` | `maxSteps` 自动处理     |
| 换 Provider  | 改 URL、Header、解析逻辑         | 换一行 `createOpenAI`   |
| 观察执行过程 | `console.log` 散落各处           | `onStepFinish` 回调     |

---

## 一些实际工程经验

![202626](https://stack-mcell.tos-cn-shanghai.volces.com/202626.png)

> 我接触 Agent 开发也算是机缘巧合，从最开始大量的使用 Claude Code 等 Code Agent 编程工具、感兴趣然后自己去研究、最后学习、实践着去做。但是没真正下场之前，我以为 Claude Code 这种东西"差不多就那样"。直到我在做 [Memo Code](https://memo.mcell.top/) 的过程中才意识到：**从"能跑"到"能解决真实问题、能稳定投产"，中间的鸿沟还是软件工程。**

这里我也选一些比较经典的三类 Agent 的工程问题来聊聊，给大家一些经验：

### Agent 上下文工程

聊 Agent / 大模型，绕不开上下文：**越跑越长、越长越容易忘**。通常要从两个入口拆开看：

1. **上下文太长了怎么办**（模型有固定上下文长度）
2. **怎么从源头控制上下文不要暴涨**

#### 1）上下文太长：压缩 + 断环重启

通用解法是"压缩"。实现上可以很朴素：做 token 计数；当 session 中 context 的 token 占比超过阈值（比如 80%）时，**中断当前 Loop**，把历史上下文整体丢给模型，让它总结：

- 已经做了什么
- 还没做什么
- 当前状态 / 关键约束
- 后续注意事项（坑、边界条件、依赖）

然后**新开一个会话**（或滑动窗口），后续只发送：系统提示词 + 总结 + 新产生的内容。

这一步的关键不在"总结写得多漂亮"，而在于它要能支撑下一轮继续干活：信息结构要稳定、可复用、可增量更新。

#### 2）防止上下文暴涨：从源头管住工具输出

真正让上下文爆炸的，很多时候不是用户对话，而是：

- 工具返回的超长结果（search / read / list）
- MCP 工具的"工作痕迹"（日志、堆栈、长 JSON）
- 不合理的提示词（把无关信息一次性塞满）

举个经典例子：TS 项目里的 `node_modules`，比宇宙还深还大。模型调用 search 去扫项目中的 js/ts 文件，如果 Search 工具没有合理的防护机制，工具返回可能直接**无限长**，一次下来就能把上下文撑爆。

所以工具设计本身非常重要，至少要有两道闸门：

- **黑白名单 / ignore 规则**：禁止访问某些目录（建议复用 ignore 库，兼容 `.gitignore`）
- **工具结果拦截**：当工具输出超过阈值，要么截断，要么直接返回一个明确的 system-hint，让模型知道"有内容，但被省略了"，避免它误以为自己看到了全量信息

比如这种形式就很好（明确、可机器解析、可追踪）：

```xml
<system_hint type="tool_output_omitted" tool="${toolName}" reason="too_long" actual_chars="${actualChars}" max_chars="${maxChars}">
  Tool output too long, automatically omitted.
</system_hint>
```

### Agent 安全问题

Agent 一旦"能动手"，安全问题就不是抽象讨论，而是迟早会发生的事故。

一些我觉得必须认真对待的点：

- **危险命令误执行**：`rm -rf /` 是最经典的例子（早期 Gemini CLI 就踩过）。以及最近"小龙虾误删某高管历史邮件"的故事......这类事故的共同点是：**不是模型一定会坏，而是系统缺少最后一道保险**
- **子进程泄漏 / 资源泄漏**：Agent 工作时会频繁启停子进程，处理不当就容易出现不可控的内存泄漏。我自己就遇到过：[Codex 内存泄漏 54GB，电脑死机](https://github.com/openai/codex/issues/9345)。这类问题通常不是"优化一下就好"，而是要把资源回收当作一等公民
- **工具权限边界**：`--dangerous` 确实能释放双手，但也会释放风险。到底是给"全程全权限"，还是"关键操作每次审批"，需要按场景权衡：频繁审批会拖慢体验，但无审批的代价可能是灾难级

[七牛 Agent 专用沙箱](https://developer.qiniu.com/las/13281/sandbox-overview) 或者 e2b、Docker 容器等做法是直接提供给 Agent 一个隔离环境，与用户本地环境隔离开。

可以参考做法：[Memo Code 安全设计：子进程、命令防护与权限审批的统一方案](https://memo.mcell.top/zh/blog/security-design/)，这里不做过多赘述。

### Agent 系统提示词

系统提示词怎么写的"内容套路"，市面上已经很多了。这里更想聊**工程层面的格式与组装**：什么样的提示词结构更利好大模型、也更利好长期维护。

很多人把系统提示词当成一个固定的 Markdown 文件来管，但在真实项目里，系统提示词往往要承载这些东西：

- 基础行为指令（核心身份、输出规范）
- 用户偏好设置（比如 `SOUL.md`）
- 项目级上下文（比如 `AGENTS.md`）
- 动态工具能力（内置工具 + MCP 工具清单/用法）
- Skills 技能（`.agents/skills/skillname/SKILL.md`）
- 运行时异常状态（截断提示、危险命令拦截、工具降级）

问题是：**来源不同、格式不同、优先级不同，而且有些是运行时动态生成的**。这就需要一套统一的拼装逻辑（比如分段、打标签、定义优先级、支持增量更新）。

没有最优解，我把自己在做 Memo Code 时的设计思路整理成了一篇文章：
[Memo Code 系统提示词架构解析：从模板到上下文组装](https://memo.mcell.top/zh/blog/prompt-architecture/)

---

## 收尾

这次课程最大的收获其实是回答了一个问题："Agent 难不难？"

答案是：**核心概念不难，40 行代码就能跑起来。但从玩具到真正能解决问题，中间每一步还是软件工程。**

希望这篇文章能帮你推开 Agent 开发的大门。代码仓库在这里：[mini-claude-code](https://github.com/minorcell/mini-claude-code)。相关的教案我也直接放在 Issues 里了。

项目里有两个实战案例：

- `projects/agent-loop` —— 纯手写版本，适合理解原理
- `projects/mini-claude-code` —— 基于 Vercel AI SDK，适合生产使用

建议先跑通 agent-loop，理解核心循环；再去看 mini-claude-code，学习工程实践。

（完）
