---
title: JavaScript：从事件循环到手写 Promise
description: 从单线程模型与事件循环出发，逐步推导出 Promise 的设计动机，并手写一个能通过 Promises/A+ 的最小实现
type: interactive
entryFile: content.md
tags: [JavaScript, 事件循环, Promise, 手写源码, 面试]
---

这份教程不是"事件循环讲一节、手写 Promise 讲一节"的拼盘，而是用一条因果链把两者串起来：

> **JS 是单线程 → 必须有异步 → 异步靠事件循环落地 → 事件循环里有微任务这种"插队任务" → 微任务催生了 Promise → Promise 的形状由几条不可妥协的约束逼出来 → 我们把这些约束翻译成代码。**

读完之后你应该能回答这几个看似简单却容易答歪的问题：

- 为什么 JS 一定是单线程？后来的 Web Worker 算"多线程"吗？
- 单线程会带来哪些**真实的**性能问题？为什么不止"卡 UI"这么简单？
- 事件循环到底循环什么？为什么"主脚本"本身也算一个宏任务？
- `Promise.then` 为什么必须异步？换成 `setTimeout` 能不能？
- `then` 为什么必须返回**新**的 Promise？
- `resolvePromise` 那一坨判断到底在防哪些奇葩输入？

```ts step file=steps/00.ts highlight=1:6

```

## 第一章 · 单线程与事件循环

### 为什么 JS 是单线程？

JS 一开始的目标只是给浏览器写"小动作"——表单校验、显示弹窗、操作 DOM 节点。Brendan Eich 在 1995 年用十天设计这门语言时，做了一个影响深远的决定：**所有 JS 代码都跑在同一个线程上**。

核心原因是 **DOM 不是线程安全的**。如果两条 JS 线程同时改一个 DOM 节点（一个删一个加），浏览器引擎得在每次访问节点时上锁，性能和实现复杂度都吃不消。"单线程"等于把这种竞态从语言层面直接消灭。

后来出现的 Web Worker、`SharedArrayBuffer`、Service Worker 看起来像"多线程"，但它们都遵守同一条原则：**Worker 不能直接访问主线程的 DOM**，要通信只能 `postMessage` 把数据"搬过去"。本质上是隔离的多个单线程世界，而不是真正的共享内存多线程。

### 单线程的代价

只有一个主线程意味着：**所有事情都得排队走这一条线**。

代价不只是"页面卡"。具体说有三层：

1. **任意一段长任务会阻塞所有交互**——点击、滚动、动画、网络回调全得等。
2. **浏览器一帧只有 ~16.7ms**（60Hz 屏幕）。一旦你的 JS 跑超过这个预算，掉帧就发生了。
3. **CPU 密集型工作没法在主线程做**——加密、压缩、大数据处理都会让页面"假死"。

### 这段代码做了什么

左边的代码用一个 `while` 循环纯粹忙等 3 秒。这 3 秒里，主线程被这个 while 死死占住——任何定时器、任何点击事件、任何渲染都得等它结束。

记住这个事实：**JS 单线程的"死"，不是某个 API 设计得不好，而是物理事实**。要绕过它，唯一的办法就是——别在主线程上等。

```ts step file=steps/01.ts highlight=1:7

```

### 异步：把"等待"交出去

上一步代码的问题是：主线程亲自在等。这一步代码做了一件根本上不一样的事——它把"等 3 秒"这件事**交给了宿主**（浏览器或 Node），自己立刻返回。

这就是 JS 异步执行的三件套心智模型：

- **call stack（调用栈）**：同步代码在这里跑。栈一空，当前任务就算结束。
- **host APIs（宿主 API）**：`setTimeout`、`fetch`、文件 IO、DOM 事件……这些"会等"的能力**不属于 JS 引擎**，而是浏览器/Node 提供的。引擎只管把"任务 + 回调"丢给它们。
- **task queue（任务队列）**：宿主完成等待后，把回调推进队列。等主线程空闲，事件循环再把它取出来执行。

`setTimeout(cb, 3000)` 在执行那一刻**没有**让线程睡觉。它干的是：

