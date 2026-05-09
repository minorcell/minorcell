---
title: 前端性能优化手册
description: 从测量、资源、渲染到框架与构建工具链，一步步建立「遇到性能问题该怎么想、怎么做」的完整决策框架
type: interactive
tags: [前端, 性能优化, Core Web Vitals, React, Vite]
---

> **页面卡 → 先量再优 → 瓶颈在首屏 → 从资源加载入手 → 交互也要流畅 → React 有它自己的坑 → 构建阶段还能压榨 → 监控兜底。每一步都是上一步逼出来的。**

性能优化最大的陷阱不是「不知道该优化什么」，而是「不知道问题在哪就开始优化」。压缩图片、改 webpack 配置、加 memo——这些事情做一遍，页面可能还是卡。不是手段没用，是你跳过了最关键的第一步：先量。

在碰任何优化手段之前，先回答一个问题：**你的页面到底慢在哪里？**

这个问题只有工具能回答，直觉不能。接下来的第一部分，我们先建立测量能力。

<!-- step-demo src=demos/fibonacci-block.html title="主线程阻塞 · Fibonacci" -->

## 1 · 主线程阻塞：性能问题的原始形态

左边是一个斐波那契计算器和一个实时时钟。先看一下时钟——它每 16ms 刷新一次，走得很流畅。现在点一下 **Fibonacci(45)**。

时钟停了。不是你的浏览器坏了——是主线程被那个递归计算死死占住了。`requestAnimationFrame` 是一个每帧都触发的回调，它驱动着时钟的每一毫秒更新。但当主线程上有一个同步计算跑了十几秒，`requestAnimationFrame` 根本得不到执行机会——帧出不来，时钟自然就冻住了。

浏览器一帧只有 ~16.7ms 的预算（60Hz 屏幕）。在 Fibonacci(45) 跑完之前，点击事件、滚动、动画、网络回调——统统排队等着。

记住这个事实：**不是「代码跑得慢」，而是「跑的这段时间里，什么都做不了」。** 前者加服务器能解决，后者加服务器没用。两者的区别，就是整个性能优化领域的起点。

<!-- step-demo src=demos/paint-timing.html title="Paint Timing · FP & FCP" -->

## 2 · 第一步测量：FP 和 FCP

上一节我们「感觉」到了卡——但感觉不能量化。量化需要一把尺子，浏览器内置的 Performance API 就是这把尺子。

左边用 `performance.getEntriesByType('paint')` 读出了两个最基础的时序指标：

- **FP（First Paint）**：浏览器**第一次往屏幕上画了任何东西**的时间点。哪怕只是一个背景色变化，也算。
- **FCP（First Contentful Paint）**：浏览器**第一次画了有内容的东西**——文字、图片、canvas 里的图形。比 FP 更有意义，因为它表示用户真的看到了信息，而不只是一个白屏变灰屏。

这两个值的单位都是毫秒，从导航开始那一刻起算。点一下刷新按钮，看看你自己的页面 FP 和 FCP 是多少。

这两把尺子能告诉你「用户等了多久才看到东西」。但它们太粗糙了——它们只管你有没有画第一笔，不管这一笔到底画了什么，也不管后续交互卡不卡。要回答这些问题，需要更精细的指标。

```js step file=steps/measure-metrics.js

```

## 3 · Core Web Vitals：三个维度定义「好体验」

FP 和 FCP 是浏览器自带的测量维度。Google 在 2020 年推出了三个更聚焦用户体验的指标，统称 **Core Web Vitals**。左边代码分别用 PerformanceObserver 监听每一个：

**LCP（Largest Contentful Paint）—— 加载体验**

页面最大块的可见内容（首屏大图、标题文字、hero 区域的视频封面）什么时候画出来。LCP ≤ 2.5s 是绿色，> 4.0s 是红色。它本质上在问：「用户觉得页面加载完了吗？」

**INP（Interaction to Next Paint）—— 交互体验**

从用户点击/敲键盘/滑动，到浏览器画出下一帧，中间的延迟。INP ≤ 200ms 算好，> 500ms 算差。它不是平均值——是一段时间内用户最差体验的那次交互。这很公平：用户只记得最卡那一下。

注意 INP 需要真实用户交互才能触发。实验室里对着页面发呆是拿不到 INP 的。

**CLS（Cumulative Layout Shift）—— 视觉稳定性**

页面加载过程中，元素突然移位了多少。你有没有过「准备点一个按钮，结果上面突然塞进来一个广告，你点到了别的东西」的经历？那就是 CLS 在作祟。CLS ≤ 0.1 是绿色。

