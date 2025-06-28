# 🧾 个人网站设计文档（基于 brittanychiang.com 风格）

### 1. 🎯 项目目标

构建一个具有视觉冲击力与技术表现力的**个人展示型网站**，用于呈现以下内容：

* 简洁自我介绍（Hero）
* 技术背景与经历（Experience）
* 项目/作品展示（Work）
* 博客（Blog）
* 联系方式与社交链接（Contact）
* 后续可拓展博客、动态内容、暗黑模式等

---

### 3. 🧑‍💻 技术选型

| 层级           | 工具/技术                                 | 说明                   |
| ------------ | ------------------------------------- | -------------------- |
| **框架**       | `Next.js`                             | 支持静态生成 & 动态加载；良好 SEO |
| **样式**       | `Tailwind CSS`                        | 快速迭代、样式一致            |
| **动画**       | `Framer Motion`                       | 实现滚动动效、入场动画等         |
| **字体**       | `Inter` from Google Fonts             | 阅读性强，设计风格统一          |
| **图标库**      | `Lucide`                              | 线性风格，适配简约 UI         |
| **内容管理**      | `MDX`                               | 博客/动态项目内容可拓展         |

---

### 4. 🧩 样式与交互设计

#### 🎨 色彩主题

* 背景：`#0a192f`（深蓝黑）
* 主色调：青绿（如 `#64ffda`）
* 字体颜色：主白 + 二级灰（如 `#8892b0`）

#### 📐 布局细节

* 宽度限制：`max-w-7xl mx-auto px-4`
* Section 分隔：`py-24` 以上，模块感强
* 动效节奏：组件在进入视口时淡入（Framer Motion）

#### 📱 响应式设计

* 使用 Tailwind 响应式断点（`md:`、`lg:` 等）
* Menu：PC 为横向导航，Mobile 为汉堡菜单 + Drawer 弹出

---

### 5. ⚙️ 功能模块设计

#### 🧍 Hero 模块

* 介绍语：如 “Hi, I’m mCell. I build things for the web.”
* 动态关键词/打字动画可选（如使用 `react-simple-typewriter`）

#### 📜 Experience

* 数据配置：`experience.json` 或用 `MDX` 渲染
* 时间线布局：左侧时间，右侧公司/职位描述

#### 📝 Blog

* 支持图片封面、标题、描述、技术栈、跳转链接
* 鼠标悬停有过渡动效（scale-up + 变色）
* MDX 渲染

#### 🛠️ Work

* 支持图片封面、标题、描述、技术栈、跳转链接
* 鼠标悬停有过渡动效（scale-up + 变色）

#### 💌 Contact

* CTA 按钮：「感兴趣？给我发邮件吧」
* 支持 mailto 或链接到 Notion 表单

---

### 📎 附录：开发脚手架建议

```bash
npx create-next-app@latest mcell-site --typescript
cd mcell-site
pnpm add tailwindcss framer-motion lucide-react classnames
```