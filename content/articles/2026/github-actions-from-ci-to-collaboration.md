---
type: article
title: 'GitHub Actions 不止是 CI：把协作规范变成自动化'
date: 2026-08-17
updated: 2026-08-17
description: '规范总被忘记，提醒也没用？把规范交给 GitHub Actions 自动执行：issue 自动分派、PR 关联检查、定时巡检、发版 CD。以两个开源学生项目为例，再带你看看它更大的可能——定时机器人、自托管 runner、合并队列。'
tags: [GitHub Action, CI/CD, 开源协作, 团队规范]
keywords: [GitHub Action, GitHub Actions, workflow, CI, CD, issue 自动化, 定时任务, Codex, PR 审查, self-hosted runner, 合并队列, merge queue, Dependabot]
order: 65
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-cover.png)

今年暑期实训营，我在七牛云的 [XEngineer 实训营](https://github.com/1024XEngineer/XEngineer/wiki)（由 [1024 实训营升级而来](https://news.qiniu.com/archives/1780021253369)）当助教，带两个小组，项目都是开源的（[Windup](https://github.com/1024XEngineer/Windup) 和 [Holonic-Asset](https://github.com/1024XEngineer/Holonic-Asset)）。这个营和一般实习不太一样：学员不是进公司按部就班打杂，而是以开源方式组队做真实项目，练的是判断、不是照做——营里的软件工程规范和 GitHub 过程管理规范都公开写在 wiki 上。可到了项目里，规范还是经常被打破：issue 开得随意、PR 不提关联、发版靠手工。提醒过很多次，隔一阵子又有人忘记——用 agent 写代码的同学，agent 也会忘。

最初想着把这些规范固化进 AGENTS.md（给写代码的 agent 看的规则文件）、做成 skill（给 agent 用的技能包），让 agent 照着办。做了一半发现这条路只覆盖一半：AGENTS.md 管得住 agent 写的代码，管不住学生本人手动开的 issue、提的 PR——而规范被打破，多数时候恰恰是人直接在页面上操作的。约束 agent，约束不到这半边。

于是换了思路：**把规范交给 GitHub Actions 自动执行。** 不用任何人记着——提了 issue，自动化脚本自动分派；PR 没关联，自动化脚本自动提醒；没做到就留下记录。这些 workflow 大多是我用 Codex 帮忙搭的。这篇文章从触发、定时、job 这几块基础积木讲起，一路讲到自托管 runner——积木不多，组合出来的东西不少。

## 先建立一个心智模型

在 `.github/workflows/` 下放一个 YAML 文件，就定义了一个 workflow。它由三部分组成：触发条件（`on:`）、job、step。

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

触发条件满足时，GitHub 会把 workflow 调度到一台 runner 上执行。runner 是一台远程的 Linux / macOS / Windows 主机，step 就是在这台主机上逐行跑命令；`uses` 则是引用别人写好的现成 action（一包预置步骤），比如 `checkout` 负责把代码拉下来。

理解 Actions，记住这一句就够：**runner 是一台远程主机，主机能做的事它都能做。** 后面那些看着花哨的用法——调 GitHub API、SSH 到服务器、发 HTTP 请求——都是这句话的自然推论，它不只是一台跑 `npm test` 的主机。

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-model.png)

## 跑通 CI

