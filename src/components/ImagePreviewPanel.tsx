import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as RMouseEvent, SyntheticEvent } from "react";
import { useStore } from "../store";
import { formatSize, getImageMime, getObjectBytes } from "../api";
import { PreviewShell } from "./PreviewShell";
import { getFileBadge, splitPath } from "./previewUtils";
import { useT } from "../i18n";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minus,
  Plus,
  RotateCw,
} from "lucide-react";

interface Props {
  bucket: string;
  initialKey: string;
  imageKeys: string[];
  onClose: () => void;
}

const MIME_LABEL: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "image/bmp": "BMP",
  "image/svg+xml": "SVG",
  "image/x-icon": "ICO",
  "image/avif": "AVIF",
};

export function ImagePreviewPanel({
  bucket,
  initialKey,
  imageKeys,
  onClose,
}: Props) {
  const activeConn = useStore((s) => s.activeConn());
  const t = useT();
  const [index, setIndex] = useState(() =>
    Math.max(0, imageKeys.indexOf(initialKey)),
  );
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeBytes, setSizeBytes] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const [userScale, setUserScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [rotate, setRotate] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const fitScaleRef = useRef(1);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );

  const currentKey = imageKeys[index];

  const loadCurrent = useCallback(async () => {
    if (!activeConn || !currentKey) return;
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setLoading(true);
    setError(null);
    setNatural(null);
    setUserScale(1);
    setTx(0);
    setTy(0);
    setRotate(0);
    try {
      const buf = await getObjectBytes(activeConn, bucket, currentKey);
      const mime = getImageMime(currentKey);
      const blob = new Blob([buf], { type: mime });
      setSizeBytes(buf.byteLength);
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

  useEffect(() => {
    return () => {
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, []);

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));

  const onImgLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNatural({ w: nw, h: nh });
    const stage = stageRef.current;
    if (stage && nw > 0 && nh > 0) {
      fitScaleRef.current = Math.min(
        stage.clientWidth / nw,
        stage.clientHeight / nh,
        1,
      );
    }
  };

  const zoomBy = (factor: number) =>
    setUserScale((s) => clamp(s * factor, 0.1, 20));

  const fit = () => {
    setUserScale(1);
    setTx(0);
    setTy(0);
  };

  const actual = () => {
    setUserScale(1 / (fitScaleRef.current || 1));
    setTx(0);
    setTy(0);
  };

  // 滚轮缩放（需 passive:false 才能 preventDefault）
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setUserScale((s) => clamp(s * factor, 0.1, 20));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [url]);

  // 拖动平移
  const onMouseDown = (e: RMouseEvent) => {
    if (userScale <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setTx(d.tx + (e.clientX - d.x));
      setTy(d.ty + (e.clientY - d.y));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setIndex((i) => (i > 0 ? i - 1 : imageKeys.length - 1));
      } else if (e.key === "ArrowRight") {
        setIndex((i) => (i < imageKeys.length - 1 ? i + 1 : 0));
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        zoomBy(1.25);
      } else if (e.key === "-") {
        zoomBy(1 / 1.25);
      } else if (e.key === "0") {
        fit();
      } else if (e.key === "1") {
        actual();
      } else if (e.key.toLowerCase() === "r") {
        setRotate((r) => r + 90);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKeys.length, onClose]);

  const goPrev = () =>
    setIndex((i) => (i > 0 ? i - 1 : imageKeys.length - 1));
  const goNext = () =>
    setIndex((i) => (i < imageKeys.length - 1 ? i + 1 : 0));

  const badge = getFileBadge(currentKey ?? "");
  const pathParts = splitPath(currentKey ?? "");
  const fileName = pathParts[pathParts.length - 1] || currentKey || "";
  const mime = getImageMime(currentKey ?? "");
  const format = MIME_LABEL[mime] ?? badge.label;
  const percent = Math.round(fitScaleRef.current * userScale * 100);

  const chips = (
    <>
      <span className="pv-chip">{formatSize(sizeBytes)}</span>
      {natural && (
        <span className="pv-chip">
          {natural.w} × {natural.h}
        </span>
      )}
      <span className="pv-chip">{format}</span>
      {imageKeys.length > 1 && (
        <span className="pv-chip">
          {index + 1} / {imageKeys.length}
        </span>
      )}
    </>
  );

  const toolbar = (
    <>
      <div className="pv-tool-group">
        <button
          className="pv-tool-btn"
          title={t("img.zoomOut")}
          onClick={() => zoomBy(1 / 1.25)}
        >
          <Minus size={14} />
        </button>
        <button
          className="pv-tool-btn zoom-label"
          title={t("img.fitTip")}
          onClick={fit}
        >
          {percent}%
        </button>
        <button
          className="pv-tool-btn"
          title={t("img.zoomIn")}
          onClick={() => zoomBy(1.25)}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="pv-tool-group">
        <button className="pv-tool-btn" title={t("img.fitTip")} onClick={fit}>
          <Maximize size={14} />
          <span>{t("img.fit")}</span>
        </button>
        <button
          className="pv-tool-btn"
          title={t("img.actualTip")}
          onClick={actual}
        >
          {t("img.actual")}
        </button>
        <button
          className="pv-tool-btn"
          title={t("img.rotate")}
          onClick={() => setRotate((r) => r + 90)}
        >
          <RotateCw size={14} />
        </button>
      </div>

      <div className="pv-tool-spacer" />

      {imageKeys.length > 1 && (
        <div className="pv-tool-group">
          <button className="pv-tool-btn" title={t("img.prev")} onClick={goPrev}>
            <ChevronLeft size={15} />
          </button>
          <button className="pv-tool-btn" title={t("img.next")} onClick={goNext}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </>
  );

  return (
    <PreviewShell
      tone={badge.tone}
      badge={badge.label}
      fileName={fileName}
      path={currentKey ?? ""}
      chips={chips}
      toolbar={toolbar}
      onClose={onClose}
      wide
      footer={
        <>
          <span>
            {imageKeys.length > 1
              ? t("img.counter", { i: index + 1, n: imageKeys.length })
              : t("img.single")}
          </span>
          <span className="pv-hint">{t("img.hint")}</span>
        </>
      }
    >
      <div
        className="img-stage checker"
        ref={stageRef}
        onMouseDown={onMouseDown}
        style={{ cursor: userScale > 1 ? "grab" : "default" }}
      >
        {imageKeys.length > 1 && (
          <button
            className="nav-btn nav-prev"
            onClick={goPrev}
            disabled={loading}
            title={t("img.prev")}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="img-canvas">
          {loading && <div className="pv-state">{t("img.loading")}</div>}
          {error && <div className="pv-state error">{error}</div>}
          {url && !loading && !error && (
            <img
              src={url}
              alt={currentKey}
              className="img-content"
              onLoad={onImgLoad}
              draggable={false}
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${userScale}) rotate(${rotate}deg)`,
                transition: dragRef.current ? "none" : "transform 0.12s ease",
              }}
            />
          )}
        </div>

        {imageKeys.length > 1 && (
          <button
            className="nav-btn nav-next"
            onClick={goNext}
            disabled={loading}
            title={t("img.next")}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </PreviewShell>
  );
}
