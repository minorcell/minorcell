---
type: article
title: '从云相册的缩略图说起：Bun.Image 让我告别 sharp'
date: 2026-05-17
updated: 2026-05-17
description: 'Bun v1.3.14 发布了内置的 Bun.Image API：drop-in 替代 sharp，零 native 模块。从我当年做云相册缩略图踩 sharp 的坑，到现在用 Bun 写图片压缩 CLI，再到这次官方把图像处理收编进 runtime——这是一条很清晰的演进线。'
keywords: [Bun, Bun.Image, sharp, 图像处理, 缩略图, WebP, Node.js]
order: 53
---

![信息图：云相册原图拖垮首屏，Bun 1.3.14 内置图像 API 可以在运行时做缩略图和封面压缩，用来替代 sharp。](https://stack-mcell.tos-cn-shanghai.volces.com/202642.png)

25年初我写过一个云相册 app，里面有一个非常常见的场景：相册页。

用户打开一个相册，里面动辄几十上百张照片。如果我老老实实地把原图丢给前端去加载，会发生什么？带宽炸了，首屏废了，用户划两下就关掉了。这种场景下，**缩略图不是优化项，是必选项**。

当时我用的是 `sharp`。功能没得说，是 Node.js 生态里事实上的标准。但中间踩了一些跨平台和预编译二进制相关的坑——具体是哪一次部署、什么环境，我已经记不清了，只记得当时被折腾得很难崩。后来回想，问题其实从来不是 sharp 本身，而是"图像处理"这件事，被绑死在了 native 模块的分发问题上：你要装 `libvips`，要匹配 glibc，要照顾 M1、Alpine、Lambda……每多一个目标环境，就多一份心智负担。

## 然后 Bun 进了我的工具箱

25年九月，Anthropic 收购了 Bun ，当时我也去围观了一下，感觉 Bun 的开箱即用特性很吸引我。所以后来，我开始把 Bun 当成日常写小工具的脚手架。

最典型的例子是博客封面压缩。我现在写文章的封面基本都让 AI 生成，问题是 AI 出图动辄三五兆，直接塞进文章里就是带宽刺客。所以我写了一个小 CLI，单文件，`bun run` 直接跑，做的事很简单：读图、缩到合理尺寸、转 WebP、写出去。

Bun 让这种"写个工具"的事情重新变得轻：单文件即可，TypeScript 直接跑，启动快，依赖少。但唯一的"重"还是图像处理本身——我仍然要装 sharp（虽然安装不麻烦，但是想起之前的坑总让人感到别扭）。

## Bun v1.3.14

[Bun v1.3.14](https://bun.com/blog/bun-v1.3.14#bun-image-built-in-image-processing) 的发布说明里有一行字让我愣了一下：

> Bun now ships a built-in image processing API ... designed as a drop-in alternative to sharp for common server-side image operations.

runtime 自己把图像处理收编了，零 native 模块。

### 一行话能力概览

- **格式**：JPEG / PNG / WebP / GIF / BMP 全平台支持（静态链接，输出一致）；HEIC / AVIF / TIFF 在 macOS 走 ImageIO + vImage，Windows 走 WIC
- **输入**：路径字符串、`ArrayBuffer` / `TypedArray`（零拷贝）、`Blob` / `BunFile` / `S3File`、`data:` URL
- **变换**：`.resize()` / `.rotate()` / `.flip()` / `.flop()` / `.modulate()`，链式调用
- **编码**：`.jpeg()` / `.png()` / `.webp()` / `.heic()` / `.avif()`，每种格式带自己的质量参数
- **终结**：`.bytes()` / `.buffer()` / `.blob()` / `.toBase64()` / `.dataurl()` / `.metadata()` / `.write(dest)`，外加一个有意思的 `.placeholder()`
- **Body 集成**：`Bun.Image` 实例可以直接作为 `Response` 的 body，`Content-Type` 自动带上

### 用我自己的两个场景重写

**场景一：云相册缩略图。** 上传接口里直接出缩略图，一行表达完：

```ts
// 上传一张图，返回 200px 宽的 WebP 缩略图
return new Response(new Bun.Image(upload).resize(200).webp({ quality: 80 }))
```

昨年我在 sharp 里要写流处理、要管 buffer、要设 header，现在这些事 runtime 全替我办了。

**场景二：博客封面压缩 CLI。** 我那个 CLI 的核心逻辑大概会变成这样：

```ts
await Bun.file('cover.png')
  .image()
  .resize(1600, null, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 82 })
  .write('cover.webp')
```

这意味着——CLI 的依赖里，可以把 sharp 整行删掉了。

### 一个让我多看了两眼的 API：`.placeholder()`

```ts
const placeholder = await Bun.file('hero.jpg').image().placeholder()
// thumbhash 的 data URL，可以直接拿去做 blur-up 占位
```

返回的是 [thumbhash](https://evanw.github.io/thumbhash/) 编码的 data URL。过去要做这个效果，得引一个 `blurhash`/`thumbhash` 库，自己在客户端解码。现在 runtime 一行给你。

### 性能

Bun 官方拿 sharp 0.34.5 做了对比，在 linux/x64 上跑了 50 次迭代。具体数字我不复述，建议感兴趣的同学[看原文](https://bun.com/blog/bun-v1.3.14#bun-image-built-in-image-processing)，或者在自己的目标环境上跑一遍。

它给出的实现关键词倒是值得记一下：**i16 定点 SIMD 的 resize 内核**、**JPEG IDCT 直接缩放到刚好够用的尺寸**、**ArrayBuffer 零拷贝借用**、**预分配 arena 给 resize 的临时内存**。除了 `metadata()`，所有处理都在主线程之外跑。这套组合拳很 Bun。

## 我的视角

抛开"快不快"，Bun.Image 让我感兴趣的其实是另外几个东西：

**第一，native 模块的分发问题被消化进了 runtime。** 这和 `Bun.sql`、`Bun.S3File`、`Bun.serve` 是同一种思路——常用的能力，runtime 自己扛。这意味着我那个图片压缩 CLI 现在可以做到真正意义上的**单文件、零依赖、跨平台**。对独立开发者，这是实打实的红利。

**第二，drop-in sharp，但不是替代 sharp。** 迁移成本几乎为零，API 形态几乎一致。但 Bun.Image 现在覆盖的是"常见服务端图像操作"——`composite`、SVG 渲染、ICC profile、复杂的 pipeline 组合，这些 sharp 仍然更全。**它解决的是 80% 场景的依赖问题，不是要把剩下的 20% 也吃掉。**

**第三，HEIC/AVIF 走 OS 后端是个有趣的取舍。** 能力换体积：在 macOS 和 Windows 上你白拿了苹果和微软已经做好的 codec；但反过来，**Linux 上目前没有这两种格式**。如果你的服务端跑在 Linux 容器里，HEIC/AVIF 这块现在还得另想办法。这点值得提前知道，免得部署时才发现。

## 回到云相册

如果今天让我重做那个云相册的缩略图，我大概率会写：

```ts
Bun.serve({
  routes: {
    '/thumb/:id': async (req) => {
      const file = await getOriginal(req.params.id)
      return new Response(new Bun.Image(file).resize(400).webp({ quality: 80 }))
    },
  },
})
```

然后就没有然后了。

当 runtime 把基础能力收编，工具的复杂度就回归到了业务本身。这种"由下而上挪走的复杂度"，可能才是 Bun 最值得期待的事情。
