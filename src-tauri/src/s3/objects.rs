use aws_sdk_s3::Client;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::AppHandle;
use tauri::Emitter;

/// 预览内容的最大字节数（超过则不下载，提示用户用下载）
const PREVIEW_MAX_BYTES: i64 = 2 * 1024 * 1024;

/// 图片预览的最大字节数
const IMAGE_MAX_BYTES: i64 = 10 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectInfo {
    pub key: String,
    pub size: i64,
    pub last_modified: Option<String>,
    pub etag: Option<String>,
    pub is_dir: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectContent {
    pub key: String,
    pub size: i64,
    pub truncated: bool,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListObjectsResult {
    pub objects: Vec<ObjectInfo>,
    pub next_continuation_token: Option<String>,
    pub is_truncated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountResult {
    pub count: i64,
    pub capped: bool,
}

/// 列出指定 bucket + 前缀下的对象（模拟"目录"概念）
/// 支持分页：传入 continuation_token 获取下一页
pub async fn list_objects(
    client: &Client,
    bucket: &str,
    prefix: &str,
    delimiter: Option<&str>,
    continuation_token: Option<&str>,
) -> anyhow::Result<ListObjectsResult> {
    let mut req = client.list_objects_v2().bucket(bucket).prefix(prefix);
    if let Some(d) = delimiter {
        req = req.delimiter(d);
    }
    if let Some(token) = continuation_token {
        req = req.continuation_token(token);
    }
    let resp = req.send().await?;

    let mut result = Vec::new();

    // "目录"（CommonPrefixes）
    for p in resp.common_prefixes() {
        if let Some(prefix) = p.prefix() {
            result.push(ObjectInfo {
                key: prefix.to_string(),
                size: 0,
                last_modified: None,
                etag: None,
                is_dir: true,
            });
        }
    }

    // 实际对象
    for obj in resp.contents() {
        let key = obj.key().unwrap_or_default().to_string();
        // 跳过与 prefix 完全相同的"占位对象"
        if key == prefix {
            continue;
        }
        result.push(ObjectInfo {
            key,
            size: obj.size().unwrap_or(0),
            last_modified: obj.last_modified().map(|d| d.to_string()),
            etag: obj.e_tag().map(|s| s.to_string()),
            is_dir: false,
        });
    }

    Ok(ListObjectsResult {
        objects: result,
        next_continuation_token: resp.next_continuation_token().map(|s| s.to_string()),
        is_truncated: resp.is_truncated().unwrap_or(false),
    })
}

/// 上传本地文件到指定 bucket/key，并通过 Tauri 事件推送进度
pub async fn upload_file(
    app: &AppHandle,
    client: &Client,
    bucket: &str,
    key: &str,
    local_path: &str,
) -> anyhow::Result<()> {
    let path = Path::new(local_path);
    let body = aws_sdk_s3::primitives::ByteStream::from_path(path)
        .await
        .map_err(|e| anyhow::anyhow!("open file: {e}"))?;

    let total_size = tokio::fs::metadata(path).await?.len();

    let _ = app.emit(
        "upload://progress",
        serde_json::json!({
            "bucket": bucket,
            "key": key,
            "phase": "started",
            "total": total_size,
        }),
    );

    client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(body)
        .send()
        .await?;

    let _ = app.emit(
        "upload://progress",
        serde_json::json!({
            "bucket": bucket,
            "key": key,
            "phase": "completed",
            "total": total_size,
        }),
    );

    Ok(())
}

/// 下载对象到本地路径
pub async fn download_file(
    app: &AppHandle,
    client: &Client,
    bucket: &str,
    key: &str,
    local_path: &str,
) -> anyhow::Result<()> {
    let resp = client.get_object().bucket(bucket).key(key).send().await?;
    let total = resp.content_length().unwrap_or(0);

    let _ = app.emit(
        "download://progress",
        serde_json::json!({
            "bucket": bucket,
            "key": key,
            "phase": "started",
            "total": total,
        }),
    );

    let body = resp.body.into_async_read();
    let mut file = tokio::fs::File::create(local_path).await?;
    let mut reader = body;
    let mut written: u64 = 0;
    let mut buf = vec![0u8; 64 * 1024];
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    loop {
        let n = reader.read(&mut buf).await?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n]).await?;
        written += n as u64;
        let _ = app.emit(
            "download://progress",
            serde_json::json!({
                "bucket": bucket,
                "key": key,
                "phase": "progress",
                "total": total,
                "written": written,
            }),
        );
    }
    file.flush().await?;

    let _ = app.emit(
        "download://progress",
        serde_json::json!({
            "bucket": bucket,
            "key": key,
            "phase": "completed",
            "total": total,
        }),
    );

    Ok(())
}

/// 统计某前缀下的对象数量（单次请求，最多 max_keys 个；超出则 capped=true）
/// MinIO/S3 无原生计数 API，这里用一次 list 请求换取低成本统计。
pub async fn count_objects(
    client: &Client,
    bucket: &str,
    prefix: &str,
    max_keys: i32,
) -> anyhow::Result<CountResult> {
    let resp = client
        .list_objects_v2()
        .bucket(bucket)
        .prefix(prefix)
        .max_keys(max_keys)
        .send()
        .await?;

    // 排除与 prefix 完全相同的“目录占位对象”
    let count = resp
        .contents()
        .iter()
        .filter(|o| o.key() != Some(prefix))
        .count() as i64;

    Ok(CountResult {
        count,
        capped: resp.is_truncated().unwrap_or(false),
    })
}

/// 删除单个对象
pub async fn delete_object(client: &Client, bucket: &str, key: &str) -> anyhow::Result<()> {
    client
        .delete_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;
    Ok(())
}

/// 读取对象内容用于预览（带大小限制，超过 PREVIEW_MAX_BYTES 会截断）
pub async fn get_object_content(
    client: &Client,
    bucket: &str,
    key: &str,
) -> anyhow::Result<ObjectContent> {
    // 先 head 一下拿大小，避免下载超大文件
    let head = client
        .head_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;
    let size = head.content_length().unwrap_or(0);
    if size > PREVIEW_MAX_BYTES {
        return Ok(ObjectContent {
            key: key.to_string(),
            size,
            truncated: true,
            content: String::new(),
        });
    }

    let resp = client.get_object().bucket(bucket).key(key).send().await?;
    let bytes = resp.body.collect().await?.into_bytes();
    let content = String::from_utf8_lossy(&bytes).to_string();
    Ok(ObjectContent {
        key: key.to_string(),
        size,
        truncated: false,
        content,
    })
}

/// 读取对象原始字节用于图片预览（带 IMAGE_MAX_BYTES 限制）
/// 返回 (bytes, size, truncated)
pub async fn get_object_bytes(
    client: &Client,
    bucket: &str,
    key: &str,
) -> anyhow::Result<(Vec<u8>, i64, bool)> {
    let head = client
        .head_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;
    let size = head.content_length().unwrap_or(0);
    if size > IMAGE_MAX_BYTES {
        return Ok((Vec::new(), size, true));
    }

    let resp = client.get_object().bucket(bucket).key(key).send().await?;
    let bytes = resp.body.collect().await?.into_bytes();
    Ok((bytes.to_vec(), size, false))
}
