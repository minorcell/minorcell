---
type: article
title: '论 SVG 的潜力'
description: '从博客配图的演变说起：手画、AI 生图、再到 AI 生成 SVG。位图生成贵在图像 token，SVG 赢在只是文本；便宜只是开始，可编辑、可缩放、可动画、可适配暗色模式，SVG 的潜力在 AI 时代才刚刚被释放。'
date: 2026-08-14
updated: 2026-08-14
tags: [SVG, AI, 图像生成, 博客, 效率]
keywords: [SVG, 矢量图, AI 生图, 博客配图, 图像生成, Nano Banana, 文生图]
order: 62
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/the-potential-of-svg-cover.png)

最近我的博客配图方式又换了：从 AI 生图，换成了 AI 生成 SVG。

原因很朴素：**生一张图太贵了，而 SVG 是代码、是文字，很便宜。**

用着用着发现，便宜只是它最不起眼的一个好处。

## 我的配图简史

早前我的博客配图只有两个来源：网上找的，或者自己拿 pad 手画。都不太行。网上找的图风格不统一，还总有版权那点说不清的事；自己画的……大家见过小学生板报吗，差不多就那个水平。

后来 AI 生图能力起来了。2025 年 11 月，Google 发布 Gemini 3，随之一起来的还有代号 **Nano Banana Pro** 的图像模型（官方名 Gemini 3 Pro Image）。我在 X 上看到一位大佬分享的文生图提示词，试了效果不错，之后很长一段时间都在用它，还专门写过一篇[《分享一个常用的文生图提示词》](/articles/2026/share-an-image-gen-prompt)。提示词的核心是“手绘风信息图”：卡通元素、关键词高亮、大留白。Nano Banana Pro 最让我喜欢的一点，是它能在图里渲染出清晰可读的文字——中文也没问题。

但用久了，问题开始冒出来。**AI 生图是“一次性”的。** 抽卡抽出一张满意的，它就定型了——想改一个字、挪一个元素，只能重新生成，重抽还不保证其他地方不变。而且图是个黑盒：占体积、吃带宽、改不了、放大就糊。

最后是钱。用得多才发现，图像生成是真的贵。

## 位图为什么贵

按 2026 年 8 月的官方定价，生成一张 1024×1024 的图：Google 的 Nano Banana 系列折算下来大约 0.03～0.13 美元，OpenAI 的 gpt-image-2 最高档 0.21 美元。单看一张好像还行，但配图这件事从来不是一张能解决的——抽卡、调提示词、重抽，一篇文章折腾十几张很常见，几美元就没了。

为什么贵？因为图像生成和文本生成根本不是一回事。图是从噪声里一点点画出来的（所以叫扩散模型），计费也单独算。**图像按“图像 token”计费**——每张图固定折算上千个图像 token（Nano Banana Pro 一张 1024×1024 的图折算 1,120 个），而图像 token 的单价是文本 token 的十倍到三百倍。

反过来，如果让文本模型输出同样内容的 SVG 代码，几百到一千多个文本 token 就写完了。用 Gemini 2.5 Flash-Lite 这种便宜模型来写，成本大约 0.0004 美元。

**同样一张图：位图几美分，SVG 零点零零零几美元。一到两个数量级的差距。**

浓缩成一张对比图：

