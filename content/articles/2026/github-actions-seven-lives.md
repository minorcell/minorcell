---
type: article
title: 'GitHub Actions 玩法大赏：一台远程主机的七种活法'
date: 2026-08-17
updated: 2026-08-17
description: '多数人只拿 GitHub Actions 跑测试，但它本质是一台带权限、可定时的远程主机。盘点开源项目把它玩出的七种活法：签到与贪吃蛇、发布多米诺、issue 治理、AI 维护者、监控台与活数据，直到用机器人管理机器人。'
tags: [GitHub Action, CI/CD, 开源协作, 自动化]
keywords: [GitHub Action, GitHub Actions, workflow, CI, CD, 自动化, issue 自动化, 定时任务, AI agent, robobun, codex, upptime, 贪吃蛇, Dependabot, zizmor]
order: 65
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-seven-lives-cover.png)

GitHub Actions 本质上是 GitHub 白送的一台远程主机：按触发条件自动开机、自带仓库权限、跑你写好的命令。但多数人只拿它跑测试和 lint——这是它最无聊的一种活法。

这篇文章盘点开源项目把它玩出的七种活法，从为自己签到，到发布软件、AI 维护者，再到用机器人管理机器人，一路进阶。看完你会同意：**把它当“跑测试的地方”，太浪费了。**

## 一、跑测试：最正统的活法

在 `.github/workflows/` 下放一个 YAML 文件，就定义了一个 workflow。触发条件（`on:`）满足时，GitHub 把它调度到一台 runner 上执行——runner 是一台远程的 Linux / macOS / Windows 主机，`step` 就是在这台主机上逐行跑命令：

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: npm test
```

测试、lint、格式化，这是所有人的起点。但同样是跑测试，大项目玩出了花样：

- **矩阵 × 分片**：一份测试定义，乘上多个版本和分片并行跑。[Ant Design 的 test.yml](https://github.com/ant-design/ant-design/blob/master/.github/workflows/test.yml) 把测试按 `shard: [1/2, 2/2]` 切成两份同时跑，再乘上 React 版本矩阵——一份 job 定义，若干份并行执行，30 分钟的测试压到 8 分钟。分片跑完的构建产物用 `actions/cache` 在 job 之间传递（键名带 `run_id`，天然不会拿到旧 run 的脏产物）。
- **按路径跳过**：[Next.js 的 CI](https://github.com/vercel/next.js/blob/canary/.github/workflows/build_and_test.yml) 开头有个 `changes` job，先判断这次改了什么——只改了文档就不跑集成测试、只改了 turbopack 就不跑无关测试。CI 不是越多越好，**聪明地少跑也是工程**。

到这里，记住全篇唯一的一句话：**runner 是一台远程主机，主机能做的事它都能做。** 后面六种活法，都是这句话的自然推论。

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-checks.png)

## 二、为自己：把微软的服务器当自己的 cron

既然是台主机，它当然不一定要为代码服务。中文社区把 Actions 玩得最野的地方，就是个人仓库。

**定时签到。** [juejin-actions](https://github.com/ruochuan12/juejin-actions) 是知名前端博主若川写的：fork 仓库、把 Cookie 填进 secrets，Actions 每天定时替你上掘金签到领矿石。同类的签到仓库覆盖 B 站、贴吧、V2EX 等二十多个平台，核心就一个 `schedule` 触发：

```yaml
on:
  schedule:
    - cron: '0 1 * * *'   # 每天凌晨 1 点（UTC），GitHub 免费帮你跑
