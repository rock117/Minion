# Minion - MinIO 客户端

基于 Tauri 2 + React + TypeScript 的 MinIO / S3 兼容对象存储桌面客户端。

## 功能

- 多连接配置管理（增删改、持久化、连接测试）
- Bucket 浏览（列出 / 创建 / 删除）
- 对象浏览（目录式导航、面包屑、上级目录）
- 对象上传 / 下载（带进度事件）
- 删除对象

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
│           └── objects.rs      # 对象操作 + 进度事件
└── src/
    ├── api.ts                  # invoke 封装 + 类型
    ├── store.ts                # zustand 状态管理
    ├── App.tsx / App.css       # 三栏布局 + 暗色主题
    └── components/
        ├── ConnectionSidebar.tsx
        ├── BucketList.tsx
        └── FileBrowser.tsx
```

## 推荐 IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
