---
title: 从零构建迷你 React
---

```jsx step file=steps/00.jsx

```

### Step Zero: 回顾基础

但首先让我们回顾一些基本概念。

我们将使用这个 React 应用——仅仅三行代码。第一行定义了一个 React 元素。第二行从 DOM 中获取一个节点。最后一行将 React 元素渲染到容器中。

**让我们移除所有 React 特定的代码，用纯 JavaScript 替换它。**

```jsx step file=steps/01.jsx highlight=1:6

```

### Step I: createElement 函数

在第一行我们有元素，用 JSX 定义。它甚至不是有效的 JavaScript，所以为了用纯 JS 替换它，我们首先需要把它替换成有效的 JS。

JSX 通过像 Babel 这样的构建工具被转换为 JS。转换通常很简单：将标签内的代码替换为对 `createElement` 的调用，将标签名、props 和 children 作为参数传递。

`React.createElement` 从其参数创建一个对象。除了一些验证，这就是它所做的全部。所以我们可以安全地用它的输出替换函数调用。

```jsx step file=steps/02.jsx highlight=1:23

```

### Step II: 实现 createElement

正如我们在上一步看到的，一个元素是一个带有 `type` 和 `props` 两个属性的对象。我们的函数唯一需要做的就是创建这个对象。

我们使用 **spread 运算符** 处理 `props`，使用 **rest 参数** 语法处理 `children`，这样 `children` prop 将始终是一个数组。

`children` 数组也可能包含原始值，如字符串或数字。所以我们会把所有不是对象的东西包装在它自己的元素中，并为它们创建一个特殊类型：`TEXT_ELEMENT`。

```jsx step file=steps/03.jsx highlight=25:43

```

### Step III: render 函数

接下来，我们需要编写自己版本的 `ReactDOM.render` 函数。

目前，我们只关心向 DOM 添加元素。我们稍后处理更新和删除。

我们从使用元素类型创建 DOM 节点开始，然后将新节点追加到容器中。我们递归地对每个子元素做同样的事情。

我们还需要处理文本元素——如果元素类型是 `TEXT_ELEMENT`，我们创建文本节点而不是常规节点。

最后我们需要将元素的 props 赋给节点。

就是这样。我们现在有了一个可以将 JSX 渲染到 DOM 的库。
