---
type: article
date: 2025-09-17
title: ECharts 万字入门指南
description: 详细学习 Apache ECharts 图表库，掌握丰富的图表类型、强大的交互功能和灵活的配置项，实现数据可视化。
author: mcell
tags:
  - ECharts
  - 数据可视化
  - JavaScript
  - 图表库
  - 前端开发
  - Web开发
  - 数据分析
keywords:
  - ECharts 教程
  - 数据可视化
  - JavaScript 图表
  - ECharts 配置项
  - 前端图表库
  - 数据分析可视化
  - 网页图表制作
  - ECharts 实例
---

![083.webp](https://stack-mcell.tos-cn-shanghai.volces.com/083.webp)

> 本文将作为你的 ECharts 入门指南，带你系统性地梳理 ECharts 的核心知识体系，并通过一个贴近实际业务的“高三期末考试成绩分析”案例，手把手教你如何将数据转化为富有洞察力的图表。

前端，本质上就是把数据可视化的技术。如何将枯燥的数据，以一种更直观、更易于理解的方式呈现给用户，始终是一个重要的课题。

图表，无疑是这个问题的最佳答案之一。

小到健康 App 中记录一周睡眠变化的柱状图，大到金融应用的实时股票仪表板，图表作为一种强大的视觉语言，其传递信息的效率远超纯粹的文字或表格。它能帮助我们快速发现数据中的模式、趋势和异常点。

在众多选择中，[Apache ECharts](https://echarts.apache.org/zh/index.html) 无疑是当下最闪耀的产品之一。凭借其丰富的图表类型、强大的交互功能、灵活的配置项以及活跃的社区，成为了全球前端开发者的首选。

然而，和 [GSAP 动画库](https://mcell.top/blog/2025/20_gsap01) 一样，很多人对 ECharts 的第一印象是“配置项繁多”、“学习曲线陡峭”。但事实果真如此吗？

当我们静下心来，深入探索 ECharts 的世界，会发现其核心概念并不复杂。万变不离其宗，所有的图表配置，都围绕着一些固定的核心模块展开：**容器与大小、样式、数据集、坐标轴、视觉映射、图例**等等。

ECharts 官网提供了海量的[示例](https://echarts.apache.org/examples/zh/index.html)，几乎涵盖了你能想到的所有图表效果。甚至，它的[配置项文档](https://echarts.apache.org/zh/option.html)本身就是可交互的——你可以一边修改配置，一边实时预览效果。这极大地降低了学习门槛。

![043.png](https://stack-mcell.tos-cn-shanghai.volces.com/043.png)

## ECharts 初体验：绘制你的第一个图表

学习任何一门技术的最好方式，就是从一个“Hello World”开始。

### 引入方式

我们将使用最简单的方式：通过 CDN 引入。你只需要在 HTML 文件中加入一个 `<script>` 标签即可。这种方式无需构建工具，非常适合快速原型开发和学习。

```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
```

### 完整示例

将下面的代码完整复制到一个 HTML 文件中，然后用浏览器打开它，你就能看到你的第一个 ECharts 图表了。

::: details 完整示例

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ECharts 入门示例</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
  </head>
  <body>
    <div id="main" style={{ width: '600px', height: '400px' }}></div>

    <script type="text/javascript">
      // 3. 基于准备好的dom，初始化echarts实例
      var myChart = echarts.init(document.getElementById("main"))

      // 4. 指定图表的配置项和数据
      var option = {
        // 标题
        title: {
          text: "我的第一个 ECharts 图表",
        },
        // 提示框
        tooltip: {},
        // X 轴
        xAxis: {
          data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
        },
        // Y 轴
        yAxis: {},
        // 系列（系列决定了图表类型和数据）
        series: [
          {
            name: "销量",
            type: "bar", // 'bar' 表示这是一个柱状图
            data: [5, 20, 36, 10, 10, 20],
          },
        ],
      }

      // 5. 使用刚指定的配置项和数据显示图表。
      myChart.setOption(option)
    </script>
  </body>
</html>
```

:::
![044.png](https://stack-mcell.tos-cn-shanghai.volces.com/044.png)

这个简单的例子，已经揭示了 ECharts 的核心工作流程：**引入脚本 -\> 准备容器 -\> 初始化实例 -\> 设置配置项**。而所有 ECharts 图表的实现，都蕴含在那个巨大的 `option` 对象中。

## 核心概念解析：解构 `option` 对象

ECharts 的 `option` 对象是一个庞大而复杂的 JavaScript 对象，`option` 描述了图表的一切：数据、样式、交互、动画等等。理解了它的核心构成，就等于掌握了 ECharts 的精髓。

让我们像剥洋葱一样，一层一层地解析 `option` 的核心组件。

### `series`：系列与图表类型

`series` 是 ECharts 中最重要的配置项，没有之一。它是一个数组，数组中的每一个对象都代表一个“系列”。

**什么是“系列”？**

你可以把它理解为一组相关的数据，以及这组数据如何被可视化的规则。一个图表中可以包含多个系列，每个系列会按照自己的规则（即 `type`）绘制成图。

比如，在上面的例子中：

```javascript
series: [
  {
    name: '销量',
    type: 'bar', // 图表类型
    data: [5, 20, 36, 10, 10, 20], // 系列数据
  },
]
```

- `type: 'bar'` 告诉 ECharts，这个系列要绘制成柱状图。
- `data: [...]` 提供了这组柱状图的具体数值。

如果我想在同一个图表中，再增加一条折线图来表示“产量”，只需要在 `series` 数组中再增加一个对象即可。

```javascript
series: [
  {
    name: '销量',
    type: 'bar',
    data: [5, 20, 36, 10, 10, 20],
  },
  {
    name: '产量',
    type: 'line', // 图表类型为折线图
    data: [15, 25, 30, 18, 15, 30],
  },
]
```

ECharts 支持的[图表类型](https://www.google.com/search?q=https://echarts.apache.org/zh/option.html%23series)非常丰富，常见的有：

- `line`: 折线图
- `bar`: 柱状图
- `pie`: 饼图
- `scatter`: 散点图
- `radar`: 雷达图
- `map`: 地图
- `tree`: 树图
- `graph`: 关系图
- ...等等

![049.png](https://stack-mcell.tos-cn-shanghai.volces.com/049.png)

`series` 的强大之处在于，它不仅定义了图表的“形”，更承载了图表的“魂”——数据。

### `xAxis` & `yAxis`：坐标轴

对于绝大多数图表（如折线图、柱状图、散点图），坐标轴是必不可少的。ECharts 通过 `xAxis` (X 轴) 和 `yAxis` (Y 轴) 来进行配置。它们通常成对出现，共同定义了一个**直角坐标系 (Grid)**。

坐标轴主要由**轴线、刻度、刻度标签、轴名称**等部分组成。

一个常见的 `xAxis` 配置如下：

```javascript
xAxis: {
  type: 'category', // 坐标轴类型
  data: ['一月', '二月', '三月', '四月', '五月'], // 类目数据
  name: '月份', // 轴名称
  axisLine: { show: true }, // 显示轴线
  axisTick: { show: true }, // 显示刻度
  axisLabel: {
    color: '#333',
    fontSize: 12
  } // 刻度标签样式
}
```

![050.png](https://stack-mcell.tos-cn-shanghai.volces.com/050.png)

坐标轴的 `type` 是一个关键属性，它决定了坐标轴如何解析数据：

- `'value'`: **数值轴**。适用于连续数据，会自动根据 `series.data` 的最大最小值来生成刻度。
- `'category'`: **类目轴**。适用于离散的类目数据，类目数据需要通过 `xAxis.data` 来指定。
- `'time'`: **时间轴**。适用于连续的时序数据，能自动格式化时间标签。
- `'log'`: **对数轴**。适用于数据跨度非常大的情况。

`yAxis` 的配置与 `xAxis` 类似。在一个图表中，可以有多个 X 轴和 Y 轴，通过 `xAxisIndex` 和 `yAxisIndex` 来关联 `series`。

### `grid`：绘图网格

`grid` 组件定义了直角坐标系在图表容器中的位置和大小。当你想调整图表主体部分（不包括标题、图例等）的位置时，就需要配置它。

```javascript
grid: {
  left: '3%', // 网格区域离容器左侧的距离
  right: '4%',
  bottom: '3%',
  top: '10%',
  containLabel: true // 防止标签溢出
}
```

`containLabel: true` 是一个非常实用的配置，它会自动计算坐标轴标签的宽度，并调整 `grid` 的位置，以确保标签能够完整显示。

### `title`：标题

一个图表应该有一个明确的标题。`title` 组件用于配置主标题和副标题。

```javascript
title: {
  text: '网站月度访问量', // 主标题
  subtext: '数据来源：模拟数据', // 副标题
  left: 'center', // 标题水平居中
  textStyle: {
    color: '#c23531',
    fontSize: 20
  }
}
```

### `tooltip`：提示框

当鼠标悬浮到图表的数据项上时，`tooltip` 组件可以显示详细的数据信息，这是图表交互的重要一环。

```javascript
tooltip: {
  trigger: 'axis', // 触发类型
  axisPointer: { // 坐标轴指示器配置
    type: 'shadow' // 默认为直线，可选为：'line' | 'shadow' | 'cross'
  }
}
```

`trigger` 属性决定了提示框的触发方式：

- `'item'`: 数据项触发。鼠标悬浮到单个数据项（如柱状图的某个柱子、饼图的某个扇区）时触发。
- `'axis'`: 坐标轴触发。鼠标悬浮到坐标轴的某个刻度上时，会同时显示该刻度下所有系列的数据。常用于折线图和柱状图。
- `'none'`: 不触发。

你可以通过 `formatter` 函数来自定义提示框显示的内容，支持 HTML 字符串和回调函数，给予了极高的灵活度。

### `legend`：图例

当图表包含多个系列时，`legend` (图例) 组件用于区分不同的系列。

```javascript
legend: {
  data: ['销量', '产量'], // 图例项的名称，需要与 series 的 name 对应
  top: 'bottom' // 图例位置
}
```

`legend` 和 `series` 是通过 `name` 属性关联的。点击图例项，可以控制对应系列的显示和隐藏，这是 ECharts 内置的交互行为。

### `dataset`：数据集

从 ECharts 4 开始，引入了 `dataset` 组件，这是一个非常重要的概念，它实现了**数据与配置的分离**。

在之前的例子中，我们的数据是直接写在 `series.data` 里的。当数据量较大，或者多个系列需要共用同一份数据时，这种方式就显得很臃肿。

`dataset` 允许我们统一定义数据源，然后在 `series` 中通过 `encode` 来映射数据。

```javascript
var option = {
  dataset: {
    // 提供一份数据。
    source: [
      ['product', '2015', '2016', '2017'],
      ['Matcha Latte', 43.3, 85.8, 93.7],
      ['Milk Tea', 83.1, 73.4, 55.1],
      ['Cheese Cocoa', 86.4, 65.2, 82.5],
      ['Walnut Brownie', 72.4, 53.9, 39.1],
    ],
  },
  // 声明一个 X 轴，类目轴（category）。默认情况下，类目轴对应到 dataset 第一列。
  xAxis: { type: 'category' },
  // 声明一个 Y 轴，数值轴。
  yAxis: {},
  // 声明多个 series。
  series: [{ type: 'bar' }, { type: 'bar' }, { type: 'bar' }],
}
```

在这个例子中，`dataset.source` 定义了一个二维数组。ECharts 会默认将第一行/第一列作为维度（dimension）。`series` 中甚至不需要写 `data`，ECharts 会自动从 `dataset` 中取数据。第一列 `product` 映射到 `xAxis`，后续的 '2015', '2016', '2017' 三列数据，依次映射到三个 `series`。

使用 `dataset` 的好处是：

1.  **数据复用**：一份数据可以被多个系列、多个组件（如 `visualMap`）使用。
2.  **数据转换**：可以配合 `data-transform` 对数据进行筛选、聚合等预处理。
3.  **代码清晰**：将数据逻辑和样式配置分离开，更易于维护。

强烈推荐在开发中优先使用 `dataset` 来管理数据。

## 实战：高三年级期末考试多维分析

理论知识总是枯燥的，让我们通过一个综合案例，将前面学到的知识点串联起来。

**背景**：假设我们是某高中的数据分析师，拿到了一份高三年级本次期末考试的成绩单。我们需要通过数据可视化的方式，从多个维度对这次考试进行分析，为教学工作提供数据支持。

**数据维度**：班级、学生姓名、各科成绩（语文、数学、英语、物理、化学、生物）、总分。

### 场景一：各班级平均总分对比（柱状图）

**分析目标**：直观对比各个班级的平均总分，了解班级间的整体学习水平差异。

![045.png](https://stack-mcell.tos-cn-shanghai.volces.com/045.png)

::: details 完整代码

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>场景一：各班级平均总分对比</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
  </head>
  <body>
    <div id="bar-chart" style={{ width: '100%', height: '500px' }}></div>

    <script type="text/javascript">
      // --- 数据准备 ---
      function generateMockData() {
        const classes = [
          "高三(1)班",
          "高三(2)班",
          "高三(3)班",
          "高三(4)班",
          "高三(5)班",
          "高三(6)班",
        ]
        const subjects = ["语文", "数学", "英语", "物理", "化学", "生物"]
        const studentsPerClass = 50
        let data = []
        let studentId = 1

        classes.forEach((className) => {
          for (let i = 0; i < studentsPerClass; i++) {
            let student = { 班级: className, 姓名: `学生${studentId}` }
            let totalScore = 0
            subjects.forEach((subject) => {
              const score = Math.floor(Math.random() * 101) + 50
              student[subject] = score
              totalScore += score
            })
            student["总分"] = totalScore
            data.push(student)
            studentId++
          }
        })
        return data
      }

      const examData = generateMockData()

      function calculateClassAverage(data) {
        const classScores = {}
        data.forEach((student) => {
          const className = student["班级"]
          if (!classScores[className]) {
            classScores[className] = { total: 0, count: 0 }
          }
          classScores[className].total += student["总分"]
          classScores[className].count++
        })

        const averageData = Object.keys(classScores).map((className) => ({
          className: className,
          averageScore: (
            classScores[className].total / classScores[className].count
          ).toFixed(2),
        }))
        averageData.sort((a, b) => b.averageScore - a.averageScore)
        return averageData
      }

      const classAverageData = calculateClassAverage(examData)

      // --- ECharts 配置 ---
      var barChart = echarts.init(document.getElementById("bar-chart"))
      var barChartOption = {
        title: {
          text: "高三各班级期末考试平均总分对比",
          left: "center",
        },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          data: classAverageData.map((item) => item.className),
          axisLabel: { interval: 0, rotate: 30 },
        },
        yAxis: { type: "value", name: "平均分" },
        series: [
          {
            name: "平均总分",
            type: "bar",
            barWidth: "60%",
            data: classAverageData.map((item) => item.averageScore),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#83bff6" },
                { offset: 0.5, color: "#188df0" },
                { offset: 1, color: "#188df0" },
              ]),
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#2378f7" },
                  { offset: 0.7, color: "#2378f7" },
                  { offset: 1, color: "#83bff6" },
                ]),
              },
            },
            label: { show: true, position: "top" },
          },
        ],
      }
      barChart.setOption(barChartOption)
    </script>
  </body>
</html>
```

:::
通过这个柱状图，我们可以一目了然地看出哪个班级的平均成绩最高，哪个最低。

### 场景二：单科成绩分布情况（饼图 & 玫瑰图）

**分析目标**：以高三(1)班为例，分析数学单科成绩的分布情况（如：优秀、良好、及格、不及格）。

![046.png](https://stack-mcell.tos-cn-shanghai.volces.com/046.png)

::: details 完整代码

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>场景二：单科成绩分布</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
  </head>
  <body>
    <div id="pie-chart" style={{ width: '100%', height: '500px' }}></div>

    <script type="text/javascript">
      // --- 数据准备 (复用上面的 generateMockData) ---
      function generateMockData() {
        /* ... 同上 ... */
        const classes = [
          "高三(1)班",
          "高三(2)班",
          "高三(3)班",
          "高三(4)班",
          "高三(5)班",
          "高三(6)班",
        ]
        const subjects = ["语文", "数学", "英语", "物理", "化学", "生物"]
        const studentsPerClass = 50
        let data = []
        let studentId = 1
        classes.forEach((className) => {
          for (let i = 0; i < studentsPerClass; i++) {
            let student = { 班级: className, 姓名: `学生${studentId}` }
            let totalScore = 0
            subjects.forEach((subject) => {
              const score = Math.floor(Math.random() * 101) + 50
              student[subject] = score
              totalScore += score
            })
            student["总分"] = totalScore
            data.push(student)
            studentId++
          }
        })
        return data
      }
      const examData = generateMockData()

      function analyzeSubjectDistribution(data, className, subject) {
        const classData = data.filter(
          (student) => student["班级"] === className
        )
        const distribution = {
          "优秀 (120+)": 0,
          "良好 (100-119)": 0,
          "及格 (90-99)": 0,
          "不及格 (<90)": 0,
        }
        classData.forEach((student) => {
          const score = student[subject]
          if (score >= 120) distribution["优秀 (120+)"]++
          else if (score >= 100) distribution["良好 (100-119)"]++
          else if (score >= 90) distribution["及格 (90-99)"]++
          else distribution["不及格 (<90)"]++
        })
        return Object.keys(distribution).map((level) => ({
          name: level,
          value: distribution[level],
        }))
      }

      const mathDistributionData = analyzeSubjectDistribution(
        examData,
        "高三(1)班",
        "数学"
      )

      // --- ECharts 配置 ---
      var pieChart = echarts.init(document.getElementById("pie-chart"))
      var pieChartOption = {
        title: {
          text: "高三(1)班数学成绩分布",
          subtext: "期末考试",
          left: "center",
        },
        tooltip: { trigger: "item", formatter: "{a} <br/>{b} : {c}人 ({d}%)" },
        legend: {
          orient: "vertical",
          left: "left",
          data: mathDistributionData.map((item) => item.name),
        },
        series: [
          {
            name: "成绩分布",
            type: "pie",
            radius: "50%",
            center: ["50%", "60%"],
            data: mathDistributionData,
            // 可选：将 type: 'pie' 改为南丁格尔玫瑰图，视觉效果更强
            // roseType: 'area',
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      }
      pieChart.setOption(pieChartOption)
    </script>
  </body>
</html>
```

:::

饼图清晰地展示了各个分数段的人数占比。如果将 `series.roseType` 设置为 `'area'`，它会变成一个南丁格尔玫瑰图，扇区的半径会根据数据大小进行调整，视觉冲击力更强。

### 场景三：理科综合成绩关联性分析（散点图）

**分析目标**：探究学生的物理成绩和化学成绩之间是否存在关联性。比如，是不是物理好的学生，化学也普遍不错？

![047.png](https://stack-mcell.tos-cn-shanghai.volces.com/047.png)

::: details 完整代码

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>场景三：理科综合成绩关联性分析</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
  </head>
  <body>
    <div id="scatter-chart" style={{ width: '100%', height: '500px' }}></div>

    <script type="text/javascript">
      // --- 数据准备 (复用上面的 generateMockData) ---
      function generateMockData() {
        /* ... 同上 ... */
        const classes = [
          "高三(1)班",
          "高三(2)班",
          "高三(3)班",
          "高三(4)班",
          "高三(5)班",
          "高三(6)班",
        ]
        const subjects = ["语文", "数学", "英语", "物理", "化学", "生物"]
        const studentsPerClass = 50
        let data = []
        let studentId = 1
        classes.forEach((className) => {
          for (let i = 0; i < studentsPerClass; i++) {
            let student = { 班级: className, 姓名: `学生${studentId}` }
            let totalScore = 0
            subjects.forEach((subject) => {
              const score = Math.floor(Math.random() * 101) + 50
              student[subject] = score
              totalScore += score
            })
            student["总分"] = totalScore
            data.push(student)
            studentId++
          }
        })
        return data
      }
      const examData = generateMockData()

      function getSubjectCorrelationData(data, subjectX, subjectY) {
        // 返回格式: [物理成绩, 化学成绩, 学生姓名, 班级]
        return data.map((student) => [
          student[subjectX],
          student[subjectY],
          student["姓名"],
          student["班级"],
        ])
      }
      const correlationData = getSubjectCorrelationData(
        examData,
        "物理",
        "化学"
      )

      // --- ECharts 配置 ---
      var scatterChart = echarts.init(document.getElementById("scatter-chart"))
      var scatterChartOption = {
        title: { text: "高三年级物理-化学成绩关联性分析", left: "center" },
        grid: { left: "3%", right: "7%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "value",
          name: "物理成绩",
          splitLine: { lineStyle: { type: "dashed" } },
        },
        yAxis: {
          type: "value",
          name: "化学成绩",
          splitLine: { lineStyle: { type: "dashed" } },
        },
        tooltip: {
          trigger: "item",
          formatter: function (params) {
            // params.data 是一个数组 [物理成绩, 化学成绩, 姓名, 班级]
            return `${params.data[3]} - ${params.data[2]}<br/>物理: ${params.data[0]}<br/>化学: ${params.data[1]}`
          },
        },
        series: [
          {
            name: "学生",
            type: "scatter",
            symbolSize: 6,
            data: correlationData,
            itemStyle: { color: "rgba(25, 100, 150, 0.6)" },
          },
        ],
      }
      scatterChart.setOption(scatterChartOption)
    </script>
  </body>
</html>
```

:::
通过观察散点图的分布趋势，我们可以做出初步判断。如果点主要集中在从左下到右上的对角线区域，则说明物理和化学成绩呈正相关关系。我们还可以轻易地发现那些“偏科”的异常点（比如物理很高但化学很低的学生）。

### 场景四：尖子生各科能力模型（雷达图）

**分析目标**：选取总分排名前三的学生，用雷达图对比他们的各科能力，分析他们的学科优势与短板。

![048.png](https://stack-mcell.tos-cn-shanghai.volces.com/048.png)

::: details 完整代码

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>场景四：尖子生各科能力模型</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
  </head>
  <body>
    <div id="radar-chart" style={{ width: '100%', height: '500px' }}></div>
    <script type="text/javascript">
      // --- 数据准备 (复用上面的 generateMockData) ---
      function generateMockData() {
        /* ... 同上 ... */
        const classes = [
          "高三(1)班",
          "高三(2)班",
          "高三(3)班",
          "高三(4)班",
          "高三(5)班",
          "高三(6)班",
        ]
        const subjects = ["语文", "数学", "英语", "物理", "化学", "生物"]
        const studentsPerClass = 50
        let data = []
        let studentId = 1
        classes.forEach((className) => {
          for (let i = 0; i < studentsPerClass; i++) {
            let student = { 班级: className, 姓名: `学生${studentId}` }
            let totalScore = 0
            subjects.forEach((subject) => {
              const score = Math.floor(Math.random() * 101) + 50
              student[subject] = score
              totalScore += score
            })
            student["总分"] = totalScore
            data.push(student)
            studentId++
          }
        })
        return data
      }
      const examData = generateMockData()

      function getTopStudentsData(data, topN = 3) {
        const sortedData = [...data].sort((a, b) => b["总分"] - a["总分"])
        const topStudents = sortedData.slice(0, topN)
        const subjects = ["语文", "数学", "英语", "物理", "化学", "生物"]
        const indicator = subjects.map((s) => ({ name: s, max: 150 }))
        const seriesData = topStudents.map((student) => ({
          value: subjects.map((s) => student[s]),
          name: `${student["姓名"]} (${student["班级"]})`,
        }))
        return { indicator, seriesData }
      }
      const radarData = getTopStudentsData(examData, 3)

      // --- ECharts 配置 ---
      var radarChart = echarts.init(document.getElementById("radar-chart"))
      var radarChartOption = {
        title: { text: "年级顶尖学生学科能力雷达图", left: "center" },
        tooltip: { trigger: "item" },
        legend: {
          data: radarData.seriesData.map((item) => item.name),
          bottom: 5,
          textStyle: { fontSize: 14 },
        },
        radar: {
          indicator: radarData.indicator,
          center: ["50%", "50%"],
          radius: "65%",
        },
        series: [
          {
            name: "学科能力对比",
            type: "radar",
            data: radarData.seriesData,
            areaStyle: { opacity: 0.2 },
          },
        ],
      }
      radarChart.setOption(radarChartOption)
    </script>
  </body>
</html>
```

:::
雷达图能够非常直观地展示出每个学生的学科均衡性。面积越大的学生，综合实力越强；在某个坐标轴上特别突出的，说明该学科是其优势学科。

## 进阶话题与技巧

掌握了以上内容，你已经可以应对 80% 的常见图表需求了。但 ECharts 的世界远不止于此。

### 事件与行为

ECharts 实例支持监听鼠标事件。你可以通过 `myChart.on('click', ...)` 来捕捉用户的点击行为，实现图表下钻、联动等复杂交互。

```javascript
// myChart 变量来自前面的初始化实例
myChart.on('click', function (params) {
  // 打印点击的系列名称、数据、数据索引
  console.log(params.seriesName, params.name, params.dataIndex)
  // 在这里可以触发其他操作，比如弹出一个对话框显示详细信息
  alert('你点击了：' + params.name)
})
```

### 响应式布局

当浏览器窗口大小变化时，你可能希望图表也能自适应调整。只需要监听 `resize` 事件，并调用 ECharts 实例的 `resize` 方法即可。

```javascript
// myChart 变量来自前面的初始化实例
window.addEventListener('resize', function () {
  myChart.resize()
})
```

结合 `grid`、`legend` 等组件的百分比布局配置，可以轻松实现完美的响应式图表。

### 视觉映射 `visualMap`

`visualMap` 是一个非常强大的组件，用于将数据的大小映射到视觉元素上，如颜色、大小、透明度等。

例如，在上面的散点图中，我们可以用 `visualMap` 将学生的总分映射到散点的颜色上，从而在二维关系中引入第三个维度的信息。只需要修改散点图示例的 `option` 和数据处理函数即可实现。

### 动画配置

ECharts 内置了流畅的动画效果。你可以在 `option` 的根级别对动画进行全局配置，也可以在 `series` 级别进行单独配置，以控制动画的时长、缓动效果等。

```javascript
{
  // 全局动画配置
  animation: true,
  animationDuration: 1000, // 初始动画时长
  animationEasing: 'cubicOut', // 缓动效果
  // ...
  series: [{
    // 系列动画配置
    animationDelay: function (idx) {
      return idx * 10;
    }
  }]
}
```

## 总结

行文至此，我们从 ECharts 的安装、第一个“Hello World”案例开始，系统性地剖析了其核心配置项，如 `series`, `xAxis`, `yAxis`, `grid`, `tooltip`, `legend` 和 `dataset`。更重要的是，我们通过一个贯穿始终的“高三成绩分析”实战项目，将这些知识点融会贯通，应用到了具体的业务场景中，绘制了柱状图、饼图、散点图和雷达图。

希望你现在回过头再看 ECharts，不再觉得它是一堆望而生畏的配置项，而是把它看作一套强大而灵活的“可视化积木”。每一个配置项都是一块积木，只要我们理解了每块积木的作用，就能按照自己的蓝图，搭建出任何想要的图表大厦。

数据可视化的征途是星辰大海。本文只是一个起点，ECharts 还有更多高级的功能（如图形组件、自定义系列、GL 三维图表等）等待你去探索。

(完)
