---
type: article
title: 'Lua 编程入门：从基础语法到元表'
date: 2026-08-15
updated: 2026-08-15
description: '一篇朴素的 Lua 入门教程：基本类型、运算符、控制流、函数，以及 Lua 最独特的 table 与元表机制。示例代码基于 Lua 5.5。'
tags: [Lua, 编程语言, 教程, 脚本语言]
keywords: [Lua, Lua 教程, Lua 入门, Lua 语法, table, 元表, 嵌入式脚本语言]
order: 63
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-getting-started-cover.png)

最近整理旧笔记时，注意到一门我平时几乎没见过的语言——Lua。本来以为是什么小众玩具，查了一下才发现：它 1993 年就发布了，使用范围其实相当广，只是大多数时候都嵌在别的软件里，不写对应场景的代码就见不到它。

真正引起我兴趣的是它的关键字数量。**Lua 的关键字只有 21 个，比以简洁著称的 Go（25 个）还要少**。一个 1993 年出生的语言，语法精简到这种程度，还能活到今天、被各种软件嵌入使用，这让我想认真学一遍。

本文是一篇入门教程，假设你已经写过代码（文中会用 JavaScript 作对照）：语法相同的地方一笔带过，重点放在 Lua 与主流语言不同的地方——类型与变量、运算符、控制流、函数，最后是 Lua 最核心的 table 和元表。示例代码基于 Lua 5.5。

## Lua 是什么

Lua 诞生于巴西里约热内卢天主教大学（PUC-Rio）的 Tecgraf 实验室，前身是为巴西石油公司（Petrobras）写的数据录入语言。它的定位从一开始就很明确：**一门嵌入到宿主程序里的脚本语言**。

这个定位决定了它的形态：

- **小**。整个解释器（含标准库）编译完几百 KB，能塞进任何程序。
- **C 可嵌入**。提供简洁的 C API，宿主程序可以把 Lua 解释器嵌进去，用 Lua 写业务逻辑。
- **可移植**。不依赖操作系统特性，几乎任何平台都能跑。

所以 Lua 的使用场景大多是“别人的软件，Lua 的配置”：游戏行业用得最多——《魔兽世界》的插件用 Lua 写，[Roblox](https://luau.org/) 的脚本语言 Luau 是 Lua 的一个方言；编辑器 [Neovim](https://neovim.io/) 用 Lua 做配置语言；[Redis](https://redis.io/docs/latest/develop/programmability/) 内置 Lua 脚本；[OpenResty](https://openresty.org/en/) 用 Lua 给 Nginx 写逻辑；macOS 上的自动化工具 [Hammerspoon](https://www.hammerspoon.org/) 也用 Lua。另外还有 [LÖVE](https://love2d.org/) 这类直接用 Lua 写游戏的框架。

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-embed-architecture.png)

补充一个常见的疑问：Lua 和 LuaJIT 是什么关系。LuaJIT 是另一个实现，带 JIT 编译，速度远超官方解释器，但它完整支持的是 Lua 5.1 的语法。官方解释器的最新稳定版是 5.5（2025 年 12 月发布）。本文示例基于 Lua 5.5。

## 安装与运行