左边代码里有个关键细节：`if (!entry.hadRecentInput)` —— 用户主动点击导致的布局变化（比如点了展开按钮弹出一个区域）不算 CLS。只算页面**自己**乱动的那部分。

三个指标，三个维度——加载、交互、视觉稳定——构成了 Google 定义的「好体验」。但指标告诉你的是「是什么慢」，不是「为什么慢」。下一步要请出工具。

<!-- step-image src=/images/tutorials/performance/devtools-performance.png alt="Chrome DevTools Performance 面板 — 火焰图（Flame Chart）展示主线程活动" -->

## 4 · Chrome DevTools Performance：看穿主线程

PerformanceObserver 能告诉你 LCP 是 3.2s——但这 3.2s 花在哪了？是 JavaScript 执行太慢，还是渲染阻塞，还是网络请求等太久？

Chrome DevTools 的 Performance 面板（F12 → Performance → 点录制 → 刷新页面 → 停止录制）给出一张**火焰图（Flame Chart）**——主线程在每一毫秒干了什么的完整记录。

读这张图的要领：

- **横轴是时间**。越宽，说明这个任务占的时间越长。
- **纵轴是调用栈**。从下往上看，下面是调用者，上面是被调用的函数。
- **黄色是脚本执行**，紫色是渲染，绿色是绘制。一大片黄色 = JS 在霸占总线。
- **红色三角标记**是长任务（Long Task）——执行时间超过 50ms 的块，浏览器会在右上角标出来。

Performance 面板是你优化后「回头看」最核心的工具。先把它的基本操作熟悉了——后面每一部分优化完之后，都要回来对着火焰图检查。

<!-- step-image src=/images/tutorials/performance/lighthouse-report.png alt="Lighthouse 审计报告 — 性能、可访问性、最佳实践、SEO 四维度评分" -->

## 5 · Lighthouse：自动化的「体检报告」

Performance 面板给你的是原始时序数据——细致但需要解读。Lighthouse 给你的是**报告单**：总分 + 分级诊断 + 具体建议。

运行方式：F12 → Lighthouse 标签 → 选 Performance → Generate report。30 秒后你拿到一份从四个维度打分的报告（Performance / Accessibility / Best Practices / SEO），以及按优先级排列的诊断清单。

看 Lighthouse 报告的正确心态：

- **分数是信号，不是判决**。100 分不一定完美，40 分不一定不能用。
- **看诊断项比看总分重要**。Diagnostics 里的「Reduce unused JavaScript」「Properly size images」「Eliminate render-blocking resources」——每一项都是一条可操作的建议。
- **本地跑 Lighthouse 不等于真实用户数据**。你的开发机通常比用户设备快，网络也更稳定。它是一份「实验室条件下的体检单」，不是「真实世界的流行病学调查」。后者需要 RUM（Real User Monitoring），这个我们最后一部分再讲。

<!-- step-image src=/images/tutorials/performance/network-waterfall.png alt="Network 面板瀑布图 — 每个资源的请求时序、大小、优先级" -->

## 6 · Network 面板：读懂资源时间线

说到加载，真正的战场在 Network 面板（F12 → Network → 刷新页面）。

左边这张**瀑布图**（Waterfall）是你要学会读的最重要的一张图。每一行是一个 HTTP 请求，每一段的颜色代表请求的不同阶段：

- **排队（Queueing）**：浏览器在等——可能是达到了同域并发上限（HTTP/1.1 是 6 个），或者优先级不够高。
- **DNS Lookup / 初始连接 / SSL**：建连成本。慢的话考虑 `preconnect`。
- **等待（TTFB）**：服务器处理时间。慢的话是后端问题。
- **下载（Content Download）**：传输时间。慢的话包太大。

把鼠标悬停到任意一个请求上，看它的 Waterfall 分段。哪个阶段占比最大，瓶颈就在哪。没有瀑布图的帮助，优化方向基本靠猜。

到这里，测量工具箱就完整了：PerformanceObserver 做程序化监控，DevTools Performance 做深度分析，Lighthouse 做自动化诊断，Network 做资源审计。第二部分我们换个角度——不再问「有多慢」，而是问「什么东西让它变慢了」。

<!-- step-demo src=demos/image-format-compare.html title="图片格式对比 · JPG / PNG / WebP / AVIF / SVG" -->

## 7 · 图片格式：同样的画面，500 倍的体积差

左边六张卡片全是相同的画面——一个圆形渐变图案。它们唯一的区别是**文件格式**。

看一下每张卡右下角的体积：