最常见的用法，PR 或 push 时跑测试和 lint。以 Windup 的 [backend.yml](https://github.com/1024XEngineer/Windup/blob/main/.github/workflows/backend.yml) 为例，Python 项目：

```yaml
on:
  push:
  pull_request:

# 同一 ref 新 run 取消旧的,省额度
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: astral-sh/setup-uv@v8.3.2
      - run: uv sync --frozen        # 用提交的 uv.lock 锁定版本
      - run: uv run ruff check .
      - run: uv run pytest -q --cov=packages
      - uses: codecov/codecov-action@v5
```

（精简过，完整文件见上面的链接。）`${{ }}` 是 workflow 里的表达式语法，可以取上下文变量——`github.ref` 就是当前触发这个 run 的分支名。几个通用习惯，后面每个 workflow 都用得上：

- **`concurrency` + `cancel-in-progress`**：同一分支的新 run 取消旧 run。学生改代码很频繁，不取消就排队跑一堆过期 CI，白烧额度（公开仓库免费，私有仓库每月也有固定免费分钟数，个人和教学场景够用）。
- **`permissions` 最小化**：`contents: read` 只给最少权限。开源项目尤其重要，workflow 默认权限很宽。
- **版本 pin**：action 尽量锁具体版本。major tag（如 `@v7`）是浮动指针，维护者账号一旦被攻破可以被重新指向恶意代码，这是供应链攻击的常见入口；而 `setup-uv` 出于安全只发布不可变 tag，所以写死 `v8.3.2`。更稳的团队直接 pin 完整 SHA（比如 Holonic 的 `actions/checkout@11d5960a…`）。

覆盖率上传到 Codecov，PR 页面上能看到覆盖变化。到这步，基本 CI 就立住了：**代码合并前自动经过 lint、测试、覆盖率。**

这些 workflow 现在就跑在 Windup 仓库的 [Actions](https://github.com/1024XEngineer/Windup/actions) 里——CI 检查代码，Triage 自动处理 issue：

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-runs.png)

但这只是 Actions 的基础用法，对协作规范还没怎么发力。

## 把协作规范变成自动化

带团队真正耗精力的不是写代码，是盯着大家按规范来。既然人总会忘，那就让自动化脚本盯着。思路分两种：有的规范自动化脚本直接替你做，比如给 issue 打标签、挂里程碑；有的规范自动化脚本检查你有没有做，没做就提醒、留记录。这一部分就讲怎么把协作流程里的规范，写成自动执行的 workflow。

### 先定义规范长什么样

规范得先有形，自动化脚本才认得。Holonic-Asset 把 issue 模板做成了 8 类（[bug / feature / document / experiment / proposal / performance / refactor / ci-cd](https://github.com/1024XEngineer/Holonic-Asset/tree/main/.github/ISSUE_TEMPLATE)），每类有固定的标题前缀和必填字段：

```yaml
# 01-bug-report.yml（节选）
name: Bug report
title: "[Bug]: "
body:
  - type: textarea
    id: trigger_conditions
    attributes:
      label: Trigger conditions and reproduction steps
    validations:
      required: true
```

```yaml
# config.yml
blank_issues_enabled: false
```

`blank_issues_enabled: false` 直接把空白 issue 禁掉，必须走模板。PR 模板也强制要求声明关联 issue：

```markdown
## Related Issue (Required)
<!-- Use `Closes #123` to close an issue, or `Part of #123` for work that contributes to an issue. Write `None` when this PR has no related issue. -->
```

模板解决的是 issue 该长什么样。下一步是让自动化脚本在 issue 进来时自动处理。

### issue 一进来就自动分派

Windup 的 [triage.yml](https://github.com/1024XEngineer/Windup/blob/main/.github/workflows/triage.yml) 在 `issues` 事件触发时跑一个脚本，自动做四件事：分类、打 label、挂 milestone、设 issue type（节选）：

```yaml
on:
  issues:
    types: [opened]

jobs:
  associate-issue-metadata:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/checkout@v7
      - uses: actions/github-script@v8
        with:
          script: |
            const triageIssue = require('./.github/scripts/triage-issue.cjs')
            await triageIssue({ github, context, core })
```

`actions/github-script` 是关键：在 workflow 里直接跑一段 JS，注入一个**已带好权限的 GitHub API 客户端**——`github` 是 API 客户端，`context` 是事件上下文（当前这个 issue 是谁、长什么样），`core` 负责打日志和输出。比反复 curl API 优雅得多。checkout 之后，仓库里的脚本文件就能直接 `require` 进来，逻辑不用塞在 YAML 里。

[triage-issue.cjs](https://github.com/1024XEngineer/Windup/blob/main/.github/scripts/triage-issue.cjs) 的核心是分类逻辑——扫一眼标题像不像 bug 开头，像就打上 bug：

```js
const TITLE_RULES = [
  { pattern: /^\s*(?:\[bug\]|bug(?:fix)?|fix)(?:\([^)]*\))?\s*[:：-]/i, label: 'bug', issueType: 'Bug' },
  { pattern: /^\s*(?:\[feature\]|feat(?:ure)?)(?:\([^)]*\))?\s*[:：-]/i, label: 'enhancement', issueType: 'Feature' },
]
```

匹配到就自动打上 `bug` / `enhancement` label，再用 GraphQL（GitHub 的查询式接口，和 REST 并列）设 issue type——label 是自由发挥的标签，issue type 是 GitHub 2024 年才推出的官方分类字段（Bug / Feature 这种），筛选和看板都按它结构化，但它目前只能通过 GraphQL API 设置。注意前缀后面要有 `:`（含全角 `：`）或 `-` 分隔符才命中，比如 `[Bug]: xxx`。然后从 open 的 milestones 里选**截止日期不早于 issue 创建日、最近的一个**挂上去：

```js
function selectMilestone(milestones, createdAt) {
  const createdDate = createdAt.slice(0, 10)
  return [...milestones]
    .filter((m) => !m.due_on || m.due_on.slice(0, 10) >= createdDate)
    .sort((a, b) => Date.parse(a.due_on) - Date.parse(b.due_on))[0]
}
```

（节选，完整实现见仓库。）配合 milestone 的 `due_on`，就形成了一套时间线：**issue 一进来就分到当前迭代，学生打开里程碑页面就知道这周该干什么。** 脚本还做了幂等——已设置的字段跳过，不会重复操作。

整个过程就是下面这样，字段被 workflow 逐项点亮：

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-triage.gif)

这是仓库里真实的一个 issue——提完之后，label、milestone、类型就被自动化脚本填好了：

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-issue-triage.png)

“自动 assign 对应同学”也属于这一类，一般按模块负责人映射到成员。示意代码：

```js
const OWNERS = { frontend: 'alice', backend: 'bob' }
// 按 issue 涉及的模块 assign
await github.rest.issues.addAssignees({
  owner, repo, issue_number: issue.number,
  assignees: [OWNERS[module]],
})
```

（示意代码，以官方文档为准。）

### PR 必须关联 issue

协作规范里有一条：**PR 必须有对应 issue。** 人工检查不现实，交给 workflow。[check-pr-issue.cjs](https://github.com/1024XEngineer/Windup/blob/main/.github/scripts/check-pr-issue.cjs) 在 `pull_request_target` 事件时执行，核心就一件事——问 GitHub 一句话：这个 PR 关联 issue 了吗（节选）：

```js
const result = await github.graphql(
  `query PullRequestClosingIssues($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        closingIssuesReferences(first: 1) { totalCount }
      }
    }
  }`,
  { owner, repo, number: pullRequest.number },
)