[官网](https://www.lua.org/)下载，或用包管理器安装：

```bash
brew install lua        # macOS
apt install lua5.5      # Debian / Ubuntu
```

如果软件源里只有 lua5.4，装它也一样——本文内容两个版本通用。

装好后有两种用法。交互模式：直接执行 `lua` 进入 REPL，敲一行执行一行：

```lua
> print("hello, lua")
hello, lua
```

脚本模式：把代码写进文件，用 `lua` 命令执行：

```lua
-- hello.lua
print("hello, lua")
```

```bash
lua hello.lua
```

## 基本类型与变量

Lua 有 8 种基本类型：`nil`、`boolean`、`number`、`string`、`function`、`userdata`、`thread`、`table`。用 `type()` 可以查看（相当于 JS 的 `typeof`）：

```lua
print(type(nil))      --> nil
print(type(42))       --> number
print(type(3.14))     --> number
print(type("lua"))    --> string
print(type(print))    --> function
print(type({}))       --> table
```

几个值得注意的点：

- **`nil` 表示“不存在”**。没赋值的变量是 nil，访问不存在的 table 字段也是 nil。相当于 JS 的 `null` 和 `undefined` 合二为一——Lua 里只有这一个“空”值。
- **`number` 只有一种**。整数和浮点数统一成一个类型（和 JS 的 `Number` 一样），内部自动区分，比如 `10 // 3` 是整数运算，`10 / 3` 是浮点运算。
- **只有 `false` 和 `nil` 为假**。`0` 和空字符串 `""` 都是真值。这一点和 JS 差异极大：JS 里 `0`、`""`、`null`、`undefined`、`NaN` 全是假值，Lua 里只有两个。

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-falsy-values.png)

变量默认是全局的，用 `local` 声明局部变量——作用类似 JS 的 `let`。区别是 JS 不加关键字会报错，Lua 不加关键字就是全局：

```lua
local x = 10    -- 局部变量，作用域是当前代码块
y = 20          -- 全局变量（尽量别这么写）
```

默认全局是个容易翻车的设计：拼错一个变量名，不会报错，而是悄悄创建了一个全局变量。所以 Lua 社区的习惯是：**除了刻意暴露的全局，一律写 `local`**。（Lua 5.5 起提供了 `global` 声明，可以在代码块里关掉默认全局、强制变量先声明再用，这里不展开。）

`nil` 还有一个用途：给 table 字段赋 `nil` 就等于删除这个字段（下一节细说）。

## 运算符

算术运算符：`+`、`-`、`*`、`/`、`//`、`%`、`^`。其中 `^` 是乘方（对应 JS 的 `**`），`//` 是整除、向负无穷取整（JS 没有整除运算符，一般用 `Math.floor` 凑）。两个容易认错的：

- `//` 是整除，不是注释。
- `^` 是乘方，不是异或——Lua 的按位异或是 `~`。

```lua
print(10 // 3)        --> 3
print(10 % 3)         --> 1
print(2 ^ 10)         --> 1024.0
```

字符串用 `..` 拼接。JS 里 `+` 既做加法又做拼接，Lua 把两件事分开了，`+` 只做加法：

```lua
print("ab" .. "cd")   --> abcd
print("n = " .. 42)   --> n = 42（数字会自动转字符串）
```

比较运算符：`==`、`~=`、`<`、`>`、`<=`、`>=`。注意不等号是 `~=`（对应 JS 的 `!=`）。另外 Lua 没有 JS 那种 `==` 与 `===` 之分，`==` 对 table、function 这类引用类型比较的就是**是不是同一个对象**，不是内容（行为等同于 JS 的 `===`）：

```lua
local a = {1, 2}
local b = {1, 2}
print(a == b)         --> false（两个不同的 table）
```

逻辑运算符：`and`、`or`、`not`。写 JS 的人对短路返回操作数不会陌生，Lua 的 `and`、`or` 行为一样——**返回操作数本身，不是布尔值**（对应 JS 的 `&&`、`||`）：

```lua
print(1 and 2)            --> 2
print(nil and 2)          --> nil
print(nil or "default")   --> default
print(not nil)            --> true
```

这带来一个常用惯用法：`x = x or 默认值`，对应 JS 的 `x = x || 默认值`。但要小心真假值集合不同：JS 里 `0` 和 `""` 会被 `||` 当成假、落到默认值，Lua 里它们是真值，不会：

```lua
local name = input or "anonymous"
```

## 控制流

条件分支是 `if / elseif / else / end`。和 JS 最大的不同是定界方式：没有括号、没有花括号，全靠 `then` 和 `end` 这两个关键字。这套风格来自 Modula（Pascal 一脉的学院派语言），在当今主流语言里已经很少见了——`then` 标记条件结束、代码块开始，`end` 标记代码块结束，多敲几个字，但块的边界非常直白。

