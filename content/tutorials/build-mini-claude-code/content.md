---
title: 从零构建一个 Mini Claude Code
description: 从手写 40 行 ReAct 循环开始，逐步构建出有工具调用、上下文压缩和安全防护的 Code Agent
type: interactive
entryFile: content.md
tags: [Agent, TypeScript, Vercel AI SDK, ReAct]
---

> **ChatBot 给建议，Agent 闭环执行。闭环的秘密是 ReAct 循环 → 循环靠手写几十行就能理解 → 理解了再引入 Vercel AI SDK 把工程细节标准化 → 加上工具边界、上下文压缩、安全护栏 → 一个能处理真实代码任务的 Code Agent 就成了。**

```ts step file=steps/00.ts highlight=1:9

```

## 第一章 · Agent 和 ChatBot，到底差在哪？

### 为什么"会调 API 的聊天机器人"不等于 Agent？

写代码之前，先把概念砸实。很多教程直接从框架开始，结果读者只知道 `generateText({ tools })` 能跑，却不知道循环里每一步在干什么。这不是小问题——一旦出 bug，你连从哪里排查都不知道。

普通 ChatBot 的交互只有三步：

```
用户输入问题
  ↓
模型生成回答
  ↓
用户阅读回答，并决定下一步
```

控制流在人这边。模型只负责给一段文本建议，要不要执行、怎么执行、执行完怎么处理错误，全由人完成。

Agent 的交互不一样：

```
用户给出目标
  ↓
模型分析当前状态 → 选择工具 → 执行
  ↓
工具结果回到上下文
  ↓
模型基于结果继续决策
  ↓
直到任务完成或需要用户确认
```

这就是 Agent 的关键：**控制流从人转移到了模型和运行时系统组成的闭环里。** 用户不再每一步手动推进，而是给出目标，让 Agent 自己拆解、执行、观察结果并调整策略。

### 三个最小要素

拆开来看，一个 LLM-based Agent 至少需要三样东西：

| 用户感知 | 技术术语 | 本质 |
|----------|----------|------|
| **记住前后说了什么** | 上下文窗口 / 对话状态管理 | 维护一个消息数组，包含 system/user/assistant/tool 等历史消息 |
| **知道自己是谁、能做什么** | 系统提示词 / 角色注入 | 在 `system` 消息里定义能力边界、行为规则、输出格式和安全约束 |
| **能和外部世界交互** | 工具调用 / 外部能力扩展 | 模型输出结构化工具调用，代码执行函数，再把结果回填给模型继续判断 |

只有前两个，它是一个更聪明的 ChatBot；加上第三个，并且能把工具结果重新纳入下一轮决策，它才开始具备 Agent 的形态。

### 为什么工具调用会改变一切？

大模型本身不会真的读文件、改代码、查网页、运行测试。它只能生成文本。所谓"工具调用"，本质是运行时和模型之间的一种约定：

1. 模型按约定输出"我要调用某个工具，参数是什么"。
2. 你的程序解析这段输出。
3. 你的程序在真实环境里执行对应函数。
4. 执行结果作为新消息追加回上下文。
5. 模型看到结果后决定下一步。

这个机制让模型从"回答问题"变成"推动任务"。比如你让 Code Agent 修一个 Bug，它不应该直接猜答案，而应该：读报错 → 搜相关文件 → 读上下文 → 改最小必要代码 → 跑测试 → 失败则根据错误继续修。

**ChatBot 给建议，Agent 闭环执行。** 这句不是修辞，是本质。

---

## 第二章 · ReAct：让模型边想边做

### ReAct 在解决什么问题？

实现 Agent 有很多范式，入门最适合先理解 ReAct。

ReAct 是 **Rea**soning + **Act**ing 的缩写，来自 Yao et al. 2022 年的论文。它要解决的问题很具体：纯推理（Chain-of-Thought）会幻觉和错误传播，纯动作执行（强化学习）缺乏透明度和可解释性。ReAct 把两者交错在一起——**推理帮助模型规划和处理异常，动作让推理有外部事实可依。**