- **JPG 483KB** — 有损压缩，照片首选，但不支持透明。
- **PNG 2.2MB** — 无损压缩，有透明通道，但体积动不动就上天。
- **WebP 126KB** — 比 JPG 小约 70%、比 PNG 小约 95%。所有现代浏览器都支持。
- **AVIF 98KB** — 比 WebP 更小，HDR 支持，但编码速度慢。适合静态资源 CDN 自动转码。
- **GIF 780KB** — 256 色调色板 + 动画。一个 3 秒的 GIF 比同长度的 MP4 大 5-10 倍。别再用了。
- **SVG 4KB** — 矢量图形。图标、logo、简单插图的正确选择。

一张图从 PNG 换成 WebP，首屏 LCP 可能直接从 4s 掉到 1.5s——这不是夸张，是对比格式体积之后的直接换算。图片通常占页面总字节的 50% 以上，压缩收益比其它任何优化都大。

但格式只是第一步。图片什么时候加载、加载多大尺寸——同样重要。

```js step file=steps/image-loading.js

```

## 8 · 图片策略：懒加载、响应式、预加载——三种互补手段

左边代码覆盖了图片加载中最实用的四种技术。它们解决三种不同的问题：

**懒加载（Lazy Loading）—— 「没看到就不加载」**

首屏以下的内容不需要在页面打开那一刻就下载。浏览器原生的 `loading="lazy"` 一行就能搞定大多数场景。如果要做更细粒度的控制（比如提前 200px 开始加载、或按可见比例触发），再用 IntersectionObserver。

**响应式图片（Responsive Images）—— 「不要在大屏幕上给手机分辨率，反之亦然」**

`<picture>` + `srcset` + `sizes` 这三个东西组合起来，让浏览器根据屏幕宽度和 DPR 自动选最合适尺寸的图片。同一个位置，手机上可能只需要 400px 宽的版本，桌面端可能需要 1200px。不做响应式，就是在让小屏设备下载大屏图片——徒增字节还拖慢 LCP。

**预加载（Preload）—— 「首屏大图别等 CSS 解析了再开始下载」**

浏览器正常流程是 HTML → 遇到 `<link>` / `<style>` → 构建 CSSOM → 才发现里面有张背景图要下载。`<link rel="preload">` 把这张图的下载提前到「解析 HTML 阶段」，省去等 CSSOM 的时间。只对首屏 hero image 用——滥用会让所有资源的优先级都变高，等于都没有优先级。

**`fetchpriority`** 是控制资源优先级的最后一把钥匙：首屏大图标 `high`，页脚装饰图标 `low`。优先级高的资源在 HTTP/2 连接上获得更多带宽份额。

图片说了这么多，但首屏还有一个容易被忽略的加载瓶颈——字体。

<!-- step-demo src=demos/font-compare.html title="字体加载对比 · 系统字体 vs 自定义字体" -->

## 9 · 字体加载：看不见的下载可能有几百 KB

左边三个卡片展示的是同一个文本块，用了三种不同的字体策略：

- **系统字体** — 零网络开销，因为字体文件已经在操作系统里了。唯一的代价是「不一定好看」。
- **Crimson Text 正常加载** — 字体文件从 Google Fonts 下载。网络慢的话，文字可能在几秒内是**不可见的**——浏览器默认在等字体文件下完才渲染文字。这叫 FOIT（Flash of Invisible Text）。
- **Crimson Text `font-display: swap`** — 跟上面同一个字体，但浏览器接到指令：「别等，先用系统字体顶着」。文字立即可见，字体加载完成后再替换。视觉上有个短暂闪烁（FOUT），但内容始终可见。对正文来说，FOUT 远好于 FOIT——用户能读比字体好看重要一万倍。

中文网站的字体问题更严峻：一个中文字体文件动辄 3-5MB，因为中文字符集有上万个字符。不处理的话，首屏 LCP 直接加几秒。

```css step file=steps/font-strategies.css

```

## 10 · 字体策略：font-display、子集化、预加载——三管齐下

左边代码给出了字体优化的完整方案。关键决策有三个：

**`font-display: swap` 是你的默认选项。** 正文内容字体一律用 swap——让文字立刻可见，再慢慢替换。只有图标字体（icon font）或品牌 logo 专用字体可以考虑 block 或 optional——因为这些场景「样式错误」比「看不见」更糟糕。

**中文字体必须做子集化。** 你的页面不会用到全部 2 万个汉字。用 `glyphhanger` 或 `fonttools pyftsubset` 只把实际用到的字符提取出来，5MB 的字体文件能砍到几十 KB。`unicode-range` 配合子集化，让英文用英文字体、中文用中文字体，浏览器只下载当前语言需要的部分。

**预加载关键字体。** `<link rel="preload" as="font">` 放在 `<head>` 里，在 CSSOM 构建完成前就开始下载。关键字体（首屏标题字体、正文字体）走 preload，装饰字体走 `optional`——别浪费带宽。

