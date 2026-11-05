import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatSize, getObjectContent, type ObjectContent } from "../api";
import { useStore } from "../store";
import {
  JsonTree,
  parseJson,
  isContainer,
  jsonValueText,
  sizeOf,
  toPlain,
  type JsonValue,
} from "./tree/JsonTree";
import { XmlTree, parseXml, type XmlNode } from "./tree/XmlTree";
import { PreviewShell } from "./PreviewShell";
import {
  copyText,
  countLines,
  getFileBadge,
  splitPath,
  type TreeCommand,
} from "./previewUtils";
import { useT } from "../i18n";
import {
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Search,
} from "lucide-react";

type PreviewKind = "json" | "xml" | "text";

function detectKind(key: string, content: string): PreviewKind {
  const lower = key.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".xml")) return "xml";
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

interface JsonMatch {
  path: string;
  value: JsonValue;
}

function searchJson(
  v: JsonValue,
  path: string,
  q: string,
  out: JsonMatch[],
) {
  const lower = q.toLowerCase();
  if (v.kind === "object") {
    for (const [k, val] of v.value) {
      const p = path ? `${path}.${k}` : k;
      if (k.toLowerCase().includes(lower)) out.push({ path: p, value: val });
      searchJson(val, p, q, out);
    }
  } else if (v.kind === "array") {
    v.value.forEach((val, i) => searchJson(val, `${path}[${i}]`, q, out));
  } else {
    const t = jsonValueText(v);
    if (t.toLowerCase().includes(lower)) {
      out.push({ path: path || "(root)", value: v });
    }
  }
}

interface XmlMatch {
  path: string;
  text: string;
}

function searchXml(node: XmlNode, path: string, q: string, out: XmlMatch[]) {
  const lower = q.toLowerCase();
  const here = `${path}/${node.name}`;
  if (node.name.toLowerCase().includes(lower)) {
    out.push({
      path: here,
      text:
        node.value ??
        (node.children.length ? `${node.children.length} 子节点` : ""),
    });
  }
  if (node.value && node.value.toLowerCase().includes(lower)) {
    out.push({ path: here, text: node.value });
  }
  for (const c of node.children) searchXml(c, here, q, out);
}

const RAW_LINE_LIMIT = 4000;

