---
type: article
title: 'Electron 瘦身记：我是如何把安装后 900MB 的"巨无霸"砍到 466MB 的？'
date: 2025-12-29
description: '从实战角度记录 Electron 应用体积优化全过程：通过关闭 SourceMap、依赖治理、精准排除 node_modules 冗余文件等手段，将 DMG 从 240MB 降至 155MB，安装后体积从 900MB+ 降至 466MB，并显著提升启动速度。'
order: 34
---

![089](https://stack-mcell.tos-cn-shanghai.volces.com/089.webp)

> 最近事情较多，上班忙、下班写论文...更文速度较慢，还望谅解。

最近在参与一个 Electron 桌面端项目开发。作为 Electron 萌新，我原本以为“桌面端 = 写写前端 + 套个壳”，结果真正折磨人的，反而是工程化那一坨：**打包构建、签名、公证、发布更新、更新测试**……坑点密度高到离谱。

先吐槽两句：

- macOS 打包要走签名 + 公证（Notarization）流程，第一次搞的时候你会怀疑自己是不是在给苹果写论文。
- 自动更新测试更难绷：为了测 Windows 的更新链路，你甚至得在 macOS 上开个 Windows 虚拟机……（是的，我真的干过）

但让我印象最深刻、也最有成就感的，是一次很“实在”的工作：**构建产物体积优化**。

因为它直接影响三件事：

1. 用户下载/安装体验（你不希望用户下载一个“3A 大作”）
2. 启动速度（图标跳半天才开，真的很败好感）
3. 发布流程成本（包越大，签名/公证/上传/分发越折磨）

这篇就记录一下：我怎么从 **DMG 240MB、安装后 900MB+**，做到 **DMG 155MB、安装后 466MB**。

## 先看结果：体积变化

最初版本：

- macOS dmg：**240MB**
- 安装后：**900MB+**
- 体验：启动慢，菜单栏图标疯狂弹跳，弹到我怀疑人生

优化后：

- macOS-arm.dmg：**155MB**
- 安装后：**466MB**
- 体验：启动速度肉眼可见地正常了

## 第一性原则：别猜，先把包拆开看

我一开始犯的错就是“凭感觉优化”。后面发现这事必须回到最朴素的方法：

> **把构建产物展开/解压，看看到底是谁在占空间。**

在 macOS 上你可以：

- dmg 挂载后找到 `.app`
- 右键 → 显示包内容 → `Contents/Resources/`
- 常见结构里会有 `app.asar` / `app.asar.unpacked` 等

然后用最土但最有效的方式查体积：

```bash
du -sh "YourApp.app"
du -sh "YourApp.app/Contents/Resources"/*
```

当我第一次看到结果时，基本就破案了：

- `.map` 有，但不是主犯
- 真正离谱的是：**node_modules**（体积大得像是把整个开发环境一起打进去了）

## 第一刀：发布版本别带 SourceMap（别把源码线索塞给用户）

这是我第一次做 Electron 发布，发布第一个内部测试版时我居然没关 sourcemap。

同事一句话把我点醒：“你这包里怎么能看到源码痕迹？”

我去翻构建产物：好家伙，`.map` 真在里面。

虽然 sourcemap 通常不会占几百 MB，但它有两个问题：

- **安全性 / 泄露风险**
- **它属于“你不该带”的东西**（该清理就清理）

于是我先在构建侧关掉 sourcemap，并在打包规则里也顺手排除 `.map`（双保险）。

## 第二刀：依赖治理——“npm install xxx 一把梭”的历史债，要还

接下来就是 node_modules 瘦身。

我以前装依赖的习惯非常粗暴：`npm install xxx`，能跑就行；**根本不在乎它应该在 dependencies 还是 devDependencies**。

这在 Web 项目里可能不致命，但在 Electron 打包里非常致命：你分错了依赖，构建产物就会帮你把一堆开发工具、类型、脚手架、lint、测试相关，全塞进最终 App。

我当时做了两件事：

1. **清理 package.json 里压根没用的废弃包**
   （这种是纯收益，删就完事了）
2. **重新整理 dependencies / devDependencies**
   我甚至请 Claude Code 帮我分了一遍（因为我当时真的没经验，靠自己很容易漏）

这一轮做完再构建：

- 安装体积从 **900MB → 600MB+**

我当时很开心，但冷静想想：**600MB 的桌面软件还是大得离谱。**

所以继续拆包。

## 第三刀：node_modules 里全是“你根本不需要”的文件

当 node_modules 变小之后，我继续往里看，结果又发现一堆“脂肪”：

- `README.md / CHANGELOG.md / HISTORY.md / LICENSE`
- `tests / __tests__ / examples / docs / coverage`
- `.d.ts`
- `.map`
- 甚至还有 `*.ts / *.tsx` 源码、配置文件（rollup/webpack/tsconfig）

这些对用户运行 App 来说几乎没价值。

形象点讲：这就像你买披萨，厨师把面粉袋子、烤箱说明书、甚至工作笔记也一起塞给你。

于是我遇到了关键问题：

> 怎么系统性剔除这些文件？
> 难道要打包前去 node_modules 手动删？（那也太原始了）

## 关键方案：electron-builder 的 files 规则，精准排除

我最终落在 `electron-builder` 的 `build.files` 配置上：用 glob 模式明确告诉打包工具“哪些要、哪些不要”。

核心思路很简单：

- 只打包你的 `dist` / `dist-electron`
- 排除 `.map`
- 排除所有 `*.md / *.ts / *.tsx` 等“开发者文件”
- node_modules 里重点清理：文档、测试、类型、锁文件、工具脚本、隐藏文件等

这是我最终的配置：

```json
"files": [
  "dist/**/*",
  "dist-electron/**/*",
  "!dist/**/*.map",
  "!dist-electron/**/*.map",

  "!**/*.{ts,tsx,md}",

  "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme,HISTORY.md,CONTRIBUTING.md}",
  "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples,coverage,docs,doc}",
  "!**/node_modules/*.d.ts",
  "!**/node_modules/.bin",
  "!**/node_modules/*/*.md",
  "!**/node_modules/*/*.markdown",
  "!**/node_modules/*/LICENSE*",
  "!**/node_modules/*/{.github,.vscode,.idea}",
  "!**/node_modules/*/{rollup.config.js,webpack.config.js,tsconfig.json}",
  "!**/node_modules/*/.*",
  "!**/node_modules/**/*.map",
  "!**/node_modules/**/*.{spec,test}.{js,jsx,ts,tsx}",
  "!**/node_modules/*/{yarn.lock,package-lock.json,pnpm-lock.yaml}",

  "!**/node_modules/lucide-react/dist/*.{ts,tsx}",
  "!**/node_modules/@types"
]
```

配置完，我点击构建按钮。电脑开始发烫、风扇狂转，我开始祈祷不要出“运行时报错找不到某个文件”的地狱场景。

结果：

- `macos-arm.dmg`: **155MB**（原 240MB）
- 安装后：**466MB**（原 900MB+）

体积几乎减半，而且功能没缺、启动也明显变快。

## 这类“删文件式瘦身”有风险吗？

有，但可控。

因为确实存在少数包会在运行时读取某些资源文件（甚至是你以为“文档/配置”的东西）。所以我的策略是：

1. **先排除最通用的一批：md/tests/docs/types/map/lockfile**
2. 打完包之后做一轮完整回归（重点：启动、关键路径、更新链路）
3. 如果某个依赖真的需要某类文件，再对它做“例外放行”（白名单）

这比“手动删 node_modules”靠谱太多了：可重复、可追踪、可回滚。

## 工程化不只是“能跑”，而是“交付可控”

回头看，我从“能打出来就行”的心态，变成了：

- 我知道最终产物里有什么
- 我知道哪些文件不该进去
- 我知道体积怎么定位、怎么收敛、怎么验证

如果你也在做 Electron，建议你按顺序做这几件事（基本不会亏）：

1. **拆包看体积分布**（别凭感觉）
2. **关 sourcemap**（安全 + 清爽）
3. **清理无用依赖、分好 dev/prod**（最稳最值）
4. **用 files 精准剔除 node_modules 垃圾文件**（体积大头就在这）
5. **每次瘦身都配回归测试**（尤其是更新链路）

## 附：我常用的排查命令

```bash
# 看体积分布
du -sh dist dist-electron node_modules
du -sh "YourApp.app/Contents/Resources"/*

# 查大体积 sourcemap
find . -name "*.map" -size +5M -print
```

(完)
