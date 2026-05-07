---
type: article
date: 2025-12-05
title: useSearchParams
description: 通过 useSearchParams 将 React 应用状态提升到 URL 查询参数，支持分享、持久化与浏览器历史控制，并示例防抖与 replace 更新的最佳实践。
author: mcell
tags:
  - React
  - React Router
  - 前端路由
  - SPA
  - useSearchParams
  - URL查询参数
  - 状态管理
  - 可分享链接
  - 防抖
  - Hook
keywords:
  - React Router useSearchParams
  - URL查询参数状态
  - React路由持久化
  - 浏览器历史替换
  - 分享链接搜索状态
  - React防抖搜索
  - SPA状态同步
  - Hook管理URL
  - Query Params管理
  - React前端路由
---

![075](https://stack-mcell.tos-cn-shanghai.volces.com/075.webp)

在开发 React 应用时，我们经常遇到一种场景：用户在搜索框输入关键词，筛选出一个列表，然后希望把这个结果分享给同事。

如果我们将筛选条件仅仅保存在组件的 `useState` 中，一旦刷新页面或复制链接，这些状态就会丢失，用户看到的只能是初始页面。

为了解决这个问题，我们需要将状态“提升”到 URL 的查询参数（Query Params）中。在 React Router v6 中，`useSearchParams` 这个 Hook 就是专门用来处理这个问题的。

本文将介绍如何使用它来实现 URL 与应用状态的同步。

## 为什么要同步状态到 URL

在单页应用（SPA）中，URL 不仅仅是页面的地址，它还应该承载页面的**状态**。

将查询参数（如 `?q=react&page=1`）绑定到 URL 有以下几个显而易见的好处：

1.  **可分享性**：用户直接复制 URL 发送给他人，对方打开后看到的内容与发送者完全一致。
2.  **持久性**：刷新页面后，搜索条件和页码不会丢失。
3.  **浏览器历史**：用户可以使用浏览器的“后退”按钮回到上一次的搜索结果。

## 基本用法

`useSearchParams` 的用法与 React 原生的 `useState` 非常相似。它返回一个数组，包含两个元素：当前的查询参数对象和一个更新查询参数的函数。

```javascript
import { useSearchParams } from 'react-router-dom'

const [searchParams, setSearchParams] = useSearchParams()
```

- **`searchParams`**：这是一个 `URLSearchParams` 对象，用于读取当前的 URL 参数。
- **`setSearchParams`**：这是一个函数，用于设置新的 URL 参数，并触发组件重新渲染。

## 读取参数

假设当前的 URL 是 `http://localhost:3000/search?q=javascript`。

要获取 `q` 参数的值，我们使用 standard URLSearchParams API 中的 `.get()` 方法。

```javascript
const query = searchParams.get('q') // 返回 "javascript"
```

**注意**：`URLSearchParams` 获取到的值默认都是字符串。如果你在处理页码（如 `?page=1`），获取到的将是字符串 `"1"`，在使用前可能需要通过 `parseInt` 或 `Number` 进行转换。

## 写入参数

要更新 URL 上的参数，我们调用 `setSearchParams`。这会更新 URL 的查询字符串，并自动将新的记录添加到浏览器的历史堆栈中。

```javascript
// 将 URL 更新为 /search?q=react
setSearchParams({ q: 'react' })
```

如果你想保留现有的其他参数（例如在切换页码时保留搜索关键词），你需要手动合并对象，或者传入一个回调函数（取决于 React Router 的具体版本行为，通常直接传入新对象会替换旧对象，因此建议显式构建新对象）。

## 构建一个可分享的搜索组件

下面我们通过一个完整的示例，来实现一个“输入即搜索”且状态同步到 URL 的功能。

### 需求分析

- 有一个输入框，用于输入搜索关键词。
- 输入框的值（Value）应该受控于 URL 中的 `q` 参数。
- 当用户输入时，更新 URL 参数。
- 页面根据 URL 参数展示结果。

### 代码实现

```jsx
import React from 'react'
import { useSearchParams } from 'react-router-dom'

function SearchPage() {
  // 1. 初始化 hook
  const [searchParams, setSearchParams] = useSearchParams()

  // 2. 读取参数：获取 URL 中的 'q'，如果没有则默认为空字符串
  const query = searchParams.get('q') || ''

  // 3. 事件处理：当 input 变化时，更新 URL
  const handleInputChange = (event) => {
    const value = event.target.value

    if (value) {
      // 设置参数，URL 会变为 ?q=输入值
      setSearchParams({ q: value })
    } else {
      // 如果清空了输入，最好也移除参数，保持 URL 干净
      setSearchParams({})
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>搜索示例</h2>

      {/* 输入框绑定 */}
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="请输入搜索内容..."
        style={{ padding: '8px', width: '300px' }}
      />

      {/* 模拟展示结果 */}
      <div style={{ marginTop: '20px' }}>
        <p>
          当前的搜索关键词是：<strong>{query}</strong>
        </p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          试着复制现在的浏览器地址栏 URL 分享给别人，他们将看到同样的关键词。
        </p>
      </div>
    </div>
  )
}

export default SearchPage
```

### 代码解析

这个组件的核心逻辑在于：**输入框的状态不再由 `useState` 管理，而是直接由 `searchParams` 驱动。**

- **读取阶段**：组件渲染时，直接从 URL 读取 `q` 赋值给 `input` 的 `value`。这意味着，如果用户是通过带有参数的链接进来的（例如 `/search?q=hello`），输入框里会自动填充 "hello"。
- **写入阶段**：用户输入时，调用 `setSearchParams`。这会修改 URL，URL 变化导致组件重新渲染，输入框的值随之更新。这是一个完美的闭环。

## 进阶细节

在使用 `useSearchParams` 时，还有两个细节值得注意。

### 防抖（Debounce）

上面的例子中，用户每输入一个字母，URL 就会更新一次，浏览器的历史记录也会增加一条。这在实际体验中可能不仅对性能有影响，也会让用户的“后退”操作变得困难（需要按很多次后退才能回到上一个页面）。

通常，我们会配合“防抖”技术，在用户停止输入 300ms 或 500ms 后再更新 URL。或者，使用 `setSearchParams` 的 `replace` 选项：

```javascript
setSearchParams({ q: value }, { replace: true })
```

设置 `replace: true` 会替换当前的历史记录项，而不是新增一条，这样用户点击“后退”时会直接回到进入搜索页之前的页面。

### 处理复杂对象

URL 参数本质上是字符串。如果你需要存储复杂的筛选对象（例如多选标签、日期范围），通常需要自行序列化。

- **写入时**：将数组或对象转换为字符串（如逗号分隔 `tags=vue,react`）。
- **读取时**：将字符串拆解回数组。

## 总结

`useSearchParams` 是 React Router 提供的一个非常实用的 Hook。它弥合了组件内部状态与浏览器 URL 之间的鸿沟。

通过将状态提升至 URL：

1.  我们简化了组件的状态管理。
2.  我们免费获得了“路由级”的状态持久化。
3.  用户的分享体验得到了显著提升。

在开发列表页、搜索页或任何需要保留视图状态的页面时，请优先考虑使用它。

(完)
