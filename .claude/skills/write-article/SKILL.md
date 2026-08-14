---
name: write-article
description: >
  minorcell 博客仓库写文章/改文章的工作流约定：文章结构与排版规范、引用原文规范、配图制作（手绘 SVG、
  报道截图，配固化脚本）、图片上传 TOS 图床、事实验证与渲染验证清单。当用户要求"写一篇博客/文章"、
  修改 content/articles/ 下的文章、给文章配图/做封面图时使用。
---

# minorcell 博客文章写作

## 使用前提：必须搭配 writing-blog

**本仓库写任何文章，两个 skill 都要遵循**：

1. **`writing-blog`（通用写作原则）**：读者意识、结构、文风、证据组织等通用规范。写作前先加载它，按它的原则构思与行文。
2. **本 skill（write-article）**：只覆盖 minorcell 仓库特有的约定（frontmatter、排版、引用、配图、上传、验证流程）。

顺序：先遵循 writing-blog 完成写作构思与正文，再按本 skill 执行仓库流程（frontmatter → 配图 → 上传 TOS → 事实验证 → 渲染验证）。二者冲突时以本 skill 为准（仓库约定优先）。

## 1. 文章结构与排版

- **位置与命名**：`content/articles/2026/<slug>.md`，描述性 kebab-case slug（如 `deepseek-harness-everything-is-a-plugin`），不要编号前缀。
- **frontmatter** 必填字段：`type: article`、`title`、`date`、`updated`、`description`（一两句，含关键词）、`tags`、`keywords`（数组格式）、`order`（排序号，写前先 `grep -h "^order:" content/articles/2026/*.md | sort -t: -k2 -n | tail -3` 取最大值 +1）。
  - 列表排序规则（`src/lib/content-parser.ts` 的 `getAllArticles`）：`date` 降序为主键，**同 date 时 `order` 降序**，再同则 slug 字典序。新文章 date 用发布当天、order 取最大值 +1，即可保证排在同日文章最前。
- **封面图**：文章开头第一行放 TOS 图床 PNG：`![](https://stack-mcell.tos-cn-shanghai.volces.com/<key>.png)`。制作法见第 3 节。
- **中文排版**：全文用中文弯引号（`“”`），**不允许直引号**，含 frontmatter 的 title/description。引用英文原文也用弯引号。写完用脚本检查配对。
- **站内链接**：`/articles/2026/<slug>`（含年份目录）。引用自己旧文时优先内链。
- **文风**：第一人称、口语化、观点鲜明（粗体强调）、短段落、小标题分层；文中有示意代码时明确标注"示意代码，以官方文档为准"。

## 2. 引用规范

- **理论依据尽量引用原文**：文中外部事实（数据、观点、引语）必须附媒体/机构名 + 可点击的 markdown 外链，方便读者跳转溯源。链接文字用媒体名或报道标题。
- **引语逐字核对**：关键数字与引语要与原文逐字一致（在事实验证阶段输出"声明 → 原文 → 修正表述"）。引用英文原文时保留原文并附中文大意。
- **链接写入前逐条验证**：`curl -sIL -A <浏览器UA>` 批量验证返回 2xx 再写入；个别站点（如中青报 wap）对裸请求返回 403，加 `-e https://www.google.com/` Referer 重试，恢复 200 即为正常浏览器可访问。本环境网络策略不通的国外链接（如 business-standard.com）可保留——用户浏览器大概率可达，不必因环境限制砍链接。
- **引用截图注明来源**：文中插入报道/官网截图时，文字里点明来源（报道标题或媒体名），截图本身就是引用证据。

## 3. 配图规则

