---
type: article
date: 2025-06-09
updated: 2025-06-09
title: JavaScript 运行机制详解：再谈 Event Loop
description: 本文从经典的 Promise 与 setTimeout 执行顺序问题入手，深入浅出地剖析了 JavaScript 的单线程模型、事件循环（Event Loop）机制。通过辨析宏任务与微任务的区别与优先级，帮助你彻底理解 JS 异步执行的底层原理，看懂页面卡顿的真相。
tags:
  - JavaScript
  - 浏览器
  - 事件循环
  - Promise
  - 异步机制
---

![082.webp](https://stack-mcell.tos-cn-shanghai.volces.com/082.webp)

> 本文从经典的 Promise 与 setTimeout 执行顺序问题入手，深入浅出地剖析了 JavaScript 的单线程模型、事件循环（Event Loop）机制。通过辨析宏任务与微任务的区别与优先级，帮助你彻底理解 JS 异步执行的底层原理，看懂页面卡顿的真相。

我常常在各种场合被问到类似下面代码的输出顺序。

```javascript
console.log('start')

setTimeout(function () {
  console.log('setTimeout')
}, 0)

Promise.resolve().then(function () {
  console.log('promise')
})

console.log('end')
```

如果你能毫不犹豫地答出 `start, end, promise, setTimeout`，并解释其原因，那么你对 JS 的异步机制已经有了不错的理解。如果你还有一丝困惑，希望本文能帮助你彻底梳理清楚。

这个问题的背后，是整个 JavaScript 的运行模型（runtime model），也就是我们常说的“事件循环”（Event Loop）。理解它，是前端工程师进阶的必经之路。

## **为什么 JavaScript 是单线程？**

首先，我们必须记住一个基本事实：**JavaScript 语言是一门单线程语言。**

这意味着，在任何一个时刻，JS 引擎只能执行一段代码。为什么这么设计？这与它的初衷有关。JavaScript 最初是为浏览器设计的，用于处理用户的交互，比如鼠标点击、键盘输入，以及操作 DOM。

试想一下，如果 JavaScript 是多线程的，会发生什么？一个线程要在一个 DOM 节点上增加内容，另一个线程要删除这个节点。那么浏览器应该听谁的？这会带来极其复杂的同步问题。为了避免这种复杂性，JavaScript 从诞生起就选择了单线程。

这既是它的优点，也是它的缺点。优点是简单，没有多线程的竞态、死锁等问题。缺点是，如果一个任务耗时很长，整个程序就会被“卡住”，无法响应其他操作。

## **浏览器：一个多进程的“操作系统”**

“JS 是单线程的”这个说法其实不完全准确。准确来说，**执行 JavaScript 代码的那个主线程是单线程的**。

现代浏览器（以 Chrome 为例）本身是一个非常复杂的程序，它采用了多进程架构来保证稳定性和安全性。你可以打开 Chrome 的任务管理器（“更多工具” \> “任务管理器”）看看，通常会看到好几个进程：

> - **浏览器进程（Browser Process）**：负责浏览器界面的“外壳”，比如地址栏、书签、前进后退按钮，以及协调其他进程。
> - **渲染进程（Renderer Process）**：核心部分，负责将 HTML、CSS 和 JavaScript 转换成用户可以看到的网页。**我们写的 JS 代码，主要就在这个进程的主线程（Main Thread）上运行**。每个标签页通常会有一个独立的渲染进程。
> - **网络进程（Network Process）**：负责处理网络请求，比如 `fetch`。
> - **GPU 进程（GPU Process）**：负责处理 GPU 相关的任务，加速 3D 绘图和页面渲染。

这种设计的好处是隔离。一个标签页（渲染进程）崩溃了，不会影响到整个浏览器。

## **任务队列（Task Queue）和事件循环（Event Loop）**

我们回到渲染进程的主线程。这个线程非常繁忙，它要做的事情包括：

- 执行 JavaScript 代码
- 渲染页面布局（Layout）
- 绘制页面（Paint）
- 响应用户交互（Click, Scroll）

如果所有任务都排队等着，一个耗时长的 JS 计算就会阻塞页面渲染和用户响应，这就是“假死”现象。

```javascript
// 一个会让页面卡住的例子
document.getElementById('myButton').addEventListener('click', function () {
  // 假装这是一个非常耗时的计算
  const start = Date.now()
  while (Date.now() - start < 5000) {
    // 这5秒内，页面完全无法响应
  }
  console.log('计算完成!')
})
```

为了解决这个问题，浏览器引入了异步（asynchronous）执行模型。当遇到一些耗时操作（比如网络请求、定时器）时，主线程不会傻等，而是把这些任务“外包”给浏览器的其他线程（比如网络线程、定时器线程）。

这些“外包”任务完成后，会把一个“回调函数”（callback）放进一个叫做\*\*任务队列（Task Queue）\*\*的地方。主线程则继续执行自己手头的同步代码。

等到主线程的同步代码全部执行完毕，它就会去任务队列里看看，有没有需要执行的回调函数。如果有，就取出一个来执行。这个“**主线程不断从任务队列里读取并执行任务**”的过程，就叫做**事件循环（Event Loop）**。

这个模型可以用一张经典的图来表示：

![019.jpg](https://stack-mcell.tos-cn-shanghai.volces.com/019.jpg)

## **微任务（Microtask）和宏任务（Macrotask）**

事情还没完。任务队列其实不止一个。根据 [WHATWG 规范](https://www.google.com/search?q=https://html.spec.whatwg.org/multipage/webappapis.html%23event-loops)，任务被分为两种类型：

1.  **宏任务（Macrotask，规范中称为 Task）**
    - `setTimeout`, `setInterval`
    - `script`（整体代码块）
    - I/O 操作, UI 渲染
    - 用户交互事件（如 `click`, `scroll`）

2.  **微任务（Microtask）**
    - `Promise.then()`, `Promise.catch()`, `Promise.finally()`
    - `queueMicrotask()`
    - `MutationObserver`

事件循环的规则是，**优先级更高的是微任务**。主线程在执行完一个宏任务后，并不是立刻去执行下一个宏任务，而是会检查微任务队列。

**完整的事件循环流程如下：**

1.  从宏任务队列中取出一个任务（通常是 `script` 脚本本身）并执行。
2.  执行完毕后，检查微任务队列。
3.  循环执行微任务队列中的所有任务，直到队列清空。
4.  执行浏览器 UI 渲染（这一步不一定每次都会发生）。
5.  回到第一步，从宏任务队列中取出下一个任务。

这个“**执行一个宏任务 -\> 清空所有微任务 -\> 再取下一个宏任务**”的循环，是理解所有异步执行顺序的关键。

## **回到最初的问题**

现在，我们用这个模型来分析开头的代码：

```javascript
console.log('start') // 1

setTimeout(function () {
  // 4
  console.log('setTimeout')
}, 0)

Promise.resolve().then(function () {
  // 3
  console.log('promise')
})

console.log('end') // 2
```

1.  **第一轮宏任务（script 脚本）开始执行。**
    - 遇到 `console.log('start')`，直接执行。输出 `start`。
    - 遇到 `setTimeout`，它是一个宏任务。浏览器定时器线程接管，0ms 后将其回调函数推入**宏任务队列**。
    - 遇到 `Promise.resolve().then()`，`.then()` 的回调是一个微任务。它被推入**微任务队列**。
    - 遇到 `console.log('end')`，直接执行。输出 `end`。

2.  **第一个宏任务（script）执行完毕。**
    - 现在，事件循环会检查**微任务队列**。发现里面有一个任务（打印 `promise`）。
    - 取出并执行该微任务。输出 `promise`。
    - 微任务队列现在空了。

3.  **开始下一轮宏任务。**
    - 事件循环检查**宏任务队列**，发现 `setTimeout` 的回调函数在那里。
    - 取出并执行该宏任务。输出 `setTimeout`。

至此，所有代码执行完毕。最终输出 `start, end, promise, setTimeout`。

## **应用与思考**

理解了事件循环，很多问题就迎刃而解了。

- **`setTimeout(fn, 0)` 为什么不是立即执行？**
  因为它只是把 `fn` 尽快地推入宏任务队列，但必须等到当前主线程的同步代码和所有微任务都执行完之后，才有机会被执行。

- **页面为什么会卡顿？**
  通常是因为一个宏任务（比如一段 JS 计算或一个事件回调）执行时间过长，导致主线程无法脱身去处理其他宏任务（如 UI 渲染、用户点击）。

- **如何处理耗时计算？**
  对于真正 CPU 密集的计算，应该使用 [Web Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)。它允许你在一个完全独立的后台线程中运行脚本，不会阻塞主线程。

## **参考链接**

- [MDN - Concurrency model and the event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [Jake Archibald: In The Loop - JSConf.Asia 2018](https://www.youtube.com/watch?v=cCOL7MC4Pl0)（非常经典的视频讲解）

希望读完本文，你对 JavaScript 的运行机制有了更深入的理解。

（完）