把这个交错过程展开就是 ReAct 循环：

```
Thought（思考下一步怎么做）
  ↓
Action（调用工具或执行动作）
  ↓
Observation（拿到工具返回的结果）
  ↓
Thought（基于结果再思考）
  ↓
继续循环，直到能给出最终答案
```

假设用户问"上海现在天气怎么样？"，一个 ReAct Agent 的执行过程：

```
[Thought]
用户要查上海当前天气，需要先知道当前时间，再查询天气。

[Action]
调用 getTime 工具

[Observation]
2026-03-02T02:41:33.898Z

[Thought]
已经拿到当前时间，现在查询上海在这个时间点的天气。

[Action]
调用 getWeather，参数 {"city":"上海","time":"2026-03-02 02:41"}

[Observation]
上海在 2026-03-02 02:41 的天气为小雨，气温 15°C。

[Final]
上海现在是小雨，气温约 15°C。
```

注意两个重点。

第一，模型不是一次性回答，而是在多轮中逐步推进。每一步都依赖上一轮工具返回的 Observation。

第二，工具结果不是给用户看的终点，而是给模型看的输入。**Agent 的能力来自这个"执行结果回填上下文"的闭环。**

### 其他 Agent 范式速览

ReAct 不是唯一的范式。知道还存在哪些，能帮你判断什么时候 ReAct 够用，什么时候该换：

**ReWOO (Reasoning WithOut Observation)**：把"规划"和"执行"拆成两个阶段。先让模型一次性生成完整执行计划（哪些步骤、调哪些工具），再在第二阶段批量执行。好处是减少模型调用次数、省 token；代价是中间步骤出错没法动态调整。适合任务步骤可预测的场景。

**Plan-and-Execute**：类似 ReWOO，但规划阶段更重。模型先生成一个带依赖关系的任务图，执行器按图逐个执行，每步结果仍然反馈给执行器。比 ReAct 更有全局视角，比 ReWOO 更灵活。LangChain 的 AgentExecutor 就是这个模式。

**Reflection**：在 ReAct 基础上加了一个"自我批评"步骤——执行若干步后，模型回头审视已完成的操作，判断是否需要调整策略。适合长任务和需要质量控制的场景。

**多 Agent 协作**：把不同职责分给不同 Agent（例如一个负责读代码、一个负责写代码、一个负责审查），通过消息传递协作。AutoGen、CrewAI 是这种模式的代表框架。架构灵活但调试难度高。

回到本教程：对于 Code Agent 这个具体场景，ReAct 的"边想边做、动态调整"是最自然的选择——代码任务的不确定性高，事先很难规划每一步。所以我们从 ReAct 讲起。

### 一个最小公式

把本教程要实现的 Agent 写成一个公式：

```
Agent = ReAct(LLM + Context) + Tools + UI
```

展开：

- **LLM**：理解任务、规划下一步、生成工具调用或最终回答。
- **Context**：保存系统提示词、用户输入、模型输出、工具结果。
- **Tools**：真实执行动作——读文件、写文件、运行命令。
- **UI**：用户和 Agent 交互的入口，CLI / Web / IDE 插件。
- **ReAct Loop**：把以上部件串起来的循环。

接下来我们先不用任何框架，自己写这个循环。

---

## 第三章 · 手写一个 Agent Loop

### 为什么从零写？

这个最小项目叫 `agent-loop`。它只解决一件事：**让你看见 Agent 的核心循环到底长什么样。**

很多教程直接从框架开始讲，结果读者只知道"调用某个 API 就能跑"，但不知道背后的循环、消息、工具结果回填到底发生了什么。我们反过来——先手写一个最小闭环，理解了每一行，再引入 SDK。这样以后换框架、出问题、或者想自己改循环逻辑，你都有底。