另外两点：条件不需要括号；Lua 没有 `switch`。注意 `elseif` 的拼写——是一个词，不是 `else if`：

```lua
local score = 85

if score >= 90 then
  print("A")
elseif score >= 60 then
  print("B")
else
  print("C")
end
```

循环有三种。`while`：

```lua
local i = 1
while i <= 3 do
  print(i)
  i = i + 1
end
```

`repeat / until`（相当于 do-while，循环体至少执行一次）：

```lua
local i = 1
repeat
  print(i)
  i = i + 1
until i > 3
```

数值 `for`（JS 没有对应物，最接近的是 C 风格的 `for`，但 Lua 把起止和步长都写在循环头里）：

```lua
for i = 1, 5 do
  print(i)              --> 1 2 3 4 5
end

for i = 10, 1, -2 do
  print(i)              --> 10 8 6 4 2
end
```

泛型 `for` 类似 JS 的 `for...of`，用来遍历 table。区别是 JS 的迭代协议藏在对象里，Lua 的迭代器是明写的函数——内置的两个：`ipairs` 按顺序遍历数组部分（遇到第一个 `nil` 停止），`pairs` 遍历所有键值对（顺序不定）：

```lua
local colors = {"red", "green", "blue"}
for i, v in ipairs(colors) do
  print(i, v)           --> 1 red / 2 green / 3 blue
end

local person = {name = "Ada", year = 1815}
for k, v in pairs(person) do
  print(k, v)           -- 输出顺序不确定
end
```

## 函数

函数是一等公民：可以赋值给变量、当作参数传递、放在 table 里。

```lua
local function add(a, b)
  return a + b
end

local f = add            -- 函数也是值
print(f(1, 2))           --> 3
```

Lua 函数可以**返回多个值**——JS 想返回多个值，得包进数组再解构，Lua 直接写在 return 后面：

```lua
local function divmod(a, b)
  return a // b, a % b
end

local q, r = divmod(10, 3)
print(q, r)              --> 3 1
```

**可变参数**也用 `...` 表示——和 JS 的 rest 参数同一个符号，同样收尾参数。配合 `table.pack` 收进一个 table（返回的表带一个 `n` 字段记录参数个数）：

```lua
local function count(...)
  local args = table.pack(...)
  return args.n
end

print(count(1, 2, 3))    --> 3
```

Lua 实现了正确的尾调用：尾递归的写法不会撑爆调用栈。写递归时把递归调用放在 `return` 表达式的最后，就能放心深递归。

## table：唯一的数据结构

终于到 Lua 最核心的部分了。**Lua 只有一种数据结构：table。** 数组、字典、对象、模块，全是 table。JS 里这些是分家的几个东西（`Array`、`Object`、`Map`、`Set`），Lua 里是一个东西。

### 数组

用 `{...}` 字面量创建，**索引从 1 开始**——这是 Lua 和 JS 最显眼的差异，JS 数组从 0 开始。

为什么从 1 开始？Lua 作者 Roberto Ierusalimschy 在演讲里给过解释：Lua 的第一批用户是 Petrobras 的工程师，他们来自 Fortran 背景，而 Fortran 的数组是从 1 数的；更重要的是直觉——“first is 1st, not 0th”，对非程序员来说从 1 数更自然。他也批评过 0 基的流行：现代语言的 0 基基本是跟着 C 学的，而 C 用 0 基是因为指针算术（`a[i]` 即 `*(a+i)`），其他语言并没有这个理由。

实际使用中记住两件事就够了：`t[1]` 是第一个元素，`t[#t]` 是最后一个：

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-array-index.png)

```lua
local colors = {"red", "green", "blue"}
print(colors[1])         --> red
print(#colors)           --> 3（# 取数组长度）
```

`#` 相当于 JS 的 `.length`，但它只对没有“空洞”的数组可靠——如果数组中间有 `nil`，长度是未定义的（JS 的稀疏数组好歹还有个长度，Lua 直接不保证）。增删元素用标准库函数，别手动挪位置（`table.insert` 近似 JS 的 `push`）：

