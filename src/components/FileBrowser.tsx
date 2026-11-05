import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useStore } from "../store";
import {
  deleteObject,
  downloadFile,
  formatSize,
  isImagePreviewable,
  isTextPreviewable,
  uploadFile,
  type ObjectInfo,
} from "../api";
import { PreviewPanel } from "./PreviewPanel";
import { ImagePreviewPanel } from "./ImagePreviewPanel";

const ROW_HEIGHT = 36;
const BUFFER_ROWS = 5;
const LOAD_MORE_THRESHOLD = 200; // 距底部多少 px 时触发加载下一页

export function FileBrowser() {
  const {
    activeBucket,
    objects,
    prefix,
    isLoading,
    hasMore,
    loadObjects,
    loadMoreObjects,
    enterDir,
    goUp,
    activeConn,
    setPrefix,
  } = useStore();

  const [busy, setBusy] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [imagePreviewKey, setImagePreviewKey] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    if (activeBucket) loadObjects();
  }, [activeBucket, loadObjects]);

  // 监听容器尺寸
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewportHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    // 无限滚动：接近底部时加载下一页
    const distanceToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < LOAD_MORE_THRESHOLD && hasMore && !isLoading) {
      loadMoreObjects();
    }
  }, [hasMore, isLoading, loadMoreObjects]);

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

  // 虚拟滚动计算
  const totalHeight = objects.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIndex = Math.min(
    objects.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_ROWS,
  );
  const visibleObjects = objects.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

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

      {/* 表头 */}
      <div className="vtable-header">
        <div className="vcol-name">名称</div>
        <div className="vcol-size">大小</div>
        <div className="vcol-date">修改时间</div>
        <div className="vcol-actions">操作</div>
      </div>

      {/* 虚拟滚动容器 */}
      <div
        className="vtable-body"
        ref={scrollRef}
        onScroll={onScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: offsetY,
              left: 0,
              right: 0,
            }}
          >
            {visibleObjects.map((obj, i) => {
              const realIndex = startIndex + i;
              return (
                <div
                  key={obj.key}
                  className={`vtable-row ${obj.is_dir ? "dir-row" : ""}`}
                  style={{ height: ROW_HEIGHT }}
                  data-index={realIndex}
                >
                  <div className="vcol-name">
                    {obj.is_dir ? (
                      <span
                        className="obj-name dir"
                        onClick={() => enterDir(obj.key)}
                      >
                        📁 {obj.key.replace(prefix, "")}
                      </span>
                    ) : (
                      <span className="obj-name">
                        📄 {obj.key.replace(prefix, "")}
                      </span>
                    )}
                  </div>
                  <div className="vcol-size">
                    {obj.is_dir ? "-" : formatSize(obj.size)}
                  </div>
                  <div className="vcol-date">
                    {obj.last_modified ?? "-"}
                  </div>
                  <div className="vcol-actions row-actions">
                    {!obj.is_dir && isTextPreviewable(obj.key) && (
                      <button
                        onClick={() => setPreviewKey(obj.key)}
                        disabled={busy}
                      >
                        预览
                      </button>
                    )}
                    {!obj.is_dir && isImagePreviewable(obj.key) && (
                      <button
                        onClick={() => setImagePreviewKey(obj.key)}
                        disabled={busy}
                      >
                        看图
                      </button>
                    )}
                    {!obj.is_dir && (
                      <button
                        onClick={() => onDownload(obj)}
                        disabled={busy}
                      >
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 加载状态指示 */}
        {isLoading && (
          <div className="vtable-loading">
            {objects.length === 0 ? "加载中..." : "加载更多..."}
          </div>
        )}
        {!isLoading && objects.length === 0 && (
          <div className="vtable-empty">该目录为空</div>
        )}
        {!isLoading && !hasMore && objects.length > 0 && (
          <div className="vtable-end">共 {objects.length} 项</div>
        )}
      </div>

      {previewKey && activeBucket && (
        <PreviewPanel
          bucket={activeBucket}
          objKey={previewKey}
          onClose={() => setPreviewKey(null)}
        />
      )}

      {imagePreviewKey && activeBucket && (
        <ImagePreviewPanel
          bucket={activeBucket}
          initialKey={imagePreviewKey}
          imageKeys={objects
            .filter((o) => !o.is_dir && isImagePreviewable(o.key))
            .map((o) => o.key)}
          onClose={() => setImagePreviewKey(null)}
        />
      )}
    </div>
  );
}