用 Bun + TypeScript。除了调用模型 API，不引入任何框架。每一个文件都和 Agent 的核心机制直接相关。

### 准备项目

```bash
mkdir agent-loop && cd agent-loop
bun init -y
```

项目结构只有三个文件：

```
agent-loop/
├── main.ts      # Agent 核心循环
├── tools.ts     # 工具定义
└── prompt.md    # 系统提示词
```

这个项目实现一个天气查询 Agent。两个工具：`getTime` 返回当前时间，`getWeather` 根据城市和时间返回模拟天气。

为什么用天气，不直接写 Code Agent？因为天气例子足够小，能让你专注理解工具调用闭环本身。读文件、改文件、运行命令本质上是同一套机制，只是工具更复杂、风险更高。**先理解机制，再堆能力。**

### 先定义核心数据结构

Agent 的核心状态是消息历史。每条消息至少包含两个字段：谁说的，以及说了什么。

```ts step file=steps/00.ts

```

两个类型：

- `ChatMessage`：发送给大模型的消息格式。
- `ParsedAssistant`：从模型回复里解析出的结构化意图。

`ParsedAssistant` 很关键。模型原始输出是字符串，但运行时需要知道它到底是在请求工具，还是已经给出最终答案。所以我们约定：解析结果要么包含 `action`，要么包含 `final`。

这也是 Agent 运行时最常见的工作之一：**把模型生成的文本转成程序可以执行的结构。**

### 调用大模型

接下来实现 `callLLMs`。它只做一件事：把消息数组发给模型 API，返回 assistant 的文本回复。

```ts step file=steps/01.ts highlight=1:28

```

这里用的是 DeepSeek 的 OpenAI 兼容接口，请求体和 OpenAI Chat Completions 类似。

几个细节值得注意：

- `messages` 是完整历史，不只是最新问题。模型是否"记得"之前发生了什么，取决于你有没有把历史再次发给它。
- `temperature` 设置为 `0.35`。工具调用需要稳定格式，温度太高会增加输出不符合约定的概率。
- API 错误必须抛出来。Agent 调试时，沉默失败会非常难查。

到这里，我们只完成了"能和模型说话"。它还不是 Agent——还没解析动作，也没执行工具。

### 解析模型回复

为了让模型输出可解析，我们约定两种 XML 标签：

```xml
<action tool="getWeather">{"city":"上海","time":"2026-03-02 02:41"}</action>
<final>上海现在是小雨，气温 15°C。</final>
```

然后用正则解析：

```ts step file=steps/02.ts highlight=1:16

```

这段代码很朴素，但它揭示了一个事实：**所谓 Agent 框架，很大一部分工作就是在处理"模型输出的结构化协议"。**

生产项目里你不一定用 XML——JSON、OpenAI Function Calling、Anthropic tool use、SDK tool calling 都可以。形式不同，本质相同：让模型用机器可读的方式表达"下一步要做什么"。

### 搭出循环骨架

现在写 ReAct 循环的骨架。

```ts step file=steps/03.ts highlight=1:24

```

这个版本还没有真正执行工具，但循环结构已经出现了：

1. 把当前 `history` 发给模型。
2. 记录模型回复。
3. 解析模型回复。
4. 如果是 `<final>`，返回最终答案。
5. 如果不是最终答案，进入下一轮或退出。

`for (let step = 0; step < 10; step++)` 是一个非常重要的保护。Agent 必须有最大步数限制，否则模型一旦陷入重复调用工具，就会无限消耗 token 和 API 费用。

### 定义工具

工具放在 `tools.ts` 里：

```ts step file=steps/04b.ts

```

设计成一个简单对象：

```ts
TOOLKIT[toolName](input) -> Promise<string>
```

这不是最类型安全的设计，但足够展示原理。模型输出工具名和输入字符串，运行时根据工具名找到函数并执行，拿到字符串结果。

