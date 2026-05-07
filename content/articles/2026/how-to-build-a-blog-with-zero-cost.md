---
type: article
title: '如何零成本搭建个人站点'
description: '写作平台写久了就想有个自己的站。一路从纯 HTML、到全栈自建，再到 VitePress、Next.js 静态站，最终用 GitHub Pages 把评论、搜索、MCP 都做成无服务器方案：0 成本也能做个不单调的个人博客。'
date: 2026-02-13
order: 43
---

![](https://stack-mcell.tos-cn-shanghai.volces.com/202617.png)

> 站点地址：[mcell.top](mcell.top)，包含完整的：写作、评论、部署、MCP支持...

我经常写作，最开始是在一些平台上，比如稀土掘金。后面慢慢写多了，就想有个自己的博客平台。

最初搭建的博客很简单：一个纯静态的 **HTML 文件**，内容也不复杂，写点自我介绍，当作个人站点。直接托管到 **GitHub Pages**，域名用的也是它默认那串。

但很快就发现：功能太少了。
比如发布文章？评论？甚至想加点扩展能力都很难——纯 HTML 又没框架，后面越改越痛苦。

接着就走上了“大家都走过的弯路”：
买了轻量服务器，又买了域名……然后写服务端、接数据库、写前端，把整套都搭起来。

直到后面参与了一个开源项目才意识到：
这种内容站点/文档站点，压根没必要搞这么重。成熟框架太多了，比如 **VitePress** 这种（比如Vue官网就是VitePress），基本开箱即用。

然后我就重构了一次：直接上 VitePress。部署？还是 GitHub Pages。那时候至少配上了自定义域名，看起来舒服多了：[mcell.top](mcell.top)

![](https://stack-mcell.tos-cn-shanghai.volces.com/202618.png)

又过了一段时间，我开始觉得个人站点还是有点单调。VitePress 能改，但做深度定制的时候会有点别扭（有些地方甚至会翻车）。
索性就 vibe coding 一把：把原先 VitePress 那套，重构到了 **Next.js**。

路线也很清晰：

- Next.js
- **SSG / 静态导出**（要部署到 GitHub Pages，关键是要把站点导出成纯静态）
- GitHub Actions 自动构建
- 部署到 GitHub Pages
- 配上自定义域名

后面我又陆续补了评论和文档搜索功能。用到服务器了吗？没有。

- 评论用的是 **giscus**：本质是把评论托管在 **GitHub Discussions** 里，前端加载组件就行，也不用数据库。
  ![](https://stack-mcell.tos-cn-shanghai.volces.com/202619.png)

- 搜索用的是 **pagefind**：还是静态站那套玩法，构建阶段生成索引，运行时纯前端查询。
  ![](https://stack-mcell.tos-cn-shanghai.volces.com/202621.png)

再后面，我还给博客加了 MCP 功能。同样，还是没有服务器：
SSG 阶段生成一份 JSON docs，只要把路径映射到 MCP server 就行；然后我做了个本地的 MCP server，用户安装大概这样：

```bash
memo mcp add stack-mcepp npx -y @mcell/stack-mcell
```

![](https://stack-mcell.tos-cn-shanghai.volces.com/202620.png)

> [memo code](https://github.com/minorcell/memo-code/) 是我最近自己写的一个轻量级编程Agent，类似Claude code那种，感兴趣可以参与进来。

本质上就是：agent 请求本地 MCP server，MCP server 再去拉取我提前生成好的 JSON 内容。

文档站上 MCP 的整体方案的记录我放在这里：
[https://mcell.top/blog/2026/mcp-from-idea-to-delivery-for-content-site](https://mcell.top/blog/2026/mcp-from-idea-to-delivery-for-content-site)

这一套折腾下来，依然是 0 成本。分享给大家，或许是个不错的“0 成本建站思路”。

## 提示词

如果你对这套方案比较感兴趣，想要多了解了解，你可以clone我的博客仓库：[Minor Cell](https://github.com/minorcell/minorcell)，或者是直接把这段提示词发给AI，他会给你方案：

```markdown
我想搭建一个个人博客，大致如下：

- 框架：nextjs ssg
- 部署：Github Action 自动化部署 + Github Page（自定义域名）
- 图片存储：对象存储（七牛云或者火山引擎）
- 搜索服务：pagefind
- 文章评论服务：giscus
- 开发方式：Vibe coding
- mcp 集成：参考 https://mcell.top/blog/2026/mcp-from-idea-to-delivery-for-content-site

请你给我一个具体可落地的方案（分阶段）
```

（完）
