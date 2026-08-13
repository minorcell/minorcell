---
type: article
title: 'DeepSeek Harness 速览：“一切皆插件”意味着什么'
date: 2026-08-13
updated: 2026-08-13
description: '从 “Everything is a Plugin” 出发，速览 DeepSeek Harness 的插件化架构：Cordis 的服务、依赖注入、事件分发与可逆副作用，并亲手写一个企业微信通知插件，感受这套架构的扩展体验。'
tags: [DeepSeek, Harness, Cordis, 插件架构, Agent]
keywords: [DeepSeek Harness, 一切皆插件, Cordis, 插件架构, Agent Harness, DeepSeek V4 Pro, 企业微信机器人, Webhook]
order: 60
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/deepseek-harness-cover.png)

8 月 12 日深夜，DeepSeek 悄然上线了 V4 Pro 正式版：100 万 Token 上下文、最大 38.4 万输出，官方自测的 Agent 基准相比 4 月的预览版有了代际级别的提升——DeepSWE 从 12.8 跳到 62.7，Cybergym 到了 83.3。13 日官方公众号正式官宣，App、网页端和 API 同步上线。

同一时间放出的，还有 **DeepSeek Harness** 的开发者预览版——一个开源的 agent 运行框架，命令行工具叫 `dsh`。

![DeepSeek Harness 官网首页](https://stack-mcell.tos-cn-shanghai.volces.com/deepseek-harness-site-hero.png)

我先体验了它的 Web 版，说实话，感觉挺有希望的。理由有两个：一是它深度绑定了自家的模型，Harness 配上 V4 Pro，再叠上上线初期（8 月 17 日调价前）每百万 Token 输入 3 元、输出 6 元的价格，这条路线的成本低得让人放心；二是信任。对 DeepSeek 这家公司的信任——说得更个人一点，对梁文锋的信任。

然后，我在它的仓库首页看到了这句 tagline：

> **DeepSeek Harness: Everything is a Plugin.**

README 里的原话更完整：“It uses an architecture where **everything is a plugin**, and is powered by Cordis.”

一切皆插件。这句话值得认真看一眼。

## 从 VS Code 说起

7 月我写过一篇[《从 VS Code 学系统架构》](/articles/2026/learning-system-architecture-from-vscode)，当时有一个印象很深的点：VS Code 的架构做得聪明，它把“编辑器”这一件事留给内核，剩下的能力几乎全部通过插件接入——语言服务（LSP）、Git、主题、调试器，全是扩展。内核没有插件照样是一个能用的编辑器，插件只是外围的加法。

“一切皆插件”听起来像是同一件事，但 Harness 走得更远：**在 Harness 里，连“核心”都是插件。**

VS Code 的内核是写死的编辑器；Harness 没有内核。它底层基于一个叫 [Cordis](https://github.com/cordiverse/cordis) 的插件框架（设计思想源自论文《A Programming Paradigm for Spatiotemporal Composability》），整个系统只有“接线和调度”这一层壳，剩下的所有能力——调用模型、管理会话、执行工具、agent 循环——全部由插件提供。

换句话说：

- VS Code 是**稳定内核 + 可插拔的外围**：内核离开插件照样活。
- Harness 是**一堆插件的组合**：拆掉所有插件，什么都不剩。

![VS Code 与 DeepSeek Harness 的架构对比](https://stack-mcell.tos-cn-shanghai.volces.com/deepseek-harness-architecture.svg)

## 支撑“一切皆插件”的四个机制

官方那篇 [Cordis 入门指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.zh.md)写得很克制，核心就这么几件事：

**1. 服务挂在上下文上。**每个插件提供的不是孤立的类，而是挂在全局上下文上的一个服务，占据一个稳定的 key：`ctx.llm`、`ctx.tools`、`ctx.sessions`、`ctx.agents`。其他插件**通过 key 找服务，而不是 import 某个具体实现**。你要用模型，就找 `ctx.llm`——它背后是 V4 Pro 还是别的什么，你不知道，也不需要知道。

**2. 依赖注入决定启动顺序。**插件用 `inject` 声明自己需要哪些服务，框架会等这些服务就绪后才启动它。启动顺序是依赖图自动推导的，没有手写的编排表，也不存在“我的插件先启动了、它依赖的东西还没来”这类问题。

**3. 事件是类型化的，而且能“插手”。**Cordis 的事件有四种分发模式：

| 模式 | 是否等待 | 分发顺序 | 能否返回结果 |
|---|---|---|---|
| `emit` | 否 | 注册顺序 | 否 |
| `waterfall` | 否 | 注册顺序 | 是 |
| `parallel` | 是 | 并行 | 否 |
| `serial` | 是 | 注册顺序 | 是 |

重点是 `waterfall`：监听器收到的参数里带一个 `next()`，把它交给下游处理，下游的返回值还会回到你手里——所以监听器可以**修改、包装、甚至短路**（不调 `next` 直接返回，后面的人就收不到了）。这和 VS Code 那种纯广播的事件（`onDidXxx`）完全不同：广播只能听，waterfall 能改。

**4. 一切注册都可逆。**监听器、提示词片段、工具 schema，统统通过 `ctx.effect()`（或 `ctx.on()`）安装。框架给每笔注册记账，卸载或热更新时会自动撤销。VS Code 里那个忘写 `deactivate` 清理就泄漏订阅的坑，在这里不存在。

感受一下“插件长什么样”，这是给每个请求的 prompt 自动加一句日期的最小插件（示意代码）：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'date-context'
export const inject = []   // 不依赖任何服务

export function apply(ctx: Context) {
  ctx.effect(() => {
    return ctx.on('prompt/build', (prompt) => {
      prompt.prepend('今天是 2026-08-13。')
    })
  })
}
```

没有注册入口、没有 manifest、没有启动顺序配置。放进插件清单，它就活；移出清单，它自动把自己留下的东西收干净。

## Harness 用它做了什么

3 月我写过一篇[《Harness 工程》](/articles/2026/harness-engineering-agent-engineering-explained)，当时给 Harness 下的定义是概念层面的：**让 Agent 能被稳定驾驭的环境系统**——任务表达、上下文组织、工具治理、状态管理、反馈回流。这次 DeepSeek 给出了一份代码层面的实现，长这样：

```yaml
# dsh 的插件清单（示意）
plugins:
  - @deepseek-ai/plugin-llm      # ctx.llm —— 模型调用
  - @deepseek-ai/plugin-sessions # ctx.sessions —— 会话
  - @deepseek-ai/plugin-tools    # ctx.tools —— 工具注册表
  - @deepseek-ai/plugin-agents   # ctx.agents —— agent 循环
```

注意，这份清单里**没有“Harness 本体”这一项**。你看到的 Web 版，就是官方替你拼好了这组清单，再套上一个界面。想换模型？把 `plugin-llm` 换掉。想换 agent 的决策方式？把 `plugin-agents` 换掉。

各插件之间的关系可以画成一张依赖图：官方插件各自把服务挂上上下文，你的插件只面向服务，不面向实现：

![DeepSeek Harness 插件依赖关系图](https://stack-mcell.tos-cn-shanghai.volces.com/deepseek-harness-dependency.svg)

你的插件和官方插件在同一个层面工作——官方插件能做的事，你都能做，包括替换掉官方插件本身。

## 实战：任务完成时，通知我的企业微信

说一个我实际想做的场景：让 `dsh` 跑长任务，我不想守着终端，任务完成后自动推一条消息到企业微信群。

先在企业微信群里添加一个群机器人（现在官方叫“消息推送”），拿到它的 webhook 地址，然后写插件：

```ts
// plugins/wecom-notify.ts —— 示意代码，事件名等细节以官方文档为准
export const name = 'wecom-notify'
export const inject = ['llm']

export function apply(ctx, llm) {
  ctx.effect(() => {
    return ctx.on('task/complete', async (result) => {
      const summary = await llm.chat(`用一句话总结这个任务结果：${result.output}`)
      const res = await fetch(process.env.WECOM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: { content: `✅ 任务完成\n> ${summary}` },
        }),
      })
      const { errcode } = await res.json()
      if (errcode !== 0) throw new Error(`通知发送失败：errcode ${errcode}`)
    })
  })
}
```

把它加进清单，完事：

```yaml
plugins:
  - @deepseek-ai/plugin-llm
  - @deepseek-ai/plugin-sessions
  - @deepseek-ai/plugin-tools
  - @deepseek-ai/plugin-agents
  - ./plugins/wecom-notify