可变字体（Variable Font）是加分项：一个文件覆盖多个字重和字宽，减少总请求数。如果团队已经统一用了可变字体，这一项基本是免费的。

到这里，首屏加载的两个最大头——图片和字体——就讲完了。但一个页面不只是「加载出来」就完事了。用户开始交互——点击、滚动、输入——这些瞬间的响应速度，决定了用户是「这个页面好用」还是「这页面好卡」。第三部分我们切换到运行时视角。

<!-- step-demo src=demos/debounce-search.html title="防抖搜索 · Debounce 500ms" -->

## 11 · 防抖（Debounce）：等你停下来再做事

左边两个搜索框长得一样，唯一区别是：上面那个**每次按键都触发一次请求**，下面那个**等你停止输入 500ms 后**才触发。

快速在上下两个框里各敲 10 个字。上面触发了 10 次请求，下面可能只触发了 1 次。前面 9 次中间状态的搜索结果你真的需要吗？不需要——用户还没打完，你搜出来的东西他根本不看。

这就是**防抖（Debounce）**：连续触发的事件，只在**最后一次触发之后等一段静默时间**才执行。搜索框是最经典的应用场景—— 搜索建议、自动补全、即时搜索——这些 API 调用都应该走防抖。

实现原理只有两行代码：每次新事件进来，先 `clearTimeout` 取消上次的定时器，再 `setTimeout` 设一个新的。效果就是：只要用户还在输入，定时器就不停被重置，直到他停下来。

<!-- step-demo src=demos/debounce-button.html title="防抖按钮 · Debounce 300ms" -->

## 12 · 防抖的另一种形态：按钮

防抖不只用于输入框。左边两个按钮——上面是普通按钮（点一次算一次），下面是防抖按钮（300ms 内重复点击只算最后一次）。

连续快速点击两个按钮各 10 次。普通按钮请求了 10 次，防抖按钮只有 1 次。

这个场景在哪里会遇到？支付按钮、提交按钮、发送验证码——用户在等待结果时焦虑地多点了几下，你不应该把这些焦虑转化成重复请求。后端幂等性能兜底当然要做，但前端防抖能从源头拦下大部分无效流量。

防抖解决的是「连续触发的事情我只做最后一次」。但如果你的场景是「连续触发的事情我想定期做一次」——比如滚动时更新进度条——防抖就不合适了。因为它会一直等到你停下来。你要的是**节流**。

<!-- step-demo src=demos/throttle-scroll.html title="节流滚动 · Throttle 500ms" -->

## 13 · 节流（Throttle）：每隔一段时间做一次

左边是一个滚动容器。快速滚动，观察两组数字：

- **「无节流触发」**——每次 `scroll` 事件都触发。数字疯狂上涨，几百次轻轻松松。
- **「节流触发（500ms）」**——不管滚多快，每秒最多触发 2 次。

这就是**节流（Throttle）**：高频事件中，固定时间间隔只执行一次。和防抖的关键区别：

| | 防抖 | 节流 |
|---|---|---|
| 行为 | 连续触发 → 只在**最后一次+静默期**执行 | 连续触发 → **每 N ms** 执行一次 |
| 典型场景 | 搜索建议、表单校验、窗口 resize 回调 | 滚动加载更多、进度条更新、鼠标轨迹 |
| 中间状态 | 不关心 | 需要定期更新 |

核心实现：`const now = Date.now(); if (now - lastTime >= delay) { fn(); lastTime = now; }`。只在距上次执行超过 `delay` 时才放行。

<!-- step-demo src=demos/throttle-autosave.html title="节流自动保存 · Throttle 1s" -->

## 14 · 节流的实战：自动保存

左边两个输入框——上面每次按键都保存，下面每秒最多保存一次。快速在两边各打 20 个字。

上面触发了 20 次保存。下面只触发了大概 2-3 次——取决于你打字多快。关键是**下面那个「已保存内容」永远是你最后一次的完整内容**——因为节流保证了最后一次调用一定被执行。

自动保存、草稿同步、编辑器的实时协作状态更新——这些场景既要给用户「内容已经被保存了」的安全感，又不能每个字符都发一次请求。节流是最合适的方案。

等一下——节流和防抖都能减少执行频率。但如果每次执行本身就很慢呢？一个任务本身就要跑 200ms，你再怎么防抖节流它还是 200ms。这时候要换一个思路：把这个任务**移出主线程**。

```js step file=steps/long-task-observer.js

```

## 15 · Long Task：当任务本身就超预算时

左边代码监听的是 **Long Task**——浏览器把任何执行时间超过 50ms 的任务标记为长任务。