![](https://stack-mcell.tos-cn-shanghai.volces.com/the-potential-of-svg-example-2.svg)

## SVG：图形世界的“纯文本文件”

SVG 是个老标准了：1998 年 W3C 成立工作组，2001 年 9 月 SVG 1.0 正式成为推荐标准——**到今年恰满 25 年**。它用 XML 描述图形：圆形是 `<circle>`，矩形是 `<rect>`，文字是 `<text>`。二十五年过去，所有现代浏览器都原生支持它。

而对 AI 来说，SVG 最妙的一点在于：**它就是个文本文件。**

这个逻辑我 5 月写[《HTML：AI 时代的通用表达层》](/articles/2026/html-the-universal-expression-layer-in-ai-era)时就聊过一半：AI 最擅长生成文本，文本格式又天然适合精确修改。上一节算的成本差，只是“是文本”的第一个结果——**因为是文本，所以便宜**。SVG 是同一个故事的图形版。

感受一下，一张信息图“本来”长这样：

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <rect width="100%" height="100%" fill="#f5f5f7"/>
  <rect x="40" y="40" width="720" height="370" rx="16" fill="#ffffff" stroke="#a8a8b0" stroke-width="2"/>
  <text x="80" y="118" font-size="30" font-weight="700" font-family="PingFang SC, Hiragino Sans GB, sans-serif" fill="#1d1d1f">论 SVG 的潜力</text>
  <text x="80" y="156" font-size="16" font-family="PingFang SC, Hiragino Sans GB, sans-serif" fill="#6e6e73">一张图，就是一段代码</text>
  <circle cx="640" cy="260" r="90" fill="none" stroke="#3f6f24" stroke-width="3" stroke-dasharray="8 6"/>
  <text x="640" y="268" font-size="20" font-family="PingFang SC, Hiragino Sans GB, sans-serif" fill="#31571d" text-anchor="middle">&lt;svg&gt;</text>
</svg>
```

这段代码保存成文件、扔给浏览器，渲染出来就是下面这张图——没有任何中间环节：

![](https://stack-mcell.tos-cn-shanghai.volces.com/the-potential-of-svg-example-1.svg)

这就是 AI 最近给我生成的东西。每一张“图”都长这样：有结构、有坐标、有文字。**它同时是一张图，也是一段可以 diff、可以 review、可以 git 管理的代码。**

## 便宜只是开始

便宜只是入场券。SVG 真正有意思的地方，是它把图片从黑盒变成了源代码。

**改起来便宜。** 位图想改细节只能重抽——你说“把标题往左移一点”，它可能把整张图都变了。SVG 改细节就是改一行代码，AI 改代码比 AI 生图精确得多，人也改得动。实话说，我现在连 SVG 也还是让 AI 写😂——但重点是，它写的是一段我随时可以打开、改两行、再保存的代码。

**缩放不糊，文件还小。** 矢量没有分辨率的概念，2 倍屏、4 倍屏、投影仪都不糊——位图想要更大，只能花更多钱生成更大的图；一段 SVG 通常几 KB，一张 2K 位图动不动几 MB。

**图可以是活的。** SVG 里能写 CSS、挂 JS：悬停高亮、点击展开、循环动画；用 `currentColor` 写的内联 SVG，暗色模式自动跟着切换。位图做不到这些——PNG 在深色页面上要么刺眼，要么蒙灰。

## 不止我在这么做

写到这里，你可能会觉得这是个人偏好。其实不是，文档界已经把同一条路走通了。

**用 HTML 做汇报，2026 年以来在开发者社区成了气候。** 把自然语言或旧 PPT 转成单文件 HTML 演示的 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) 半年拿了 2.7 万 star；单文件演示工具 Bento 登上 Hacker News 头条（千赞），高赞评论说得直白：“团队正从成品演示软件转向手写 HTML/JS 方案”；HTML 幻灯片框架 Slidev 一年涨了约一万 star，到 4.8 万。

动力和图形界这边一模一样。手作 PPT 很麻烦——就像手写 SVG 很费劲；让 AI 生成 PPT 也不省心——就像位图生成即定型。36氪实测 AI PPT 工具，结论是“生成的是‘图’不是可编辑对象，一个错别字都没法手动改”；连 WPS 自家的 AI 都转向了 HTML 布局渲染来改善编辑体验（太平洋科技报道）。**PPT 是专有格式，为软件设计，不是为 AI 设计的。** HTML 是文本，AI 生成便宜，改起来精确，还能进版本库。

文档界从 PPT 走到了 HTML。那么图呢？其实图形界早有答案：GitHub 原生支持 Markdown 嵌入 SVG，2022 年起还能直接渲染 Mermaid 代码块；Prometheus 的架构图是 draw.io 画完导出 SVG 提交进仓库的，Kubernetes 官网的组件图也是 SVG；D3、ECharts 这类图表库默认就用 SVG 渲染。**信息图用 SVG 从来不是新发明，它一直是图形界的默认答案。** 它缺的只是一件东西：便宜的生产方式。现在 AI 把它补上了。

## SVG 的边界

当然，SVG 不是万能的。照片、写实插画、复杂纹理，这些还得靠位图模型，该花钱还是得花。

SVG 擅长的是**结构化图形**：信息图、架构图、流程图、封面、图表。好消息是，博客和技术内容需要的配图，绝大多数恰好属于这一类。也就是说，对写博客这件事来说，SVG 几乎覆盖了我全部的配图需求。

## 潜力

回到标题的问题：一个 25 岁的老标准，为什么我说它潜力巨大？

因为一个格式有没有潜力，从来不取决于它自己，取决于**生产它的成本**。SVG 过去二十多年一直是“人类手写费劲、工具又没动力支持”的鸡肋格式：画一张架构图要手写几百行坐标，谁受得了。现在 AI 来写，人只需要一句话。比如我让 AI“画一张 RAG 架构图，绿色接线点，浅色背景”，几秒钟后拿到的就是这样一张图——它同时是一段可以继续改的源码：

![](https://stack-mcell.tos-cn-shanghai.volces.com/the-potential-of-svg-example-3.svg)

位图生成越用越贵，生成即定型；SVG 生成越用越便宜，生成还能再改。当图形的成本和文本的成本不再有本质区别，图形的修改、版本管理、二次创作，就会全部并进文本的工作流——git diff 一张图，会是稀松平常的事。

这不是预测，它已经发生在我的博客里了。