1. JS 引擎把 `cb` 和 3000ms 这条信息交给宿主。
2. 宿主用自己的定时器机制（不在 JS 线程上）数 3 秒。
3. 数到 3 秒后，宿主把 `cb` 推到任务队列里。
4. 主线程跑完所有同步代码，事件循环从队列里取出 `cb`，执行。

所以输出顺序是：`start → end → (3s 后) after 3000ms`。`end` 出现在 setTimeout 之前不是因为它"插队"，而是因为 setTimeout 的回调**根本没在当前调用栈里跑**。

### 一个常见误解

很多教程把事件循环画成一个"轮询定时器的轮子"。这是错的。

事件循环的工作不是"看时间到了没"，而是**"当前调用栈空了之后，从队列里取下一个任务"**。它是个**节拍器**，不是个计时器。计时是宿主的事。

```ts step file=steps/02.ts highlight=1:7

```

### 输出顺序的反直觉

把这段代码丢给十个写过 JS 的人，会有人答 `1, 2, 3, 4`，有人答 `1, 4, 2, 3`。正确答案是 **`1, 4, 3, 2`**。

`Promise.resolve().then(...)` 看起来"立刻就 resolve 了"，但 `then` 注册的回调比 `setTimeout(cb, 0)` 跑得还早。这只能用一个事实解释：**任务队列不止一条**。

引擎里有两条不同性质的队列：

- **宏任务队列（macrotask queue）**：放 `setTimeout`、`setInterval`、I/O、UI 事件等。
- **微任务队列（microtask queue）**：放 `Promise.then`、`queueMicrotask`、`MutationObserver` 等。

对，现在你只需要先记住这两条名字。下一步会给出它们之间的精确规则——但有了"两条队列"这个事实，已经能机械推出本步的输出：

1. 同步代码先跑完 → 打印 `1, 4`。
2. 同步代码结束这一刻，引擎做一次"清空微任务队列"的动作 → 打印 `3`。
3. 微任务清空后，事件循环才取下一个**宏任务** → 打印 `2`。

如果你之前一直觉得 Promise 的执行时机是"玄学"，原因往往就是没意识到队列不止一条。

```ts step file=steps/03.ts highlight=1:3

```

## 第二章 · 宏任务与微任务

### 两条不可妥协的规则

宏任务和微任务的全部关系，只用两条规则就能讲清楚：

1. **一次只取一个宏任务**执行。
2. **每个宏任务跑完之后，立刻把当前微任务队列全部清空**，才允许去取下一个宏任务。

这两条规则解释了所有"输出顺序题"。本步代码给出最朴素的对照：同一时刻丢进去的 `setTimeout(cb, 0)`（宏任务）和 `Promise.resolve().then(cb)`（微任务），永远是微任务先跑。

### 把微任务当成"插队任务"

理解微任务最好的隐喻是**插队**：

> 当前这一轮宏任务结束、还没轮到下一个宏任务之间，存在一个"窗口期"。微任务就是塞进这个窗口里执行的。

所以微任务有两个特性：

- **优先级高于任意宏任务**——再急的 `setTimeout(cb, 0)` 也排在 `then` 之后。
- **可以连环触发**——微任务执行过程中再注册的微任务，会被**纳入当前这次清空**，而不是等下一轮。这意味着写一个无限递归注册微任务的代码，会让事件循环永远卡在微任务清空阶段，**连渲染都做不了**——这是一个真实存在的反模式。

### 主脚本本身就是一个宏任务

这是初学者最容易漏掉的关键事实：

> **整段顶层 `<script>` 代码（或 Node 的入口模块）本身，被引擎当作一个宏任务来执行。**

所以"同步代码先跑完，再清空微任务"这个观察，其实就是规则 2 的特例——主脚本是当前正在执行的宏任务，它结束之前注册的所有 `then` 都排在它的微任务尾巴上，主脚本一结束就被立刻清空。

抓住"主脚本是宏任务"，下一步那道综合输出题就能机械推出来。

```ts step file=steps/04.ts highlight=1:15

```

### 综合输出题：机械推导

我们现在有了两条规则 + "主脚本是宏任务"这个事实，就可以一步一步硬推出 `A, G, D, F, B, C, E`。

**第 0 阶段（开始执行主脚本，本身就是一个宏任务）**