```

（示意代码，以官方文档为准。）

**定时推送。** [hackernews-daily](https://github.com/headllines/hackernews-daily) 每天抓 Hacker News 热榜 Top 10，摘成早报推送。还有人用微信公众号测试号接口做天气推送、课表提醒——零服务器零费用，一台永不关机的“免费 cron”。

**主页仪表盘。** [waka-readme](https://github.com/athul/waka-readme) 每天把你的编码时长统计写进 profile README；[running_page](https://github.com/yihong0618/running_page) 定时同步 Strava / Nike 跑步数据，自动生成跑步地图和统计页——中文圈的“跑步主页”文化就靠它。最出圈的是 [snk](https://github.com/Platane/snk)：六千多星的仓库，每天把你的 commit 热力图渲染成一条贪吃蛇动画，commit 回你的主页。访客点进你的 GitHub，看到的是一条蛇在吃你的贡献格子：

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-snake.png)

这层的共同点是：**仓库不再只是代码，它是你的数据面板、你的个人品牌、你的自动化生活。** GitHub 主页成了你不需要自己搭服务器的个人网站。

## 三、发出去：一个 tag 的多米诺

跑测试是为自己，发布软件是给别人。发布流程最容易乱——什么时候发、发什么、发到哪，靠人记不可靠，大项目把整条链都交给了 Actions。

[Ant Design](https://github.com/ant-design/ant-design) 发布一个版本 tag，好几个 workflow 同时被踢起来：自动发推、往三个钉钉群推送 changelog、[构建并部署文档站点](https://github.com/ant-design/ant-design/blob/master/.github/workflows/site-deploy.yml)（dumi 全站构建 + bundle 分析 + GitHub Pages / Gitee / surge 三处部署 + Release 附件，一次跑 30–45 分钟）。维护者只需要打一个 tag，剩下的交给 runner 连轴转。

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-antd-release.png)

发布的安全也在升级。npm 的可信发布（OIDC）让仓库里**不再存 npm token**：

```yaml
permissions:
  id-token: write   # 用 GitHub 与 npm 之间的联邦身份，换掉 token
steps:
  - run: npm publish --provenance
```

（示意代码，以官方文档为准。）

[flux2](https://github.com/fluxcd/flux2) 走得更远：它的 [release.yaml](https://github.com/fluxcd/flux2/blob/main/.github/workflows/release.yaml) 在发布时生成 SLSA provenance 并用 cosign 给产物签名，还每周跑一次 OSSF Scorecard 给自己打供应链安全分。**发出去的不只是软件，还有可验证的“出身证明”**——下游用户能查证这个二进制确实出自这个仓库、这条流水线，中途没人动过手脚。

## 四、管起来：让人只做机器做不了的事

协作规范是人总忘、机器不会忘的东西。开源项目把这层交给了自动化脚本。

[Windup](https://github.com/1024XEngineer/Windup) 是个开源学生项目，它把 issue 治理做成了流水线：8 类 issue 模板强制标题前缀，issue 一进来，workflow 用 [github-script](https://github.com/actions/github-script) 跑一段 JS——注入一个**已带好权限的 GitHub API 客户端**——按标题正则自动分类、打 label、挂里程碑、设 issue type，字段被逐项点亮：

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-triage.gif)

几个值得抄的细节：判断 PR 是否关联 issue 用 GraphQL 的 `closingIssuesReferences`（描述里的 `Closes #123` 和 Development 侧栏关联都能识别）；提醒类 comment 埋一个隐藏标记防止每次 push 重复刷屏；检查类 workflow 要挂到 **required status checks** 上——纯提醒没有强制力，挂上闸门才能让不合规的 PR 合不进来。