if (result.repository.pullRequest.closingIssuesReferences.totalCount > 0) {
  core.info('Pull request is linked to an issue.')
  return
}
// 没关联 → 发一条 comment 提醒，且用隐藏标记防重复刷屏
const comments = await github.paginate(github.rest.issues.listComments, { ... })
if (comments.some((c) => c.body?.includes(WARNING_MARKER))) return
await github.rest.issues.createComment({ body: `${WARNING_MARKER}\n⚠️ 此 PR 尚未关联 issue……` })
```

真实效果——没关联 issue 的 PR 提交后，自动化脚本会自动留一条这样的提醒：

![](https://stack-mcell.tos-cn-shanghai.volces.com/github-actions-pr-warning.png)

这个脚本有两个细节值得记：

- 用 GraphQL 的 `closingIssuesReferences` 判断 PR 是否关联 issue，不仅能识别描述里的 `Closes #123`，还能识别 Development 侧栏的关联；
- 用隐藏的 HTML 注释 `WARNING_MARKER` 标记已提醒过，避免每次 push 都刷屏。幂等提醒，这类自动化脚本必须考虑。

顺带说一个容易踩的坑：这个检查用的是 `pull_request_target`，不是 `pull_request`。fork 来的 PR 触发 `pull_request` 时，出于安全**不提供仓库 secrets、GITHUB_TOKEN 只有读权限**——你连 comment 都发不了，这正是它改用 `pull_request_target` 的原因。后者跑的是**仓库默认分支（通常 main）上已有的那份 workflow**，带完整权限：它执行的是你自己写好的代码，不执行 PR 里的内容。也正因如此，这类 workflow 的逻辑本身必须安全——真正的坑是，如果你在 workflow 里 checkout 了 PR 的代码再跑构建，PR 作者写的东西就直接跑在了带 secrets 的权限环境里，历史上被攻破的案例全是这个套路。

还有一个容易漏的收尾：这类检查要挂到仓库的 **required status checks**（分支保护规则）上。不挂，它只是一条评论——评论可以被无视，三周后连维护者都不看了。挂上之后，没关联 issue 的 PR 直接显示失败、**合不进来**，机器人从“提醒”升级成“闸门”。这也是整篇文章所有“检查类”自动化的通用收尾：**纯提醒没有强制力，检查必须挂上闸门。**

