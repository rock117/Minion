use aws_sdk_s3::Client;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::AppHandle;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectInfo {
    pub key: String,
    pub size: i64,
    pub last_modified: Option<String>,
    pub etag: Option<String>,
    pub is_dir: bool,
}

/// 列出指定 bucket + 前缀下的对象（模拟"目录"概念）
pub async fn list_objects(
    client: &Client,
    bucket: &str,
    prefix: &str,
    delimiter: Option<&str>,
) -> anyhow::Result<Vec<ObjectInfo>> {
    let mut req = client.list_objects_v2().bucket(bucket).prefix(prefix);
    if let Some(d) = delimiter {
        req = req.delimiter(d);
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

    Ok(result)
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
