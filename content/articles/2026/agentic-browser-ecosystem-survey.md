---
type: article
title: "谁在为 AI 开车：Agent 浏览器生态调研（2026）"
date: 2026-08-14
updated: 2026-08-14
description: "调研 2025-2026 年 Agent 专用浏览器生态：Chrome DevTools MCP 与 Playwright MCP 的定位差异、DOM 与视觉两条技术路线、Kitesurf 与 Lightpanda 等轻量浏览器，以及 CDP 到 WebMCP 的协议演进。"
tags: [Agent 浏览器, MCP, CDP, 调研报告, 浏览器自动化]
keywords:
  [
    Agentic Browser,
    Chrome DevTools MCP,
    Playwright MCP,
    computer use,
    CDP,
    WebDriver BiDi,
    WebMCP,
    Browser Use,
    Stagehand,
    Skyvern,
    Lightpanda,
    Kitesurf,
    AI Agent,
  ]
order: 61
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/agentic-browser-survey-cover.png)

去年 10 月底的公司黑客松上，我们组做了一个能操作电脑的 Agent：让它自己打开浏览器、帮我导航网页（当时的演示我传到了 [B 站](https://www.bilibili.com/video/BV1oTszz7EuP/)）。Agent 本身的调用没问题，但它在操作浏览器时慢得让人着急：每一步都要先详细解析一遍页面结构，操作期间我还只能在旁边干看着，不能动这台电脑。这种速度和效率，还不如我自己上手点。

那次之后我开始关注 Agent 操作电脑的生态，Browser Use、Codex Desktop 这类项目让我看到了更成熟的玩法。而今天——就是写这篇文章的这些天——我发现 Claude Code 自带的浏览器工具在帮我验证页面时，同样如此：**没有打开一个可见的浏览器窗口，验证却做完了。**（后来我才知道，那是桌面版在 2026 年 7 月刚发布的正式功能。）它到底是怎么“看”网页的？

页面在屏幕上是一堆像素，AI 既没有眼睛，也没有你点鼠标的手指。顺着这个问题查下去，我发现 2025-2026 年“给 AI 用的浏览器”已经长成了一个完整的产业。

本文是这次调研的记录。

## 一、三个角色：造协议的、写框架的、卖服务器的

想象造一辆自动驾驶的车，需要三拨人：有人定方向盘和油门的接口标准，有人写驾驶逻辑，有人造和维护车队。Agent 浏览器生态恰好对应这三层：

- **造协议的**：定义“程序怎么和浏览器对话”。现在的局面是新旧交替——老接口（CDP，Chrome 开发者工具背后的遥控协议）进入维护期，新标准（BiDi、MCP、WebMCP）在接力。
- **写框架的**：解决“怎么驱动浏览器干活”，代表是 Browser Use、Stagehand、Skyvern。
- **卖服务器的**：解决“浏览器跑在哪”。成千上万个 AI 同时上网，每个都需要一个浏览器环境，于是有了 Steel、Hyperbrowser、Browserbase 这类托管/自托管浏览器云。

![Agent 浏览器生态三层结构](https://stack-mcell.tos-cn-shanghai.volces.com/agentic-browser-layers.png)

这一层划分的好处很实际：**选型时分开决策**。框架和基础设施不是竞品——Browser Use 搭配 Steel、Stagehand 搭配 Browserbase，是常见组合。

## 二、两大官方工具：一个开车，一个修车

2026 年，浏览器巨头各自送出了官方的 AI 接口。理解它们的分工，就理解了整个生态的骨架。

**Chrome DevTools MCP**（Google 出品，微软参与合作）：把 Chrome 调试工具的完整能力交给 AI——打开页面、点击、填表、看网络请求、做性能分析、拍快照。它在 2026 年 6 月随 Chrome 149 从实验转正（[官方发布说明](https://developer.chrome.com/blog/new-in-devtools-149?hl=en)）。最实用的能力是“附着到你正在运行的 Chrome”——你的登录态、Cookie、插件它都能用，绕开了 AI 上网最大的拦路虎：登录墙。

**Playwright MCP**（微软出品）：定位是“测试与自动化”——把浏览器的操作抽象成稳定、可重复的步骤，跨 Chrome、Firefox、Safari 三种浏览器。

业界有个到位的比喻：**Playwright 是司机，DevTools 是修车工**（[Steve Kinney 的文章](https://stevekinney.com/writing/driving-vs-debugging-the-browser)）。一个负责“把车开稳”，一个负责“车坏了能查”。有意思的是成本：很多人以为 Playwright 更省 token，实际恰恰相反——它每操作一步就把整页的结构快照发给 AI，页面一复杂就是几万 token；DevTools 按需取用，多步流程反而便宜一个量级（[第三方对比](https://mcp.directory/blog/chrome-devtools-mcp-vs-playwright-mcp-2026)）。

## 三、AI 的两种“眼睛”：读菜单，还是看照片

理解了谁来干活，再看 AI 到底怎么“看”网页——这是整个生态最核心的分野。

**读菜单（DOM 路线）**：网页在浏览器内部有一份“结构菜单”——标题是什么、按钮叫什么、输入框在哪。AI 读这份菜单来操作：token 便宜（一份菜单几千字）、动作精准、速度快。代价是脆：网站一改版，或者内容是画在画布上而不是文字（很多图表、验证码就是这样），菜单就读不出来了。另外网站能识别出“来的是机器人”，反爬会拦截。

**看照片（视觉路线）**：每做一步，截一张整页图，AI 看图决定点哪。这就是各种 “computer use” 的做法。好处是“人能看到就能点”——任何界面、任何网站，甚至桌面软件都能操作。代价是贵：每一眼都是一张照片的 token，成本比读菜单**高约一个数量级**（第三方评测 [Respan](https://www.respan.ai/market-map/compare/anthropic-computer-use-vs-openai-operator) 测得 Anthropic 的方案每个任务约 $0.3–1.5，是主流方案里最贵的）；而且看图猜坐标，点错是常事。

![三条技术路线对比](https://stack-mcell.tos-cn-shanghai.volces.com/agentic-browser-routes.png)

还有第三条路刚冒头：**网站主动配合**。Google 和微软联合起草的 WebMCP 方案（W3C 草案）让网站自己声明“我支持这些操作”——比如订票网站直接告诉 AI“我的搜索接口长这样”，AI 就不再需要读菜单或看照片，直接从源头对接。官方宣称比视觉循环快 8-12 倍（早期基准，未经广泛复现），目前还在 Chrome 的公开试用阶段。

**2026 年的共识是混合**：默认读菜单（便宜），菜单读不动就看照片（兜底），做顺手的操作固化成脚本下次直接执行（零 AI 成本）。这个“越用越便宜”的路线，做得最好的是 [Stagehand](https://www.browserbase.com/blog/stagehand-v3)——第一次让 AI 做，之后照抄，官方数据最快能快 44%。

## 四、离你更近的：给编码 Agent 装“浏览器眼睛”

两条路线是“怎么看”的问题。2026 年出现了一批工具，把这两条路线落地到一个更日常的问题上：**你让 AI 改前端代码，它怎么验证自己改对了？** 用上一节的路线做参照，它们是这样选边的：

**读菜单派**——把“读菜单”做到极致：

- **[Claude Code 桌面版内置浏览器](https://code.claude.com/docs/en/whats-new/2026-w28.md)**（2026 年 7 月第 28 周发布）：Claude 在内置的浏览器面板里打开任意网站，像验证本地 dev server 一样点击、阅读、交互。官方强调两点：沙箱化，且安全分类器会审查它对外部站点的操作；默认使用干净的独立 profile（不带你的登录态），需要“以你的身份”操作时官方建议改用 Chrome 扩展。开头那个“没开窗口就做完验证”的工具，就是它。
- **[agent-browser](https://github.com/vercel-labs/agent-browser)**（Vercel，40k+ stars）：Rust 写的命令行工具，自带 MCP。页面快照直接输出带编号的 accessibility tree，AI 按编号点元素，不用猜 CSS 选择器。默认无界面运行，登录态给了六种方案，包括直接从你正在用的 Chrome 里抓取。Vercel 还做过一个配套 skill，强制“启动 dev server 后必须先用浏览器验证”——存活了约三周就被更完整的验证 skill 取代，可见这个领域迭代之快。

**看照片派**——回答“菜单说没问题，但页面看起来对吗”：

- **[Frontend-VisualQA](https://github.com/yutori-ai/frontend-visualqa)**（Yutori）：它不看 DOM，直接用视觉模型看截图，判断“进度条是不是真的走到 100%”“弹窗是不是渲染在了屏幕外”。解决的是读菜单派的天生盲区：DOM 断言通过 ≠ 页面真的对。

**登录态与工作流派**——关心的不是“怎么看”，而是“怎么用起来”：

- **[ego-lite](https://github.com/citrolabs/ego-lite)**（Citro Labs，约 1 万 stars）：一个可以和你共享登录态的浏览器。它把“AI 操作浏览器”从“开一个空白浏览器、登录态全靠搬运”变成“AI 用你的浏览器，但隔离在自己的 Space 里，不抢你的鼠标和标签页”。有第三方评测称登录页的 token 消耗从 3 万+ 降到 200-400（官方只作定性声称，数字出处见参考资料）。目前仅支持 macOS。
- **[Shiplight MCP](https://docs.shiplight.ai/getting-started/quick-start.html)**：把“验证”变成可持续的工作流——AI 每改一次代码就在真实浏览器里跑一遍验证，再把验证步骤存成 YAML 意图测试（“确认订单信息已显示”这类人话断言），之后每次改动和 CI 里都能复跑，页面改版时自动重新定位元素。

这些工具的共同点是 **skill 化**：工具只提供能力，经验被封装成一个个 skill（“什么时候该验证”“验证什么”“失败怎么定位”），而且迭代极快。这也是它们和“通用驱动工具”最大的区别——离场景更近，离人更近。

## 五、为 AI 重新发明的浏览器

沿着“读菜单”的逻辑往下推会得出一个大胆的结论：**如果 AI 只需要菜单，为什么还要背着一个为人类眼睛打造的完整浏览器？** 人类浏览器 90% 的力气花在渲染像素上——动画、合成、GPU——而这些 AI 根本不需要。

2026 年下半年，一批“只为 AI 而生”的浏览器出现了，而且不约而同选择了同一条路：**兼容 Chrome 的接口（CDP），但把资源消耗砍掉一个量级**：

- **Kitesurf**（Cloudflare，2026 年 8 月 7 日发布）：跑在 Cloudflare 的服务器上，官方宣称 CPU 省 3-4 倍、内存省 5-7 倍（[TechCrunch 报道](https://techcrunch.com/2026/08/07/cloudflare-launches-kitesurf-a-browser-built-for-ai-agents/)）；
- **Lightpanda**（Zig 语言从零手写）：官方基准里比 Chrome 快约 9 倍、省内存约 16 倍（933 个真实网页的测试，[官方仓库](https://github.com/lightpanda-io/browser)）。代价是不能截图——它干脆不做渲染；
- **Obscura**（Rust）：约 30MB 内存就能跑一个浏览器实例，一台 32GB 的服务器可以跑一千多个——相比之下 Chrome 只能跑一百多个。

三者都还是 beta，网页兼容性不完整，但方向明确：**浏览器内核第一次为程序而不是为人做优化**。

## 六、协议正在换代

这一节压缩成三件事：

1. **Chrome 的老接口（CDP）已进入维护期**，新的跨浏览器标准 BiDi 正在接力——Firefox 已经在 2025 年 6 月把老接口彻底移除，逼着整个生态迁移；
2. **MCP 成为 AI 与浏览器之间的事实标准**——第二节的两个官方工具都是 MCP 形态，Claude Code、Cursor 等工具都能装；
3. **WebMCP 想把标准再推进一步**：让网站自己开口，这需要时间，但方向很清晰。

## 七、你能做什么

如果你现在就想让 AI 帮你操作网页（比如自动查资料、填表、监控页面），最直接的路径是给 Claude Code 装官方工具：

```bash
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest
```

选型按场景对号入座：

- **在 Claude Code 里做前端开发** → 桌面版内置浏览器，零安装、沙箱安全
- **每天要反复跑的固定流程**（抓数据、填表）→ Playwright MCP，把步骤写死
- **想省 token、要稳定的结构化操作** → Vercel 的 agent-browser
- **要用自己的登录态、又不被打扰** → ego-lite（目前限 macOS）
- **想让验证进 CI 长期复跑** → Shiplight；还想补上“看起来对不对” → Frontend-VisualQA
- **操作界面千奇百怪的网站**（菜单读不了只能看图的）→ 视觉路线的工具，准备好为 token 买单

三个共同的坑要记住：登录验证（扫码/人机验证）、反爬拦截、AI 被网页内容误导（页面里藏一句“忽略你的指令”就可能带偏它）。2026 年的共识是：先在自己的、有人监督的场景用起来，再谈全自动。

## 参考资料

- [Chrome DevTools MCP（GitHub）](https://github.com/ChromeDevTools/chrome-devtools-mcp) / [Chrome 149 发布说明](https://developer.chrome.com/blog/new-in-devtools-149?hl=en)
- [Playwright MCP（GitHub）](https://github.com/microsoft/playwright-mcp)
- [Claude Code 2026 年第 28 周更新日志（桌面版内置浏览器）](https://code.claude.com/docs/en/whats-new/2026-w28.md)
- [agent-browser（Vercel，GitHub）](https://github.com/vercel-labs/agent-browser)
- [ego-lite（Citro Labs，GitHub）](https://github.com/citrolabs/ego-lite) / [ego-lite token 数据出处（阿里云开发者社区）](https://developer.aliyun.com/article/1752929)
- [Shiplight 快速上手](https://docs.shiplight.ai/getting-started/quick-start.html)
- [Frontend-VisualQA（Yutori，GitHub）](https://github.com/yutori-ai/frontend-visualqa)
- [Chrome DevTools MCP vs Playwright MCP（mcp.directory，2026）](https://mcp.directory/blog/chrome-devtools-mcp-vs-playwright-mcp-2026)
- [Driving vs Debugging the Browser](https://stevekinney.com/writing/driving-vs-debugging-the-browser)
- [Stagehand v3 发布公告（Browserbase）](https://www.browserbase.com/blog/stagehand-v3)
- [Kitesurf（TechCrunch，2026-08-07）](https://techcrunch.com/2026/08/07/cloudflare-launches-kitesurf-a-browser-built-for-ai-agents/)
- [Lightpanda（GitHub，含官方基准）](https://github.com/lightpanda-io/browser)
- [WebDriver BiDi 路线图（Mozilla）](https://wiki.mozilla.org/WebDriver/RemoteProtocol/WebDriver_BiDi)
- [WebMCP 技术笔记（W3C WICG）](https://w3c-cg.github.io/aikr/webMCP/webmcp-technical-notes.html)
- [2026 Agentic Browser 生态地图（Unbrowse）](https://www.unbrowse.ai/blog/agentic-browser-wars-2026-landscape)
- [Computer Use vs Operator 对比（Respan）](https://www.respan.ai/market-map/compare/anthropic-computer-use-vs-openai-operator)
