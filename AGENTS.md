# Project Rules

## 技术栈

- 前端：React 19 + TypeScript + Vite + zustand
- 后端：Rust + Tauri 2 + aws-sdk-s3（MinIO / S3 兼容）
- 图标：lucide-react（禁止 emoji / Unicode 作图标）
- 包管理器：npm

## 常用命令

- `npm run dev`：仅前端（无法调用 Tauri commands）
- `npm run tauri dev`：完整开发（Rust + 前端）
- `npm run build`：前端类型检查 + 构建（提交前必须通过）
- `cd src-tauri && cargo check`：Rust 编译检查

## UI / 视觉规范

**完整规范见 [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md)。** 修改任何界面时必须遵循，核心红线：

- 颜色 / 圆角 / 字体一律使用 `src/App.css` 顶部的 CSS 变量，禁止硬编码色值。
- 深色分层设计：`--bg` → `--panel` → `--panel-hover` → `--panel-active`；边框用半透明白 `--border` / `--border-strong`。
- 主色 `--accent`（靛蓝）只用于主操作 / 选中 / 焦点，同一区域最多一个 `.primary`。
- 图标使用 lucide-react，纯图标按钮必须带 `title`。
- **禁止 `window.confirm / alert / prompt`**（macOS WKWebView 静默失效）；统一用 `src/dialogs.tsx` 的 `useDialogs()` 提供 `confirm` / `prompt` / `toast`。
- 交互元素必须具备 hover / focus-visible / disabled / loading / empty / error 状态。
- 预览统一使用 `src/components/PreviewShell.tsx`；浮层支持 ESC 关闭与点击遮罩关闭。
- 窄窗口（最小 720px 宽）下不得出现横向滚动或截断错位。

## 代码约定

- 组件放 `src/components/`，工具放 `src/` 下的 `*.ts`；每个文件职责单一。
- 状态集中在 `src/store.ts`（zustand），组件通过 `useStore()` 读取。
- Tauri 调用统一封装在 `src/api.ts`，组件不直接 `invoke`。
- Rust 端命令在 `src-tauri/src/commands.rs` 注册，业务逻辑放 `src-tauri/src/s3/`。
- 不新增无必要依赖；新增依赖优先选择发布满 7 天以上的稳定版本。

## 提交前

- `npm run build` 通过；涉及 Rust 时 `cargo check` 通过。
- UI 改动对照 `docs/UI_DESIGN.md` 的「变更检查清单」逐项确认。
- 提交信息使用 Conventional Commits（`feat:` / `fix:` / `style:` / `docs:` / `refactor:` / `chore:`）。