### 定时任务：巡检没人管的 issue / PR

光在事件发生时响应不够，还要定期翻一翻“那些没人管的”。用 `schedule` 触发，配合 cron：

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'   # 每周一早上 9 点（UTC）

jobs:
  stale-check:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/github-script@v8
        with:
          script: |
            // 遍历 open 的 issue / PR，超过 N 天没更新的，发 comment 提醒作者推进
```

（示意代码，以官方文档为准。）

定时任务本质是“一台定期被叫醒的主机”，就像 Linux 上的 cron 定时任务，只是由 GitHub 托管、自动带上了仓库的 API 权限。两个小区别：schedule 只在默认分支上跑，高峰期可能延迟几分钟到几十分钟——别拿它当秒级准点的定时器。

到这里，协作的三块硬规范——issue 分派、PR 关联、stale 巡检——都自动跑了。学生提一个 issue，标题写对，剩下全自动。

## 发版与部署

协作规范管的是日常的提 issue、提 PR。另一块容易乱的是发布：什么时候发版、发什么、怎么部署，靠人记同样不可靠。这块也交给了 Actions。

### tag → release

规范的发布流程：打 tag 触发，自动生成 release、附构建产物：

```yaml
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
      - run: make build
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*
```

（示意代码，以官方文档为准。）

### CD：发布后自动部署

Holonic-Asset 的 [backend-cd.yml](https://github.com/1024XEngineer/Holonic-Asset/blob/main/.github/workflows/backend-cd.yml) 是真实的 CD：push 到 `deploy` 分支（也能在 Actions 页面点按钮手动触发）时，在 runner 上构建 Linux 二进制，SSH 到服务器、**先上传为临时文件再原子替换**（避免“文件传到一半服务就重启”的中间状态）、重启 systemd 服务（精简）：

```yaml
on:
  push:
    branches: [deploy]
  workflow_dispatch:   # 也可以从 Actions 页面手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v5
        with:
          go-version-file: core-api/go.mod
      - name: Build Linux backend
        working-directory: core-api
        run: go build -trimpath -ldflags="-s -w" -o dist/app .

      - name: Configure SSH Key
        run: |
          echo "${{ env.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

      - name: Upload binary and restart service
        run: |
          scp -P "$SSH_PORT" -o StrictHostKeyChecking=no \
            core-api/dist/app "${SSH_USER}@${SSH_HOST}:/usr/local/bin/holonic-asset/app.incoming"
          ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" \
            "chmod +x app.incoming && mv -f app.incoming app && sudo systemctl restart holonic-asset.service"
        env:
          SSH_HOST: ${{ secrets.DEV_BACKEND_SSH_HOST }}
          SSH_PORT: ${{ secrets.DEV_BACKEND_SSH_PORT || '22' }}
          SSH_PRIVATE_KEY: ${{ secrets.DEV_BACKEND_SSH_PRIVATE_KEY }}
```

（精简过，完整文件见上面的链接。）到这里 runner 的能力又延伸了一步：**它直接替开发者连上了生产服务器。** 部署密钥放在 GitHub Actions secrets 里，不用任何人持有私钥。里面的 `StrictHostKeyChecking=no` 跳过了 SSH 主机指纹校验——部署目标固定、密钥只在 secrets 里时是常见取舍，但别养成习惯。这也解释了为什么前面反复强调 `permissions` 最小化——runner 权限越大，它保管的密钥越危险。

## runner 还能做什么

前面几部分覆盖了最常见的用法。再往上是些更有想象力的方向，都不复杂：

- **IM 通知**：workflow 结束时调用企业微信 / 钉钉 / Slack 的 webhook，把结果推给群。跑很久的 CI 完成时，大家不用守着页面刷新。

```yaml
- name: Notify IM
  if: always()
  run: curl -X POST "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" \
    -d '{"msgtype":"text","text":{"content":"构建完成"}}'