天气工具使用模拟数据而不是真实 API。这样做有两个好处：教程不依赖第三方天气服务，读者更容易复现；同样的城市和时间得到稳定结果，方便调试 Agent 循环。

### 接入工具执行

最后把工具调用接入主循环：

```ts step file=steps/04.ts highlight=23:35

```

这里沿用前面已实现的 `callLLMs` 和 `parseAssistant`，只展示新增的工具执行分支。完整闭环出现了：

1. 模型输出 `<action tool="...">...</action>`。
2. `parseAssistant` 解析出工具名和参数。
3. 运行时从 `TOOLKIT` 查找工具函数。
4. 执行工具，得到 `observation`。
5. 把 `<observation>...</observation>` 作为新消息追加到 `history`。
6. 下一轮模型看到 observation，继续判断。

这一行尤其关键：

```ts
history.push({
  role: 'user',
  content: `<observation>${observation}</observation>`,
})
```

工具结果必须回到上下文，否则模型不知道刚才的动作发生了什么。你可以把它理解成 Agent 的"感官输入"：工具负责接触外部世界，Observation 负责把外部世界的反馈交还给模型。

### 写系统提示词

代码只能执行协议，协议本身要通过系统提示词告诉模型。

```markdown
你是天气查询的工具型助手，回答要简洁。
可用工具（action 的 tool 属性需与下列名称一致）：

- getTime: 返回当前 time 字符串，参数为空。
- getWeather: 返回模拟天气信息字符串，参数为 JSON，如 {"city":"上海","time":"2026-02-27 10:00"}。

回复格式（严格使用 XML，小写标签）：
<thought>对问题的简短思考</thought>
<action tool="工具名">工具输入</action>
等待 <observation> 后再继续思考。
如果已可直接回答，则输出：
<final>最终回答（中文，必要时引用数据来源）</final>

规则：

- 每次仅调用一个工具；工具输入要尽量具体。
- 查询天气时，必须调用 getWeather，并提供 city 和 time 两个字段。
- 如果拿到 observation 后有了答案，应输出 <final> 而不是重复调用。
- 避免幻觉，不确定时请说明。
```

系统提示词不是"让模型说得更像某个人"的装饰文本。它是 Agent 协议的一部分，至少要说明四件事：角色、工具、输出格式、规则。

### 运行最小 Agent

```bash
DEEPSEEK_API_KEY=你的_key bun main.ts "上海现在天气怎么样？"
```

你应该会看到类似流程：

```text
用户问题: 上海现在天气如何？

[LLM 第 1 轮输出]
<thought>用户询问上海现在的天气，需要获取当前时间。</thought>
<action tool="getTime"></action>

<observation>2026-03-02T02:41:33.898Z</observation>

[LLM 第 2 轮输出]
<thought>已获得当前时间，需要查询上海天气。</thought>
<action tool="getWeather">{"city":"上海","time":"2026-03-02 02:41"}</action>

<observation>天气信息：上海在 2026-03-02 02:41 的天气为小雨，气温 15°C。</observation>

[LLM 第 3 轮输出]
<final>上海现在是小雨，气温约 15°C。</final>
```

这就是一个最小 Agent。它的本质不过是一句话：

```text
消息历史 + 模型调用 + 输出解析 + 工具执行 + 结果回填 + 循环
```

### 手写版的问题

手写版适合理解原理，但不适合直接扩展成生产级 Code Agent。三个具体痛点：

**第一，Provider 适配成本高。** 从 DeepSeek 换到 OpenAI、Anthropic、Gemini，你要改 URL、Header、请求体、响应解析，甚至工具调用协议。

**第二，工具调用状态机全靠自己维护。** 什么时候继续循环、什么时候停止、工具结果怎么塞回历史、模型输出不合法怎么办——全要手写。