export function PreviewPanel({ bucket, objKey, onClose }: Props) {
  const activeConn = useStore((s) => s.activeConn());
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ObjectContent | null>(null);
  const [view, setView] = useState<"tree" | "raw">("tree");
  const [query, setQuery] = useState("");
  const [cmd, setCmd] = useState<TreeCommand>({ seq: 0, action: "expand" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeConn) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setQuery("");
    setView("tree");
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

  const parsedJson = useMemo(
    () => (kind === "json" && data ? parseJson(data.content) : null),
    [kind, data],
  );
  const parsedXml = useMemo(
    () => (kind === "xml" && data ? parseXml(data.content) : null),
    [kind, data],
  );

  const trimmedQuery = query.trim();
  const jsonMatches = useMemo(() => {
    if (!trimmedQuery || !parsedJson || !parsedJson.ok) return [];
    const out: JsonMatch[] = [];
    searchJson(parsedJson.value, "", trimmedQuery, out);
    return out.slice(0, 300);
  }, [trimmedQuery, parsedJson]);
  const xmlMatches = useMemo(() => {
    if (!trimmedQuery || !parsedXml || !parsedXml.ok) return [];
    const out: XmlMatch[] = [];
    searchXml(parsedXml.value, "", trimmedQuery, out);
    return out.slice(0, 300);
  }, [trimmedQuery, parsedXml]);

  const badge = getFileBadge(objKey);
  const pathParts = splitPath(objKey);
  const fileName = pathParts[pathParts.length - 1] || objKey;
  const lineCount = data ? countLines(data.content) : 0;

  // 元信息 chips
  let keyOrNodeCount: number | null = null;
  if (parsedJson && parsedJson.ok) keyOrNodeCount = sizeOf(parsedJson.value);
  if (parsedXml && parsedXml.ok)
    keyOrNodeCount = parsedXml.value.children.length;

  const onCopyAll = async () => {
    if (!data) return;
    if (await copyText(data.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const showTreeToolbar = kind !== "text";
  const treeMode = effectiveView === "tree" && kind !== "text";

  const toolbar = (
    <>
      {treeMode && (
        <div className="pv-tool-group">
          <button
            className="pv-tool-btn"
            title={t("pv.expandAll")}
            onClick={() => setCmd((c) => ({ seq: c.seq + 1, action: "expand" }))}
          >
            <ChevronsUpDown size={14} />
          </button>
          <button
            className="pv-tool-btn"
            title={t("pv.collapseAll")}
            onClick={() =>
              setCmd((c) => ({ seq: c.seq + 1, action: "collapse" }))
            }
          >
            <ChevronsDownUp size={14} />
          </button>
        </div>
      )}

      {showTreeToolbar && (
        <div className="pv-search">
          <Search size={13} />
          <input
            placeholder={t("pv.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="pv-tool-spacer" />

      <button className="pv-tool-btn" title={t("pv.copyAll")} onClick={onCopyAll}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? t("pv.copied") : t("pv.copy")}</span>
      </button>

      {showTreeToolbar && (
        <div className="view-toggle">
          <button
            className={effectiveView === "tree" ? "active" : ""}
            onClick={() => setView("tree")}
          >
            {t("pv.tree")}
          </button>
          <button
            className={effectiveView === "raw" ? "active" : ""}
            onClick={() => setView("raw")}
          >
            {t("pv.raw")}
          </button>
        </div>
      )}
    </>
  );

  const chips = (
    <>
      <span className="pv-chip">{formatSize(data?.size ?? 0)}</span>
      {kind !== "text" && <span className="pv-chip">{kind.toUpperCase()}</span>}
      {lineCount > 0 && (
        <span className="pv-chip">{t("pv.lines", { n: lineCount })}</span>
      )}
      {keyOrNodeCount !== null && (
        <span className="pv-chip">
          {kind === "xml"
            ? t("pv.children", { n: keyOrNodeCount })
            : t("pv.keys", { n: keyOrNodeCount })}
        </span>
      )}
    </>
  );

  // 内容区
  let content: ReactNode = null;
  if (loading) {
    content = <div className="pv-state">{t("pv.loading")}</div>;
  } else if (error) {
    content = <div className="pv-state error">{error}</div>;
  } else if (data?.truncated) {
    content = (
      <div className="pv-state error">
        {t("pv.tooLarge", { size: formatSize(data.size) })}
      </div>
    );
  } else if (data && treeMode && trimmedQuery) {
    // 搜索结果
    if (kind === "json") {
      content =
        jsonMatches.length === 0 ? (
          <div className="pv-state">{t("pv.noMatch")}</div>
        ) : (
          <div className="search-results">
            {jsonMatches.map((m, i) => (
              <div className="search-result" key={i}>
                <span className="sr-path">{m.path}</span>
                {isContainer(m.value) ? (
                  <span className="sr-value dim">
                    {m.value.kind === "array"
                      ? `[${t("pv.items", { n: sizeOf(m.value) })}]`
                      : `{${t("pv.fields", { n: sizeOf(m.value) })}}`}
                  </span>
                ) : (
                  <span className="sr-value">{jsonValueText(m.value)}</span>
                )}
                <button
                  className="tree-copy"
                  title={t("pv.copy")}
                  onClick={() =>
                    copyText(
                      isContainer(m.value)
                        ? JSON.stringify(toPlain(m.value), null, 2)
                        : jsonValueText(m.value),
                    )
                  }
                >
                  <Copy size={11} />
                </button>
              </div>
            ))}
          </div>
        );
    } else {
      content =
        xmlMatches.length === 0 ? (
          <div className="pv-state">{t("pv.noMatch")}</div>
        ) : (
          <div className="search-results">
            {xmlMatches.map((m, i) => (
              <div className="search-result" key={i}>
                <span className="sr-path">{m.path}</span>
                <span className="sr-value">{m.text}</span>
              </div>
            ))}
          </div>
        );
    }
  } else if (data && treeMode) {
    if (kind === "json" && parsedJson) {
      content = parsedJson.ok ? (
        <div className="tree-view">
          <JsonTree data={parsedJson.value} command={cmd} />
        </div>
      ) : (
        <div className="pv-state error">
          {t("pv.jsonError", { msg: parsedJson.error })}
        </div>
      );
    } else if (kind === "xml" && parsedXml) {
      content = parsedXml.ok ? (
        <div className="tree-view">
          <XmlTree node={parsedXml.value} command={cmd} />
        </div>
      ) : (
        <div className="pv-state error">
          {t("pv.xmlError", { msg: parsedXml.error })}
        </div>
      );
    } else {
      content = null;
    }
  } else if (data) {
    // 原始视图（带行号）
    const lines = data.content.split("\n");
    content =
      lines.length > RAW_LINE_LIMIT ? (
        <pre className="raw-view">{data.content}</pre>
      ) : (
        <div className="raw-lines">
          {lines.map((l, i) => (
            <div className="raw-line" key={i}>
              <span className="raw-ln">{i + 1}</span>
              <span className="raw-code">{l || " "}</span>
            </div>
          ))}
        </div>
      );
  }

  return (
    <PreviewShell
      tone={badge.tone}
      badge={badge.label}
      fileName={fileName}
      path={objKey}
      chips={chips}
      toolbar={toolbar}
      onClose={onClose}
      footer={
        <>
          <span>
            {data
              ? `${formatSize(data.size)} · ${t("pv.lines", { n: lineCount })}`
              : ""}
          </span>
          <span className="pv-hint">{t("pv.escClose")}</span>
        </>
      }
    >
      {content}
    </PreviewShell>
  );
}