- 同步打印 `A`。
- 注册一个 timer：把 `B-and-then-C` 这个回调挂到宿主的定时器上。
- 注册一个微任务：`then → 打印 D 并注册 timer(E)`。
- 注册一个微任务：`queueMicrotask → 打印 F`。
- 同步打印 `G`。

主脚本结束这一刻，状态是：

- 微任务队列：`[then→D, queueMicrotask→F]`（按注册顺序）
- 宏任务队列：`[timer→B]`

**第 1 阶段（主脚本这个宏任务结束 → 清空微任务）**

- 取出 `then→D`：打印 `D`。在它内部又同步执行 `setTimeout(E)` → 把 E 排进宏任务队列 → 现在宏任务队列变成 `[timer→B, timer→E]`。
- 取出 `queueMicrotask→F`：打印 `F`。
- 微任务队列空了。

**第 2 阶段（取下一个宏任务）**

- 取出 `timer→B`：打印 `B`。它内部 `Promise.resolve().then(C)` → 把 `then→C` 推进微任务队列。
- 这个宏任务结束 → 清空微任务 → 打印 `C`。

**第 3 阶段（再取下一个宏任务）**

- 取出 `timer→E`：打印 `E`。

最终输出：`A, G, D, F, B, C, E`。

### 拿这套机械流程去解任何题

你会发现"输出顺序题"做完之后，没有任何一步是靠"感觉"或"经验"。只要严格按：

> 同步跑完 → 清空微任务 → 取一个宏任务 → 同步跑完 → 清空微任务 → …

去推，就一定对。这套流程看起来啰嗦，但**它就是 V8 / SpiderMonkey 等引擎里 Event Loop 的真实工作方式**。

```ts step file=steps/05.ts highlight=1:9

```

### Node 的两个额外角色

浏览器和 Node 共享"宏任务 + 微任务"的双队列模型，但 Node 在外层套了一个 **libuv 事件循环**，多出两个 API：`process.nextTick` 和 `setImmediate`。

不必背 libuv 那六个阶段（timers / pending / poll / check / close 等），只需要记住三层优先级：

| 层级               | 代表 API                               | 何时被清空                       |
| ------------------ | -------------------------------------- | -------------------------------- |
| nextTick 队列      | `process.nextTick`                     | 每个阶段切换之间，比微任务更优先 |
| 微任务队列         | `Promise.then`、`queueMicrotask`       | 每个阶段切换之间                 |
| 宏任务（按阶段分） | `setTimeout` / `setImmediate` / I/O 等 | libuv 当前阶段轮到时             |

所以本步的输出顺序大致是：

```
sync          ← 主脚本（同步）
nextTick      ← 比 then 更急的"独立队列"
promise.then  ← 普通微任务
setTimeout 0  ← timers 阶段
setImmediate  ← check 阶段
```

### 浏览器的渲染时机

事件循环不只跑你的 JS，**它还要插入渲染**。简化版的浏览器一帧大致是：

```
取宏任务 → 清空微任务 → requestAnimationFrame 回调 → 样式/布局/绘制 → 进入下一帧
```

这就解释了几个常见现象：

- 大量微任务循环注册会让浏览器**永远渲染不到**——它卡在"清空微任务"这一步出不来。
- `requestAnimationFrame` 比 `setTimeout(cb, 16)` 更准——前者跟着帧节奏走，后者只是计时。
- 在 `then` 里改 DOM 通常很快就能看到——因为微任务清空后紧接着就是渲染。

事件循环这条线索到这里告一段落。我们接下来要切换视角——从"运行时怎么调度异步"切到"应用层怎么写出可维护的异步"，这正是 Promise 出场的地方。

```ts step file=steps/06.ts highlight=1:20

```

## 第三章 · 从回调到 Promise 的动机

### 三个具体痛点

每个写过 Node 早期代码的人都见过左边这种结构。它的问题被简称为"回调地狱"，但**真正的问题不是嵌套丑**——那只是表象。痛点其实有三个，每一个都很具体：

**1. 结构和业务无关**

左边代码的缩进有 3 层，仅仅是因为我们做了 3 次异步调用。如果改成 6 次，缩进就有 6 层。**结构由 API 形态决定，而不是由业务复杂度决定**——这违反了"代码应该反映问题，而不是反映工具"的基本审美。

