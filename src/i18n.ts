import { useCallback } from "react";
import { useSettings } from "./settings";

export type Locale = "zh" | "en";

const zh = {
  // 顶栏
  "app.notConnected": "未连接",

  // 连接
  "conn.title": "连接",
  "conn.new": "新建",
  "conn.expand": "展开侧边栏",
  "conn.collapse": "折叠侧边栏",
  "conn.newConn": "新建连接",
  "conn.empty": "还没有连接，点击「新建」添加",
  "conn.edit": "编辑",
  "conn.delete": "删除",
  "conn.name": "名称",
  "conn.endpoint": "Endpoint",
  "conn.region": "Region",
  "conn.accessKey": "Access Key",
  "conn.secretKey": "Secret Key",
  "conn.pathStyle": "Path Style",
  "conn.allowHttp": "允许 HTTP",
  "conn.test": "测试连接",
  "conn.testing": "测试中...",
  "conn.save": "保存",
  "conn.cancel": "取消",
  "conn.testOk": "连接成功，共 {n} 个 bucket",
  "conn.testFail": "失败: {msg}",
  "conn.deleteTitle": "删除连接",
  "conn.deleteMsg": "确定删除连接「{name}」？",

  // Bucket
  "bucket.title": "Buckets",
  "bucket.new": "新建 bucket",
  "bucket.emptyNoConn": "请先在左侧选择一个连接",
  "bucket.empty": "暂无 bucket，点击上方 + 新建",
  "bucket.deleteTitle": "删除 Bucket",
  "bucket.deleteMsg": "确定删除 bucket「{name}」？Bucket 必须为空才能删除。",
  "bucket.createTitle": "新建 Bucket",
  "bucket.createMsg": "输入 bucket 名称（仅小写字母、数字、连字符）",
  "bucket.placeholder": "my-bucket",
  "bucket.create": "创建",
  "bucket.created": "已创建 bucket「{name}」",
  "bucket.createFail": "创建失败: {msg}",
  "bucket.deleted": "已删除 bucket",
  "bucket.deleteFail": "删除失败: {msg}",

  // 文件
  "file.colName": "名称",
  "file.colSize": "大小",
  "file.colModified": "修改时间",
  "file.colActions": "操作",
  "file.upload": "上传",
  "file.busy": "处理中...",
  "file.up": "上级",
  "file.emptyDir": "该目录为空",
  "file.total": "共 {n} 项",
  "file.loading": "加载中...",
  "file.loadingMore": "加载更多...",
  "file.selectBucket": "← 请先选择一个 bucket",
  "file.preview": "预览",
  "file.viewImage": "看图",
  "file.download": "下载",
  "file.delete": "删除",
  "file.deleteTitle": "删除对象",
  "file.deleteMsg": "确定删除「{key}」？此操作不可撤销。",
  "file.uploaded": "已上传 {name}",
  "file.uploadFail": "上传失败: {msg}",
  "file.downloaded": "已下载到 {path}",
  "file.downloadFail": "下载失败: {msg}",
  "file.deleted": "已删除",
  "file.deleteFail": "删除失败: {msg}",
  "file.selectDir": "选择保存目录",

  // 预览
  "pv.loading": "加载中…",
  "pv.tree": "树状",
  "pv.raw": "原始",
  "pv.search": "搜索键或值…",
  "pv.copy": "复制",
  "pv.copied": "已复制",
  "pv.copyAll": "复制全部",
  "pv.expandAll": "展开全部",
  "pv.collapseAll": "折叠全部",
  "pv.jsonError": "JSON 解析失败: {msg}",
  "pv.xmlError": "XML 解析失败: {msg}",
  "pv.noMatch": "没有匹配项",
  "pv.tooLarge": "文件过大（{size}），超过预览上限 2MB，请使用下载。",
  "pv.escClose": "ESC 关闭 · ⌘/Ctrl+C 复制",
  "pv.lines": "{n} 行",
  "pv.keys": "{n} 键",
  "pv.children": "{n} 子节点",
  "pv.items": "{n} 项",
  "pv.fields": "{n} 字段",
  "pv.copyValue": "复制值",

  // 图片
  "img.loading": "加载中…",
  "img.fit": "适应",
  "img.fitTip": "适应窗口 (0)",
  "img.actual": "1:1",
  "img.actualTip": "原始尺寸 1:1 (1)",
  "img.rotate": "旋转 90° (R)",
  "img.zoomOut": "缩小 (-)",
  "img.zoomIn": "放大 (+)",
  "img.prev": "上一张 (←)",
  "img.next": "下一张 (→)",
  "img.counter": "第 {i} 张 / 共 {n} 张",
  "img.single": "1 张图片",
  "img.hint": "← → 切换 · 滚轮缩放 · 拖动平移 · 0 适应 · 1 原始 · R 旋转 · ESC 关闭",

  // 设置
  "settings.title": "设置",
  "settings.open": "设置",
  "settings.appearance": "外观",
  "settings.theme": "主题",
  "settings.themeDark": "深色",
  "settings.themeLight": "浅色",
  "settings.themeSystem": "跟随系统",
  "settings.language": "语言",
  "settings.langZh": "中文",
  "settings.langEn": "English",
  "settings.folderCounts": "显示目录文件数",
  "settings.folderCountsHint": "进入目录时统计子目录文件数（每个目录一次请求，上限 1000）",

  // 通用
  "dialog.ok": "确定",
  "dialog.cancel": "取消",
  "dialog.delete": "删除",
} as const;

