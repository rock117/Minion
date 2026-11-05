# Minion UI 设计规范

本文件是 Minion 桌面客户端的 UI 设计与实现标准。所有新增或修改界面的改动都应遵循本规范；修改后请对照文末的[检查清单](#变更检查清单)。

> 参考设计语言：Linear、Raycast、VS Code Dark Modern。目标是一个**深色、克制、信息密度高、跨平台一致**的开发者工具界面。

---

## 1. 设计原则

1. **深色优先、分层表达**
   用不同的表面层级（background → panel → hover → active）表达空间关系，而不是靠边框堆叠。
2. **克制用色**
   主色（靛蓝）只用于「主操作 / 当前选中 / 焦点」，绝不用于大面积填充或装饰。
3. **层级清晰**
   通过字号、字重、颜色（text → text-2 → text-dim）建立信息层级，避免所有文字一个颜色。
4. **紧凑但不拥挤**
   列表/表格追求高信息密度；对话框/预览等聚焦场景留足留白。
5. **一致的交互反馈**
   hover / focus / active / disabled / loading 状态必须齐全且可预期。
6. **跨平台一致**
   不依赖系统原生控件（原生 `confirm/alert/prompt` 一律不用），保证 Windows / macOS / Linux 表现一致。
7. **无障碍与键盘可用**
   所有关键操作可用键盘完成；ESC 关闭浮层；箭头切换；focus-visible 有可见轮廓。

---

## 2. 设计令牌（Design Tokens）

所有颜色/字体/圆角都必须通过 `src/App.css` 顶部的 CSS 变量使用，**禁止硬编码颜色值**。

### 2.1 表面（Surfaces）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--bg` | `#0a0b0d` | 最底层背景（文件浏览器、内容区） |
| `--bg-header` | `#0d0e11` | 顶栏、工具栏背景 |
| `--panel` | `#101114` | 侧边栏、面板、弹窗背景 |
| `--panel-2` | `#16181c` | 次级表面（按钮、卡片） |
| `--panel-hover` | `#1c1e24` | hover 背景 |
| `--panel-active` | `#22252c` | active / 按下背景 |

### 2.2 边框

| 变量 | 值 | 用途 |
|------|-----|------|
| `--border` | `rgba(255,255,255,0.06)` | 常规分隔线 |
| `--border-strong` | `rgba(255,255,255,0.11)` | 按钮/输入框/浮层边框 |

> 边框永远使用半透明白，**不要用不透明灰色**（如 `#3a3a3a`）。

### 2.3 文字

| 变量 | 值 | 用途 |
|------|-----|------|
| `--text` | `#e7e9ee` | 主文字、标题 |
| `--text-2` | `#9ba1ac` | 次要文字、描述、按钮默认色 |
| `--text-dim` | `#626873` | 弱化文字、占位、元信息、行号 |

### 2.4 主色与语义色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--accent` | `#6366f1` | 主操作、当前选中、焦点 |
| `--accent-hover` | `#818cf8` | 主色 hover / 链接 |
| `--accent-soft` | `rgba(99,102,241,0.12)` | 选中背景、焦点光晕底色 |
| `--accent-glow` | `rgba(99,102,241,0.35)` | focus ring、品牌阴影 |
| `--danger` | `#f0605f` | 删除、错误 |
| `--danger-soft` | `rgba(240,96,95,0.12)` | 危险按钮 hover 背景 |
| `--success` | `#3ecf8e` | 成功、在线状态点 |

### 2.5 字体

| 变量 | 用途 |
|------|------|
| `--font-sans` | 全部 UI 文本（Inter → 系统字体回退） |
| `--font-mono` | 路径、endpoint、文件大小、行号、JSON/XML/原始文本、快捷键提示 |

**字号规范**

| 场景 | 字号 | 字重 |
|------|------|------|
| 区块标题（如 `连接`、`BUCKETS`） | 11px | 650，`letter-spacing: .06em`，大写 |
| 正文 / 列表项 | 13px | 400–550 |
| 对话框标题 / 预览文件名 | 14–15px | 650 |
| 元信息 / chips / 状态栏 | 11–12px | 400–500 |
| 代码 / 树 / 原始文本 | 12.5–13px | 400，等宽 |

### 2.6 圆角

| 变量 | 值 | 用途 |
|------|-----|------|
| `--r-sm` | `6px` | 按钮、输入框、小标签 |
| `--r-md` | `8px` | 列表项、图标按钮、连接项 |
| `--r-lg` | `12px` | 对话框、预览外壳 |

### 2.7 间距

采用 4px 基准网格：`4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 24`。

- 面板内边距：`12px 14px`
- 列表项内边距：`9px 10px`
- 弹窗内边距：`20–22px`
- 元素间距（gap）：`4 / 6 / 8 / 10 / 12`

### 2.8 动效

| 场景 | 时长 | 缓动 |
|------|------|------|
| hover / 颜色变化 | `0.12–0.13s` | `ease` |
| 侧边栏宽度 | `0.18s` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 浮层出现（fade-in） | `0.12–0.14s` | `ease` |
| 弹窗出现（modal-in） | `0.15–0.16s` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Toast 出现 | `0.18s` | `cubic-bezier(0.16, 1, 0.3, 1)` |

> 动效要「快而稳」，不要有弹跳或超过 0.2s 的过渡。

---

## 3. 布局结构

```
┌────────────────────────────────────────────────────────────┐
│ app-header (44px)  品牌 Logo + 当前连接状态                  │
├──────────┬───────────┬───────────────────────────────────────┤
│ 连接侧栏  │ Bucket 面板 │ 文件浏览器（虚拟滚动表格）             │
│ 248px    │ 232px      │ flex: 1                                │
│ 可折叠→52px           │                                        │
└──────────┴───────────┴───────────────────────────────────────┘
```

- 顶栏固定 44px，含品牌与连接状态。
- 侧边栏可折叠为 52px 活动栏（首字母头像）。
- 文件浏览器占满剩余空间，使用虚拟滚动（行高 36px）。
- 三个区域之间用 `--border` 1px 分隔，不使用阴影。

---

## 4. 组件规范

### 4.1 按钮

| 类型 | 类名 | 用途 |
|------|------|------|
| 主按钮 | `.primary` | 页面内唯一主操作（如「上传」「保存」） |
| 默认按钮 | `button` | 次要操作 |
| 幽灵按钮 | `.ghost` | 工具栏、无边框操作 |
| 危险按钮 | `.danger`（文字红）/ `.danger-solid`（红底白字） | 删除等破坏性操作 |
| 图标按钮 | `.icon-btn` | 仅图标，带 `title` 提示 |
| 工具栏按钮 | `.pv-tool-btn` | 预览工具栏的小按钮 |

**规则**

- 按钮高度：默认约 28–30px，工具栏 26px，行内操作 26×26px。
- 按钮内图标 13–15px，图标与文字间距 6px。
- 必须有 `:hover` / `:disabled` / `:focus-visible` 状态。
- `:focus-visible` 使用 `box-shadow: 0 0 0 2px var(--accent-glow)`，不要用默认 outline。
- 同一视觉区域内**最多一个** `.primary`。

### 4.2 输入框

- 背景 `--bg`，边框 `--border-strong`，圆角 `--r-sm`，内边距 `8px 11px`。
- 聚焦：边框变 `--accent`，并加 `box-shadow: 0 0 0 3px var(--accent-soft)`。
- 占位文字使用 `--text-dim`。

### 4.3 侧边栏 / 列表

- 列表项圆角 `--r-md`，hover 背景 `--panel-hover`。
- 当前选中项：背景 `--accent-soft`，左侧 3px 竖条（`::before`）用 `--accent`。
- 行内操作按钮（编辑/删除）**默认隐藏**，仅 hover 或键盘聚焦（`:focus-within`）时淡入；**选中态不显示**（避免常驻干扰）。
- 空状态：居中、`--text-dim`、字号 12.5–13px，文案要说明「为什么空 + 怎么操作」。

### 4.4 表格（虚拟滚动）

- 表头 34px，11px 大写、`--text-dim`。
- 行高固定 36px，hover 背景 `--panel-2`。
- 列：名称（`1fr`）/ 文件数（72px）/ 大小（84px）/ 修改时间（148px）/ 操作（116px）；窄窗口（< 1040px）隐藏「修改时间」列。
- 数字列使用 `font-variant-numeric: tabular-nums`。
- 行内操作图标按钮默认 `opacity: 0` + `pointer-events: none`，仅行 hover 或 `:focus-within` 时显示。
- 文件夹图标 `--accent-hover`，文件图标 `--text-dim`。
- 「文件数」列（`.vcol-count`）显示文件夹内文件数：按需统计、结果缓存、并发受限，单目录上限 1000，超出显示 `N+`；文件行显示 `-`；可在设置中关闭。

### 4.5 浮层 / 模态

- 遮罩：`rgba(0,0,0,0.62–0.68)` + `backdrop-filter: blur(3–4px)`。
- 容器：`--panel` 背景、`--border-strong` 边框、`--r-lg` 圆角、大阴影。
- 出现动画：`modal-in`（淡入 + 上移 6px + 轻微缩放）。
- 点击遮罩关闭，点击内容不关闭（`stopPropagation`）。

### 4.6 应用内对话框（必须使用）

**禁止使用 `window.confirm / alert / prompt`**（macOS WKWebView 下静默失效，且样式不一致）。

统一使用 `src/dialogs.tsx` 的 `useDialogs()`：

```tsx
const { confirm, prompt, toast } = useDialogs();

// 确认（危险操作用 danger: true）
const ok = await confirm({
  title: "删除对象",
  message: `确定删除「${key}」？此操作不可撤销。`,
  confirmText: "删除",
  danger: true,
});
if (!ok) return;

// 输入
const name = await prompt({ title: "新建 Bucket", placeholder: "my-bucket" });

// 提示
toast("已上传", "success"); // "info" | "success" | "error"
```

- 危险确认：图标红色、主按钮 `.danger-solid`。
- Toast：右下角堆叠，3.2s 自动消失，带成功/失败/信息图标。

### 4.7 预览外壳（文本 / 图片）

统一使用 `src/components/PreviewShell.tsx`：

- **头部**：类型徽章 + 文件名 + 完整路径 + 关闭按钮。
- **元信息 chips**：大小、类型、行数/键数/像素尺寸等，圆角胶囊。
- **工具栏**：分组按钮（`--bg` 底 + 边框的分组容器）。
- **内容区**：`flex: 1`，可滚动。
- **状态栏**：左侧统计、右侧快捷键提示（等宽字体）。

类型徽章色调（`.tone-*`）：

| 类型 | 类名 | 颜色 |
|------|------|------|
| JSON | `.tone-json` | 琥珀 `#f0b86e` |
| XML | `.tone-xml` | 蓝 `#6ea8f0` |
| 文本 | `.tone-text` | 灰 `#9ba1ac` |
| 图片 | `.tone-image` | 紫 `#c084fc` |

### 4.8 树状视图（JSON/XML）

- 等宽字体，行号 gutter 44px、右对齐、`--text-dim`、`opacity: .5`。
- 可折叠节点用 `▼ / ▶`；缩进用左侧 1px 引导线。
- 语法配色（One Dark 风格）：键 `--accent-hover`、字符串 `#98c379`、数字 `#d19a66`、布尔 `#c678dd`、null `--text-dim`。
- 每行 hover 显示复制按钮（`opacity` 过渡）。

### 4.9 图片预览

- 舞台背景使用**棋盘格**（透明图友好），类名 `.checker`。
- 缩放：滚轮 / 按钮 / 百分比显示；适应窗口；1:1 原始尺寸。
- 放大后可拖动平移；支持 90° 旋转。
- 左右切换按钮为半透明圆形、`backdrop-filter: blur`。

---

## 5. 交互与状态

每个可交互元素都必须定义以下状态：

| 状态 | 视觉 |
|------|------|
| hover | 背景 `--panel-hover`，文字变 `--text` |
| focus-visible | `box-shadow: 0 0 0 2–3px var(--accent-glow / --accent-soft)` |
| active | 背景 `--panel-active`（或 `transform: translateY(0.5px)`） |
| disabled | `opacity: .45`，`cursor: not-allowed` |
| loading | 文案「加载中…」或按钮显示「处理中…」并禁用 |
| empty | 居中提示，说明原因与下一步操作 |
| error | `--danger` 文字，说明可恢复的操作 |

**键盘约定**

- `ESC` 关闭所有浮层（模态、预览、对话框）。
- `← / →` 切换图片；`0` 适应窗口；`1` 原始尺寸；`R` 旋转；`+/-` 缩放。
- 输入框 `Enter` 提交、`ESC` 取消（对话框）。

---

## 6. 图标

- 统一使用 **lucide-react**，禁止使用 emoji 或 Unicode 字符作为图标。
- 尺寸：行内 13–14px，工具栏 14–15px，头部/导航 15–17px，大号 18–22px。
- 默认 `strokeWidth`（2），品牌等强调场景可用 2.2。
- 纯图标按钮必须带 `title` 作为可访问名称与提示。
- 语义映射：
  - 文件夹 `Folder`、文件 `File`、文本 `FileText`、图片 `Image`
  - 预览 `Eye`、下载 `Download`、删除 `Trash2`、上传 `Upload`
  - 折叠侧栏 `PanelLeftClose` / `PanelLeftOpen`、新建 `Plus`、编辑 `Pencil`
  - 关闭 `X`、左右 `ChevronLeft/Right`、旋转 `RotateCw`

---

## 7. 反模式（不要这样做）

- ❌ 硬编码颜色（`#333`、`rgba(...)` 直接写在组件里）——必须用 CSS 变量。
- ❌ 使用 `window.confirm / alert / prompt`——用 `useDialogs()`。
- ❌ 使用 emoji / Unicode 作图标——用 lucide-react。
- ❌ 大面积使用主色填充，或同时出现多个 `.primary`。
- ❌ 不透明灰色边框或纯黑纯白背景。
- ❌ 超过 0.2s 的过渡动画或弹跳缓动。
- ❌ 只定义 hover 而缺少 focus/disabled/loading/empty/error 状态。
- ❌ 表格/列表在窄窗口下出现横向滚动（应压缩列宽或响应式隐藏次要列）。

---

## 8. 代码示例

### 新增一个列表项（可选中 + 行内操作）

```tsx
<li
  className={active ? "active" : ""}
  onClick={() => onSelect(name)}
>
  <span className="bucket-icon"><Database size={14} /></span>
  <span className="bucket-name">{name}</span>
  <button
    className="icon-btn danger"
    title="删除"
    onClick={(e) => { e.stopPropagation(); onDelete(name); }}
  >
    <Trash2 size={13} />
  </button>
</li>
```

### 危险操作确认

```tsx
const ok = await confirm({
  title: "删除连接",
  message: `确定删除连接「${c.name}」？`,
  confirmText: "删除",
  danger: true,
});
if (ok) removeConnection(c.id);
```

---

## 9. 主题与国际化

### 9.1 主题

- 主题由 `src/settings.ts` 管理，取值 `"dark" | "light" | "system"`，持久化到 `localStorage`。
- 通过给 `<html>` 设置 `data-theme="dark|light"` 切换，**不要在组件里判断主题**。
- 深色为默认；浅色通过 `:root[data-theme="light"]` 覆盖全部设计令牌（见 `App.css`）。
- 新增颜色时必须同时提供深色（`:root`）与浅色（`:root[data-theme="light"]`）两套值。
- 语法高亮、棋盘格、类型徽章等硬编码色需在浅色主题下单独覆盖。

### 9.2 国际化（i18n）

- 所有面向用户的文案必须走 `src/i18n.ts` 的 `useT()`，**禁止在组件中硬编码中文或英文**。

```tsx
import { useT } from "../i18n";

const t = useT();
t("file.upload");
t("file.total", { n: 42 });
```

- 文案 key 采用「模块.语义」扁平命名（如 `conn.deleteTitle`、`pv.copyAll`）。
- 新增文案需同时补充 `zh` 与 `en` 两个字典；`en` 使用 `Record<MsgKey, string>` 强制校验完整性。
- 支持 `{name}` 形式的变量插值。
- 当前支持语言：中文（`zh`）、English（`en`）；默认跟随系统语言。

### 9.3 设置入口

- 顶栏右侧齿轮按钮打开 `SettingsDialog`。
- 设置项分组：外观（主题）、语言。

---

## 10. 变更检查清单

提交 UI 相关改动前逐项确认：

- [ ] 所有颜色/圆角/字体都通过 CSS 变量，无硬编码色值
- [ ] 新增颜色同时提供深色与浅色（`:root[data-theme="light"]`）两套值
- [ ] 所有用户可见文案使用 `useT()`，`zh`/`en` 字典均已补充
- [ ] 图标使用 lucide-react，无 emoji
- [ ] 无 `window.confirm/alert/prompt`，使用 `useDialogs()`
- [ ] 交互元素具备 hover / focus-visible / disabled / loading / empty / error 状态
- [ ] 同一区域最多一个主按钮
- [ ] 浮层支持 ESC 关闭、点击遮罩关闭
- [ ] 性能敏感功能（列表统计、预览加载）具备缓存 / 并发限制 / 上限保护
- [ ] 窄窗口（≥ 720px 宽）下无横向滚动、无截断错位
- [ ] 深色主题下对比度足够，文字层级（text/text-2/text-dim）使用正确
- [ ] 运行 `npm run build` 通过
- [ ] 在 Windows 上实际启动确认视觉效果（如涉及交互，测试 macOS 兼容性）
