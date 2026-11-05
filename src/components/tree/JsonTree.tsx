import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { copyText, type TreeCommand } from "../previewUtils";

// ---------- 类型与解析 ----------

export type JsonValue =
  | { kind: "object"; value: [string, JsonValue][] }
  | { kind: "array"; value: JsonValue[] }
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" };

export function parseJson(
  text: string,
): { ok: true; value: JsonValue } | { ok: false; error: string } {
  try {
    return { ok: true, value: wrap(JSON.parse(text)) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function wrap(v: unknown): JsonValue {
  if (v === null) return { kind: "null" };
  if (typeof v === "boolean") return { kind: "boolean", value: v };
  if (typeof v === "number") return { kind: "number", value: v };
  if (typeof v === "string") return { kind: "string", value: v };
  if (Array.isArray(v)) return { kind: "array", value: v.map(wrap) };
  if (typeof v === "object") {
    return {
      kind: "object",
      value: Object.entries(v as Record<string, unknown>).map(([k, val]) => [
        k,
        wrap(val),
      ]),
    };
  }
  return { kind: "null" };
}

export function isContainer(v: JsonValue): boolean {
  return v.kind === "object" || v.kind === "array";
}

export function sizeOf(v: JsonValue): number {
  return v.kind === "object" || v.kind === "array" ? v.value.length : 0;
}

export function jsonValueText(v: JsonValue): string {
  switch (v.kind) {
    case "string":
      return JSON.stringify(v.value);
    case "number":
      return String(v.value);
    case "boolean":
      return String(v.value);
    case "null":
      return "null";
    default:
      return "";
  }
}

export function toPlain(v: JsonValue): unknown {
  switch (v.kind) {
    case "object":
      return Object.fromEntries(v.value.map(([k, x]) => [k, toPlain(x)]));
    case "array":
      return v.value.map(toPlain);
    case "null":
      return null;
    default:
      return v.value;
  }
}

function collectContainers(v: JsonValue, path: string, out: Set<string>) {
  if (v.kind === "object") {
    out.add(path);
    for (const [k, val] of v.value) collectContainers(val, path + "/" + k, out);
  } else if (v.kind === "array") {
    out.add(path);
    v.value.forEach((val, i) => collectContainers(val, path + "/" + i, out));
  }
}

// ---------- 渲染 ----------

function ValueView({ v }: { v: JsonValue }) {
  if (v.kind === "string") return <span className="jv-string">"{v.value}"</span>;
  if (v.kind === "number") return <span className="jv-number">{v.value}</span>;
  if (v.kind === "boolean")
    return <span className="jv-bool">{String(v.value)}</span>;
  if (v.kind === "null") return <span className="jv-null">null</span>;
  return null;
}

function CopyBtn({ value }: { value: JsonValue }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="tree-copy"
      title="复制值"
      onClick={async (e) => {
        e.stopPropagation();
        const text = isContainer(value)
          ? JSON.stringify(toPlain(value), null, 2)
          : jsonValueText(value);
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        }
      }}
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

interface Props {
  data: JsonValue;
  command: TreeCommand;
}

export function JsonTree({ data, command }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const lastSeq = useRef(0);

  useEffect(() => {
    if (command.seq === lastSeq.current) return;
    lastSeq.current = command.seq;
    if (command.action === "expand") {
      setCollapsed(new Set());
    } else {
      const s = new Set<string>();
      collectContainers(data, "", s);
      setCollapsed(s);
    }
  }, [command, data]);

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // 行号计数器：按渲染顺序递增
  const ctx = { n: 0 };

  const renderNode = (
    v: JsonValue,
    path: string,
    label: string | undefined,
  ): ReactNode => {
    const line = ++ctx.n;
    const container = isContainer(v);
    const isOpen = !collapsed.has(path);
    return (
      <div className="tree-node" key={path}>
        <div className="tree-row">
          <span className="tree-lineno">{line}</span>
          {container ? (
            <span className="toggle" onClick={() => toggle(path)}>
              {isOpen ? "▼" : "▶"}
            </span>
          ) : (
            <span className="toggle placeholder" />
          )}
          {label !== undefined && <span className="tree-key">{label}</span>}
          {container ? (
            <span className="tree-summary">
              {v.kind === "array" ? "[" : "{"}
              {!isOpen && (
                <span className="collapsed">
                  {v.kind === "array"
                    ? ` ${sizeOf(v)} 项 `
                    : ` ${sizeOf(v)} 字段 `}
                </span>
              )}
              {!isOpen && (v.kind === "array" ? "]" : "}")}
            </span>
          ) : (
            <ValueView v={v} />
          )}
          <CopyBtn value={v} />
        </div>
        {container && isOpen && (
          <div className="tree-children">
            {v.kind === "array"
              ? v.value.map((item, i) =>
                  renderNode(item, path + "/" + i, String(i)),
                )
              : v.kind === "object"
                ? v.value.map(([k, item]) =>
                    renderNode(item, path + "/" + k, k),
                  )
                : null}
            <div className="tree-row">
              <span className="tree-lineno">{++ctx.n}</span>
              <span className="toggle placeholder" />
              <span className="tree-close">
                {v.kind === "array" ? "]" : "}"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <div className="json-tree">{renderNode(data, "", undefined)}</div>;
}
