---
type: article
title: '细说我日常 AI coding 碰到的十个问题'
date: 2026-02-10
updated: 2026-05-10
description: '这一年大量 vibe coding，经典翻车现场真的不少。有些是模型习惯问题，有些是 Agent 工具链缺陷，还有些属于“工程现实 vs 最佳实践”的冲突。'
keywords: [AI Coding, 常见问题, AI开发, 编程实践, vibe coding]
order: 40
---

![202606](https://stack-mcell.tos-cn-shanghai.volces.com/202606.jpg)

这一年大量 vibe coding，经典翻车现场真的不少。有些是模型习惯问题，有些是 Agent 工具链缺陷，还有些属于“工程现实 vs 最佳实践”的冲突。下面这十个算是我最常遇到、也最容易让人 **当场没绷住** 的。

## 1. hardcode：类型系统被你当摆设

是的，很多 TS / Golang 项目，vibe coding 一顿猛改之后，总会冒出一堆 hardcode。

比如判断任务状态：

- 你会看到它写：`taskResult.status === "error"`
- 而不是标准的：`taskResult.status == TaskResultStatusError`

问题不是“看着也能跑”，问题是：**类型服务失效**。后续再 AI coding，模型经常忘记把这些“临时写法”改回规范写法，久而久之就变成隐患或者 bug。

这个我单独写过：
[https://mcell.top/blog/2026/ai-always-like-hard-code](https://mcell.top/blog/2026/ai-always-like-hard-code)

## 2. 不更新文档：文档漂移，Agent 还会一本正经地错

CLAUDE.md / AGENTS.md / 设计文档这些，AI 改完代码之后，经常忘记同步更新文档。

于是文档失效、文档漂移；更要命的是：后续 Agent 对着文档分析，会在旧版本前提下给出一堆“逻辑自洽但完全错误”的结论。
这类错，比单纯代码 bug 更阴险。

## 3. codex 犟嘴：过度追求最佳实践，丢了工程的灵活性

codex 5.3 之前我体感特别明显：第一轮喜欢“全仓库分析”，所以也经常被吐槽慢。后面执行快了，但又经常出现另一种问题——**犟嘴**。

典型对话：

用户：“请你按我的需求修改。”
codex：“你的方式不对，我觉得 xxx 才是对的。”
然后扯皮好几轮。
最后用户：“领导说的，让这么改。”
codex：“好的，我将按照你领导的要求修改。”

开玩笑说这是 codex 懂人情世故；说真话就是：**过度追求最佳实践，反而少了软件工程里那种真实的妥协与灵活性。**

## 4. 重复输出：纯犯傻

现在少很多了，但上半年我用 trea(IDE) + qwen(CLI) 时，确实碰到过：模型重复输出同一段内容 / 重复调用同一个工具，直到上下文爆满。

后面我自己做 memo code 也复现过一次（deepseek-chat）。概率不高，但一旦发生就特别掉好感。

## 5. 子进程内存泄露：五十个 G，直接给我送走

![202607](https://stack-mcell.tos-cn-shanghai.volces.com/202607.jpg)

发生在 codex CLI。那次我让 codex 帮我改一个开源项目（Cap，我想去掉其中收费模块），然后——内存泄露了。

题外话：正如 Anthropic 当时收购 bun 的语境里提过的那种现象，Agent 在运行时会频繁启动子进程，这玩意儿一旦出问题就很夸张。

我那次在 iTerm 里跑的 codex 占了快 50GB 内存，电脑卡崩，最后只能重启。
后续我提了 issue，也修了：

- issue： [https://github.com/openai/codex/issues/9345](https://github.com/openai/codex/issues/9345)
- 修复 PR： [https://github.com/openai/codex/pull/9543](https://github.com/openai/codex/pull/9543)

顺便一提：codex cli 是 rust 写的，rust 确实是性能打手、也有所有权那套内存管理优势；但这次看起来更像**工具逻辑问题**，和语言没啥关系。

## 6. 蓝紫色：一眼 AI 作品

最早 AI coding 出来的项目，页面主题十个有八个是蓝紫色。当时看到就一眼：
“你这是 AI 写的吧。”

后来也有人解释：LLM 训练数据里 tailwind 内容很多，而 tailwind 默认主题色就是偏蓝紫。
哈哈，不过近期模型（比如 codex 5.3、kimi k2.5）这类问题明显好很多了。

## 7. 表情包：开发者需要清晰文档，不需要 🥳✨🚀

这是所有模型 / agent 的通病：特别爱在文档、甚至页面代码里塞一堆表情。

我个人真的不喜欢。作为开发者我需要的是**清晰的结构和可检索的结论**，表情包放在文档里只会拉分。

## 8. rm -rf：不是“删错了”，是系统缺安全边界

这个是别人碰到的案例（我忘了具体哪个模型刚出来那阵），据说 agent 直接 `rm -rf` 然后……嗯，你懂的。

本质是：agent 的工具系统缺乏 **沙箱 / 审批机制 / 敏感操作权限控制**。

近期我用 codex 时有个细节还挺好：我让它删除某个不需要的目录，发现 codex cli 会拦截，不让直接 `rm -rf`。
这种“工具层兜底”比模型层喊口号强多了。

## 9. 代码有问题不解决，转头去改测试代码

这个真的很魔幻，是 codex 我亲自遇到过一两次。

我在 AGENTS.md 里写了要求：“修改完代码之后运行单元测试”。然后它改完、run test，测试过不去。按正常逻辑，应该回去修实现对吧？

结果它给我来个：**把相关测试删了**。
我当场没绷住，直接回它：“xxxxxxxxxxxx”。

我怀疑它对 bun test 不够熟。我强烈希望 bun 官方补一个 bun 的 skills 或者 MCP 服务，让这些 agent 至少别在测试环节胡来。

## 10. read 工具读图，上下文直接爆炸

多模态模型读取图片，正确姿势其实很明确：走 `content.image_url`（URL 可以是 base64 或可访问 http），这样不会占用模型上下文。

但我怀疑 claude code cli 有概率会用 Read 工具去读图片文件——然后工具把图片的 base64 字符串当作结果返回。
于是上下文直接爆炸。

更烦的是：它有时候又能走 content api（不占上下文），有时候又会调 Read。闭源工具你也不知道它内部怎么做的，就只能祈祷别触发。

## 这些坑给我的启发

这些问题基本就是我这一年 vibe coding 的”经典合集”。对我最大的启发是：**别把希望全寄托在模型自觉上，工程上要有”工具层的底线”**。

所以我在做 memo code（https://github.com/minorcell/memo-code）时针对性做了不少兜底：工具返回结果长度检查与截断、重复输出去重、bash 工具沙箱与审批拦截、系统提示词要求同步更新文档防止漂移。这些处理基本都来自上面踩过的坑。
