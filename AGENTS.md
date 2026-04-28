# AGENTS.md

本文件定义本仓库内 agent 的协作约束与执行规范。目标是：在不偏离用户当前任务的前提下，稳定、可验证地交付改动。

## 1. 项目概览

- 项目类型：`Next.js 16` 静态导出站点（`output: 'export'`）。
- 语言与框架：`TypeScript` + `React 19` + App Router。
- 包管理：`pnpm`（workspace）。
- 主要内容源：`content/` 下 Markdown 文档。
- 构建产物：`out/`（静态站点）。

## 2. 目录职责（按改动优先级理解）

- `src/app/`：页面路由、全局布局、SEO 路由（`sitemap.ts` / `robots.ts`）。
- `src/components/`：页面组件与 UI 组件。
- `src/lib/`：内容读取、业务逻辑、SEO 组装等。
- `content/`：博客、专题、站点元信息。
- `scripts/`：构建前数据生成脚本（feed、icons）。
- `public/`：静态资源。

## 3. 常用命令

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`
- 代码检查：`pnpm lint`
- 构建站点：`pnpm build`
- 本地预览导出站点：`pnpm start`
- 生成图标：`pnpm icons`

说明：`pnpm build` 会先执行 `prebuild`，自动生成 feed；构建后会运行 `pagefind` 建索引。

## 4. 实施约束

- 优先做与当前需求直接相关的最小改动，不主动扩大范围。
- 保持现有技术栈与风格：TypeScript、函数组件、模块化拆分。
- 涉及 UI 时，优先复用已有组件与样式变量，避免引入无必要新依赖。
- 修改内容渲染或路由逻辑时，注意静态导出兼容性（避免依赖运行时服务端能力）。
- 发现 bug/风险时，先向用户说明影响与建议；经确认后再创建 issue（如用户需要）。

## 5. 内容与 SEO 相关注意点

- 内容主要来自 `content/blog` 与 `content/topics`，frontmatter 字段需保持兼容（如 `title`、`date`、`description`）。
- 页面元信息由 `src/lib/seo.ts`、`src/lib/structured-data.ts` 统一生成；新增页面应接入同一套 SEO 结构。
- `site` 级配置来自 `content/site/site.json`，涉及站点名称、链接、关键词等全局信息时优先修改这里。

## 6. 交付前最小验证

对代码改动，默认执行以下检查（至少覆盖与改动相关项）：

1. `pnpm lint`
2. `pnpm build`
3. 若改动了内容检索/搜索相关：确认 `pagefind` 索引流程未报错。

如果受环境限制无法完成检查，需在回复中明确说明未验证项及潜在影响。

## 7. 提交规范（供 agent 执行时参考）

- 单次任务尽量保持单一主题提交，避免混入无关改动。
- 不回滚或覆盖用户已有的未授权改动。
- 提交说明聚焦“改了什么 + 为什么”，避免空泛描述。

## 8. 决策优先级

当规则冲突时，按以下顺序决策：

1. 用户当前明确指令
2. 安全与正确性
3. 本文件约束
4. 项目现有实现风格

---

如需长期调整协作偏好，可直接更新本文件；不要记录短期任务状态。
