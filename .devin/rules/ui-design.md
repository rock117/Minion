---
description: "Minion UI 设计规范：修改前端界面（src/**/*.tsx、src/App.css）时应用"
trigger: glob
globs: "src/**/*.{tsx,css}"
---

# UI 设计规范（作用域规则）

完整标准见 `docs/UI_DESIGN.md`。修改界面代码时逐项自检：

- [ ] 颜色 / 圆角 / 字体使用 `src/App.css` 的 CSS 变量，无硬编码色值
- [ ] 深色分层：`--bg` / `--panel` / `--panel-hover` / `--panel-active`；边框用 `--border` / `--border-strong`
- [ ] 主色 `--accent` 仅用于主操作 / 选中 / 焦点；同一区域最多一个 `.primary`
- [ ] 图标用 lucide-react（禁止 emoji）；纯图标按钮带 `title`
- [ ] 禁止 `window.confirm/alert/prompt`，改用 `useDialogs()` 的 `confirm`/`prompt`/`toast`
- [ ] 交互元素具备 hover / focus-visible / disabled / loading / empty / error
- [ ] 浮层用 `PreviewShell` 或统一模态样式，支持 ESC 与点击遮罩关闭
- [ ] 最小窗口 720px 宽下无横向滚动 / 截断
- [ ] `npm run build` 通过