**2. 错误处理无法复用**

注意每一层都重复写了 `if (err) return console.error(err)`。这不只是难看，还会**真的出 bug**——业务复杂之后，很容易某一层忘了检查 err，错误就被静默吞了。Node 的"error-first callback"约定本身就是个补丁，它没有从根本上解决错误传播。

**3. 异步函数没有"返回值"**

`getUser` 的"结果"没法被赋值给一个变量，因为它要异步才知道结果。同步代码可以写：

```ts
const user = getUser('u1')
const orders = getOrders(user.id)
```

异步代码无论多努力，都没法直接复刻这种写法——除非有一个"还没拿到结果但代表未来值"的对象。

### 我们到底需要一个什么样的对象？

把上面三个痛点反着看，需求就清晰了。我们需要一个对象，它：

- **代表"未来某个时刻才会有的值"**——可以现在就被传递、存储、返回。
- **支持组合**——两个这种对象可以串起来，得到第三个。
- **错误能在末端统一处理**——而不是每一层都写 `if (err)`。
- **能向链路上下游传递异常**——同步代码里的 `try/catch` 可以跨层捕获，这个对象也应该能。

满足这四点的对象就是 Promise。它不是凭空设计出来的，而是被这四个需求逼出来的。

```ts step file=steps/07.ts highlight=1:7

```

### Promise 是一台一次性状态机

Promise 的全部本质，可以画成左边代码那种小图：**三态、单向、一次性**。

- `pending`：初始态。可以转向 `fulfilled` 或 `rejected`，但只能转一次。
- `fulfilled`：成功态。会带一个值（`value`）。
- `rejected`：失败态。会带一个原因（`reason`）。

两条不可妥协的约束：

1. **状态不可逆**——一旦离开 pending，就再也回不去了，更不能在 fulfilled / rejected 之间跳。
2. **resolve / reject 只生效一次**——重复调用全部静默忽略。

本步代码做了一个验证：`resolve(1)` 之后再 `resolve(2)` 和 `reject(...)` 都不会生效，最终 `then` 拿到的还是 `1`。

### 为什么必须这么严格？

这两条约束看起来只是"小心翼翼"，但它们的存在让**消费者代码**变得简单。如果状态可以反复变，那 `then` 里的回调就可能被同一个 Promise 触发多次（或者从成功翻车到失败），消费者就得自己处理"我已经处理过一次了吗？"这种状态——这正是事件监听器（`addEventListener`）的复杂度。Promise 通过单次性把这种复杂度从消费者那里移走了。

这两条约束，也是后面所有手写代码里 `if (state !== 'pending') return` 的来源。

接下来从 v1 到 v5，我们一行一行把这台状态机翻译成代码。

```ts step file=steps/08.ts highlight=4:33

```

## 第四章 · 手写 MyPromise

### v1 · 状态机骨架

本步代码是手写实现的最小骨架：一个 class，三个字段（`state` / `value` / `reason`），`resolve` 和 `reject` 都有 `if (this.state !== 'pending') return` 守卫——这就是上一节"两条约束"的代码翻译。

注意几个设计细节：

- `resolve` 和 `reject` 不是 `MyPromise` 的方法，而是构造函数里的**闭包变量**。这样外部拿到一个 `MyPromise` 实例后，**没法**手动改它的状态——状态控制权牢牢被 executor 持有。
- `try { executor(...) } catch (e) { reject(e) }`——executor 同步抛错应该被自动转成 rejected。这条规则在原生 Promise 里同样存在。
- `then` 暂时只会把同步回调**立即同步执行**——这就是 v1 的全部能力。

### v1 暴露的问题

把构造函数里 `executor` 改成异步触发 resolve，比如：

```ts
new MyPromise((res) => setTimeout(() => res(1), 100)).then((v) =>
  console.log(v),
)
```

`then` 注册的那一刻，状态还是 `pending`。v1 的 `then` 对 pending 这种情况什么都不做——回调被静默丢掉了。100ms 后即使 `resolve(1)` 触发，也没人通知任何回调。

修复办法：在 pending 阶段把 `then` 传进来的回调**先存起来**，等到 resolve / reject 真正触发时再统一拿出来执行。这就是 v2。

```ts step file=steps/09.ts highlight=8:9,18,24,36:39

```