```lua
table.insert(colors, "yellow")   -- 尾部插入
table.remove(colors, 2)          -- 移除第 2 个并前移
print(colors[1], colors[2])      --> red blue
```

### 字典

键值对写法：

```lua
local person = {
  name = "Ada",
  year = 1815,
}

print(person["name"])    --> Ada
print(person.name)       --> Ada（语法糖，等价于上一行）
```

一个实用细节：`person.name` 是 `person["name"]` 的语法糖，键是字符串（JS 对象字面量也有同款）。而 `colors[1]` 的键是数字 1——**同一个 table 可以同时当数组和字典用**，这在 JS 里是分家的两件事：

```lua
local mix = {10, 20, name = "moon"}
print(mix[1], mix[2], mix.name)   --> 10 20 moon
```

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-table-mix.png)

给字段赋 `nil` 等于删除它：

```lua
person.year = nil
print(person.year)       --> nil
```

### 对象

Lua 没有 class 关键字，对象就是一个装了数据和函数的 table。配合冒号语法糖，可以写出面向对象的味道：

```lua
local counter = {
  n = 0,
  inc = function(self)
    self.n = self.n + 1
  end,
}

counter:inc()            -- 冒号语法糖，等价于 counter.inc(counter)
counter:inc()
print(counter.n)         --> 2
```

`obj:method(...)` 会自动把 `obj` 作为第一个参数（习惯上叫 `self`）传给 `method`。`self` 的角色类似 JS 的 `this`，但它是显式传参——没有绑定规则、没有“this 到底是谁”的经典困惑。定义方法时也可以直接用冒号简写：

```lua
local counter = {
  n = 0,
}

function counter:inc()
  self.n = self.n + 1
end
```

两种写法等价。

## 元表：给 table 加行为

table 本身只是存数据。想要“方法找不到时怎么办”“两个 table 相加怎么算”这类行为，靠的是**元表（metatable）**——这是 Lua 最有辨识度的机制。

每个 table 可以挂一个元表（`setmetatable`），元表里以 `__` 开头的字段定义特殊行为。JS 里最接近的概念是 Proxy：两者都是拦截“默认行为”的元编程机制。区别在于 Proxy 在 JS 里属于高级技巧，元表在 Lua 里是基础设施——语言自己的“继承”和运算符重载都建立在它上面。

### `__index`：找不到的键去哪找

访问 `t[k]` 时，如果 `k` 在 `t` 里不存在，Lua 会查元表的 `__index`。它可以是函数，也可以是另一个 table：

```lua
local defaults = {color = "green", size = 10}
local t = setmetatable({}, {__index = defaults})

print(t.color)           --> green（t 里没有，去 defaults 里找）
```

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-metatable-lookup.png)

这是 Lua 里实现“继承”的基础：把 `__index` 指向“父类” table，子对象就自动拥有父类的方法。

### 用元表写一个“类”

把 `__index` 和冒号语法糖组合起来，是 Lua 面向对象的标准写法：

```lua
local Vec = {}
Vec.__index = Vec

function Vec.new(x, y)
  return setmetatable({x = x, y = y}, Vec)
end

function Vec:add(other)
  return Vec.new(self.x + other.x, self.y + other.y)
end

local a = Vec.new(1, 2)
local b = Vec.new(3, 4)
local c = a:add(b)
print(c.x, c.y)          --> 4 6
```

`a:add(b)` 会先在 `a` 里找 `add`——找不到，就顺着元表的 `__index` 找到 `Vec.add`。看起来就像真的类一样。

### 运算符重载

元表还能定义算术行为，比如 `__add`：

```lua
local mt = {
  __add = function(a, b)
    return {x = a.x + b.x, y = a.y + b.y}
  end,
}

local a = setmetatable({x = 1, y = 2}, mt)
local b = setmetatable({x = 3, y = 4}, mt)
local c = a + b
print(c.x, c.y)          --> 4 6
```

