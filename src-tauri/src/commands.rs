use tauri::AppHandle;

use crate::config::{self, Connection};
use crate::s3;

/// 把 anyhow::Error 转成字符串，方便前端拿到 message
fn to_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

// ---------- 连接管理 ----------

#[tauri::command]
pub fn list_connections(app: AppHandle) -> Vec<Connection> {
    config::load_connections(&app)
}

#[tauri::command]
pub fn save_connection(app: AppHandle, conn: Connection) -> Result<Connection, String> {
    let mut conns = config::load_connections(&app);
    let mut conn = conn;
    if conn.id.is_empty() {
        conn.id = uuid::Uuid::new_v4().to_string();
        conns.push(conn.clone());
    } else {
        if let Some(c) = conns.iter_mut().find(|c| c.id == conn.id) {
            *c = conn.clone();
        } else {
            conns.push(conn.clone());
        }
    }
    config::save_connections(&app, &conns).map_err(to_err)?;
    Ok(conn)
}

#[tauri::command]
pub fn delete_connection(app: AppHandle, id: String) -> Result<(), String> {
    let mut conns = config::load_connections(&app);
    conns.retain(|c| c.id != id);
    config::save_connections(&app, &conns).map_err(to_err)?;
    Ok(())
}

#[tauri::command]
pub async fn test_connection(conn: Connection) -> Result<Vec<s3::BucketInfo>, String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::list_buckets(&client).await.map_err(to_err)
}

// ---------- Bucket ----------

#[tauri::command]
pub async fn list_buckets(conn: Connection) -> Result<Vec<s3::BucketInfo>, String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::list_buckets(&client).await.map_err(to_err)
}

#[tauri::command]
pub async fn create_bucket(conn: Connection, bucket: String) -> Result<(), String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    client
        .create_bucket()
        .bucket(&bucket)
        .send()
        .await
        .map_err(to_err)?;
    Ok(())
}

#[tauri::command]
pub async fn delete_bucket(conn: Connection, bucket: String) -> Result<(), String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    client
        .delete_bucket()
        .bucket(&bucket)
        .send()
        .await
        .map_err(to_err)?;
    Ok(())
}

// ---------- Object ----------

#[tauri::command]
pub async fn list_objects(
    conn: Connection,
    bucket: String,
    prefix: Option<String>,
    delimiter: Option<String>,
) -> Result<Vec<s3::ObjectInfo>, String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::list_objects(
        &client,
        &bucket,
        prefix.as_deref().unwrap_or(""),
        delimiter.as_deref(),
    )
    .await
    .map_err(to_err)
}

#[tauri::command]
pub async fn upload_file(
    app: AppHandle,
    conn: Connection,
    bucket: String,
    key: String,
    local_path: String,
) -> Result<(), String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::upload_file(&app, &client, &bucket, &key, &local_path)
        .await
        .map_err(to_err)
}

#[tauri::command]
pub async fn download_file(
    app: AppHandle,
    conn: Connection,
    bucket: String,
    key: String,
    local_path: String,
) -> Result<(), String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::download_file(&app, &client, &bucket, &key, &local_path)
        .await
        .map_err(to_err)
}

#[tauri::command]
pub async fn delete_object(
    conn: Connection,
    bucket: String,
    key: String,
) -> Result<(), String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::delete_object(&client, &bucket, &key).await.map_err(to_err)
}

#[tauri::command]
pub async fn get_object_content(
    conn: Connection,
    bucket: String,
    key: String,
) -> Result<s3::ObjectContent, String> {
    let client = s3::build_client(&conn).map_err(to_err)?;
    s3::get_object_content(&client, &bucket, &key)
        .await
        .map_err(to_err)
}
