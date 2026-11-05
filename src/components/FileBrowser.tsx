import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useStore } from "../store";
import {
  deleteObject,
  downloadFile,
  formatSize,
  uploadFile,
  type ObjectInfo,
} from "../api";

export function FileBrowser() {
  const {
    activeBucket,
    objects,
    prefix,
    loadObjects,
    enterDir,
    goUp,
    activeConn,
    setPrefix,
  } = useStore();

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (activeBucket) loadObjects();
  }, [activeBucket, loadObjects]);

  if (!activeBucket) {
    return <div className="file-browser empty">← 请先选择一个 bucket</div>;
  }

  const onUpload = async () => {
    const conn = activeConn();
    if (!conn) return;
    const files = await open({ multiple: false });
    if (!files || Array.isArray(files)) return;
    const localPath = files as string;
    const filename = localPath.split(/[\\/]/).pop() || "upload.bin";
    const key = prefix + filename;
    setBusy(true);
    try {
      await uploadFile(conn, activeBucket, key, localPath);
      await loadObjects();
    } catch (e) {
      alert(`上传失败: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async (obj: ObjectInfo) => {
    const conn = activeConn();
    if (!conn) return;
    const savePath = await open({
      directory: true,
      multiple: false,
      title: "选择保存目录",
    });
    if (!savePath || Array.isArray(savePath)) return;
    const dir = savePath as string;
    const filename = obj.key.split("/").pop() || "download.bin";
    const full = `${dir}/${filename}`;
    setBusy(true);
    try {
      await downloadFile(conn, activeBucket, obj.key, full);
      alert(`已下载到: ${full}`);
    } catch (e) {
      alert(`下载失败: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (obj: ObjectInfo) => {
    const conn = activeConn();
    if (!conn) return;
    if (!confirm(`删除 "${obj.key}"?`)) return;
    try {
      await deleteObject(conn, activeBucket, obj.key);
      await loadObjects();
    } catch (e) {
      alert(`删除失败: ${e}`);
    }
  };

  const breadcrumbs = prefix.split("/").filter(Boolean);

  return (
    <div className="file-browser">
      <div className="browser-header">
        <div className="breadcrumbs">
          <button
            onClick={async () => {
              setPrefix("");
              await loadObjects();
            }}
          >
            {activeBucket}
          </button>
          {breadcrumbs.map((part, i) => {
            const p = breadcrumbs.slice(0, i + 1).join("/") + "/";
            return (
              <span key={i}>
                <span className="sep">/</span>
                <button
                  onClick={async () => {
                    setPrefix(p);
                    await loadObjects();
                  }}
                >
                  {part}
                </button>
              </span>
            );
          })}
        </div>
        <div className="browser-actions">
          {prefix && <button onClick={goUp}>↑ 上级</button>}
          <button onClick={onUpload} disabled={busy}>
            {busy ? "处理中..." : "⬆ 上传"}
          </button>
        </div>
      </div>

      <table className="object-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>大小</th>
            <th>修改时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {objects.map((obj) => (
            <tr key={obj.key} className={obj.is_dir ? "dir-row" : ""}>
              <td>
                {obj.is_dir ? (
                  <span className="obj-name dir" onClick={() => enterDir(obj.key)}>
                    📁 {obj.key.replace(prefix, "")}
                  </span>
                ) : (
                  <span className="obj-name">
                    📄 {obj.key.replace(prefix, "")}
                  </span>
                )}
              </td>
              <td>{obj.is_dir ? "-" : formatSize(obj.size)}</td>
              <td>{obj.last_modified ?? "-"}</td>
              <td className="row-actions">
                {!obj.is_dir && (
                  <button onClick={() => onDownload(obj)} disabled={busy}>
                    下载
                  </button>
                )}
                <button
                  className="danger"
                  onClick={() => onDelete(obj)}
                  disabled={busy}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
          {objects.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-hint">
                该目录为空
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