export type MsgKey = keyof typeof zh;

const en: Record<MsgKey, string> = {
  "app.notConnected": "Not connected",

  "conn.title": "Connections",
  "conn.new": "New",
  "conn.expand": "Expand sidebar",
  "conn.collapse": "Collapse sidebar",
  "conn.newConn": "New connection",
  "conn.empty": "No connections yet. Click “New” to add one.",
  "conn.edit": "Edit",
  "conn.delete": "Delete",
  "conn.name": "Name",
  "conn.endpoint": "Endpoint",
  "conn.region": "Region",
  "conn.accessKey": "Access Key",
  "conn.secretKey": "Secret Key",
  "conn.pathStyle": "Path Style",
  "conn.allowHttp": "Allow HTTP",
  "conn.test": "Test connection",
  "conn.testing": "Testing...",
  "conn.save": "Save",
  "conn.cancel": "Cancel",
  "conn.testOk": "Connected. {n} bucket(s).",
  "conn.testFail": "Failed: {msg}",
  "conn.deleteTitle": "Delete connection",
  "conn.deleteMsg": "Delete connection “{name}”?",

  "bucket.title": "Buckets",
  "bucket.new": "New bucket",
  "bucket.emptyNoConn": "Select a connection on the left",
  "bucket.empty": "No buckets. Click + above to create one.",
  "bucket.deleteTitle": "Delete bucket",
  "bucket.deleteMsg": "Delete bucket “{name}”? The bucket must be empty.",
  "bucket.createTitle": "New bucket",
  "bucket.createMsg": "Enter a bucket name (lowercase letters, numbers, hyphens)",
  "bucket.placeholder": "my-bucket",
  "bucket.create": "Create",
  "bucket.created": "Created bucket “{name}”",
  "bucket.createFail": "Create failed: {msg}",
  "bucket.deleted": "Bucket deleted",
  "bucket.deleteFail": "Delete failed: {msg}",

  "file.colName": "Name",
  "file.colSize": "Size",
  "file.colModified": "Modified",
  "file.colActions": "Actions",
  "file.upload": "Upload",
  "file.busy": "Working...",
  "file.up": "Up",
  "file.emptyDir": "This folder is empty",
  "file.total": "{n} item(s)",
  "file.loading": "Loading...",
  "file.loadingMore": "Loading more...",
  "file.selectBucket": "← Select a bucket first",
  "file.preview": "Preview",
  "file.viewImage": "View",
  "file.download": "Download",
  "file.delete": "Delete",
  "file.deleteTitle": "Delete object",
  "file.deleteMsg": "Delete “{key}”? This cannot be undone.",
  "file.uploaded": "Uploaded {name}",
  "file.uploadFail": "Upload failed: {msg}",
  "file.downloaded": "Downloaded to {path}",
  "file.downloadFail": "Download failed: {msg}",
  "file.deleted": "Deleted",
  "file.deleteFail": "Delete failed: {msg}",
  "file.selectDir": "Choose save folder",

  "pv.loading": "Loading…",
  "pv.tree": "Tree",
  "pv.raw": "Raw",
  "pv.search": "Search keys or values…",
  "pv.copy": "Copy",
  "pv.copied": "Copied",
  "pv.copyAll": "Copy all",
  "pv.expandAll": "Expand all",
  "pv.collapseAll": "Collapse all",
  "pv.jsonError": "JSON parse error: {msg}",
  "pv.xmlError": "XML parse error: {msg}",
  "pv.noMatch": "No matches",
  "pv.tooLarge": "File too large ({size}); exceeds the 2MB preview limit. Please download it.",
  "pv.escClose": "ESC to close · ⌘/Ctrl+C to copy",
  "pv.lines": "{n} line(s)",
  "pv.keys": "{n} key(s)",
  "pv.children": "{n} child node(s)",
  "pv.items": "{n} item(s)",
  "pv.fields": "{n} field(s)",
  "pv.copyValue": "Copy value",

  "img.loading": "Loading…",
  "img.fit": "Fit",
  "img.fitTip": "Fit to window (0)",
  "img.actual": "1:1",
  "img.actualTip": "Actual size 1:1 (1)",
  "img.rotate": "Rotate 90° (R)",
  "img.zoomOut": "Zoom out (-)",
  "img.zoomIn": "Zoom in (+)",
  "img.prev": "Previous (←)",
  "img.next": "Next (→)",
  "img.counter": "Image {i} of {n}",
  "img.single": "1 image",
  "img.hint": "← → switch · wheel zoom · drag pan · 0 fit · 1 actual · R rotate · ESC close",

  "settings.title": "Settings",
  "settings.open": "Settings",
  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.themeSystem": "System",
  "settings.language": "Language",
  "settings.langZh": "中文",
  "settings.langEn": "English",
  "settings.folderCounts": "Show folder item counts",
  "settings.folderCountsHint": "Count items in each subfolder on demand (one request per folder, max 1000)",

  "dialog.ok": "OK",
  "dialog.cancel": "Cancel",
  "dialog.delete": "Delete",
};

const messages: Record<Locale, Record<MsgKey, string>> = { zh, en };

export function translate(
  locale: Locale,
  key: MsgKey,
  vars?: Record<string, string | number>,
): string {
  let s = messages[locale][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

export type TFunc = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;

/** 返回绑定当前语言、并在语言切换时自动更新的翻译函数 */
export function useT(): TFunc {
  const locale = useSettings((s) => s.locale);
  return useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );
}
