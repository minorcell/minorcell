# Topic 撰写指南（内部）

本文档描述本仓库 `content/topics/` 下专题的写作约定。读者是后续要新增 / 修改 topic 的协作者（人类或 agent）。

## 1. 两种 Topic 形态

`content/topics/<slug>/` 下必须有一份 `content.md`，frontmatter 里的 `type` 字段决定渲染方式。

| `type`        | 形态                              | 入口组件                                    | 适用场景                         |
| ------------- | --------------------------------- | ------------------------------------------- | -------------------------------- |
| `interactive` | 左代码、右文档的滚动同步教程      | `InteractiveTutorialView`                   | 手把手实现一个东西，代码逐步演进 |
| 不写 / 其它值 | 文章合集（`content.md` 仅当索引） | Topic 详情页直接列出同目录下其它 `.md` 文章 | 围绕主题的多篇独立文章           |

下面所有内容默认讨论 **`type: interactive`**。文章合集形态的约束极少，只要 `content.md` 有 `title` / `description`，再把同目录其它 markdown 文件按 `order` 或 `date` 排序即可。

## 2. 目录结构

```
content/topics/<slug>/
├── content.md                # 入口（frontmatter + 正文 + step 引用）
└── steps/                    # 代码步骤文件
    ├── 00.ts
    ├── 01.ts
    └── ...
```

**约定：**

- `<slug>` 即 URL 段（`/topics/<slug>`）。用 kebab-case，纯小写，不要中文。
- 步骤文件统一放 `steps/`，命名 `00.ts`、`01.ts`、`02.ts` ……便于排序。
- 即使是非 TS 项目，扩展名仍按真实语言走（`.tsx` / `.js` / `.py` / `.go` 都可以；fence 里写对应语言）。

## 3. content.md 头部

```yaml
---
title: 标题（必填，会用作 H1 + SEO title）
description: 一句话描述（必填，会用作 SEO description）
type: interactive
entryFile: content.md # 仅占位，目前未实际读取，保留以备将来扩展
tags: [JavaScript, 手写源码] # 仅占位，目前未渲染。可以留作元信息
---
```

只有 `title` / `description` / `type` 三个字段是真正生效的。`entryFile` 和 `tags` 写了不会出错，但当前实现不会读它们——别指望它们影响渲染。

## 4. 解析模型（最重要的一节）

`src/lib/interactive.server.ts` 的 `parseTutorialContent` 把 `content.md` 切成一份 `intro` 和若干 `steps`。**它的归属规则不直观，下面三条决定了你的章节标题该写在哪里：**

> **R1.** 第一个 step 之前的所有正文 → `intro`（渲染在页面顶部，不带左侧代码）。
>
> **R2.** 两个 step 之间的正文 → **前一个 step 的 prose**（与前一个 step 的代码并排显示）。
>
> **R3.** 最后一个 step 之后的所有正文 → **最后一个 step 的 prose**。

**直接后果（容易踩坑）：**

- 如果你想让 `## 第二章` 这个标题在 _step N+1_ 滚到中央时出现在右侧，**必须把它写在 step N+1 fence 的下面**，而不是 step N fence 的下面。
- "过场段落" / "章节小结"如果写在两个 step 中间，**永远归前一个 step**。没有"中间地带"。
- 想让某句话和某段代码同框出现，唯一办法：把这句话放在那段代码 fence 之后。

实操写法（推荐模板）：

````markdown
[导言：放在最前面，会成为 intro]

```ts step file=steps/00.ts highlight=1:6

```
````

[step 00 prose：紧接着这块代码的解释 + 章节标题（如果它正好是新章节的第一步）]

```ts step file=steps/01.ts highlight=1:7

```

[step 01 prose]

...

````

## 5. Step Fence 语法

### 5.1 代码 step

```text
```<lang> step file=<rel-path> highlight=<ranges>
````

````

- `<lang>`：代码语言，决定 Shiki 高亮（`ts` / `tsx` / `js` / `py` / `go` / `bash` 等）。
- `step` 关键字必须紧跟 lang，**前面要有空格**。这是 fence 被识别为"step"而不是普通代码块的判据。
- `file=<rel-path>`：相对 topic 目录的路径，例如 `steps/00.ts`。读出来的内容会替换 fence 之间的内容（fence 之间留空就行；多数情况下留一个空行即可，对解析无影响）。
- `highlight=<ranges>`（可选）：高亮行号。

> ⚠️ `file=` 路径写错时**不会报错**，渲染出来是 `// File not found: <path>`。先在本地用 `pnpm dev` 验证一下再提交。

### 5.2 highlight 语法

- `highlight=2:8`：高亮第 2 到第 8 行，**双闭合区间**（含 2 含 8）。
- `highlight=1,3,5`：高亮第 1、3、5 行。
- `highlight=2:8,15,20:25`：可混用，逗号分隔。
- 行号是 **`file=` 引用文件本身的 1-indexed 行号**，不是 markdown 文件里的行号。

**渲染语义：**

- **写了 `highlight=`** → 列出的行 `opacity: 1`，其余行 `opacity: 0.25`，滚动会自动把高亮区间的中点居中。
- **没写 `highlight=`** → 全部行 `opacity: 1`，滚动停在文件顶部。短 demo 文件（≲ 20 行）可以直接省略。

### 5.3 图片 step

