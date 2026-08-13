---
name: write-article
description: >
  minorcell 博客仓库写文章/改文章的工作流约定：文章结构与排版规范、配图制作（手绘 SVG、封面图、官网截图）、
  图片上传 TOS 图床、事实验证与渲染验证清单。当用户要求"写一篇博客/文章"、修改 content/articles/ 下的文章、
  给文章配图/做封面图时使用。通用写作原则用 writing-blog skill，本 skill 只覆盖仓库特定约定。
---

# minorcell 博客文章写作

通用写作原则（读者、结构、文风）用 `writing-blog` skill；本文件只写这个仓库特有的约定。

## 1. 文章结构与排版

- **位置与命名**：`content/articles/2026/<slug>.md`，描述性 kebab-case slug（如 `deepseek-harness-everything-is-a-plugin`），不要编号前缀。
- **frontmatter** 必填字段：`type: article`、`title`、`date`、`updated`、`description`（一两句，含关键词）、`tags`、`keywords`（数组格式）、`order`（排序号，写前先 `grep -h "^order:" content/articles/2026/*.md | sort -t: -k2 -n | tail -3` 取最大值 +1）。
- **封面图**：文章开头第一行放 TOS 图床 PNG：`![](https://stack-mcell.tos-cn-shanghai.volces.com/<key>.png)`。制作法见第 3 节。
- **中文排版**：全文用中文弯引号（`“”`），**不允许直引号**，含 frontmatter 的 title/description。引用英文原文也用弯引号。写完用脚本检查配对。
- **站内链接**：`/articles/2026/<slug>`（含年份目录）。引用自己旧文时优先内链。
- **文风**：第一人称、口语化、观点鲜明（粗体强调）、短段落、小标题分层；文中有示意代码时明确标注"示意代码，以官方文档为准"。

## 2. 配图规则

- **图床统一**：所有图片（封面、插图、截图）上传 TOS 桶 `stack-mcell`，引用裸 URL `https://stack-mcell.tos-cn-shanghai.volces.com/<key>`。上传流程用 `upload-image-to-tos` skill（tosutil + 环境变量凭证，上传后 curl 校验 Content-Type）。
- **不用 Mermaid**：图表一律手绘 SVG（Mermaid 默认样式与站点不搭）。**SVG 只是设计源文件，文章里引用的是渲染后的 PNG**——把 SVG 原文粘到掘金等平台时矢量文字会因字体缺失渲染错乱，栅格化后任何平台一致。
  - SVG 设计规范：
    - 站点配色：亮色 底 `#f5f5f7` / 字 `#1d1d1f` / 次要字 `#6e6e73` / 盒底 `#e9e9ed` / 描边 `#a8a8b0` / 绿 `#3f6f24` / 绿底 `#e9f1e5` / 深绿字 `#31571d`。
    - 风格元素：圆角矩形（rx 9-16）、虚线（`stroke-dasharray`）、绿色接线点、手绘波浪线；关键对象用绿色描边突出。
    - 字体：`"PingFang SC", "Hiragino Sans GB", sans-serif`；字号 12-15px 为主。
    - SVG 根部放 `<rect width="100%" height="100%" fill="#f5f5f7"/>` 背景（转 PNG 后与站点底色融合；PNG 无法响应暗色主题，固定亮色即可，与封面图一致）。
    - 完成后用 Playwright 打开 `file://` 做几何验证：所有 `<text>` 的 bbox 不得越界（viewBox 外）、两两不得重叠。
  - 渲染与上传：Playwright 打开 SVG，`device_scale_factor=2` 按 viewBox 尺寸截图输出 PNG → 上传 TOS（key 用 `.png`）→ 文章引用 PNG 地址 → 删除本地 SVG/PNG。SVG 源文件不上传图床（例外：确有矢量需求的场景再单独决定）。
- **官网截图**：用 Python Playwright（系统已装），`new_context(locale='zh-CN', device_scale_factor=2)` 访问官网取中文版；用 `section:has(h2:text-is("..."))` 定位区块截图。**注意**：带加载动画的页面区块截图可能全黑——截完用 PIL 检查非白像素比例，异常就换区块或放弃。
- **封面图**：SVG 设计（1536×1024，3:2）→ Chrome headless 渲染 PNG：`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --screenshot=<out.png> --window-size=1536,1024 --default-background-color=FFFFFFFF file://<svg>` → 上传 TOS → 替换文章占位。PNG 与 SVG 本地文件上传后删除。

## 3. 事实验证

- 文中所有外部事实（新闻数据、文档原文、GitHub 链接、第三方 API 用法）用**多个 subagent 并行验证**，每个 agent 负责一个维度（新闻交叉验证 / 官方文档逐条核对 / 链接与仓库存在性 / API 用法），要求逐条输出"声明 → 属实/不实 → 证据 → 修正表述"。
- 预览期/内测产品的 API（事件名、配置项）来源不明确时：示意代码必须标注，且文中注明"以官方文档为准"。
- 时效性数据（价格、版本号）加时间限定（如"上线初期（8 月 17 日调价前）"）。
- 引用的官方表述（tagline、README 原文）区分出处：仓库 tagline 不是 README 副标题。

## 4. 渲染验证清单

- **dev server**：Next.js 16 同一项目目录只允许一个 dev 实例；端口 3000 被占时新实例会启动后立刻退出，先停旧实例。验证用 `preview_start`（launch.json 里 `minorcell-dev`，端口 3456）。
- **streamdown 渲染特性与坑**：
  - 列表项以 `**粗体**` 开头不会被解析（显示字面星号）——粗体不要放在列表项行首。
  - markdown 内联 `<svg>` 不可靠（属性引号易被破坏、React 渲染 SVG 属性名会刷 console 警告）——SVG 一律独立文件 + `![](url)` 引用。
  - `hasMermaidFence` 检测到 ```mermaid 才会加载 mermaid 运行时；既然不用 Mermaid，文章里不要出现 mermaid fence。
  - h1 会被自动降级为 h2（页面级标题已占 h1）。
- **验证步骤**：`gray-matter` 解析 frontmatter → 页面 img 全部 `naturalWidth > 0`（ZoomImage 懒加载在 dev 预览可能不触发，eval 时强制 `loading='eager'` 重设 src 再验证）→ console 无错误 → 外链全部 200 → 中文引号配对检查。
- **完成提醒**：文章无需 push 即可在 dev 预览（图片都在 TOS）；提醒用户 git 提交与发布时机。

## 持续迭代

这个 skill 是活的，不是一次性文档：每次协作中发现新约定、踩到新坑（渲染问题、平台兼容、流程改进、用户偏好变化），都直接更新到本文件——修正过时内容、补充新经验，让它持续吸收这个仓库的实践。
