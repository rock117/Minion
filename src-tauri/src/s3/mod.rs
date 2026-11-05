pub mod client;
pub mod buckets;
pub mod objects;

pub use client::build_client;
pub use buckets::{list_buckets, BucketInfo};
pub use objects::{
    list_objects, upload_file, download_file, delete_object, get_object_content, ObjectInfo,
    ObjectContent,
};