常用的还有 `__sub`（减法）、`__eq`（等于）、`__tostring`（`print` 时的字符串形式）、`__call`（让 table 能被调用）等。元表是 Lua 元编程的主要出口，理解了它，才算真正理解了 Lua。

## 模块与 require

Lua 的模块就是一个返回 table 的文件。约定：文件里用 `local` 变量做内部私有状态，最后返回暴露接口的 table：

```lua
-- math_utils.lua
local M = {}

function M.square(x)
  return x * x
end

function M.cube(x)
  return x * x * x
end

return M
```

使用时 `require`：

```lua
local mu = require("math_utils")
print(mu.square(5))      --> 25
```

和 JS 的 `import` 不同，`require` 不是语法而是运行时函数。它会按 `package.path` 里的模板找文件（当前目录默认在搜索路径里），并且对同一个模块只加载一次——重复 `require` 会直接返回缓存的结果。

## 错误处理

Lua 没有 JS 那样的 try-catch，用 `pcall`（protected call）包住可能出错的调用——错误处理不是语法结构，而是一个函数：

```lua
local function risky()
  error("something went wrong")
end

local ok, err = pcall(risky)
if not ok then
  print("捕获到错误:", err)
end
```

调用成功时 `pcall` 返回 `true` 加函数的所有返回值；出错时返回 `false` 加错误消息。配合 `assert` 可以少写很多判断：

```lua
local n = assert(tonumber("42"), "不是一个数字")
print(n)                 --> 42
```

## 标准库一瞥

Lua 的标准库很小，几个常用的：

- **string**：`string.format`、`string.sub`、`string.match`（自带一套模式匹配，类似简化版正则）。
- **table**：`table.insert`、`table.remove`、`table.sort`、`table.concat`。
- **math**：`math.floor`、`math.abs`、`math.random` 等常规数学函数。
- **io / os**：文件读写与系统调用。
- **coroutine**：协程，Lua 的原生并发方案。
- **utf8**：UTF-8 字符串处理。

## 实战：Dijkstra 最短路

学完语法，写一个完整的程序来收尾。这里选图论经典算法 Dijkstra 最短路——它要处理的数据结构（图）天然就是 table 嵌套，正好检验刚学的知识。

### 要解决的问题

图长这样：六个点，边上的数字是走这条边的代价（权重）：

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-dijkstra-graph.png)

问题是：**从 A 出发，到每个点的最短距离是多少？** 比如 A 到 F，直观看可以走 A → B → D → F（4+5+6=15），也可以走 A → C → B → D → E → F（2+1+5+2+3=13），后者更短。人眼能凑出来，程序怎么算？

### 算法思路

Dijkstra 的想法很朴素，一步步来：

1. 起点 A 到自己的距离是 0；其他点到 A 的距离先记作“无穷大”（`math.huge`），因为还没找到路。
2. 从“还没固定”的点里挑出距离最小的那个，把它**固定**——它的最短距离到此确定，不可能有更短的路线了（想绕别的路过来，只会更长）。
3. 看这个点能直达的邻居：如果“先到当前点、再走到邻居”比邻居现在记录的距离短，就更新邻居的距离。这一步叫**松弛**。
4. 重复 2、3，直到所有点都被固定。

拿上面的图走一遍，完整过程如下（绿色边是每轮正在检查的边，右侧 dist 表里绿色的行是被更新过的值）：

