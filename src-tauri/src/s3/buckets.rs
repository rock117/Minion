use aws_sdk_s3::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BucketInfo {
    pub name: String,
    pub created_at: Option<String>,
}

/// 列出当前账号下的所有 bucket
pub async fn list_buckets(client: &Client) -> anyhow::Result<Vec<BucketInfo>> {
    let resp = client.list_buckets().send().await?;
    let buckets = resp
        .buckets()
        .iter()
        .map(|b| BucketInfo {
            name: b.name().unwrap_or_default().to_string(),
            created_at: b.creation_date().map(|d| d.to_string()),
        })
        .collect();
    Ok(buckets)
}
