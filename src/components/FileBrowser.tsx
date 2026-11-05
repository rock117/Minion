import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useDialogs } from "../dialogs";
import { useT } from "../i18n";
import { useSettings } from "../settings";
import { useFolderCounts, folderCountKey } from "../folderCounts";
import {
  ArrowUp,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  Image as ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";

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
  const { confirm, toast } = useDialogs();
  const t = useT();
  const requestCount = useFolderCounts((s) => s.request);
  const countEntries = useFolderCounts((s) => s.entries);
  const showCounts = useSettings((s) => s.showFolderCounts);

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

  // 可见文件夹（用于懒加载文件数）
  const conn = activeConn();
  const visibleFolderKeys = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const end = Math.min(
      objects.length,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_ROWS,
    );
    return objects
      .slice(start, end)
      .filter((o) => o.is_dir)
      .map((o) => o.key);
  }, [objects, scrollTop, viewportHeight]);
  const visibleFolderKeyStr = visibleFolderKeys.join("|");

  useEffect(() => {
    if (!showCounts || !activeBucket || !conn) return;
    for (const k of visibleFolderKeys) requestCount(conn, activeBucket, k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFolderKeyStr, showCounts, activeBucket, conn, requestCount]);

  if (!activeBucket) {
    return <div className="file-browser empty">{t("file.selectBucket")}</div>;
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
      toast(t("file.uploaded", { name: filename }), "success");
    } catch (e) {
      toast(t("file.uploadFail", { msg: String(e) }), "error");
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
      title: t("file.selectDir"),
    });
    if (!savePath || Array.isArray(savePath)) return;
    const dir = savePath as string;
    const filename = obj.key.split("/").pop() || "download.bin";
    const full = `${dir}/${filename}`;
    setBusy(true);
    try {
      await downloadFile(conn, activeBucket, obj.key, full);
      toast(t("file.downloaded", { path: full }), "success");
    } catch (e) {
      toast(t("file.downloadFail", { msg: String(e) }), "error");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (obj: ObjectInfo) => {
    const conn = activeConn();
    if (!conn) return;
    const ok = await confirm({
      title: t("file.deleteTitle"),
      message: t("file.deleteMsg", { key: obj.key }),
      confirmText: t("dialog.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteObject(conn, activeBucket, obj.key);
      await loadObjects();
      toast(t("file.deleted"), "success");
    } catch (e) {
      toast(t("file.deleteFail", { msg: String(e) }), "error");
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
          {prefix && (
            <button className="ghost" onClick={goUp}>
              <ArrowUp size={14} /> {t("file.up")}
            </button>
          )}
          <button className="primary" onClick={onUpload} disabled={busy}>
            <Upload size={14} /> {busy ? t("file.busy") : t("file.upload")}
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="vtable-header">
        <div className="vcol-name">{t("file.colName")}</div>
        <div className="vcol-count">{t("file.colItems")}</div>
        <div className="vcol-size">{t("file.colSize")}</div>
        <div className="vcol-date">{t("file.colModified")}</div>
        <div className="vcol-actions">{t("file.colActions")}</div>
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
                        <span className="obj-icon dir">
                          <Folder size={15} />
                        </span>
                        {obj.key.replace(prefix, "")}
                      </span>
                    ) : (
                      <span className="obj-name">
                        <span className="obj-icon">
                          {isImagePreviewable(obj.key) ? (
                            <ImageIcon size={15} />
                          ) : isTextPreviewable(obj.key) ? (
                            <FileText size={15} />
                          ) : (
                            <File size={15} />
                          )}
                        </span>
                        {obj.key.replace(prefix, "")}
                      </span>
                    )}
                  </div>
                  <div className="vcol-count">
                    {obj.is_dir && showCounts
                      ? (() => {
                          const c =
                            countEntries[
                              folderCountKey(activeBucket, obj.key)
                            ];
                          if (c === "loading")
                            return <span className="count-loading">…</span>;
                          if (!c || c === "error") return "-";
                          return c.capped ? `${c.count}+` : c.count;
                        })()
                      : "-"}
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
                        title={t("file.preview")}
                        onClick={() => setPreviewKey(obj.key)}
                        disabled={busy}
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    {!obj.is_dir && isImagePreviewable(obj.key) && (
                      <button
                        title={t("file.viewImage")}
                        onClick={() => setImagePreviewKey(obj.key)}
                        disabled={busy}
                      >
                        <ImageIcon size={14} />
                      </button>
                    )}
                    {!obj.is_dir && (
                      <button
                        title={t("file.download")}
                        onClick={() => onDownload(obj)}
                        disabled={busy}
                      >
                        <Download size={14} />
                      </button>
                    )}
                    <button
                      className="danger"
                      title={t("file.delete")}
                      onClick={() => onDelete(obj)}
                      disabled={busy}
                    >
                      <Trash2 size={14} />
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
            {objects.length === 0 ? t("file.loading") : t("file.loadingMore")}
          </div>
        )}
        {!isLoading && objects.length === 0 && (
          <div className="vtable-empty">{t("file.emptyDir")}</div>
        )}
        {!isLoading && !hasMore && objects.length > 0 && (
          <div className="vtable-end">
            {t("file.total", { n: objects.length })}
          </div>
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
