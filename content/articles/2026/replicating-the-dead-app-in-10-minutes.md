---
type: article
title: '10分钟复刻爆火「死了么」App：vibe coding 实战（Expo+Supabase+MCP）'
date: 2026-01-15
description: '这期用 vibe coding 的方式，10分钟复刻「死了么」App 的核心功能。我不讲原理、不展开细节，只讲“怎么做”。跟着视频步骤走，你也能做出一个可运行的 App 原型。'
author: mcell
tags: [Expo, Supabase, MCP, AI Agent, vibe coding, React Native, Edge Functions]
order: 36
---

![202602](https://stack-mcell.tos-cn-shanghai.volces.com/202602.jpg)

> 视频链接：[10分钟复刻爆火「死了么」App：vibe coding 实战](https://www.bilibili.com/video/BV1yEr4BJE8B/)

最近“死了么”App 突然爆火：内容极简——**签到** + **把紧急联系人邮箱填进去**。
它的产品形态很轻，但闭环很完整：
你每天打卡即可；如果你连续两天没打，系统就给紧急联系人发邮件。

恰好我最近在做 Supabase 相关调研，就顺手把它当成一次“极限验证”：

- 我想看看：**Expo + Supabase** 能不能把后端彻底“抹掉”
- 我也想看看：**Codex + MCP** 能不能把“建表 / 配置 / 写代码”这整套流程进一步压缩
- 以及：vibe coding 到底能不能真的做到：**跑起来、能用、闭环通**

结论是：能。并且我录了全过程，**从建仓库到 App 跑起来能用，全程 10 分钟**。

## 我复刻的目标：只保留“核心闭环”

我没打算做一个完整产品，只做最小闭环：

1. **用户注册 / 登录**（邮箱 + 密码 + 邮箱验证码）
2. **首页打卡**：每天只能打一次，展示“连续打卡 xx 天”
3. **我的**：查看打卡记录 / 连续天数
4. **紧急联系人**：设置一个邮箱
5. **连续两天没打卡就发邮件**（定时任务 + 邮件发送）

页面风格：简约、有活力（但不追求 UI 细节）。

## 技术栈：把“后端”交给 Supabase，把“体力活”交给 Agent

- **前端**：React Native + Expo（TypeScript）
- **后端**：Supabase（Auth + Postgres + RLS）
- **自动化**：Supabase Cron + Edge Functions
  Supabase 的定时任务本质是 `pg_cron`，可以跑 SQL / 调函数 / 发 HTTP 请求（包括调用 Edge Function）。([Supabase][1])
- **Agent**：Codex（通过 **Supabase MCP** 直接连 Supabase）
  Supabase 官方有 MCP 指南，并且强调了安全最佳实践（比如 scope、权限、避免误操作）。([Supabase][2])

我整个过程的体验是：

> 以前你要在“前端 / SQL / 控制台 / 文档”之间来回切。
> 现在你只需要把需求写清楚，然后盯着它干活，偶尔接管一下关键配置。

## 两天没打卡发邮件：用 Cron + Edge Function，把事情做完

这是这个 App 最关键的“闭环”。

### 方案：每天跑一次定时任务

- **Cron**：每天固定时间跑（比如 UTC 00:10）
- **任务内容**：找出“已经两天没打卡”的用户
- **动作**：调用 Edge Function 发邮件

Supabase 官方文档推荐的组合是：`pg_cron` + `pg_net`，定时调用 Edge Functions。([Supabase][3])

> 你也可以不调用 Edge Function，直接让 Cron 发 HTTP webhook 给你自己的服务。
> 但既然目标是“不写后端”，那就让 Edge Function 处理就行。

### Edge Function：负责“发邮件”

注意：Supabase Auth 的邮件（验证码）是它自己的系统邮件；
你要给紧急联系人发提醒，通常需要接第三方邮件服务（Resend / SendGrid / Mailgun / SES 之类）。

Supabase 文档里也提到：定时调用函数时，敏感 token 建议放到 **Supabase Vault** 里。([Supabase][3])

Edge Function（伪代码示意）：

```ts
// 1) 查数据库：哪些人超过 2 天没打卡
// 2) 取紧急联系人邮箱
// 3) 调用邮件服务 API 发送提醒
```

Cron 每天跑一次就够了：
这个产品的语义不是“立刻报警”，而是“连续两天都没动静”。

## MCP + Codex：我觉得最爽的地方

如果你只看结果，你会觉得“这不就是一个 CRUD App 吗”。

但我觉得真正有意思的是过程：

- 它不仅写前端代码
- 它还能“像个人一样”去把 Supabase 后台的事情做掉：建表、加约束、开 RLS、写策略、甚至提示你哪里要手动补配置

而 Supabase MCP 的官方定位，就是让模型通过标准化工具安全地操作你的 Supabase 项目（并且强调先读安全最佳实践）。([Supabase][2])

我这次几乎没写代码，最大的精力消耗其实是两件事：

1. **把提示词写清楚**（尤其是“规则”和“边界条件”）
2. **对关键点做人工复核**（RLS、唯一约束、邮件配置）

## 我现在会怎么写提示词

我发现 vibe coding 成功率最高的提示词，不insane，反而“啰嗦”：

- 先写“模块和流程”
- 再写“数据约束”（每天只能一次、断档怎么处理）
- 再写“安全策略”（RLS 怎么开）
- 最后写“验收标准”（做到什么算跑通）

你给得越具体，它越像一个靠谱同事；
你给得越模糊，它越容易“自作主张”。

## 附录

### 我这次用的提示词（原文）

```markdown
需求：使用expo和supabase开发一个移动端APP： 死了么

## 功能：

### 用户注册：

1. 描述：在app进入页面，用户需要输入邮箱和密码以及确认密码，进行注册。
2. 流程：
   - 使用supabase的auth进行校验，发送验证码注册邮箱到用户邮箱，用户需要在页面输入邮箱中的验证码。
   - 注册成功之后即可进入app首页

### 首页打卡：

1. 描述：用户进入首页，只有一个大大的打卡功能；“今日活着”，点击即可完成打卡功能
2. 流程：
   - supabase需要记录用户的打卡信息
   - 打开成功时，提示用户已经“你已连续打卡xx日，又活了一天”

### “我的”

1. 用户可以在“我的”页面查看自己的打卡记录，连续打卡时间
2. 用户可以设置紧急联系人，当检测到用户连续两天没有打卡时，会发送一封紧急联系的邮件到紧急联系人邮箱

## 其他：

1. 用户每天只能打卡一次
2. 页面简约、有活力

> 你可以使用supabase的mcp进行所有的操作，
```

[1]: https://supabase.com/docs/guides/cron?utm_source=chatgpt.com 'Cron | Supabase Docs'
[2]: https://supabase.com/docs/guides/getting-started/mcp?utm_source=chatgpt.com 'Model context protocol (MCP) | Supabase Docs'
[3]: https://supabase.com/docs/guides/functions/schedule-functions?utm_source=chatgpt.com 'Scheduling Edge Functions - Supabase Docs'