- **图床统一**：所有图片（封面、插图、截图）上传 TOS 桶 `stack-mcell`，引用裸 URL `https://stack-mcell.tos-cn-shanghai.volces.com/<key>`。上传流程用 `upload-image-to-tos` skill（tosutil + 环境变量凭证，上传后 curl 校验 Content-Type）。
- **固化脚本**（在 `.claude/skills/write-article/scripts/` 下，所有转换过程优先用脚本，不要每次手写）：
  - `svg2png.py`：SVG → PNG。自动做 text 越界/重叠几何验证、按 viewBox 渲染截图、尺寸与四角背景色检查。用法：`python3 svg2png.py in.svg [-o out.png] [--scale 1|2] [--bg r,g,b]`（默认 2x；封面图用 `--scale 1` 输出 1536×1024）。
  - `svg2gif.py`：多帧静态 SVG → GIF 动图。逐帧截图、逐帧独立量化（防调色板串色）、末帧加长、逐帧像素差验证动画有效。用法：`python3 svg2gif.py frames/ -o out.gif [--pattern "frame-*.svg"] [--duration 800,800,2000]`。**帧 SVG 的生成仍由内容决定**：用 Python 脚本参数化生成各帧（状态用 dict 描述：节点颜色、边高亮、表格值），本脚本只负责转换与验证。
  - `news-shot.py`：新闻/官网页面截图（去广告）。三种用法：
    1. `python3 news-shot.py URL out.png --probe`——探测正文容器候选（标准选择器 + 大文本块 + 标题位置），输出坐标供确定裁剪参数；
    2. `python3 news-shot.py URL out.png --clip x,y,w,h`——按正文区域裁剪截图，**去掉导航、广告、推荐位**；
    3. `python3 news-shot.py URL out.png`——整页视口截图。
    截图后自动检查非白像素比例（>3% 为有内容，防全黑/全白）。默认 `--wait 6`，页面加载慢可加大；`domcontentloaded` + 固定等待（不用 networkidle，持续请求的页面会卡住它）。
- **不用 Mermaid**：图表一律手绘 SVG（Mermaid 默认样式与站点不搭）。**SVG 只是设计源文件，文章里引用的是渲染后的 PNG**——把 SVG 原文粘到掘金等平台时矢量文字会因字体缺失渲染错乱，栅格化后任何平台一致。
  - SVG 设计规范：
    - 站点配色：亮色 底 `#f5f5f7` / 字 `#1d1d1f` / 次要字 `#6e6e73` / 盒底 `#e9e9ed` / 描边 `#a8a8b0` / 绿 `#3f6f24` / 绿底 `#e9f1e5` / 深绿字 `#31571d`。
    - 风格元素：圆角矩形（rx 9-16）、虚线（`stroke-dasharray`）、绿色接线点、手绘波浪线；关键对象用绿色描边突出。
    - 字体：`"PingFang SC", "Hiragino Sans GB", sans-serif`；字号 12-15px 为主。
    - SVG 根部放 `<rect width="100%" height="100%" fill="#f5f5f7"/>` 背景（转 PNG 后与站点底色融合；PNG 无法响应暗色主题，固定亮色即可，与封面图一致）。
  - 渲染与上传：`svg2png.py` 渲染 PNG → 上传 TOS（key 用 `.png`）→ 文章引用 PNG 地址 → 删除本地 SVG/PNG。SVG 源文件不上传图床（例外：确有矢量需求的场景再单独决定）。
- **GIF 动图**（算法演示/过程动画）：不做 SMIL/JS 动画，用「参数化脚本生成每帧 SVG → `svg2gif.py` 合成」流程。帧时长 1.5-3s（末帧定格久一些）。
  - **选型判断**（2026-08 与用户确认）：内容本质是「状态随时间变化」→ 用动图（算法迭代、状态机转换、协议握手、数据管道、DP 填表等）；信息是并置的（结构关系、概念对比、层级）→ 仍用静态图，动起来反而干扰阅读。
- **官网/报道截图**：用 `news-shot.py`。**先 --probe 定位正文容器，再 --clip 裁剪正文区域**，去掉导航条、广告位、推荐位、登录墙等无关因素；找不到正文容器时（如政务新闻页标题用 span），用关键词 text 节点定位（包含报道关键词的元素 bbox）。裁剪坐标是 CSS 像素，脚本内部 2x 输出。截图后脚本自带非白像素验证，异常就换区块或放弃。
- **封面图**：SVG 设计（1536×1024，3:2）→ `svg2png.py --scale 1` 渲染 PNG → 上传 TOS → 替换文章占位。PNG 与 SVG 本地文件上传后删除。
  - 封面 PNG 渲染后视觉验证：会话环境无法直接预览图片（Read/截图返回 Unsupported Image）时，用 PIL 程序化检查替代——尺寸正确、背景色 `(245,245,247)`、标题区有深色像素、卡片区白色占比、绿色元素（代码高亮/描边/箭头）像素计数 > 0。别跳过视觉验证。

