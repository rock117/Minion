import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store";
import { getImageMime, getObjectBytes } from "../api";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  bucket: string;
  initialKey: string;
  imageKeys: string[]; // 同目录下所有可预览图片的 key
  onClose: () => void;
}

export function ImagePreviewPanel({
  bucket,
  initialKey,
  imageKeys,
  onClose,
}: Props) {
  const activeConn = useStore((s) => s.activeConn());
  const [index, setIndex] = useState(() =>
    Math.max(0, imageKeys.indexOf(initialKey)),
  );
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentKey = imageKeys[index];

  const loadCurrent = useCallback(async () => {
    if (!activeConn || !currentKey) return;
    // 释放旧 URL
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setLoading(true);
    setError(null);
    try {
      const buf = await getObjectBytes(activeConn, bucket, currentKey);
      const mime = getImageMime(currentKey);
      const blob = new Blob([buf], { type: mime });
      setUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [activeConn, bucket, currentKey]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  // 组件卸载时释放 URL
  useEffect(() => {
    return () => {
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, []);

  // 键盘左右切换 + ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setIndex((i) => (i > 0 ? i - 1 : imageKeys.length - 1));
      } else if (e.key === "ArrowRight") {
        setIndex((i) => (i < imageKeys.length - 1 ? i + 1 : 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imageKeys.length, onClose]);

  const goPrev = () =>
    setIndex((i) => (i > 0 ? i - 1 : imageKeys.length - 1));
  const goNext = () =>
    setIndex((i) => (i < imageKeys.length - 1 ? i + 1 : 0));

  return (
    <div className="modal-mask image-preview-mask" onClick={onClose}>
      <div
        className="image-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-header">
          <div className="preview-title">
            <span className="preview-key" title={currentKey}>
              {currentKey?.replace(/^[^/]*\//, "")}
            </span>
            <span className="preview-meta">
              {index + 1} / {imageKeys.length}
            </span>
          </div>
          <button onClick={onClose}>
            <X size={14} /> 关闭
          </button>
        </div>

        <div className="image-preview-body">
          {imageKeys.length > 1 && (
            <button
              className="nav-btn nav-prev"
              onClick={goPrev}
              disabled={loading}
              title="上一张 (←)"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <div className="image-stage">
            {loading && <div className="preview-loading">加载中...</div>}
            {error && <div className="tree-error">{error}</div>}
            {url && !loading && !error && (
              <img
                src={url}
                alt={currentKey}
                className="preview-image"
              />
            )}
          </div>

          {imageKeys.length > 1 && (
            <button
              className="nav-btn nav-next"
              onClick={goNext}
              disabled={loading}
              title="下一张 (→)"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        <div className="image-preview-footer">
          <span>← → 切换 · ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