### v2 · 把 pending 阶段的回调存起来

v2 在两个地方动了刀：

- 新增两个数组 `onFulfilledCbs` / `onRejectedCbs`，作为"等候队列"。
- `then` 在 pending 时把回调入队；`resolve / reject` 触发时遍历队列依次通知。

这其实就是经典的**订阅者模式**：Promise 是发布者，每次 `then` 都是注册一个订阅者。

为什么是数组而不是单个回调？因为同一个 Promise 可以被 `.then` 多次，比如：

```ts
const p = fetchData()
p.then(render)
p.then(report)
p.then(cache)
```

这三个 `.then` 都得拿到通知。所以队列必须是数组。

### v2 还有的问题

v2 已经能正确处理"executor 里异步 resolve"的情况了。但仔细看 `then`：当状态已经是 `fulfilled` 时，它**同步**调用 `onFulfilled`。也就是说我们的 `MyPromise` 出现了一种很糟糕的"双面性"——

- executor 里同步 resolve 的 → `then` 同步执行回调
- executor 里异步 resolve 的 → `then` 异步执行回调

**同一个 API、同样的调用方式，行为却随上下文变化**。这种 API 在社区有个绰号叫 [Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony/)（"释放邪神"），写出来的上层逻辑会有一类极难复现的 bug——开发期间它"碰巧"是异步的所以一切正常，上线后某个分支 resolve 变同步了，就开始随机翻车。

修法很简单：让 `then` 永远异步。

```ts step file=steps/10.ts highlight=33:45

```

### v3 · 让 then 永远异步

v3 的改动只有一处但分量很重：在调用 `onFulfilled / onRejected` 之前，统统用 `queueMicrotask` 包一层。无论当前状态是 fulfilled / rejected 还是 pending，回调都被推迟到微任务里去执行。

这一改之后，`MyPromise` 的执行时机和原生 `Promise` 一致了——都是微任务。看本步底部那段示例：

```
console.log('A')
new MyPromise((r) => r(1)).then((v) => console.log('then', v))
console.log('B')
// 输出：A, B, then 1
```

即使 resolve 是同步触发的，`then` 的回调依然在 `B` 之后才打印，因为它被排进了当前轮的微任务队列。

### 为什么是 queueMicrotask 而不是 setTimeout？

两个原因：

1. **语义对齐原生 Promise**：原生 `then` 就是微任务。如果我们用 `setTimeout`，`MyPromise.then` 会变成宏任务，跟原生在同一段代码里混用就会出现微妙的顺序差异。
2. **微任务比宏任务快得多**：`setTimeout(cb, 0)` 即使在最理想情况下也要等 4ms（HTML 规范规定的最小 clamp）；`queueMicrotask` 紧接着当前任务就跑。Promise 的核心使用场景是"链式异步"，这种场景里慢哪怕几毫秒，叠加起来都很可观。

### v3 的隐藏收益

v3 还顺手解决了一个 v4 才会用到的问题：**`then` 里需要在闭包中引用一个还没赋值完的 `promise2`**。把回调推迟到微任务里之后，等微任务真正跑起来时，`promise2` 一定已经从 `new MyPromise(...)` 表达式里赋值出来了。这一点我们在 v5 处理 `resolvePromise` 时会再用到。

但 v3 还没解决最关键的问题：`then` 没有返回值，不能链式调用。

```ts step file=steps/11.ts highlight=29:56

```

### v4 · 链式调用的本质

链式调用 `p.then(a).then(b)` 之所以能成立，是因为 `then` 本身**返回一个新的 Promise**——我们叫它 `promise2`——而 `promise2` 的状态由 `a` 的执行结果决定：

- `a` 正常返回 `x` → `promise2` resolve(x)
- `a` 抛错 → `promise2` reject(error)

所以 v4 的核心是把 `then` 的返回值改成 `new MyPromise((resolve, reject) => { ... })`，并把 `try { resolve(fulfilled(this.value)) } catch (e) { reject(e) }` 这段逻辑嵌进去。

### 值穿透 / 错误穿透

第 36-41 行处理了一个容易忽略的情况：`onFulfilled` 或 `onRejected` 不是函数（比如开发者直接写 `.then(undefined, handler)` 或者只写 `.then(handler)` 然后再 `.catch`）。