```html
<!-- step-image src=images/diagram-01.png alt=事件循环阶段图 -->
````

整行单独成行（前后不要混入文字）。`src` 是相对 topic 目录的路径；要让构建生效，图片需放在 `public/` 下，并写成 `/images/...` 这种绝对路径——具体由部署侧决定。当前还没有正式案例，新加图片 step 时建议先跑一遍构建验证。

### 5.4 Demo step（可交互 HTML）

```html
<!-- step-demo src=demos/hover-card.html title="Hover Card" height=320 -->
```

整行单独成行。把一段**自包含**的 HTML 文件（含 `<!doctype html>`、内嵌 `<style>`、内嵌 `<script>`）放进 topic 目录的 `demos/` 子目录，构建期会读出文件内容，渲染时用 `iframe srcDoc` + `sandbox="allow-scripts"` 隔离。

属性：

- `src=`（必填）：HTML 文件相对 topic 目录的路径。
- `title=`（可选）：iframe 标题，会显示在面板顶栏。包含空格时用引号：`title="Hover Card"`。
- `height=`（可选）：固定像素高度，如 `height=320`。
- `aspect=`（可选，与 `height` 二选一）：宽高比，如 `aspect=16/9`、`aspect=4/3`、`aspect=1.78`。
- 都不写 → 桌面端撑满 sticky 面板高度；移动端默认 `320px`。

读者交互：左侧面板顶栏自带 `Preview / Source` 切换；移动端把 iframe 平铺，源码放在 `<details>` 折叠块里。

**作者注意：**

- demo 文件必须**自包含**——不能引外部 CSS/JS、不能引入站点字体或 token。需要图标就内联 SVG，需要动画就写 CSS 关键帧。这是「样本式独立沙箱」的设计意图。
- iframe 的 `sandbox` 不开 `allow-same-origin`：你的脚本可以跑，但拿不到 `document.cookie`、不能修改父页面、不能访问 `localStorage`。如果 demo 需要这些，重新设计成不需要它们。
- 触屏没有 hover——做 hover 类 demo 时，要么在 prose 里点明「桌面端体验最佳」，要么提供一个 active 态等价物。
- demo 文件用 kebab-case 命名（`hover-card.html`、`skeleton-loading.html`），与 topic slug 风格一致。

## 6. 代码风格约定（重要）

> **Step 文件里不写解释性注释。所有"为什么 / 怎么做"全部放在右侧 prose。**

原因是 Shiki 默认把注释染成深灰，叠上未高亮区域 25% 透明度后，注释和"被淡化的代码"视觉上完全分不开——高亮失去意义。所以：

- ❌ 不要写：`console.log(v) // 1`
- ❌ 不要写：开头的 `// 这是 v3：让 then 永远异步` 介绍块
- ❌ 不要写：结尾的 `// 输出: A, G, D, F, B, C, E` 推导块
- ✅ 这些信息全部移到 `content.md` 对应 step 的 prose 里
- ✅ 仅保留 TS 必需的语句（`export {}`、`declare class` 等）

例外：如果某个项目要求保留注释展示（比如教 JSDoc 本身），可以在该 topic 内单独说明。

## 7. 高亮策略

短 demo 整段亮，长代码精确聚焦：

| 文件长度                        | 推荐策略                                                 |
| ------------------------------- | -------------------------------------------------------- |
| ≲ 20 行，整段就是 demo          | 整段高亮：`highlight=1:N` 或干脆省略                     |
| 较长（含完整 class / 多个函数） | 只高亮本步要讲的部分（一个方法 / 一个新增字段集合）      |
| 多版本演进（v1 → v2 → v3）      | 在 v(n+1) 文件里高亮"相对 v(n) 的增量行"，让读者看清差异 |

**避免的反模式：**

- highlight 范围指向空行——等于没高亮。设范围前对照实际文件 `cat -n` 看一遍。
- highlight 范围把闭合 `}` 漏在外面——视觉上代码"半截没收住"。宁可多包一行。
- 用 highlight 高亮注释行——配合"代码不写注释"的约定，注释行根本不会出现，无需高亮。

## 8. 验证流程

```bash
pnpm lint     # 类型 + 风格
pnpm build    # 含 prebuild（生成 feed）+ pagefind 索引
pnpm dev      # 本地预览滚动同步效果
```

发布前最小验证：

1. `pnpm build` 通过。
2. `pnpm dev` 打开 `/topics/<slug>`，从头滚到尾，每段 prose 出现时，左侧代码焦点是不是对的位置；高亮的行是不是真实代码行（非空行 / 非已删的注释）。
3. 任何出现 `// File not found` 的 step 立即修复。

## 9. 速查表

| 我想...                          | 这样写                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| 让段落 A 出现在 step N 的右侧    | 把 A 写在 step N fence 之后、step N+1 fence 之前                        |
| 在某 step 出现时把章节标题打出来 | 把 `## 章节` 放进该 step 的 prose（fence 之后）                         |
| 高亮整段短 demo                  | 省略 `highlight=` 或写 `highlight=1:N`                                  |
| 高亮长文件里的一个方法           | `highlight=<方法首行>:<方法末行>`，包到闭合 `}`                         |
| 标记某个版本"相对上一版的新增"   | 多个 range：`highlight=8:9,18,24,36:39`                                 |
| 在 prose 里嵌一段额外代码块      | 用普通 ` ```ts ` fence（不带 `step` 关键字），不会被识别成 step         |
| 引用一个外部链接                 | 普通 markdown `[文字](url)`                                             |
| 内嵌图片 step                    | `<!-- step-image src=... alt=... -->` 单独成行                          |
| 内嵌可交互 demo                  | `<!-- step-demo src=demos/x.html title="..." -->` 单独成行；HTML 自包含 |

## 10. 已有 topic 参考

- `content/topics/build-mini-claude-code/`：有 `04b.ts` 这种"分支文件名"的用法、单 step 多 highlight range 的范例。
- `content/topics/js-event-loop-to-promise/`：长链路渐进推导的范例，章节标题嵌入"对应章节首个 step 的 prose 开头"的标准写法。

新增 topic 之前先打开这两份对照一下结构，可以省掉一半试错时间。
