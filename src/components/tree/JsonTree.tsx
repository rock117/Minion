// JSON 解析 + 树状渲染

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
    const raw = JSON.parse(text);
    return { ok: true, value: wrap(raw) };
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

import { useState } from "react";

function isContainer(v: JsonValue): boolean {
  return v.kind === "object" || v.kind === "array";
}

function countLeaves(v: JsonValue): number {
  if (v.kind === "object") return v.value.length;
  if (v.kind === "array") return v.value.length;
  return 0;
}

function ValuePreview({ v }: { v: JsonValue }) {
  if (v.kind === "string") return <span className="jv-string">"{v.value}"</span>;
  if (v.kind === "number") return <span className="jv-number">{v.value}</span>;
  if (v.kind === "boolean")
    return <span className="jv-bool">{v.value ? "true" : "false"}</span>;
  if (v.kind === "null") return <span className="jv-null">null</span>;
  // 容器：显示简短摘要
  const n = countLeaves(v);
  return (
    <span className="jv-summary">
      {v.kind === "array" ? `Array(${n})` : `Object(${n})`}
    </span>
  );
}

function TreeNode({ label, v }: { label?: string; v: JsonValue }) {
  const [open, setOpen] = useState(true);
  const container = isContainer(v);
  const n = countLeaves(v);

  return (
    <div className="tree-node">
      <div className="tree-row">
        {container ? (
          <span
            className="toggle"
            onClick={() => setOpen((o) => !o)}
            title={open ? "折叠" : "展开"}
          >
            {open ? "▼" : "▶"}
          </span>
        ) : (
          <span className="toggle placeholder" />
        )}
        {label !== undefined && <span className="tree-key">{label}:</span>}
        {container ? (
          <span className="tree-summary">
            {v.kind === "array" ? "[" : "{"}
            {!open && (
              <span className="collapsed">
                {v.kind === "array" ? ` ${n} 项 ` : ` ${n} 字段 `}
              </span>
            )}
            {open ? "" : v.kind === "array" ? "]" : "}"}
          </span>
        ) : (
          <ValuePreview v={v} />
        )}
      </div>
      {container && open && (
        <div className="tree-children">
          {v.kind === "array"
            ? v.value.map((item, i) => (
                <TreeNode key={i} label={String(i)} v={item} />
              ))
            : v.kind === "object"
              ? v.value.map(([k, item]) => (
                  <TreeNode key={k} label={k} v={item} />
                ))
              : null}
          <div className="tree-row">
            <span className="toggle placeholder" />
            <span className="tree-close">
              {v.kind === "array" ? "]" : "}"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function JsonTree({ data }: { data: JsonValue }) {
  return (
    <div className="json-tree">
      <TreeNode v={data} />
    </div>
  );
}