**第三，工具参数没有类型安全。** 所有工具输入都是字符串，解析 JSON、校验字段、处理错误全靠手工。工具越多越失控。

所以接下来引入 Vercel AI SDK。它不会改变 Agent 的本质，但会把这些重复的工程细节标准化。

---

## 第四章 · 为什么是 Vercel AI SDK？

### 先看清 Agent 框架的版图

Agent 框架这几年井喷式增长。选框架之前，先搞清楚几大类的定位：

**编排类框架**——以 LangChain、LlamaIndex 为代表。它们把 LLM、工具、记忆、检索等抽象成可组合的组件，通过 Chain / AgentExecutor 编排。优点：生态丰富，什么都能接。缺点：**抽象层太厚，出问题时很难定位到根因。** Anthropic 在 "Building effective agents" 里也表达了类似立场：框架"make it tempting to add complexity when a simpler setup would suffice"。

**多 Agent 协作框架**——以 AutoGen、CrewAI 为代表。设计理念是把不同职责分给不同 Agent 角色，通过对话或消息传递协作。适合复杂工作流，但引入角色间通信的额外复杂度，调试难度指数级上升。

**轻量 SDK**——以 Vercel AI SDK、Anthropic SDK、OpenAI SDK 为代表。不强制架构范式，只做 Provider 抽象、工具调用循环、流式响应等基础能力。好处是薄——薄到你能看清楚每一步发生了什么。

本教程选 Vercel AI SDK 的原因很明确：**它是轻量 SDK，不改变 Agent 的运作机制，只是把手写版里那些重复劳动标准化。** 对于学习来说，LangChain 会让你迷失在抽象里；AutoGen 的多 Agent 模式对 Code Agent 这个场景又太重。

### SDK 在这里解决的三件事

**统一 Provider**

手写版：

```text
fetch(url, headers, body) -> parse response JSON -> get message content
```

SDK 版：

```ts
generateText({ model, messages, tools })
```

换模型时业务代码尽量不动，只替换 provider 配置。Provider 层只做这些事：读 API Key、设 baseURL、选模型名、导出统一的 `model`。Agent Loop 不需要知道底层到底是七牛、DeepSeek、OpenAI 还是 Anthropic。

**内置工具调用循环**

手写版需要自己处理：模型是否调用工具、调用哪个工具、工具参数怎么解析、工具结果怎么回填、何时再次请求模型、最多循环多少步。SDK 的 `generateText` + `maxSteps` 自动处理这个状态机。你仍然要设计工具和提示词，但不需要重复写循环胶水代码。

**Zod 参数校验**

手写版工具输入是字符串。SDK 版为每个工具定义 Zod schema：

```ts
parameters: z.object({
  path: z.string(),
  limit: z.number().optional(),
})
```

模型生成的参数被 SDK 解析和校验，`execute` 拿到的是有类型的对象。对 Code Agent 来说这一点尤其重要——工具参数错误直接影响文件和命令执行。

---

## 第五章 · 构建 Mini Claude Code

### 它不是 Claude Code 的克隆

现在构建第二个项目：`mini-claude-code`。它是一个教学版 Code Agent，保留最关键的能力：读文件、写文件、局部编辑、Shell 执行、网页抓取、多轮对话、上下文压缩、危险命令防护。

项目结构：

```text
src/
├── index.ts              # CLI 入口
├── SYSTEM_PROMPT.md      # 基础系统提示词
├── agent/
│   ├── provider.ts       # 模型 Provider 配置
│   ├── loop.ts           # 核心 AgentLoop
│   ├── context.ts        # 上下文压缩
│   └── prompt.ts         # 系统提示词组装
├── tools/
│   ├── index.ts          # 工具注册表
│   ├── read-file.ts      # 读取文件
│   ├── write-file.ts     # 写入文件
│   ├── edit-file.ts      # 局部替换
│   ├── bash.ts           # Shell 执行
│   └── web-fetch.ts      # 网页抓取
└── utils/
    ├── truncate.ts       # 工具输出截断
    ├── safety.ts         # 危险命令和敏感路径检测
    └── confirm.ts        # 用户确认交互
```