![](https://stack-mcell.tos-cn-shanghai.volces.com/lua-programming-dijkstra-animation.gif)

动图里最值得注意的一刻在第二轮：B 从 4 变成 3——“绕路比直连更近”是反直觉的，这正是松弛的价值。

### 把图装进 table

图怎么表示？每个点列出它的邻居和对应权重，这就是**邻接表**。Lua 里的天然写法是 table 套 table：外层 table 的键是节点名，值是内层 table（键是邻居，值是权重）。无向图的每条边要写两个方向，`A = {B = 4, C = 2}` 表示 A 到 B 权重 4、A 到 C 权重 2：

```lua
local graph = {
  A = {B = 4, C = 2},
  B = {A = 4, C = 1, D = 5},
  C = {A = 2, B = 1, D = 8, E = 10},
  D = {B = 5, C = 8, E = 2, F = 6},
  E = {C = 10, D = 2, F = 3},
  F = {D = 6, E = 3},
}
```

### 核心循环

主循环对应上面思路的第 2、3 步。需要三张辅助表：`dist` 记距离；`visited` 标记已固定的点（值是 true）；`prev` 记“到某个点是从哪里走来的”，后面还原路径用：

```lua
local function dijkstra(graph, start)
  local dist = {}
  local prev = {}
  local visited = {}

  for node in pairs(graph) do
    dist[node] = math.huge   -- 初始无穷大
  end
  dist[start] = 0            -- 起点到自己是 0

  while true do
    -- 选“未固定”里 dist 最小的点
    local current = nil
    local best = math.huge
    for node, d in pairs(dist) do
      if not visited[node] and d < best then
        best = d
        current = node
      end
    end
    if current == nil then
      break                   -- 没有未固定的点了
    end
    visited[current] = true   -- 固定它

    -- 松弛：经过 current 到邻居会不会更近
    for neighbor, weight in pairs(graph[current]) do
      local new_dist = dist[current] + weight
      if new_dist < dist[neighbor] then
        dist[neighbor] = new_dist
        prev[neighbor] = current
      end
    end
  end

  return dist, prev
end
```

注意 `if not visited[node]`：没标记过的点，`visited[node]` 是 nil，nil 为假——不需要任何“集合”结构，一张 table 配合真假值就够了。

### 还原路径

`dist` 给出距离，路径靠 `prev` 还原：`prev[F] = E` 表示“到 F 的前一站是 E”。从终点一路往回查，查到起点为止，再把顺序倒过来：

```lua
local function build_path(prev, target)
  local path = {target}
  local node = target
  while prev[node] do
    node = prev[node]
    table.insert(path, 1, node)   -- 插到最前面，顺序就正过来了
  end
  return path
end
```

### 运行

```lua
local dist, prev = dijkstra(graph, "A")

for node, d in pairs(dist) do
  local path = table.concat(build_path(prev, node), " → ")
  print(string.format("%s: %d (%s)", node, d, path))
end
```

把上面四段代码拼起来存成 `dijkstra.lua`，运行：

```bash
lua dijkstra.lua
```

```text
A: 0 (A)
B: 3 (A → C → B)
C: 2 (A → C)
D: 8 (A → C → B → D)
E: 10 (A → C → B → D → E)
F: 13 (A → C → B → D → E → F)
```

（`pairs` 遍历顺序不定，行的先后可能不同。）

对照图看，A 到 F 最短是 13，正是图中绿色标出的 A → C → B → D → E → F。程序里一路用到的都是前面讲过的东西：table 嵌套、`pairs`、真假值、多重返回值，还有 `table.insert`、`table.concat`、`string.format`。同样的程序用 JS 写，图结构得靠 `Map` 或者对象套对象，`visited` 还得另起一个 `Set`；Lua 一张 table 全包了。

最后说明一点：这个实现每轮线性扫描选最小点，复杂度 O(V²)，小图完全够用；大图要二叉堆优化，Lua 没有内置堆，已超出本文范围。

## 下一步

语法就这些——一门只有 21 个关键字的语言，入门到这里就完成了大半。真正值得花时间的反而是用起来之后的事：在 Neovim 里写配置、给游戏写插件，或者读别人写的 Lua 代码。

进一步学习的资料，官方的一手资源就够用：

- [Lua 5.5 参考手册](https://www.lua.org/manual/5.5/)：语法细节以它为准。
- [《Programming in Lua》](https://www.lua.org/pil/)：官方教程，网络版免费，元表和面向对象那几章值得精读。

（完）