规范要求这种情况下：

- 没有 `onFulfilled` → 用默认透传 `(v) => v`，把当前值原样传给下游。
- 没有 `onRejected` → 用默认抛出 `(e) => { throw e }`，让下游能继续 reject。

这就是"值穿透/错误穿透"。它让 `.then(...).then(...).catch(handler)` 这种写法能正确工作——错误能"跨过"中间没写错误处理的 `then`，一路落到末端的 `catch`。

### v4 还差最后一步

v4 已经能处理 `onFulfilled` 返回**普通值**（数字、字符串、对象）的情况。但如果它返回的 `x` 本身又是一个 Promise 呢？比如：

```ts
fetchUser().then((u) => fetchOrders(u.id)) // 返回值是另一个 Promise
```

v4 会把这个 Promise 当作普通值丢进 `resolve` 里，导致 `promise2.value === 那个 Promise 对象`。下游 `.then` 拿到的不是订单数据，而是个 Promise。这显然不是我们要的——下游应该等到内层 Promise 也 resolve 出真正的值之后再触发。

这就是 `resolvePromise` 要解决的问题。

```ts step file=steps/12.ts highlight=2:42

```

### v5 · resolvePromise · 规范 2.3 节

`resolvePromise` 是整个手写过程里最容易出错的一段。它的工作是：拿到 `onFulfilled` 返回的 `x`，根据 `x` 的形态决定怎么 resolve `promise2`。Promises/A+ 规范 2.3 节用了整整一页篇幅描述它，对应到代码就是本步的 `resolvePromise` 函数。

它要应对四种情况：

**1. `x === promise2`（自我引用）**

`p2 = p1.then((v) => p2)` 这种写法会让 promise2 等自己——死循环。必须 reject 一个 `TypeError`，这是规范明确要求的。

**2. `x` 是另一个 Promise（包括 thenable）**

调用 `x.then(onFulfilled, onRejected)`，把 `x` 的最终状态"传染"给 `promise2`。注意是**递归**调用 `resolvePromise`——因为 `x` resolve 出来的 `y` 可能还是个 Promise。

**3. `x` 是普通对象（没有 `.then` 或 `.then` 不是函数）**

直接当成值 resolve。

**4. `x` 是基本类型**（`null` / `undefined` / 数字 / 字符串等）

直接 resolve。

### 两个魔鬼细节

**`called` 标志位**

第 27 行的 `let called = false` 看起来像在防御什么。它防御的是这种"不规矩的 thenable"：

```ts
const evil = {
  then(onFulfilled, onRejected) {
    onFulfilled(1)
    onFulfilled(2) // 重复调用
    onRejected(new Error()) // 既 resolve 又 reject
    throw new Error() // 还抛错
  },
}
```

第三方库或用户实现的 thenable 不一定遵守"只 settle 一次"的规则。`called` 标志位让我们的实现**对外严格遵守一次性**——无论 thenable 怎么乱来，第一次拿到结果就锁死。

**`const then = x.then` 这行可能抛错**

第 29 行单独用一个变量取出 `then`，是为了把"取属性"的过程包在 `try` 里。因为有些对象会用 getter 故意 throw：

```ts
const tricky = {
  get then() {
    throw new Error('boom')
  },
}
```

如果直接写 `if (typeof x.then === 'function')`，这个 throw 会逃出 `try/catch` 之外。规范在 2.3.3.2 明确要求"取 then 时抛错也算 reject"，所以必须写成"先取一次，存到变量里，后续都用变量"。

把 v4 里 `try { resolve(fulfilled(this.value)) }` 这一行改成：

```ts
try {
  const x = fulfilled(this.value)
  resolvePromise(promise2, x, resolve, reject)
} catch (e) {
  reject(e)
}
```

到这里，`MyPromise` 的核心就完成了。

```ts step file=steps/13.ts highlight=11:62

```

## 第五章 · 静态方法与规范验证

### 四个常考静态方法

`Promise.all / race / allSettled / any` 经常出现在面试里，其实代码差异很小——重点是**语义差异**。