这个结构背后的原则是：**Agent Loop 不关心具体工具怎么实现，工具也不关心模型怎么调用。** 后续增加工具、替换模型、调整上下文策略都不会互相污染。

### Provider 配置

先配置模型：

```ts step file=steps/05.ts

```

用 `createOpenAI` 创建 OpenAI 兼容 Provider。很多第三方模型服务提供 OpenAI-compatible API，但兼容不代表完全等价。`compatibility: "compatible"` 让 SDK 避免发送某些 OpenAI 官方特有但第三方未必支持的字段。只要接的是非 OpenAI 官方兼容接口，就优先开这个配置。

### 工具注册：把能力交给模型

```ts step file=steps/06.ts

```

每个工具三部分：

- `description`：给模型看的说明，影响模型什么时候选择这个工具。
- `parameters`：Zod schema，定义工具参数。
- `execute`：真实执行逻辑。

工具描述不是普通注释——它是模型决策的直接输入。Anthropic 管这叫 **ACI (Agent-Computer Interface)**，认为应该像设计人机交互一样认真设计工具接口。他们在 SWE-bench 上的实践结论是："花了更多时间优化工具设计，而非模型提示词。"

具体到本教程的工具组合：

- `read_file` 负责看上下文；
- `write_file` 负责创建或全量覆盖；
- `edit_file` 负责局部修改——明确说它只替换唯一匹配的 `old_string`，模型就更容易先读文件、再做局部修改；
- `bash` 负责搜索、测试、构建等通用命令；
- `web_fetch` 负责查文档。

**不要一开始就堆很多工具。** 工具越多，模型选择成本越高，误用概率也越高。教学版保留最小可用集合更合理。

### Bash 工具：能力越大，越要加护栏

Code Agent 最危险的工具通常是 Shell。它最强——几乎所有本地开发任务都能通过 Shell 完成；它也最危险——一个错误命令就可能删除文件、泄漏信息或破坏系统。

```ts step file=steps/07.ts

```

`bash` 工具做了六件事：执行前危险命令检测、需要确认的命令暂停询问用户、禁止执行的直接拒绝、超时保护、合并 stdout/stderr、长输出截断。

这不是"锦上添花"。**只要 Agent 可以执行命令，就必须有最后一道保险。**

危险检测逻辑在 `utils/safety.ts`：

```ts step file=steps/08.ts

```

把风险分成两类：

- `block`：无论如何都不该执行——格式化磁盘、删除根目录。
- `confirm`：有合法用途但风险高——`rm -rf`、`sudo`、`git push --force`。

这种设计比全拦或全放更实用。Code Agent 的目标是帮用户做事，不能因为安全而完全失去执行能力，但高风险操作必须让用户明确知情。

同一个文件里还有敏感路径检测（`.env`、`.ssh/id_rsa`、`secrets.json` 等）。文件工具和命令工具都可能被诱导去访问工作目录外的敏感文件，路径安全同样不能漏。

### 工具输出截断

Agent 的上下文不是无限的。工具输出是最容易把上下文撑爆的来源——`find . -type f` 在 `node_modules` 里能产出几千行，读一个几万行日志文件能瞬间填满上下文窗口。

```ts step file=steps/09.ts

```

关键不是单纯截断，而是**告诉模型"这里被截断了"**。

如果你只是把输出裁成前 8000 字符，模型会误以为这就是完整结果。追加一个结构化提示：

```xml
<system_hint type="tool_output_truncated">
...
</system_hint>
```

这样模型知道它看到的不是全量内容，后续可以改用更精确的命令、分页读取文件、增加过滤条件，而不是基于不完整信息做判断。

### 核心 Loop：让 SDK 接管状态机