为什么是 50ms？因为一帧 16.7ms 的预算下，50ms 已经吃掉 3 帧了。用户交互应该在第 1 帧得到响应，但 Long Task 让它被迫等到第 4 帧——这几帧的延迟累积起来就是「卡」。

`new PerformanceObserver((list) => { ... }).observe({ type: 'longtask', buffered: true })` 能捕获页面上所有长任务，包括第三方脚本和框架内部代码产生的。`attribution` 字段还能追溯到是哪个脚本导致的——排查线上卡顿问题时，这个信息就是侦查的起点。

TBT（Total Blocking Time）就是从 Long Task 衍生出来的：把每个长任务超过 50ms 的部分加起来，就是 TBT。TBT 越高，页面在加载期间的交互就越不响应。

防抖节流能减少**调用次数**，但每个调用的**执行成本**不会变。如果一个计算本身就要 200ms——加密、大数据排序、复杂正则匹配——防抖没用。唯一的解法是把这段计算迁出主线程。

<!-- step-demo src=demos/web-worker-fib.html title="Web Worker · Fibonacci 43" -->

## 16 · Web Worker：把重计算踢出主线程

左边这个 demo 分三个部分。先点「主线程计算」，计算期间狂点下面的「测试响应」按钮。

点不动。和最开始 Fibonacci(40) 的故事一样——主线程被递归计算占满了。

现在点「Web Worker 后台计算」，再狂点测试按钮。按钮正常响应——计算在**另一个线程**里跑，主线程完全空闲。

Web Worker 做的事情本质上就是 `new Worker(url)`。Worker 里的代码跑在一个独立线程上，**没有 DOM 访问权，没有 window 对象**，和主线程的通信全靠 `postMessage`。所以它适合的是「纯计算」型任务——斐波那契、正则匹配、JSON 解析、图像处理——而不适合任何需要操作 DOM 的逻辑。

左边 demo 里 Worker 的代码是通过 **Blob URL** 内联的——把 worker 脚本写成字符串 → `new Blob([code])` → `URL.createObjectURL(blob)`。真实项目中 Worker 一般作为独立文件部署，但原理完全一样。

两个常见误区：

- **「Worker 里的任务跑得更快」**——不，它跑得一样快。它只是**不阻塞主线程**。耗时不变，体验变好。
- **「什么都可以放 Worker 里」**——不行。Worker 不共享内存（只能拷贝数据），复杂对象的序列化开销可能比计算本身还大。

<!-- step-demo src=demos/async-concurrency.html title="请求并发控制 · Concurrency ≤ 5" -->

## 17 · 请求并发控制：别让浏览器替你做限流

左边输入一个数字（比如 30），点「发起请求」。这 30 个请求不会同时发出——代码把并发上限锁在 5 个，任何时候最多只有 5 个请求在跑。完成一个，释放一个槽位，下一个补上。

浏览器本身对同域并发有上限（HTTP/1.1 是 6 个，HTTP/2 理论上不限制但实际也有流控），但浏览器管的是**连接数**，不管**业务逻辑**。你的代码如果同时发出 50 个 fetch，浏览器会把多余的排队，但你的业务逻辑还会尝试处理 50 个响应——内存和 CPU 都得扛。

`limitConcurrency` 的核心逻辑只有一段：用一个 `Set` 追踪正在执行的 Promise。当数量达到上限 → `Promise.race(executing)` 等最快的那个完成 → 踢出 Set → 下一个进场。这种模式在前端不常见（大多数项目请求量不大），但在 Node.js 批量处理、爬虫、数据同步场景是基本功。

到这里，运行时性能的三个层次就全了：

- **减少频率**——防抖节流
- **迁移重计算**——Web Worker
- **控制并发**——并发限流

第四部分我们转到框架层面——React 应用里有哪些专属的性能坑和优化手段。

```jsx step file=steps/react-rendering.jsx

```

## 18 · React 渲染机制：什么时候会 re-render？

前面三部分讲的都是通用前端性能——不管你用 React、Vue 还是纯 HTML 都适用。但从这一步开始，我们要谈 React 特有的话题。

左边代码展示了 React 最核心的一条规则：**state 变化 → 当前组件重渲染 → 所有子组件默认也跟着重渲染。** 不论子组件的 props 变没变。

看第一个例子：`ExpensiveChild` 和 `count` 完全没关系，但 `count` 每次变化，`ExpensiveChild` 还是跟着渲染了一遍。这就是 React 性能问题的第一来源——**无辜的连带渲染**。

React 的渲染分两步：Render phase（生成 Virtual DOM、diff 对比）和 Commit phase（把差异写入真实 DOM）。即使 diff 结果为「没变化」，Render phase 的计算仍然发生了。所以「re-render 了但 DOM 没变」也是有成本的——只是比 DOM 更新便宜。

