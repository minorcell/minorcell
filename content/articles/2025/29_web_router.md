---
type: article
date: 2025-11-16
updated: 2025-11-16
title: 前端路由详解：Hash VS History
description: 全面解析前端路由的 Hash 与 History 两种模式，涵盖原理、实现、优缺点、服务器配置与框架实践，帮助你做出兼顾兼容性与 SEO 的路由选型。
author: mcell
tags:
  - 前端路由
  - Hash模式
  - History模式
  - SPA
  - 浏览器历史
  - 路由守卫
  - 服务器配置
  - SEO
  - Vue Router
  - React Router
keywords:
  - 前端路由模式
  - Hash路由实现
  - History API教程
  - SPA导航
  - 浏览器history
  - 路由守卫实践
  - Nginx history配置
  - React Router HashRouter
  - Vue Router history模式
  - SEO路由优化
---

![084.webp](https://stack-mcell.tos-cn-shanghai.volces.com/084.webp)

## 背景

在 Web 开发的早期，互联网主要由 多页应用（MPA, Multi-Page Application）组成。那时的路由逻辑非常简单：用户点击一个链接，浏览器向服务器发送请求；服务器接收请求，根据 URL 路径找到对应的 HTML 文件（或通过模板引擎生成），返回给浏览器；浏览器卸载当前页面，重新渲染新页面。

这种模式的缺点显而易见：每次页面切换都需要重新加载资源，出现短暂的“白屏”，用户体验不够流畅。

随着 AJAX 技术的普及，单页应用（SPA, Single-Page Application）开始流行。SPA 的核心理念是：**页面初始化时加载必要的 HTML、CSS 和 JavaScript，之后的页面切换不再请求完整的 HTML，而是通过 JS 动态更新页面内容。**

这就带来了一个新问题：**如何在不刷新页面的前提下，改变 URL 并渲染对应的内容？**

这就是**前端路由**诞生的背景。目前主流的解决方案有两种：**Hash 模式**和 **History 模式**。

## Hash 模式

如果你看到 URL 中包含一个 `#` 号，例如 `http://www.example.com/#/home`，那么这个应用很可能使用的是 Hash 模式。

### Hash 的本质

Hash（哈希）原本是用来做页面定位的（锚点）。比如 `<a href="#content">` 可以直接跳转到页面 id 为 `content` 的位置。

Hash 有一个非常重要的特性：**URL 中 `#` 及其后面的内容，虽然会显示在浏览器地址栏，但不会被包含在 HTTP 请求中。**

当你访问 `http://www.example.com/#/home` 时，浏览器向服务器请求的仅仅是 `http://www.example.com/`。这意味着，无论 `#` 后面的内容如何变化，服务端都只接收到同一个请求，返回同一个 `index.html`。

### 实现原理

在浏览器中，我们可以通过 `window.location.hash` 属性读取或修改 Hash 值。

更关键的是，浏览器提供了一个 `hashchange` 事件。当 URL 的 Hash 部分发生变化时，就会触发这个事件。

```javascript
// 监听 Hash 变化
window.addEventListener('hashchange', function () {
  console.log('The hash has changed to: ' + location.hash)
  // 在这里根据 hash 的值，动态更新页面 DOM
})
```

### 优缺点分析

- **优点**：
  - **兼容性好**：支持低版本浏览器（如 IE8）。
  - **无需服务端配置**：因为 Hash 不参与 HTTP 请求，服务器只需处理根路径请求，部署极其简单。
- **缺点**：
  - **URL 不美观**：`#` 符号夹在中间，违背了 URL 的语义（Uniform Resource Locator），看起来像个“补丁”。
  - **SEO 较差**：搜索引擎爬虫虽然在进化，但对 Hash 的支持依然不如纯路径友好。

## History 模式

为了解决 Hash 模式 URL 不美观的问题，HTML5 标准在 `history` 对象上增加了新的 API。这就是 History 模式的基础。

### 核心 API

在 HTML4 时代，`window.history` 只能用于前进（`forward`）、后退（`back`）和跳转（`go`）。

HTML5 新增了两个关键方法，允许我们在**不刷新页面**的情况下修改 URL：

1.  `history.pushState(state, title, url)`：向历史记录堆栈中添加一条新记录。
2.  `history.replaceState(state, title, url)`：修改当前的历史记录。

例如，执行 `history.pushState(null, null, '/user/id')` 后，浏览器的地址栏会变为 `http://www.example.com/user/id`，但浏览器**不会**向服务器发送请求，页面也不会刷新。

### 实现原理

History 模式的实现比 Hash 稍微复杂一点。我们需要处理两种情况：

1.  **用户点击链接**：前端框架会拦截 `<a>` 标签的点击事件，阻止默认跳转，改用 `history.pushState` 修改 URL，并手动更新视图。
2.  **用户点击浏览器的前进/后退按钮**：这会触发 `popstate` 事件。我们需要监听这个事件来更新视图。

```javascript
// 监听浏览器的前进、后退
window.addEventListener('popstate', function (event) {
  console.log(
    'Location: ' +
      document.location +
      ', state: ' +
      JSON.stringify(event.state),
  )
  // 根据当前 path 更新视图
})
```

### 优缺点分析

- **优点**：
  - **URL 美观**：和传统后端路由一样的路径结构，符合 RESTful 规范。
  - **功能更强**：`pushState` 可以传递 `state` 对象，允许在页面跳转时传递复杂数据。
- **缺点**：
  - **兼容性**：需要 IE10 及以上。
  - **必须服务端配置**：这是最大的痛点（详见第五节）。

## 源码级实战：手写迷你路由

为了彻底理解，我们模仿 Vue Router 写一个简化版。

### 4.1 HashRouter 实现

```javascript
class HashRouter {
  constructor() {
    this.routes = {} // 存储路径与回调函数的映射
    this.currentUrl = ''

    // 绑定 this，防止指向丢失
    this.refresh = this.refresh.bind(this)

    // 监听 load 和 hashchange 事件
    window.addEventListener('load', this.refresh)
    window.addEventListener('hashchange', this.refresh)
  }

  // 注册路由
  route(path, callback) {
    this.routes[path] = callback || function () {}
  }

  // 刷新页面逻辑
  refresh() {
    // 获取当前 hash，去掉 # 号
    this.currentUrl = location.hash.slice(1) || '/'
    // 执行对应的回调函数（渲染 UI）
    if (this.routes[this.currentUrl]) {
      this.routes[this.currentUrl]()
    }
  }
}
```

### HistoryRouter 实现

```javascript
class HistoryRouter {
  constructor() {
    this.routes = {}

    this.bindPopState()
    this.initLinkHijack() // 拦截 a 标签
  }

  route(path, callback) {
    this.routes[path] = callback || function () {}
  }

  // 监听浏览器自带的前进后退
  bindPopState() {
    window.addEventListener('popstate', (e) => {
      const path = location.pathname
      this.updateView(path)
    })
  }

  // 拦截全局点击事件，处理 link 跳转
  initLinkHijack() {
    document.addEventListener('click', (e) => {
      const target = e.target
      if (target.tagName === 'A') {
        e.preventDefault() // 阻止默认跳转
        const path = target.getAttribute('href')
        // 手动修改 URL
        history.pushState(null, null, path)
        // 更新视图
        this.updateView(path)
      }
    })
  }

  updateView(path) {
    if (this.routes[path]) {
      this.routes[path]()
    }
  }
}
```

## 部署难题：History 模式下的 404 问题

这是新手最容易遇到的“坑”。

### 现象复现

你在本地开发时（使用 `webpack-dev-server` 或 `vite`），一切正常。但是，当你运行 `npm run build` 打包，将生成的文件部署到 Nginx 服务器后：

1.  访问根路径 `http://www.site.com/`，页面正常显示。
2.  点击导航进入 `http://www.site.com/about`，页面正常显示（因为是 JS 动态渲染的）。
3.  **但是**，如果你在 `/about` 页面按下**刷新**按钮，或者直接在地址栏输入这个地址，页面会显示 **404 Not Found**。

### 根本原因

这是一个典型的“前端路由与后端路由冲突”问题。

- **前端逻辑**：我认为 `/about` 是一个视图（Component），属于 `index.html` 的一部分。
- **后端逻辑**：当浏览器发送 `/about` 请求时，服务器会去文件系统中查找名为 `about` 的文件夹或文件。

很显然，你的服务器上只有一个 `index.html`，并没有 `about` 这个文件，所以 Nginx 诚实地返回了 404。

### 解决方案

解决思路很简单：**告诉服务器，如果找不到对应的文件，不要报 404，而是统统返回 `index.html`。**

只要返回了 `index.html`，浏览器就会加载 JS，路由插件（Vue Router 等）就会接管 URL，分析路径是 `/about`，然后渲染出对应的组件。

**Nginx 配置示例：**

```nginx
location / {
  root   /usr/share/nginx/html;
  index  index.html index.htm;

  # 核心配置：尝试查找文件，找不到则重定向到 index.html
  try_files $uri $uri/ /index.html;
}
```

`try_files $uri $uri/ /index.html;` 的意思是：

1.  先看用户请求的是不是一个真实存在的文件（`$uri`）。
2.  如果不是，再看是不是一个真实存在的目录（`$uri/`）。
3.  如果都不是，就返回 `/index.html`。

## 总结与选型指南

最后，我们用一张表格来总结两者的区别，帮助你在项目中做出选择。

| 特性           | Hash 模式                      | History 模式           |
| :------------- | :----------------------------- | :--------------------- |
| **URL 外观**   | `example.com/#/about`          | `example.com/about`    |
| **美观度**     | 丑，有“\#”号干扰               | 美观，符合标准         |
| **原理**       | `window.location.hash`         | `history.pushState`    |
| **兼容性**     | 极好（IE8+）                   | 较好（IE10+）          |
| **服务端配置** | **不需要**                     | **必须配置**           |
| **应用场景**   | 内部系统、Demo、静态资源服务器 | 正式商业项目、C 端应用 |

在现代前端开发中，除非你有特殊的兼容性需求或者由于权限问题无法配置服务器，否则**强烈建议使用 History 模式**。它不仅能提供更好的用户体验，也更符合 Web 标准的发展趋势。

（完）