```

整个通知过程是这样的：agent 循环在任务结束时发出事件，你的插件收到后借 `ctx.llm` 做一次总结，再把结果推给企业微信。每一个箭头都不是硬编码调用，而是服务与事件：

![企业微信通知插件的时序图](https://stack-mcell.tos-cn-shanghai.volces.com/deepseek-harness-notify-sequence.svg)

二十行左右。前面讲的机制，这段代码全用上了：

- **`inject: ['llm']`**——声明依赖模型服务。框架保证 `apply` 执行时 `llm` 已经就绪，而且它不关心 `llm` 背后是哪个模型、哪个厂商。哪天你把 `plugin-llm` 换成别的实现，这个插件一行不用改。
- **`ctx.on('task/complete', ...)`**——监听任务完成事件。事件由 agent 循环（`plugin-agents`）在任务结束时发出，你的插件和它没有任何耦合，甚至互相不认识。任务结果还能顺手交给 `llm` 总结成一句话，再推给群机器人。
- **`ctx.effect()`**——保证可逆。用户关掉通知功能或热更新时，框架自动把这个监听器摘掉。

作为对比，如果这是个 VS Code 插件，同样的功能你要写：注册扩展、拿另一个扩展的 API 时先判空、再在 `deactivate` 里手动清理订阅。而在这里，这三件事被机制本身消化了。

> 注：`task/complete` 是我为演示起的事件名。官方 primer 说新事件会带 `@mode` 标签注册并生成目录，具体的事件清单要等文档完善。

## 预览期的边界

最后泼一点冷水。README 里有一句大写警告：**“THERE WILL BE COMPATIBILITY-BREAKING CHANGES”**——开发者预览阶段，API 随时会变，别急着在生产环境依赖。插件发布通道也还没完全开放（官方为插件作者准备了 `dsh-plugin` 话题标签，生态刚起步）。目前上手只有一条路：`npx @deepseek-ai/dsh web`，在本地跑一个 Web 界面。

但如果你看完想动手，路径其实已经铺好了：[官方文档站](https://deepseek-harness.github.io/deepseek-harness/) 上有快速上手，仓库里的 [Cordis 教程](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/cordis-tutorial)一共七章，第一章就是第一个插件的 hello world——包括插件清单（loader 配置）放在哪、怎么写。API 会变，但这些大框架不会。

但架构层面的信号是明确的：它把**可替换性**做成了系统的一等公民。在 agent 技术栈还远未定型的今天，一个 harness 能活下来的前提，就是允许被反复拆装。DeepSeek 选了一个适合快速试错的底座——这大概才是“一切皆插件”这句话真正的意思：不是炫技，是生存策略。

如果这就是 DeepSeek 未来一年想打的方向，那我对它的期待，比一个 V4 Pro 还要高一点。