```ts step file=steps/10.ts

```

和手写版相比，最大的变化：没有手写 `for` 循环，也没有手动解析 `<action>`。

`generateText` 根据工具调用协议自动执行多步：调用模型 → 如果模型请求工具，校验参数 → 执行对应工具 → 结果放回上下文 → 再调用模型 → 直到模型输出最终文本或达到 `maxSteps`。

`maxSteps: 50` 仍然很重要。SDK 能帮你循环，但不能替你决定什么叫"无限循环"。Agent 系统必须始终有边界。

`onStepFinish` 用来观察中间过程。对 Code Agent 来说，透明度非常重要——用户需要知道 Agent 在读哪些文件、执行哪些命令、是否卡在某一步。

### 系统提示词：静态规则 + 动态状态

系统提示词不应该永远只是一个静态 Markdown 文件。真实 Agent 运行时经常需要注入动态信息：当前工作目录、用户偏好、项目级规则、截断提示、压缩后的执行历史、上一次失败的原因。

```ts step file=steps/11.ts

```

分成两段：静态段从 `SYSTEM_PROMPT.md` 读取（Agent 身份和长期行为规则），动态段由 `runtimeHints` 传入（压缩摘要等当前状态）。

这个分段方式比把所有内容硬写在一个字符串里可维护得多。后续接入 `AGENTS.md`、用户偏好、项目规则、Skills 索引，都可以继续作为新段落拼进去。

一个 Code Agent 的基础提示词至少应该包含这些规则：修改文件前先读文件、优先做最小改动、能局部替换就不要全量覆盖、工具调用后简要说明发现、不确定时询问用户、不要编造不存在的文件或命令结果。

这些规则看起来朴素，但能显著降低 Agent 乱改文件的概率。

### 上下文压缩

长任务会不断积累上下文。每一轮用户输入、模型输出、工具调用、工具结果都进入历史。哪怕单次工具输出被截断，长时间运行后也会逼近上下文上限。

解决思路是压缩。本教程实现的是最基本的方案，完整的上下文工程其实有几种常见策略：

**滑动窗口**：只保留最近 N 轮对话，旧的直接丢弃。最简单但最暴力——超过窗口的信息永久丢失。

**摘要压缩**（教程实现的方式）：让模型把历史总结成结构化摘要，保留"已完成什么、还剩什么、当前状态、注意事项"。旧的原始消息可以清空，摘要作为 runtime hint 注入下一轮。代价是压缩会损失细节。

**重要性过滤**：不是按时间而是按语义重要性决定保留哪些消息。比如包含错误信息的消息、用户明确要求的约束条件、关键文件路径等标记为"重要"不参与压缩，中间的工具调用和普通回复可以压缩。

**分层记忆**：把上下文分成工作记忆（最近的消息，全量保留）、短期记忆（上文的摘要）、长期记忆（跨会话的知识，手工管理或向量检索）。这是最接近人脑的模型，但实现复杂度最高。

```ts step file=steps/12.ts

```

本模块做两件事。第一，`shouldCompress` 判断是否超过阈值——基于 SDK 返回的真实 `promptTokens`，超过模型上下文窗口的 80% 时触发。第二，`compressHistory` 让模型把历史总结成结构化摘要，保留后续执行需要的关键信息。

这个阈值是任意的，但合理。太低频繁压缩损失细节，太高来不及压缩就超上下文。实际项目通常会结合滑动窗口、重要性过滤等策略，本教程先实现最容易理解的一版。

压缩完成后旧 history 清空，摘要作为 runtime hint 注入下一轮系统提示词。Agent 不需要携带完整历史也能继续任务。

### CLI 入口：让 Agent 连续工作

```ts step file=steps/13.ts

```

入口逻辑做了几件事：读用户输入 → 调 `agentLoop` → 打印最终回答 → 保存 `responseMessages` 到 history → 根据 token 使用量决定是否压缩 → 支持 `/reset`、`/exit`、`/help` 基础命令。

