# Components 目录规范

当前统一为以下分层：

- `common/`：通用业务组件，跨页面复用。
- `layout/`：站点框架相关组件（导航、页脚、全局拦截层等）。
- `effects/`：纯视觉/交互特效组件。
- `effects/reactbits/`：从 reactbits 引入、保持原实现的特效组件。
- `ui/`：shadcn/radix 基础 UI 原子组件。

## 放置规则

- 页面框架级别组件放 `layout/`。
- 只负责动画、背景、视觉效果的组件放 `effects/`。
- reactbits 组件统一放 `effects/reactbits/`，业务层通过封装组件引用。
- 其他可复用业务组件放 `common/`。
- 通用基础控件（Button/Card/Dialog 等）统一放 `ui/`。

## 命名与引用

- 文件名使用 `PascalCase.tsx`。
- 从外部引用时，优先使用绝对路径：`@/components/<group>/<Name>`。
- 新增组件前先检查是否可复用现有组件，避免重复。