什么会触发 re-render？三条路：state 变化、父组件重渲染、Context value 变化。什么不会？ref 的 current 改了不会、普通变量变了也不会——React 只对它自己知道的状态变化做响应。

理解这条规则，就理解了 React 性能优化 90% 的本质：不是让渲染更快，而是**让不该渲染的组件别渲染**。

```jsx step file=steps/react-memo-usecallback.jsx

```

## 19 · memo、useMemo、useCallback：三件套的正确打开方式

左边代码把 React 最常用的三个优化 API 以及各自的**反模式**都写出来了。三个 API 解决三种不同的问题：

**`React.memo` — 「props 没变就别重渲染」**

给子组件包一层 memo，React 会在渲染前用浅比较检查 props。props 全等 → 跳过。但 memo 有一个致命弱点：如果传给 memo 子组件的 props **每次都是新引用**——新的对象、新的数组、新的函数——那 memo 的检查每次都白做。这就是为什么 memo 经常要和 useMemo / useCallback 配对。

**`useMemo` — 「结果不变就不用重算」**

缓存一个计算结果的引用。适用于大数组的 filter/map/sort 这类真正有成本的运算。**不适用于**简单拼接字符串或加减乘除——`useMemo` 本身的闭包创建和依赖数组比较也需要成本，对简单运算来说比直接算还贵。

**`useCallback` — 「函数引用不变」**

本质是 `useMemo(() => fn, [])` 的语法糖。唯一价值是**传给 memo 子组件时**保持引用稳定。如果子组件没有 memo，useCallback 完全是在浪费代码。

这三件套的黄金法则是：**不要在没测量之前就全局加 memo。** 在 React DevTools 的 Profiler 里找到实际的重渲染瓶颈，再对症下药。一个没经过测量的 memo 不是优化，是自我安慰——而且还会让后续代码更难维护。

```jsx step file=steps/react-lazy-suspense.jsx

```

## 20 · React.lazy + Suspense：组件级的代码分割

前面 Part 2 我们讨论了图片和字体的加载优化。但别忘了一个事实：**你的 JavaScript 本身也是要下载的资源。** 一个 React 组件，它的代码、它依赖的第三方库——全部打包在一个 chunk 里。首屏不需要的组件也在里面，白白增加了下载和解析时间。

`React.lazy()` 让你可以把组件的代码从主 bundle 中拆出去。它只在组件**第一次被渲染时**才发起下载——浏览器按需加载，首屏负担立减。

`Suspense` 是懒加载的配套：组件下载期间，显示 `fallback`（骨架屏或 spinner）。Suspense 的粒度有讲究——不需要每个懒组件一个 Suspense，把一组相关的懒组件包在同一个 Suspense 下更自然，加载完成时一起出现，不会各自闪烁。

一个容易被漏掉的细节：懒加载的 chunk 可能**加载失败**——网络波动、CDN 故障、文件被删除。用 ErrorBoundary 兜底，给用户一个降级 UI 而不是白屏。

什么值得懒加载？图表库、富文本编辑器、视频播放器、地图组件——这些「首屏看不见、本身又很大」的东西。按钮、输入框、头像这些小 UI 组件不值得——下载延迟加 chunk 开销可能比收益还大。

```jsx step file=steps/react-route-split-state.jsx

```

## 21 · 路由懒加载 + 状态下放：两个最容易忽视的优化

这一步聊两个「知道的人不多但收益巨大」的技术。

**路由级懒加载。** Next.js 默认已经按路由自动拆包（每个 `page/` 下的文件生成独立 chunk），但如果某个路由页面特别重，可以用 `dynamic()` 手动控制加载行为：自定义 loading skeleton、关掉不需要的 SSR。用户访问 `/settings` 时，不需要下载 `/dashboard` 的代码。

**状态下放（State Colocation）。** 这是 React 性能优化中最被低估的原则。左边第二个例子对比了两种写法：

- 把 `searchQuery` 放在页面顶层 → 每次输入一个字，整个页面（Header、Content、Sidebar）全部重渲染。
- 把 `searchQuery` 放在 `SearchBarSection` 内部 → 只重渲染搜索栏自己。

区别只是状态的**位置**不同，写法几乎一样——但性能天差地别。原则很简单：**state 放在能访问它的最近公共祖先处**。不要把状态无脑升到全局或页面顶层。

`useDeferredValue` 是 React 18 的并发特性，用于「高优先级更新先走，低优先级更新缓缓」。搜索框输入是高频操作，搜索结果更新是低频——把 `query` 传给输入框（立即响应），把 `deferredQuery` 传给搜索结果列表（等主线程空闲才更新）。用户感受到的是输入不卡，搜索结果慢慢跟上。

