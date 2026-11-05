use aws_credential_types::Credentials;
use aws_sdk_s3::config::Region;
use aws_sdk_s3::Config;

use crate::config::Connection;

/// 根据连接配置构造一个 S3 客户端。
/// MinIO 兼容 S3 协议，因此直接复用 aws-sdk-s3。
pub fn build_client(conn: &Connection) -> anyhow::Result<aws_sdk_s3::Client> {
    let creds = Credentials::new(
        &conn.access_key,
        &conn.secret_key,
        None,
        None,
        "minion-static",
    );

    let region = if conn.region.is_empty() {
        Region::new("us-east-1".to_string())
    } else {
        Region::new(conn.region.clone())
    };

    let cfg: Config = aws_sdk_s3::Config::builder()
        .credentials_provider(creds)
        .region(region)
        .endpoint_url(&conn.endpoint)
        .behavior_version_latest()
        .force_path_style(conn.use_path_style)
        .build();

    Ok(aws_sdk_s3::Client::from_conf(cfg))
}
