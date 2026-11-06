fn main() {
    // 图标或配置变化时强制重新运行 build script，确保 Windows 资源内嵌新图标
    println!("cargo:rerun-if-changed=icons");
    println!("cargo:rerun-if-changed=icon-source.png");
    println!("cargo:rerun-if-changed=tauri.conf.json");
    tauri_build::build()
}
