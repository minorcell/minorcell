# 前端性能优化教程 — 规划文档

将 [perfedge](https://github.com/minorcell/perfedge) 中的前端性能优化内容，结合重新设计的叙事主线，迁移到 minorcell 交互式教程系统中。

## 基础信息

| 项 | 值 |
|---|---|
| Slug | `frontend-performance-optimization` |
| 标题 | 前端性能优化手册 |
| 教程数 | **1 个**（所有子话题合并为一个教程） |
| Demo 形式 | 独立 HTML（WebWave iframe 渲染） |
| 代码形式 | 独立代码文件（CodeWave 渲染） |

## 叙事主线

不按技术维度分类（资源/渲染/网络），而是按**优化决策流程**线性叙事，让读者建立「遇到性能问题该怎么想、怎么做」的心智模型。

```
1. 测量与标准     → 不知道问题在哪就优化是浪费时间
2. 首屏加载性能   → 用户打开到看到内容的窗口期，流失率最高
3. 运行时性能     → 页面出来了，交互卡不卡？
4. 框架层面       → React 特有的渲染模型和优化手段
5. 构建工具链     → 基于框架/打包器生态，代码怎么最高效交付
6. 监控与闭环     → 优化不是一次性项目，怎么防止回退
```

## 写作手法

参考 [JS 教程](../content/tutorials/js-event-loop-to-promise/content.md) 的叙事风格，整篇教程遵循以下写作原则：

### 1. 开篇一句定调

第一部分开头用一句话概括整篇教程的因果链，让读者立刻知道「要学什么、为什么这个顺序」。例如：

> **页面卡 → 先量再优 → 瓶颈在首屏 → 资源加载入手 → 交互也要流畅 → React 有它自己的坑 → 构建阶段还能压榨 → 监控兜底。每一步都是上一步逼出来的。**

### 2. 因果链驱动，不是分类罗列

每个概念都是上一个问题的答案。结构始终是「有问题 → 解决方案 → 解决方案带来新问题 → 下一个解决方案」。读者被「为什么」推着走，而不是被动接收知识点列表。

对比：
- ❌ 「防抖和节流是两种高频事件优化手段。防抖是指……节流是指……」
- ✅ 「搜一下触发一次请求没问题吧？试试快速敲 10 个字——10 次请求同时发出去了，后面的 9 次全是浪费。这个问题叫'高频触发'，防抖就是来解决它的。」

### 3. 左边先看，右边再解释

每个 step 的 prose 第一句永远是对左边内容的直接引用——「左边这个搜索框，试一下快速输入」「这段代码做了什么」。读者带着自己的观察进入文字，不是空对空读理论。

### 4. 短段落 + 口语化 + 直接对话

- 段落不超过 4 句话
- 用「你」不用「我们」「开发者」
- 「记住这个事实」「如果你之前一直觉得……」——像是在一对一讲，不是在写教材

### 5. 用读者能感知到的现象说话，少用比喻

性能优化比 JS 事件循环「具体」得多——页面冻住、图片慢慢加载、滚动掉帧，这些是读者每天都在经历的。不需要硬造比喻去解释，直接描述现象本身力量更大。

对比：

- ❌ 「长任务像一个人霸占着收银台」→ 读者要想「谁是那个人？」
- ✅ 「点一下 Fibonacci(40)，然后立刻点测试响应按钮——你会发现按钮根本没反应。不是鼠标坏了，是主线程被算斐波那契死死占住了。」

原则：

- 概念本身是抽象的（微任务 = 插队任务）→ 用隐喻
- 概念本身是具体的（页面卡了、请求太多、包太大）→ 直接让读者体验

### 6. 机械推导，不靠感觉

不写「一般来说这样比较好」「经验上建议」。写「因为 X，所以 Y」「如果你做了 A，B 就会发生」——每一步都是可验证的因果推理。

### 7. 「这就是 X 要解决的问题」

每次引入新技术/新概念时，先明确命名当前的问题，再说这个技术是怎么解决它的。读者始终在「问题 → 方案」的节奏里，不会出现「忽然开始讲一个东西不知道为什么」。

### 8. 每个 demo 的 prose 固定节奏

以 Fibonacci 阻塞演示为例：

```
左边是一个斐波那契计算器。点一下 Fibonacci(40)，然后立刻去点「测试响应」按钮。

你会发现……按钮根本没反应。不是鼠标坏了——是主线程被那个递归计算死死占住了。

浏览器一帧只有 ~16.7ms 的预算。Fibonacci(40) 在主线程上跑了好几秒。
这几秒里，点击事件、滚动、动画、网络回调——统统排队等着。

记住这个事实：不是「代码跑得慢」，而是「跑的这段时间里，什么都做不了」。
这两者有本质区别——前者加服务器能解决，后者加服务器没用。

这就是为什么我们需要理解浏览器的渲染机制，而不是直觉地觉得「优化就是让代码跑得更快」。
```

### 9. 结尾收束

最后一部分（监控与闭环）把因果链完整复述一遍，呼应开篇 thesis，给读者一个可操作的后续清单。

## 教程内容结构

连续的同类 step 会被 `groupSteps()` 合并为一个 Wave 组。切换 step 类型时自动断组，形成章节间的自然分隔。

### 第一部分：测量与标准（6 steps）

**叙事**：先量再优。浏览器渲染一个页面的基本过程 → Core Web Vitals 各自衡量什么 → 用工具抓到数据。

| # | 子话题 | Step 类型 | 文件 |
|---|---|---|---|
| 1 | 为什么性能重要：主线程阻塞演示 | WebWave | `demos/fibonacci-block.html` |
| 2 | Paint Timing 实时监测（FP/FCP） | WebWave | `demos/paint-timing.html` |
| 3 | Core Web Vitals 测量（LCP/INP/CLS） | CodeWave | `steps/measure-metrics.js` |
| 4 | Chrome DevTools Performance 面板 | ImageWave | `images/devtools-performance.png` |
| 5 | Lighthouse 审计报告解读 | ImageWave | `images/lighthouse-report.png` |
| 6 | Network 面板瀑布图分析 | ImageWave | `images/network-waterfall.png` |

**分组**：WebWave(x2) → CodeWave(x1) → ImageWave(x3)

### 第二部分：首屏加载性能（4 steps）

**叙事**：Critical Rendering Path — 哪些资源阻塞渲染、哪些不阻塞。图片、字体是首屏最常见的瓶颈。

| # | 子话题 | Step 类型 | 文件 |
|---|---|---|---|
| 7 | 图片格式对比（JPG/PNG/WebP/AVIF） | WebWave | `demos/image-format-compare.html` |
| 8 | 图片策略：懒加载 + 响应式 + 预加载 | CodeWave | `steps/image-loading.js` |
| 9 | 字体加载对比（系统 vs 自定义 vs 预加载） | WebWave | `demos/font-compare.html` |
| 10 | 字体策略：font-display / 子集化 / preload | CodeWave | `steps/font-strategies.css` |

**分组**：WebWave(x1) → CodeWave(x1) → WebWave(x1) → CodeWave(x1)

### 第三部分：运行时性能（7 steps）

**叙事**：页面出来了，但交互卡不卡？16ms 一帧的预算从哪被吃掉了。从理解长任务开始，到防抖节流减少执行频率，再到 Web Worker 迁移重计算，最后是请求并发控制。

| # | 子话题 | Step 类型 | 文件 |
|---|---|---|---|
| 11 | 防抖 — 搜索输入 | WebWave | `demos/debounce-search.html` |
| 12 | 防抖 — 按钮点击 | WebWave | `demos/debounce-button.html` |
| 13 | 节流 — 滚动事件 | WebWave | `demos/throttle-scroll.html` |
| 14 | 节流 — 自动保存 | WebWave | `demos/throttle-autosave.html` |
| 15 | 长任务检测：PerformanceObserver 监听 Long Task | CodeWave | `steps/long-task-observer.js` |
| 16 | Web Worker — 重计算移出主线程 | WebWave | `demos/web-worker-fib.html` |
| 17 | 请求并发控制 | WebWave | `demos/async-concurrency.html` |

**分组**：WebWave(x4) → CodeWave(x1) → WebWave(x2)

长任务检测的 CodeWave step 放在防抖节流和 Web Worker 之间，作为概念桥梁：防抖节流减少执行频率，但如果任务本身就长呢？→ 用 Long Task API 检测 → Web Worker 迁移。

### 第四部分：框架层面（4 steps）

**叙事**：前面是通用手段，但实际项目用 React。先从 React 的渲染机制入手——什么时候会 re-render、为什么这跟性能有关——然后逐个看优化手段：memo 三件套、代码分割、路由懒加载、状态拆分。

| # | 子话题 | Step 类型 | 文件 |
|---|---|---|---|
| 18 | React 渲染机制：state 变化 → re-render → diff → commit | CodeWave | `steps/react-rendering.jsx` |
| 19 | React.memo / useMemo / useCallback：何时该用，何时是过度优化 | CodeWave | `steps/react-memo-usecallback.jsx` |
| 20 | React.lazy() + Suspense：组件级代码分割 | CodeWave | `steps/react-lazy-suspense.jsx` |
| 21 | 路由级懒加载 + 状态拆分（state colocation） | CodeWave | `steps/react-route-split-state.jsx` |

**分组**：CodeWave(x4)

四个步骤都在同一个 CodeWave 组内，读者滚动时左侧依次展示不同代码示例。Prose 重点不在 API 怎么用，而在「什么时候不该用」——过度优化是 React 性能话题里最值得讲的东西。

### 第五部分：构建工具链（5 steps）

**叙事**：框架和打包器生态下的优化手段。从最直观的压缩和 Tree Shaking，到可视化分析打包产物，再到手动控制分包策略——代码怎么最高效地交付到用户浏览器。

| # | 子话题 | Step 类型 | 文件 |
|---|---|---|---|
| 22 | 代码压缩对比（JS/CSS/HTML 压缩前后） | WebWave | `demos/compression-compare.html` |
| 23 | Tree Shaking 模拟（dead code 消除） | WebWave | `demos/tree-shaking.html` |
| 24 | Bundle 分析：rollup-plugin-visualizer 可视化 | ImageWave | `images/bundle-analysis.png` |
| 25 | Vite 分包策略：manualChunks 配置 | CodeWave | `steps/vite-manual-chunks.js` |
| 26 | 动态导入：`import()` 与按需加载 | CodeWave | `steps/dynamic-import.js` |

**分组**：WebWave(x2) → ImageWave(x1) → CodeWave(x2)

Tree Shaking demo 和压缩 demo 作为连续 WebWave step 归入一组；中间插入一张 bundle 分析截图作为 ImageWave，直观展示分包前后体积对比，再过渡到 Vite 配置和动态导入的代码 step。

### 第六部分：监控与闭环（纯 prose，无 step）

**叙事**：优化不是一次性项目。性能预算、Lighthouse CI、RUM 线上监控——怎么确保不会回退？

这部分不需要 demo 或代码 step，以 prose 收尾，回顾整体优化流程，给读者一个可操作的后续行动清单。

### 总计

- **26 个 step**（12 个 WebWave + 9 个 CodeWave + 4 个 ImageWave + 1 个纯 prose 结尾）
- **14 个 Wave 组**（7 个 WebWave 组 + 5 个 CodeWave 组 + 2 个 ImageWave 组 + 第六部分 prose）

## Demo 转换清单

11 个 React 组件需转换为独立 HTML 文件，放入 `demos/`。

| 原 React 组件 | 目标 HTML | 功能 | 复杂度 |
|---|---|---|---|
| `BlockButtons` | `fibonacci-block.html` | 4 个按钮计算不同规模斐波那契，展示阻塞效果 | 低 |
| `FPandFCP` | `paint-timing.html` | 读取 `performance.getEntriesByType('paint')` 显示 FP/FCP | 低 |
| `WebImgGroup` | `image-format-compare.html` | 同一图片不同格式并排对比 | 低 |
| `WebFont` | `font-compare.html` | 系统字体 vs 预加载自定义字体 | 低 |
| `CompressionComparisonDemo` | `compression-compare.html` | JS/CSS/HTML 三选项卡，压缩前后对比 | 中 |
| `TreeShakingDemo` | `tree-shaking.html` | 勾选工具函数 → 构建 → 显示体积 | 中 |
| `SearchInput` | `debounce-search.html` | 普通输入 vs 防抖 500ms | 低 |
| `DebounceButton` | `debounce-button.html` | 普通点击 vs 防抖点击 | 低 |
| `ScrollDemo` | `throttle-scroll.html` | 滚动容器 + 普通计数 vs 节流计数 | 低 |
| `AutoSaveInput` | `throttle-autosave.html` | 每次保存 vs 节流每秒最多一次 | 低 |
| `WebWorkerDemo` | `web-worker-fib.html` | 主线程阻塞 vs Worker 后台计算 + 响应性测试按钮 | 中 |
| `AsyncConcurrency` | `async-concurrency.html` | 可配置并发数的请求控制 | 中 |

**未纳入转换的组件**：
- `AsyncButton` — 功能与 `debounce-button.html` 重叠，合并到防抖按钮 demo 中
- `QuestionAnswer` — async 问答逻辑合并到并发控制 demo 或 prose 中

**注意事项**：
- Web Worker demo 中 worker 脚本需通过 Blob URL 内联（iframe 无法加载独立 worker 文件）
- 所有 HTML demo 必须在 `<head>` 中内联样式，不依赖外部 CSS
- demo 不引用外部依赖（如 React、图标库），保持纯 HTML/CSS/JS

## 代码步骤文件清单

放入 `steps/`。

| 文件 | 内容 |
|---|---|
| `measure-metrics.js` | PerformanceObserver 监听 LCP/INP/CLS + Performance API 基础用法 |
| `image-loading.js` | IntersectionObserver 懒加载 + `<picture>` 响应式 + `fetchpriority` 预加载 |
| `font-strategies.css` | `@font-face` + `font-display` + `<link rel="preload">` + 子集化注释 |
| `long-task-observer.js` | PerformanceObserver 监听 long task + 计算 TBT/INP 的示例 |
| `react-rendering.jsx` | React 渲染机制演示：state 变化触发 re-render、父组件 re-render 带动子组件 |
| `react-memo-usecallback.jsx` | React.memo / useMemo / useCallback 正确用法与反模式对比 |
| `react-lazy-suspense.jsx` | React.lazy() + Suspense 组件级代码分割 + fallback |
| `react-route-split-state.jsx` | 路由懒加载 + 状态下放（state colocation）避免大范围 re-render |
| `vite-manual-chunks.js` | `vite.config.js` 中 `manualChunks` 配置 + `rollup-plugin-visualizer` |
| `dynamic-import.js` | `import()` 动态导入 + magic comments（`/* webpackChunkName */` / vite chunk 命名） |

## 图片资源

从 perfedge 截图复用或重新截取，放入 `images/`。

| 图片 | 内容 |
|---|---|
| `devtools-performance.png` | Chrome DevTools Performance 面板火焰图 |
| `lighthouse-report.png` | Lighthouse 审计报告概览 |
| `network-waterfall.png` | Network 面板瀑布图（含优先级、时序） |
| `bundle-analysis.png` | rollup-plugin-visualizer 打包分析图（分包前后对比） |

## 实施阶段

### Phase 1 — 骨架搭建
- 创建 `content/tutorials/frontend-performance-optimization/` 目录及子目录（`demos/`、`steps/`、`images/`）
- 编写 `content.md` frontmatter + intro prose + 第六部分 prose
- 转换 1 个简单 demo（`fibonacci-block.html`）验证流程
- `npm run dev` 验证教程能正常展示

### Phase 2 — 第一部分：测量与标准（step 1-6）
- `fibonacci-block.html`、`paint-timing.html`、`measure-metrics.js`
- 3 张工具截图
- 对应 prose 内容（渲染过程简述、Core Web Vitals 解释、工具使用指南）

### Phase 3 — 第二部分：首屏加载（step 7-10）
- `image-format-compare.html`、`font-compare.html`
- `image-loading.js`、`font-strategies.css`
- 对应 prose（Critical Rendering Path、资源提示类型、格式选择决策树）

### Phase 4 — 第三部分：运行时性能（step 11-17）
- `debounce-search.html`、`debounce-button.html`、`throttle-scroll.html`、`throttle-autosave.html`
- `web-worker-fib.html`、`async-concurrency.html`
- `long-task-observer.js`
- 对应 prose（16ms 帧预算、长任务与 INP 的关系、防抖 vs 节流的决策）

### Phase 5 — 第四部分：React 优化（step 18-21）
- `react-rendering.jsx`、`react-memo-usecallback.jsx`、`react-lazy-suspense.jsx`、`react-route-split-state.jsx`
- 对应 prose（React 渲染机制、memo 三件套的正确与错误用法、代码分割与状态下放）

### Phase 6 — 第五部分：构建工具链（step 22-26）
- `compression-compare.html`、`tree-shaking.html`
- `bundle-analysis.png`
- `vite-manual-chunks.js`、`dynamic-import.js`
- 对应 prose（压缩与 Tree Shaking 原理、bundle 分析解读、分包策略决策）

### Phase 7 — 整体打磨
- 手机端回退体验检查
- 封面页视觉设计
- 教程列表页展示
- 全文案校对、代码示例验证

## 与 perfedge 的关键差异

| | perfedge | 本方案 |
|---|---|---|
| 组织逻辑 | 参考手册式分类 | 线性叙事，按优化决策流程 |
| 起点 | 先讲指标概念 | 先演示「为什么卡」（Fibonacci 阻塞），再讲怎么量 |
| 加载 vs 运行时 | 混在「渲染优化」里 | 明确分离：首屏加载（Part 2）/ 运行时（Part 4） |
| 构建工具链 | 压缩 + Tree Shaking 放在「静态资源」 | 独立成章（Part 5），放在框架之后，新增 Vite 分包 + 动态导入 |
| React 优化 | 渲染优化子话题 | 独立成章（Part 4），强调「什么时候不该用」 |
| 结尾 | 无 | 监控闭环 + 流程回顾（Part 6） |
| 异步编程 | 独立章节讲 Promise/async-await 原理 | 不单独讲 JS 基础，只在 Part 4 涉及并发控制和长任务时提及性能相关部分 |

## 当前状态

perfedge 源码位于 `tmp/perfedge/`，可随时参考原文内容和 demo 实现。