```

（示意代码，以官方文档为准。）

- **Codex 做 PR review**：OpenAI 官方有 [codex-action](https://learn.chatgpt.com/docs/github-action)，官方示例就是接进 GitHub Actions 写一个 PR review bot，在 PR 上跑 AI 代码审查，需要配 `OPENAI_API_KEY` 之类的 secret；也能让 Codex 直接改代码（比如修 CI），[官方 cookbook 里有现成模板](https://github.com/openai/openai-cookbook/blob/main/examples/codex/Autofix-github-actions.ipynb)可抄，但仍要自己拼 workflow、按项目调整，没有开箱即用的一键修复。思路和前面一致——**把另一个“AI runner”塞进 workflow。**

- **Bun 的 AI 维护者**：这个方向 Bun 走得更远。它的仓库里住着一个叫 robobun 的 AI bot——提一个 bug issue，它自动分析代码、修复、提交 PR，像一位时刻在线的真人维护者。翻它的 [workflows 目录](https://github.com/oven-sh/bun/tree/main/.github/workflows)能看到一整套配套：给 bot 的 PR 自动打标签、用 LLM 做 issue 判重，甚至专门有个 workflow [关掉 robobun 开多的过期 PR](https://github.com/oven-sh/bun/blob/main/.github/workflows/close-stale-robobun-prs.yml)——**机器开 PR 也会刷屏，自动化自己也需要被管理。**

- **LLM 判重**：issue 去重我调研过，用 LLM 判断两个 issue 是不是同一个问题。可行，但最后没做——每次调用要付 API 费用，而且判错比不判更糟，把相关 issue 误合并不好收场（Bun 的仓库里倒有个真在跑这个的 workflow）。这个取舍，动手前值得想清楚：自动化不是免费的，误报也是成本。

- **自托管 runner**：runner 也不必是 GitHub 的机器。私有仓库要连内网服务器、或者需要特殊硬件（GPU、Apple Silicon 芯片），可以注册 self-hosted runner——你自己的机器当 CI 机。[llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/server-self-hosted.yml) 就这么干：带 Apple Silicon 的 Mac 跑 Metal GPU 测试，带 NVIDIA 显卡的机器跑 CUDA 测试；Homebrew 用它构建 bottles。这算是把开头那句话贯彻到底——**主机能做的事它都能做，包括这台主机是你自己的。**

## 大项目怎么玩

上面这些来自两个学生项目。再看一个顶流开源项目，Actions 能玩到什么程度。Ant Design 仓库里有 33 个 workflow：每次 push 重拍全组件截图基线，每个 PR 自动部署一个可点的文档预览站、自动做视觉回归对比，每个 commit 发布一个可安装的预览包。发布一个版本 tag，好几个 workflow 同时被踢起来：[发推、三个钉钉群推 changelog、构建并部署站点、生成 Release 附件](https://github.com/ant-design/ant-design/blob/master/.github/workflows/site-deploy.yml)——其中站点构建最重，一次跑 30–45 分钟。它还有[一个每 5 分钟醒一次的机器人](https://github.com/ant-design/ant-design/blob/master/.github/workflows/pr-auto-merge.yml)：master / feature / next 几个长期分支并行开发，靠它自动互相合并同步——CI 全绿就 merge 掉带标记的同步 PR，不用维护者手工追。

说到合并队列，GitHub 官方的 **merge queue** 解决一个经典问题：两个 PR 单独测都绿，合到一起就挂。它把 PR 编成一组放进临时分支一起跑 CI，谁坏了谁出队。GitHub 自己就在用，[官方博客给出的数字](https://github.blog/engineering/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/)是每月合并约 2500 个 PR、等待时间降低 33%。

依赖更新也有机器人：**Dependabot + auto-merge** 是个人项目立刻能用的组合——Dependabot 每天开升级 PR，配一个 workflow 对 patch / minor 版本自动 approve 并合入，major 版本留人工确认，依赖从此不再腐烂。

## 收尾

回看最开始的问题——规范总有人忘记。用 skill、AGENTS.md 去约束 agent，管得住 agent 写的代码，管不住人直接在页面上操作的半边；Actions 是补上这半边：**不要求任何人记住规范，把规范拆成一个个自动检查，没做到就有记录、有提醒。** 提醒不够的，就把检查挂到 required status checks 上——机器人从“提醒”升级成“闸门”，没做到就合不进来。自动化脚本盯着流程，人只看红灯亮没亮。

这条思路的底层，还是开头那句话：runner 是一台远程主机，带权限、可定时、可联网。把它当“跑测试的地方”太浪费了——antd 用它发版，llama.cpp 用它跑 GPU，GitHub 用它合 PR。触发、定时、job、自托管 runner，四块积木不算多，组合出来的东西不少：想到一个要管的流程，就写成一个 workflow，跑起来看看，坏了就修。它的上限比想象中高很多。