## 4. 事实验证

- 文中所有外部事实（新闻数据、文档原文、GitHub 链接、第三方 API 用法）用**多个 subagent 并行验证**，每个 agent 负责一个维度（新闻交叉验证 / 官方文档逐条核对 / 链接与仓库存在性 / API 用法），要求逐条输出"声明 → 属实/不实 → 证据 → 修正表述"。
- 验证结果回到写作时：**引用口径以原文为准**（如七牛云面向届别以 hr.qiniu.com 官网页面为准，不以转载帖的宣传语为准）；官方表述与二手转载不一致时取官方。
- 预览期/内测产品的 API（事件名、配置项）来源不明确时：示意代码必须标注，且文中注明"以官方文档为准"。
- 时效性数据（价格、版本号）加时间限定（如"上线初期（8 月 17 日调价前）"）。
- 引用的官方表述（tagline、README 原文）区分出处：仓库 tagline 不是 README 副标题。
- **WebFetch 可能被安全策略拦截**（如 lua.org、go.dev 等官网域名）——改用 `curl -s <url>` 抓 HTML 后用 python 去标签提取文本，比 WebFetch 更可靠，还能精确锚定章节。
- **教程类文章**：
  - 定位是"普通教程"，不做"为什么 2026 年还要学 X"式的动机渲染，不夸大其词；开头如有作者观察，平实陈述即可。
  - 示例代码必须实跑验证：本机装了对应解释器就逐个运行代码块（提取 markdown 代码块 → 运行 → 对比 `-->` 断言注释输出）。print 多参数输出用 tab 分隔，断言注释用空格是惯例；依赖前文变量的代码块单独跑失败是预期，不算错误。
  - 语言版本口径要对：先查官网版本页（如 lua.org/versions.html）确认最新稳定版，再定"基于 X 版本"的表述与手册链接；安装命令的包名（apt/brew）要查包源确认存在。

## 5. 渲染验证清单

- **dev server**：Next.js 16 同一项目目录只允许一个 dev 实例；端口 3000 被占时新实例会启动后立刻退出，先停旧实例。验证用 `preview_start`（launch.json 里 `minorcell-dev`，端口 3456）。端口被其他会话的 dev server 占用时，preview_start 会拒绝附加——此时直接 `curl` + Playwright 访问 `http://localhost:3456` 做等价验证，不要改 launch.json（会影响那个会话）。
- **streamdown 渲染特性与坑**：
  - 列表项以 `**粗体**` 开头不会被解析（显示字面星号）——粗体不要放在列表项行首。
  - markdown 内联 `<svg>` 不可靠（属性引号易被破坏、React 渲染 SVG 属性名会刷 console 警告）——SVG 一律独立文件 + `![](url)` 引用。
  - `hasMermaidFence` 检测到 ```mermaid 才会加载 mermaid 运行时；既然不用 Mermaid，文章里不要出现 mermaid fence。
  - h1 会被自动降级为 h2（页面级标题已占 h1）。
- **验证步骤**：`gray-matter` 解析 frontmatter → 页面 img 全部 `naturalWidth > 0`（ZoomImage 懒加载在 dev 预览可能不触发，eval 时强制 `loading='eager'` 重设 src 再验证）→ console 无错误 → 外链全部 200 → 中文引号配对检查 → 首页列表确认新文章排序正确。
- **dev 内容缓存坑**：修改 content/ 下的 md 后，dev server 有时不重新编译（页面还是旧内容、新插图不出现）。带 cache-busting 参数访问 `?fresh=<timestamp>` 可强制重编译。
- **完成提醒**：文章无需 push 即可在 dev 预览（图片都在 TOS）；提醒用户 git 提交与发布时机。

## 持续迭代

这个 skill 是活的，不是一次性文档：每次协作中发现新约定、踩到新坑（渲染问题、平台兼容、流程改进、用户偏好变化），都直接更新到本文件——修正过时内容、补充新经验，让它持续吸收这个仓库的实践。固化脚本同理：转换过程中任何重复超过一次的手工步骤，都考虑沉淀进 `scripts/`。
