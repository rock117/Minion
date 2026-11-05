// 与 Rust 端 commands 对应的 TS 类型与 invoke 封装

import { invoke } from "@tauri-apps/api/core";

export interface Connection {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  access_key: string;
  secret_key: string;
  use_path_style: boolean;
  allow_http: boolean;
}

export interface BucketInfo {
  name: string;
  created_at: string | null;
}

export interface ObjectInfo {
  key: string;
  size: number;
  last_modified: string | null;
  etag: string | null;
  is_dir: boolean;
}

export interface ObjectContent {
  key: string;
  size: number;
  truncated: boolean;
  content: string;
}

export interface ListObjectsResult {
  objects: ObjectInfo[];
  next_continuation_token: string | null;
  is_truncated: boolean;
}

// ---------- 连接管理 ----------
export const listConnections = () => invoke<Connection[]>("list_connections");

export const saveConnection = (conn: Connection) =>
  invoke<Connection>("save_connection", { conn });

export const deleteConnection = (id: string) =>
  invoke<void>("delete_connection", { id });

export const testConnection = (conn: Connection) =>
  invoke<BucketInfo[]>("test_connection", { conn });

// ---------- Bucket ----------
export const listBuckets = (conn: Connection) =>
  invoke<BucketInfo[]>("list_buckets", { conn });

export const createBucket = (conn: Connection, bucket: string) =>
  invoke<void>("create_bucket", { conn, bucket });

export const deleteBucket = (conn: Connection, bucket: string) =>
  invoke<void>("delete_bucket", { conn, bucket });

// ---------- Object ----------
export const listObjects = (
  conn: Connection,
  bucket: string,
  prefix?: string,
  delimiter?: string,
  continuationToken?: string,
) =>
  invoke<ListObjectsResult>("list_objects", {
    conn,
    bucket,
    prefix,
    delimiter,
    continuationToken,
  });

export const uploadFile = (
  conn: Connection,
  bucket: string,
  key: string,
  localPath: string,
) => invoke<void>("upload_file", { conn, bucket, key, localPath });

export const downloadFile = (
  conn: Connection,
  bucket: string,
  key: string,
  localPath: string,
) => invoke<void>("download_file", { conn, bucket, key, localPath });

export const deleteObject = (conn: Connection, bucket: string, key: string) =>
  invoke<void>("delete_object", { conn, bucket, key });

export const getObjectContent = (conn: Connection, bucket: string, key: string) =>
  invoke<ObjectContent>("get_object_content", { conn, bucket, key });

export const getObjectBytes = (conn: Connection, bucket: string, key: string) =>
  invoke<ArrayBuffer>("get_object_bytes", { conn, bucket, key });

// ---------- 工具 ----------
export function formatSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function emptyConnection(): Connection {
  return {
    id: "",
    name: "",
    endpoint: "http://localhost:9000",
    region: "us-east-1",
    access_key: "",
    secret_key: "",
    use_path_style: true,
    allow_http: true,
  };
}

// 可预览的文本扩展名
const TEXT_PREVIEWABLE_EXT = [
  ".txt", ".json", ".xml", ".csv", ".log", ".md", ".yaml", ".yml",
  ".ini", ".conf", ".cfg", ".toml", ".html", ".htm", ".css", ".js",
  ".ts", ".jsx", ".tsx", ".rs", ".go", ".py", ".java", ".c", ".cpp",
  ".h", ".sh", ".bat", ".ps1", ".sql", ".env",
];

// 可预览的图片扩展名 → mime type
const IMAGE_EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

export function isTextPreviewable(key: string): boolean {
  const lower = key.toLowerCase();
  return TEXT_PREVIEWABLE_EXT.some((ext) => lower.endsWith(ext));
}

export function isImagePreviewable(key: string): boolean {
  const lower = key.toLowerCase();
  return Object.keys(IMAGE_EXT_MIME).some((ext) => lower.endsWith(ext));
}

export function getImageMime(key: string): string {
  const lower = key.toLowerCase();
  for (const [ext, mime] of Object.entries(IMAGE_EXT_MIME)) {
    if (lower.endsWith(ext)) return mime;
  }
  return "application/octet-stream";
}