依赖更新也全自动：[Dependabot](https://docs.github.com/en/code-security/dependabot) 每天开升级 PR，配一个 workflow 对 patch / minor 版本自动 approve 并 auto-merge，major 留人工确认——个人项目的依赖从此不再腐烂。Ant Design 甚至有个[每 5 分钟醒一次的机器人](https://github.com/ant-design/ant-design/blob/master/.github/workflows/pr-auto-merge.yml)，自动合并 master / feature / next 几个长期分支之间的同步 PR，并行开发不用维护者手工追。

更硬核的是**合规门**：[Home Assistant](https://github.com/home-assistant/core/blob/dev/.github/workflows/detect-non-english-issues.yml) 的 workflow 在 issue 打开时调用 GitHub 官方内置 AI（`permissions: models: read`）检测语言，非英语 issue 自动评论引导；[VS Code](https://github.com/microsoft/vscode/blob/main/.github/workflows/require-commit-trailer.yml) 强制微软安全响应分支的 PR 必须带 `Msrc-Case-Id` 标记，否则 CI 直接失败。**当维护者精力有限，机器先替你挡掉一部分。**

## 五、给 AI：从 review bot 到 AI 维护者

AI 进 workflow，是这一两年变化最快的一层。

OpenAI 官方的 [codex-action](https://learn.chatgpt.com/docs/github-action) 官方示例就是 PR review bot：PR 进来，Codex 跑审查、把意见发成评论。官方 cookbook 里还有自动修 CI 的[现成模板](https://github.com/openai/openai-cookbook/blob/main/examples/codex/Autofix-github-actions.ipynb)——CI 挂了，AI 修好之后自动开一个修复 PR。

Bun 走得更远。它的仓库里住着一个叫 robobun 的 AI 机器人：**提一个 bug issue，它自动分析代码、修复、提交 PR**，像一位时刻在线的真人维护者。翻 Bun 的 [workflows 目录](https://github.com/oven-sh/bun/tree/main/.github/workflows)能看到一整套配套——给 bot 的 PR 自动打标签、用 LLM 做 issue 判重。最有意思的是它还专门有个 workflow [关掉 robobun 开多的过期 PR](https://github.com/oven-sh/bun/blob/main/.github/workflows/close-stale-robobun-prs.yml)：**机器开 PR 也会刷屏，自动化自己也需要被管理。** 这个细节比“AI 维护者”本身更值得记住。

AI 不只能干活，还能当被测对象。[Supabase](https://github.com/supabase/supabase/blob/master/.github/workflows/braintrust-evals.yml) 把自家 AI 功能的 LLM 评测（Braintrust evals）跑成 PR 门禁——每次 push 先验证 AI 答案质量和工具调用正确性，坏了 PR 合不进。**AI 代码进仓库之前，AI 自己先考试。**

## 六、当服务器：仓库成了会自己长大的数据源

“主机能做的事它都能做”——包括替你监控世界、收集世界。

[upptime](https://upptime.js.org)（1.7 万星）把 GitHub 拼成了一整套商业监控服务的免费替代：每 5 分钟探测一次网站可用性、每 6 小时记录响应时间、每天生成图表、挂了自动开 issue 当告警单、GitHub Pages 出状态页。**Actions 当探测器、Issues 当告警工单、Pages 当状态页**，Canonical 等公司都在用。数据全在 git 历史里，不怕平台跑路。

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-upptime.png)

同样的模式用在数据上，仓库就成了**会自己长大的活数据源**：[fanmingming/live](https://github.com/fanmingming/live)（2.8 万星）每 2 小时抓取合并一次 IPTV 直播源；[blackmatrix7 的分流规则集](https://github.com/blackmatrix7/ios_rule_script)（2.7 万星）提交记录几乎全是 `github-actions[bot]`——一个仓库每天自动更新自己，下游项目再从这个仓库派生，形成一条“Actions 数据链”。还有 [chinese-independent-developer](https://github.com/1c7/chinese-independent-developer)（6 万星）用定时 workflow 爬取开发者信息生成榜单。不需要数据库、不需要后端：**git 提交历史就是数据库，README 和 Pages 就是前端。**

## 七、管自动化本身：自动化也需要被管理

workflow 攒到几十个，自动化自己就成了工程对象。

[uv](https://github.com/astral-sh/uv) 有 40 多个 workflow，它用 [check-zizmor.yml](https://github.com/astral-sh/uv/blob/main/.github/workflows/check-zizmor.yml) 跑 zizmor——一个专门审计 workflow YAML 安全问题的 linter——扫描自己的所有 workflow 有没有注入漏洞和危险用法，结果直接进 Code Scanning 面板。**用 CI 检查 CI 本身。**

[deno](https://github.com/denoland/deno/blob/main/.github/workflows/ci.ts) 干脆不用 YAML 写 workflow——它的 CI 是 TypeScript 写的，用 `@david/gagen` 库生成最终 YAML，矩阵定义、runner 常量全部代码共享，和普通工程一样被 lint、被 review。

成本也是管理对象。[Next.js](https://github.com/vercel/next.js/blob/canary/.github/workflows/pr_stack_optimizer.yml) 对 stacked PR 智能跳过昂贵 job——堆栈中段的 PR 只跑 lint 和单测这类轻量又关键的检查；还有一个[一键 code freeze](https://github.com/vercel/next.js/blob/canary/.github/workflows/code_freeze.yml)，冻结期间谁也别想合入。

## 收尾

回到开头那句话：**runner 是一台远程主机，带权限、可定时、可联网。** 七种活法递进到这里，服务对象从代码变成发布、变成协作、变成你、变成数据、最后变成自动化本身——而它始终是同一台主机，积木只有四块：触发、定时、job、runner（还可以换成[你自己的机器](https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/server-self-hosted.yml)，llama.cpp 就用带 Apple Silicon 的 Mac 跑 Metal GPU 测试）。

下次再遇到“要管的流程”，别先想着靠人记——写一个 workflow，跑起来看看，坏了就修。七种活法之外，第八种等你自己玩出来。