| 方法         | 何时 fulfilled                              | 何时 rejected                          |
| ------------ | ------------------------------------------- | -------------------------------------- |
| `all`        | 全部成功 → `[v1, v2, ...]`                  | 任意一个失败 → 立刻 reject 那个 reason |
| `race`       | 第一个 fulfilled 的值                       | 第一个 rejected 的 reason              |
| `allSettled` | 全部 settle → `[{status, value/reason}...]` | 永远不会                               |
| `any`        | 任意一个成功 → 那个值                       | 全部失败 → `AggregateError`            |

`all` 和 `any` 是镜像关系——一个"任意失败就 reject"、一个"任意成功就 resolve"。`race` 和 `allSettled` 处于两个极端——`race` 抢第一个 settle 的、`allSettled` 等所有人 settle。

### 空数组的边界陷阱

每个静态方法对空数组的行为都不一样，面试常考：

| 调用                     | 结果                                              |
| ------------------------ | ------------------------------------------------- |
| `Promise.all([])`        | resolve `[]`                                      |
| `Promise.allSettled([])` | resolve `[]`                                      |
| `Promise.any([])`        | reject `AggregateError([])`                       |
| `Promise.race([])`       | **永远 pending**（没有任何 promise 来 settle 它） |

`race([])` 那条尤其阴险——程序不会报错，也不会走任何分支，就是永远卡住。如果你在线上看到一个"既不成功也不失败"的链路，这是一个值得排查的方向。

### `any` 的 AggregateError

`any` 是 ES2021 才进规范的，配套引入了 `AggregateError`——一个能装多个错误原因的特殊错误对象。本步代码里 `new AggregateError(errs, 'All promises were rejected')` 第一个参数就是各路失败原因的数组，第二个参数是统一的 message。

这个设计的好处是：调用方可以通过 `err.errors` 拿到完整的失败列表，决定是统一处理还是分别报告。如果只 reject 第一个失败的 reason，信息就丢了。

```ts step file=steps/14.ts highlight=6:21

```

### 用规范测试给自己打分

[`promises-aplus-tests`](https://github.com/promises-aplus/promises-tests) 是 Promises/A+ 官方测试套件，包含 872 条用例，专门用来检验"是不是真的合规"。它的工作方式是：你提供一个 `adapter` 对象，暴露三个工厂函数（左边代码）；测试套件会用它们造出各种 Promise 来跑测试。

实际跑一遍的步骤：

1. 把 `MyPromise` 整理到一个独立文件，暴露 default export。
2. `pnpm add -D promises-aplus-tests`
3. 写一个 `adapter.cjs`：

   ```js
   const MyPromise = require('./MyPromise.js').default
   module.exports = {
     deferred() {
       /* 同左 */
     },
     resolved(v) {
       return new MyPromise((r) => r(v))
     },
     rejected(e) {
       return new MyPromise((_, r) => r(e))
     },
   }
   ```

4. 跑：`npx promises-aplus-tests adapter.cjs`
5. 顺利的话会看到 `872 passing`。如果某条 fail，套件会指明是哪一节哪一项不合规，对照规范回去补即可——v1~v5 这条主线已经覆盖了 90% 以上的用例。

### 收束

回头看，整套手写 Promise 其实只用了两条事实：

1. JS 是单线程，异步必须把"等待"交给宿主，回调被排进任务队列。
2. 微任务是"插队任务"——它让 `then` 可以在当前轮事件循环结束前就被执行。

剩下所有代码——`if (state !== 'pending') return`、订阅者数组、`queueMicrotask` 包裹、`promise2` 链式、`resolvePromise` 的四种情况——都是在这两条事实之上，加上"状态不可逆"和"then 必须返回新 Promise"两条约束逼出来的。

V8 等真实引擎的实现当然比这复杂得多——它们会用原生 job queue 替代 `queueMicrotask`，会用隐藏类、内联缓存等手段优化性能，也会增加 `Promise.try` / `Promise.withResolvers` 这些较新的 API。但**形状**和我们手写的这一版完全一致。

如果你能把"为什么单线程 → 单线程的代价 → 异步三件套 → 宏任务 vs 微任务 → 输出顺序机械推导 → Promise 状态机 → v1 到 v5"这条因果链自己讲一遍，那么之后无论是面试被问到"输出顺序题"还是"手写 Promise"，都不会再卡壳。
