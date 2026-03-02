---
title: '文生图通用提示词（技术内容配图）'
description: '一个可复用的技术内容配图提示词模板，适合把文章/文档内容转成手绘风格信息图。'
date: 2026-03-03
order: 2
---

# 文生图通用提示词（技术内容配图）

这个提示词来自日常使用沉淀，适合把技术文档、博客、课程内容转成更易传播的信息图。

使用时，把 `{{ content copy here }}` 替换为你的原始内容即可。

原文可参考：[分享一个常用的文生图提示词](/blog/2026/share-an-image-gen-prompt)

![](https://stack-mcell.tos-cn-shanghai.volces.com/202630.png)

```markdown
{{ content copy here }}

Please create a cartoon-style infographic based on the provided content, following these guidelines:

- Hand-drawn illustration style, landscape orientation (16:9 aspect ratio).

- Include a small number of simple cartoon elements, icons, or famous personalities to enhance visual interest and memorability.

- If the content includes sensitive or copyrighted figures, replace them with visually similar alternatives; do not refuse to generate the illustration.

- All imagery and text must strictly adhere to a hand-drawn style; avoid realistic visual elements.

- Keep information concise, highlighting keywords and core concepts. Utilize ample whitespace to clearly emphasize key points.

- Unless otherwise specified, use the same language as the provided content.

Please use nano banana pro to create the illustration based on the input provided.

Please translate the text content in the image into Chinese.
```
