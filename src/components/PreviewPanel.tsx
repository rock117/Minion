import { useEffect, useState } from "react";
import { type ObjectContent, formatSize, getObjectContent } from "../api";
import { useStore } from "../store";
import { JsonTree, parseJson } from "./tree/JsonTree";
import { XmlTree, parseXml } from "./tree/XmlTree";
import { X } from "lucide-react";

type PreviewKind = "json" | "xml" | "text";

function detectKind(key: string, content: string): PreviewKind {
  const lower = key.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".xml")) return "xml";
  // 尝试嗅探
  const trimmed = content.trimStart();
  if (trimmed.startsWith("<")) return "xml";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  return "text";
}

interface Props {
  bucket: string;
  objKey: string;
  onClose: () => void;
}

export function PreviewPanel({ bucket, objKey, onClose }: Props) {
  const activeConn = useStore((s) => s.activeConn());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ObjectContent | null>(null);
  const [view, setView] = useState<"tree" | "raw">("tree");

  useEffect(() => {
    if (!activeConn) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getObjectContent(activeConn, bucket, objKey)
      .then((c) => {
        if (cancelled) return;
        setData(c);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConn, bucket, objKey]);

  const kind = data ? detectKind(objKey, data.content) : "text";
  const effectiveView = kind === "text" ? "raw" : view;

  let treeEl: React.ReactNode = null;
  if (data && !data.truncated) {
    if (kind === "json") {
      const parsed = parseJson(data.content);
      if (parsed.ok) {
        treeEl = <JsonTree data={parsed.value} />;
      } else {
        treeEl = <div className="tree-error">JSON 解析失败: {parsed.error}</div>;
      }
    } else if (kind === "xml") {
      const parsed = parseXml(data.content);
      if (parsed.ok) {
        treeEl = <XmlTree node={parsed.value} />;
      } else {
        treeEl = <div className="tree-error">XML 解析失败: {parsed.error}</div>;
      }
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title">
            <span className="preview-key" title={objKey}>
              {objKey}
            </span>
            {data && (
              <span className="preview-meta">
                {formatSize(data.size)} · {kind.toUpperCase()}
              </span>
            )}
          </div>
          <div className="preview-actions">
            {kind !== "text" && (
              <div className="view-toggle">
                <button
                  className={effectiveView === "tree" ? "active" : ""}
                  onClick={() => setView("tree")}
                >
                  树状
                </button>
                <button
                  className={effectiveView === "raw" ? "active" : ""}
                  onClick={() => setView("raw")}
                >
                  原始
                </button>
              </div>
            )}
            <button onClick={onClose}>
              <X size={14} /> 关闭
            </button>
          </div>
        </div>

        <div className="preview-body">
          {loading && <div className="preview-loading">加载中...</div>}
          {error && <div className="tree-error">{error}</div>}
          {data?.truncated && (
            <div className="tree-error">
              文件过大（{formatSize(data.size)}），超过预览上限 2MB，请使用下载。
            </div>
          )}
          {data && !data.truncated && effectiveView === "tree" && (
            <div className="tree-view">{treeEl}</div>
          )}
          {data && !data.truncated && effectiveView === "raw" && (
            <pre className="raw-view">{data.content}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
