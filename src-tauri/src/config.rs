use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "minion-config.json";
const CONNECTIONS_KEY: &str = "connections";

/// 一条 MinIO 连接配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub region: String,
    pub access_key: String,
    pub secret_key: String,
    pub use_path_style: bool,
    pub allow_http: bool,
}

/// 读取所有连接配置
pub fn load_connections(app: &AppHandle) -> Vec<Connection> {
    let store = match app.store(STORE_FILE) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[config] open store failed: {e}");
            return Vec::new();
        }
    };
    store
        .get(CONNECTIONS_KEY)
        .and_then(|v| serde_json::from_value::<Vec<Connection>>(v).ok())
        .unwrap_or_default()
}

/// 保存全部连接配置
pub fn save_connections(app: &AppHandle, conns: &[Connection]) -> anyhow::Result<()> {
    let store = app.store(STORE_FILE)?;
    store.set(
        CONNECTIONS_KEY,
        serde_json::to_value(conns).map_err(|e| anyhow::anyhow!("serialize: {e}"))?,
    );
    store.save()?;
    Ok(())
}