到这里，React 的专属坑就讲完了。但这些优化都在「代码怎么写」的层面。还有一层——「代码怎么打包」——我们还没碰。前一节的 `React.lazy` 已经开始涉及代码分割，但那只是消费端。第五部分我们站到构建端，看看 Vite 能替我们做什么。

<!-- step-demo src=demos/compression-compare.html title="代码压缩对比 · JS / CSS / HTML" -->

## 22 · 代码压缩：免费的性能优化

左边切换 JS / CSS / HTML 三个 tab，点「查看压缩结果」。每个例子都是同一个代码片段在压缩前后的对比。

压缩做的事情不复杂：删空格、删换行、删注释、缩短变量名、简化颜色值（`#ffffff` → `#fff`）。但效果很实在——通常能减少 30-50% 的体积。这块体积减少不是「优化体验」，是**实打实的网络传输节省**。

压缩是最不需要动脑子的优化：Vite 默认在生产构建时用 esbuild（比 Terser 快 20-40 倍）压缩 JS，用 Lightning CSS 压缩 CSS。你一行配置都不用写——`npm run build` 的时候自动完成。所以如果你还在手动挑压缩工具，从这一步开始：确认你的生产构建确实开启了 minify。

压缩原理里有一条容易被忽视：注释删除。你的代码里有注释是好事，但注释不应该出现在用户浏览器里。Terser 默认删除所有注释，esbuild 会保留 `/*! license */` 格式的许可声明——注意这个区别，别让 license 注释被误删了。

<!-- step-demo src=demos/tree-shaking.html title="Tree Shaking · Dead Code Elimination" -->

## 23 · Tree Shaking：你没 import 的代码不应该出现在包里

左边是一个模拟的工具库 `utils.js`，里面有 5 个函数。勾选你需要的函数，点「打包构建」。

看看结果：没勾选的函数被标注为「已自动消除」。工具库总大小 512 bytes，如果你只用了其中 2 个函数，打包结果只有 ~200 bytes。剩下的 300 bytes 被 Tree Shaking 自动移除了——它们从来没被 `import`，所以构建工具能安全地删除。

Tree Shaking 只对 ESM（`import/export`）生效，对 CJS（`require/module.exports`）无效。原因很简单：ESM 的导入导出是**静态的**——构建工具在编译时就知道谁 import 了什么。CJS 的 `require` 是**运行时的**——可以在 `if` 里、可以在循环里、可以拼接字符串，构建工具没法静态分析。

所以如果你的项目用了 `lodash`（CJS），改成 `lodash-es`（ESM）。一个小细节就能让包体积减半。

还有一条容易被漏掉的配置：`package.json` 里的 `"sideEffects": false`。这告诉打包器「这个包里所有未引用的导出都可以安全删除」。如果不设这个字段，Tree Shaking 可能会因为保守策略而保留一些你根本没用的代码。

<!-- step-image src=/images/tutorials/performance/bundle-analysis.svg alt="Bundle Analysis — rollup-plugin-visualizer 打包分析树状图" -->

## 24 · Bundle 分析：看到你的包到底装了什么

压缩和 Tree Shaking 都是「优化手段」，但在动手之前你需要知道**包里面到底有什么**——就像 Part 1 里先测量再优化一样。

`rollup-plugin-visualizer` 是 Vite 生态下最常用的 bundle 分析工具。构建完成后生成一张树状图——每个色块代表一个 chunk，面积 = 体积占比。左边这张图模拟了一个典型项目的分析结果：

- **react-vendor (142KB)** — React 全家桶，占了首屏 JS 的一半。这很合理，但如果你发现里面有个 50KB 的 `moment.js`——那就是问题。
- **chart-vendor (198KB) — 懒加载**。标注了 lazy，说明它被 `React.lazy` 或 `dynamic import()` 拆出去了，不算在首屏预算里。
- **ui-lib (86KB)** — 组件库。如果你只用了 Dialog 和 Dropdown 但整个组件库都被打进来了，说明 Tree Shaking 没生效。

读这种图的关键习惯：**先看最大的色块，再看它是否在首屏**。如果首屏的 JS 超过 200KB（gzip），逐个追问每个色块「这个东西一定要在首屏加载吗？」——你会发现很多可以懒加载的空间。

```js step file=steps/vite-manual-chunks.js

```

## 25 · Vite 分包：manualChunks 让缓存更聪明

左边是一个典型的 `vite.config.js` 分包配置。核心只改一个地方：`build.rollupOptions.output.manualChunks`。

