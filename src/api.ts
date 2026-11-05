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
) =>
  invoke<ObjectInfo[]>("list_objects", { conn, bucket, prefix, delimiter });

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