`history` 和 `runtimeHints` 在多轮之间持久存在——这是它能像一个真正助手一样连续工作的基础。

整个运行链路：

```text
用户输入
  ↓
index.ts CLI 循环
  ↓
agent/loop.ts 调用 generateText
  ↓
agent/prompt.ts 组装系统提示词
  ↓
tools/index.ts 提供工具注册表
  ↓
具体工具执行文件操作 / Shell / WebFetch
  ↓
工具结果回填给模型
  ↓
模型继续下一步或输出最终回答
  ↓
agent/context.ts 必要时压缩历史
```

---

## 第六章 · 从玩具到 Code Agent，中间多了什么？

### 两个版本的差异

回头看两个版本的对比：

| | agent-loop 手写版 | mini-claude-code SDK 版 |
|---|---|---|
| 模型调用 | 手写 `fetch` | `generateText()` |
| 工具协议 | XML + 正则解析 | SDK tool calling |
| 参数校验 | 字符串 + 手动解析 | Zod schema |
| 循环状态机 | 手写 `for` 循环 | `maxSteps` 自动处理 |
| 工具结果回填 | 手动 `history.push` | SDK 自动回填 |
| 文件操作 | 无 | read/write/edit |
| Shell 执行 | 无 | bash 工具 + 危险命令防护 |
| 上下文保护 | 无 | 工具输出截断 + 历史压缩 |
| 多轮对话 | 单次问题 | CLI history + runtime hints |
| 适合目的 | 理解原理 | 学习工程化 Agent 结构 |

最重要的结论：**mini-claude-code 并没有改变 Agent 的基本原理，它只是把原理放进了更可靠的工程结构里。**

手写版里 `parse action → execute tool → push observation → next loop` 这套动作，在 SDK 版里仍然存在，只是由 SDK 和工具系统接管了大部分细节。

### Code Agent 的三个工程重点

如果你继续扩展这个项目，优先关注三个方向。

**第一，工具边界。** 工具越强，越要定义清楚输入、输出、权限和失败行为。不要让模型靠猜使用工具。Anthropic 的实践是 poka-yoke（防错设计）——改变参数设计，让错误更难发生。比如用绝对路径代替相对路径，直接消除一整类错误。

**第二，上下文工程。** 不要等上下文爆了才处理。文件读取、搜索结果、命令输出都应该有分页、过滤、截断和明确提示。滑动窗口、摘要压缩、重要性过滤、分层记忆——选哪个方案取决于你的任务特征。

**第三，安全策略。** 只要涉及文件和命令执行，就必须考虑路径限制、危险命令、用户确认、超时、资源回收。

这三个方向有一个共性：**它们不是模型能力问题，而是软件工程问题。** 一个 Code Agent 是否可靠，很大程度取决于这些边界是否设计得足够清楚。

---

## 收束

回头看，整套教程其实只讲了一条因果链：

```
Agent 的本质是让模型进入闭环执行
→ 闭环的最小实现是 ReAct 循环
→ 手写几十行就能跑通一个天气 Agent
→ 但工程化需要 Provider 抽象、类型安全、状态机管理
→ Vercel AI SDK 把这些标准化，同时不改变 Agent 的运作原理
→ 一个真正的 Code Agent 还需要工具边界、上下文压缩、安全护栏
→ 这些不是模型能力问题，是软件工程问题
```

手写版的 `agent-loop` 帮你理解"消息是怎么流动的"，SDK 版的 `mini-claude-code` 帮你理解"工程上需要补哪些能力"。先跑通前者，确认自己理解每一步；再看后者，理解从"能跑"到"可靠"之间每一步工程决策的为什么。

核心概念不复杂，几十行代码就能跑起来。但从"能跑"到"能可靠地解决真实问题"，中间的差距不在模型，在工程。