分包的终极目标是**利用浏览器缓存**。React 的代码一年更新不了几次，但你的业务代码可能一天更新好几次。如果把它们打包在一起，每次业务代码更新，用户都得重新下载整个 200KB 的 bundle——包括那段没变的 React 代码。

正确做法：把稳定的大型依赖拆成独立 chunk。React 归 react-vendor、UI 库归 ui-lib、图表归 chart-vendor。文件名带 content hash：内容不变 → hash 不变 → 缓存命中 → 0 字节下载。

三个决策原则：

- **拆稳定性高的，不拆频繁变的。** React > UI 组件库 > 工具库 > 业务代码。业务代码别拆太细。
- **一个 chunk 至少 20KB+ 才值得拆。** 太小的 chunk 产生额外 HTTP 请求，得不偿失。HTTP/2 可以并发，但每个请求仍有 overhead。
- **按使用场景分组。** Dashboard 的依赖不要混进 Landing page 的 chunk。`manualChunks` 支持函数形式做更细粒度的控制。

`chunkSizeWarningLimit` 默认 500KB。单个 chunk 超过这个值，Vite 会警告你。不是必须改——只是提醒你「看一眼是不是太大了」。

```js step file=steps/dynamic-import.js

```

## 26 · 动态导入：用户要什么才加载什么

`import()` 是代码分割最直接的实现方式。和 `React.lazy` 是同一套底层机制——ES Module 的动态导入。区别是：`React.lazy` 包装了组件，`import()` 是原生 API，任何 JS 代码都能用。

左边的例子覆盖了四种实际场景：

**事件驱动的按需加载。** 用户点「导出」按钮 → 才下载 Excel 库。这个库里大多数代码从来不会被用到——但如果你在顶层 `import XLSX from 'xlsx'`，它就会跟着首屏 bundle 一起下来。`import()` 让下载延迟到真正需要的那一刻。

**条件加载。** 桌面端需要富文本编辑器（可能 300KB），移动端不需要 → `if (width >= 1024)` 才 import。这个判断在构建时是静态的，两个分支会生成两个不同的 chunk。

**预加载（Preload）。** `mouseenter` 时就开始下载。用户悬停到按钮上 → 还没点 → 浏览器已经在后台下拉 chunk 了。他点下去的那一刻，大概率已经下载完成——感知延迟降到零。这个技巧在电商详情页、后台管理系统的 tab 切换场景特别有效。

**错误兜底。** `import()` 返回的是一个 Promise——网络错误、CDN 挂了、文件 404，这个 Promise 会 reject。不处理就是白屏。用 try/catch 包住，给一个降级 UI。

到这里，构建工具链的五个环节——压缩、Tree Shaking、分析、分包、动态导入——就全了。第六部分我们收尾：做完了优化，怎么确保不会回退。

---

## 终章：监控与闭环

我们从头到尾走完了一条完整的性能优化链路：测量 → 加载 → 运行时 → React → 构建。每一步都在解决上一步暴露的问题。但现在这些优化全在你的本地环境里——把它们推到线上之后呢？你怎么知道 LCP 没有偷偷从 1.5s 涨回 3s？

**性能预算（Performance Budget）。** 给关键指标设一个不可逾越的基线：「首屏 JS 不超过 150KB」「LCP 不超过 2.5s」「Lighthouse Performance 分数不低于 90」。把这个预算写进 CI。Lighthouse CI 可以在每次 PR 时跑审计——如果 LCP 涨了 20%，CI 直接挂掉。不让劣化代码合进主分支，比事后修要便宜一百倍。

**线上监控（RUM — Real User Monitoring）。** 我们在 Part 1 学会了用 PerformanceObserver 在本地测指标。但本地是你自己的机器、自己的网络——不代表真实用户。真实用户可能在甘肃用 3G、在印度用 150ms 延迟的 CDN。Web Vitals 库（`web-vitals` npm 包）可以把真实用户的 LCP/INP/CLS 数据回传到你的分析平台。这才是真相，不是实验室模拟。

**性能不是一次做完就完了。** 它更像打扫房间——你整理好之后，第二天又乱了。新功能上线、依赖升级、换了一套 UI 库——每一次都可能是性能的隐性损失。好的性能文化不是「来一次性能优化 sprint」，而是**每次 PR 都看一眼 Lighthouse 分数**。就像你做 code review 会看逻辑错误一样——性能劣化也是一种 bug。

如果你只从这整篇教程里带走两样东西，我希望是这两条：

1. **先量再优，永远。** 在打开 `vite.config.js` 之前，先打开 Performance 面板。
2. **优化是减法的游戏。** 不是你能加多少优化，而是你能减去多少不需要的字节、不需要的请求、不需要的渲染。

感谢读到结尾。现在打开 DevTools，去看看你的页面到底慢在哪里。
