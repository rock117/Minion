# Minion - MinIO 客户端

基于 Tauri 2 + React + TypeScript 的 MinIO / S3 兼容对象存储桌面客户端。

## 功能

- 多连接配置管理（增删改、持久化、连接测试）
- Bucket 浏览（列出 / 创建 / 删除）
- 对象浏览（目录式导航、面包屑、上级目录）
- 对象上传 / 下载（带进度事件）
- 删除对象
- 文本/JSON/XML 预览（树状结构 + 原始视图切换）
- 图片预览（上一张/下一张切换 + 键盘左右键）
- 大目录分页加载（每页 1000 + 无限滚动 + 虚拟滚动，支持数万文件不卡顿）
- 主题设置（深色 / 浅色 / 跟随系统）
- 国际化（中文 / English，可实时切换）

## 技术栈

- **前端**：React + TypeScript + Vite + zustand
- **后端**：Rust + Tauri 2 + aws-sdk-s3（MinIO 兼容 S3 协议）
- **插件**：tauri-plugin-store（配置持久化）、tauri-plugin-dialog / fs（文件选择）

## 环境要求

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://www.rust-lang.org/tools/install)（stable 工具链）
- Tauri 2 系统依赖：
  - **Windows**：[WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)（Win11 自带）、MSVC 构建工具
  - **macOS**：Xcode Command Line Tools
  - **Linux**：参考 [Tauri prerequisites](https://tauri.app/start/prerequisites/)

## 如何运行

### 开发模式

```bash
# 安装前端依赖
npm install

# 启动开发服务器（同时编译 Rust 后端并打开窗口）
npm run tauri dev
```

首次运行会编译全部 Rust 依赖（含 aws-sdk-s3），耗时约 1–3 分钟，之后增量编译很快。

### 生产构建

```bash
# 打包成可执行文件（Windows 下生成 .exe / .msi）
npm run tauri build
```

产物位于 `src-tauri/target/release/bundle/`。

### 仅前端开发（不开 Rust）

```bash
npm run dev      # 浏览器访问 http://localhost:1420
npm run build    # 仅构建前端到 dist/
```

> 注意：仅前端模式下无法调用 Tauri commands（连接 MinIO 等功能不可用），仅适合调样式。

## 如何使用

### 1. 添加 MinIO 连接

1. 启动应用后，左侧栏点击 **+ 新建**
2. 填写连接信息：
   - **名称**：任意标识，如 `本地 MinIO`
   - **Endpoint**：MinIO 地址，如 `http://localhost:9000`
   - **Region**：通常填 `us-east-1`（MinIO 不强制）
   - **Access Key / Secret Key**：MinIO 控制台创建的访问密钥
   - **Path Style**：本地 MinIO 勾选（推荐）
   - **允许 HTTP**：本地或非 HTTPS 环境勾选
3. 点 **测试连接** 验证凭证，成功会显示 bucket 数量
4. 点 **保存**，左侧栏出现新连接

### 2. 浏览 Bucket

- 点击左侧连接名，中间栏自动加载该账号下的 bucket 列表
- 点 **+ 新建** 创建新 bucket（输入名称即可）
- 点 bucket 行内的 **✕** 删除（需先清空内部对象）

### 3. 浏览对象

- 选中 bucket 后，右侧文件浏览器加载根目录对象
- **目录**（带 📁 图标）点击进入
- 顶部面包屑可点击跳转到任意层级
- 点 **↑ 上级** 返回上一级目录

### 4. 上传文件

- 进入目标目录后点 **⬆ 上传**
- 系统文件对话框选择本地文件
- 上传进度通过 `upload://progress` 事件推送（控制台可见），完成后自动刷新列表

### 5. 下载文件

- 对象行内点 **下载**
- 选择保存目录，文件下载到该目录下（文件名为对象 key 的最后一段）
- 下载进度通过 `download://progress` 事件推送

### 6. 删除对象

- 对象行内点 **删除**，确认后即删除

### 7. 预览文本/JSON/XML

- 文本类对象（`.txt` `.json` `.xml` `.csv` `.md` `.yaml` `.log` 等约 30 种扩展名）行内会显示 **预览** 按钮
- 点击后弹出预览面板：
  - **JSON**：自动解析并展示为可折叠的树状结构，键/字符串/数字/布尔/空值分别着色
  - **XML**：使用浏览器 DOMParser 解析为树状结构，标签名/属性/文本节点分别着色
  - **其他文本**：直接显示原始内容
- 顶部可切换 **树状** / **原始** 视图（纯文本类无此切换）
- 预览大小上限 **2MB**，超过会提示用下载代替

### 8. 预览图片

- 图片对象（`.jpg` `.jpeg` `.png` `.gif` `.webp` `.bmp` `.svg` `.ico` `.avif`）行内会显示 **看图** 按钮
- 点击后弹出图片预览面板：
  - 支持上一张 / 下一张切换（同目录下所有图片）
  - 键盘 **←** **→** 切换，**ESC** 关闭
  - 底部显示当前序号 `N / 总数`
- 图片预览大小上限 **10MB**，超过会提示用下载代替
- 技术实现：后端用 `tauri::ipc::Response` 返回原始字节（无 base64 膨胀），前端用 Blob URL 显示，切换时自动释放旧 URL 避免内存泄漏

### 9. 大目录浏览（分页 + 虚拟滚动）

当目录下文件数超过 1000 时：

- **后端分页**：S3 API 单次最多返回 1000 个对象，使用 `continuation_token` 翻页
- **无限滚动**：滚动到列表底部 200px 范围内时自动加载下一页（追加到列表末尾）
- **虚拟滚动**：只渲染可视区域内的行（约 20 行 + 前后各 5 行缓冲），即使加载了数万个文件也不会卡顿
- 底部状态栏显示"加载中..."、"共 N 项"等提示

技术细节：
- 行高固定 36px，通过 `scrollTop` 计算可视区间 `[startIndex, endIndex]`
- 用绝对定位 + 总高度占位 div 实现滚动条
- `ResizeObserver` 监听容器尺寸变化

## 配置存储位置

连接配置通过 `tauri-plugin-store` 持久化，文件名 `minion-config.json`：

- **Windows**：`%APPDATA%\com.minion.app\minion-config.json`
- **macOS**：`~/Library/Application Support/com.minion.app/minion-config.json`
- **Linux**：`~/.config/com.minion.app/minion-config.json`

> ⚠️ 当前配置为明文存储（含 secret key）。生产环境建议改用 `tauri-plugin-stronghold` 加密存储。

## 项目结构

```
Minion/
├── src-tauri/
│   ├── Cargo.toml              # Rust 依赖
│   ├── capabilities/           # Tauri 权限配置
│   └── src/
│       ├── lib.rs              # 入口，注册 commands + 插件
│       ├── config.rs           # 连接配置读写
│       ├── commands.rs         # Tauri command 桥接层
│       └── s3/
│           ├── client.rs       # S3 client 构造
│           ├── buckets.rs      # bucket 操作
│           └── objects.rs      # 对象操作 + 进度事件 + 内容/图片预览
└── src/
    ├── api.ts                  # invoke 封装 + 类型 + 预览判断
    ├── store.ts                # zustand 状态管理
    ├── settings.ts             # 主题/语言设置（持久化 + 应用）
    ├── i18n.ts                 # 国际化字典 + useT()
    ├── dialogs.tsx             # 应用内对话框（confirm / prompt / toast）
    ├── App.tsx / App.css       # 布局 + 设计系统（CSS 变量 + 深/浅主题）
    └── components/
        ├── ConnectionSidebar.tsx
        ├── BucketList.tsx
        ├── FileBrowser.tsx
        ├── SettingsDialog.tsx  # 设置面板（主题/语言）
        ├── PreviewShell.tsx    # 统一预览外壳
        ├── previewUtils.ts     # 预览工具（类型识别/复制等）
        ├── PreviewPanel.tsx    # 文本/JSON/XML 预览
        ├── ImagePreviewPanel.tsx # 图片预览（缩放/平移/旋转）
        └── tree/
            ├── JsonTree.tsx    # JSON 树状渲染
            └── XmlTree.tsx     # XML 树状渲染
```

## 开发规范

- **[`docs/UI_DESIGN.md`](docs/UI_DESIGN.md)**：UI 设计规范（设计令牌、组件规范、交互状态、反模式、变更检查清单）
- **[`AGENTS.md`](AGENTS.md)**：项目规则（技术栈、命令、代码约定、UI 红线）
- **[`.devin/rules/ui-design.md`](.devin/rules/ui-design.md)**：修改前端界面时自动应用的设计自检清单

修改任何界面相关代码前请先阅读 `docs/UI_DESIGN.md`，并遵循其中的检查清单。

## 推荐 IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
