---
type: article
date: 2025-04-10
title: 探索 JS 异步编程：从 setTimeout 到生成器的六种定时实现
description: 深入探索 JavaScript 异步编程的完整演进路径。以“每秒打印数字”为实例，深入剖析 6 种定时任务实现方法：从经典的闭包问题、Promise 链式调用，到现代的 async/await、生成器函数和函数式编程。
tags:
  - JavaScript异步
  - 异步编程
  - Promise
  - async/await
  - 生成器函数
  - Generator
  - setTimeout
  - setInterval
  - 定时器
  - 闭包
  - ES6+
  - 函数式编程
author: mCell
---

![010.png](https://stack-mcell.tos-cn-shanghai.volces.com/010.png)

> 本文将摒弃 Web API (`requestAnimationFrame`)，在 Node 环境中探讨六种实现方案，展示不同编程范式下的异步控制技巧。

“每秒打印一个数字”这个看似简单的任务，是检验 JavaScript 开发者异步理解程度的绝佳试金石。它不仅考察定时器使用，更串联起闭包、Promise、生成器等核心概念。下面我们由浅入深探索六种实现方案。

## 1. 经典的 `setTimeout` 与闭包陷阱

```javascript
function printNumbersWithTimeout() {
  for (let i = 1; i <= 10; i++) {
    setTimeout(() => console.log(i), i * 1000)
  }
}
```

**核心思路**：  
一次循环启动多个定时器，通过延迟时间差实现顺序打印。

**关键点**：

- `let` 创建块级作用域，每个回调捕获独立的 `i`
- 若使用 `var` 会共享变量，导致打印十个 `11`
- 闭包陷阱是 JS 异步编程的经典问题

## 2. `setInterval` 状态管理

```javascript
function printNumbersWithInterval() {
  let i = 1
  const timer = setInterval(() => {
    console.log(i++)
    if (i > 10) clearInterval(timer)
  }, 1000)
}
```

**核心思路**：  
创建周期性执行的"节拍器"，外部维护状态。

**关键点**：

- 需要显式管理状态变量 `i`
- **必须调用 `clearInterval`** 避免内存泄漏
- 在组件化开发中，需在卸载生命周期清理定时器

## 3. 递归 `setTimeout` 的精准控制

```javascript
function printNumbersRecursive(i = 1) {
  if (i > 10) return

  console.log(i)

  setTimeout(() => printNumbersRecursive(i + 1), 1000)
}
```

**核心思路**：  
当前任务完成后，再安排下一个任务。

**优势**：

- 比 `setInterval` 更健壮，避免任务堆积
- 确保执行间隔至少为 1 秒
- 递归终止条件必不可少

## 4. `async/await` 同步化表达

```javascript
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function printNumbersAsync() {
  for (let i = 1; i <= 10; i++) {
    await sleep(1000)
    console.log(i)
  }
}
```

**核心思路**：  
用 `await` 暂停循环执行，模拟同步代码。

**优势**：

- 代码结构清晰，避免回调地狱
- `await` 只暂停当前函数，不阻塞主线程
- 现代 JS 异步编程首选方案

## 5. 生成器函数的精细控制

```javascript
function* numberGenerator() {
  for (let i = 1; i <= 10; i++) {
    yield new Promise((resolve) =>
      setTimeout(() => {
        console.log(i)
        resolve()
      }, 1000),
    )
  }
}

async function printNumbersGenerator() {
  for await (const _ of numberGenerator()) {
  }
}
```

**核心思路**：  
生成器产出 Promise，外部消费执行。

**关键点**：

- 执行控制权交给调用方
- 展示迭代器与异步操作结合
- 理解异步迭代器的基础

## 6. `Array.reduce` 构建 Promise 链

```javascript
function printNumbersFunctional() {
  Array.from({ length: 10 }, (_, i) => i + 1).reduce(
    (chain, num) =>
      chain.then(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              console.log(num)
              resolve()
            }, 1000),
          ),
      ),
    Promise.resolve(),
  )
}
```

**核心思路**：  
使用 `reduce` 动态构建 Promise 执行链。

**特点**：

- 函数式编程思想的典型应用
- 代码高度声明式但可读性较低
- 展示 Promise 链式执行机制

## 方案对比总结

| 方法              | 适用场景       | 优势             | 注意事项                 |
| ----------------- | -------------- | ---------------- | ------------------------ |
| **`setTimeout`**  | 简单定时任务   | 直观易理解       | 注意闭包陷阱             |
| **`setInterval`** | 周期性任务     | 状态集中管理     | 必须清理定时器           |
| **递归调用**      | 需要精确间隔   | 避免任务堆积     | 设置终止条件             |
| **`async/await`** | 现代异步编程   | 代码可读性最佳   | 需封装 sleep 函数        |
| **生成器函数**    | 复杂流程控制   | 精细控制执行流程 | 概念较抽象               |
| **`reduce`链式**  | 函数式编程场景 | 无状态、声明式   | 可读性差，慎用于业务代码 |

## 异步编程演进启示

从 `setTimeout` 到 `async/await`，JavaScript 异步编程经历了显著进化：

1. **从回调地狱到同步风格**：`async/await` 让异步代码拥有同步代码的可读性
2. **控制粒度精细化**：生成器提供更细粒度的执行控制
3. **编程范式多元化**：函数式与异步的结合拓展了解决方案空间

每种方案都有其适用场景，理解底层机制比死记语法更重要。建议初学者从 `async/await` 入手，再逐步探索其他模式的精妙之处。

### 参考文档

- [MDN: 数组的 reduce 方法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
- [MDN: Promise 异步编程](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [面试官：你可以终止 forEach 吗？](https://juejin.cn/post/7380942251411226659?searchId=202503302032262C8FF11FB96465422772)
