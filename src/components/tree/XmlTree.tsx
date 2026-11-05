import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { copyText, type TreeCommand } from "../previewUtils";
import { useT } from "../../i18n";

// ---------- 类型与解析 ----------

export interface XmlNode {
  name: string;
  value: string | null;
  attributes: Record<string, string>;
  children: XmlNode[];
  isComment: boolean;
}

export function parseXml(
  text: string,
): { ok: true; value: XmlNode } | { ok: false; error: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return { ok: false, error: parseError.textContent || "XML 解析错误" };
    }
    const root = doc.documentElement;
    if (!root) return { ok: false, error: "无根元素" };
    return { ok: true, value: convert(root) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function convert(el: Element): XmlNode {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    attributes[attr.name] = attr.value;
  }

  const children: XmlNode[] = [];
  let textValue: string | null = null;

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(convert(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent?.trim();
      if (t) textValue = (textValue ?? "") + t;
    } else if (child.nodeType === Node.COMMENT_NODE) {
      children.push({
        name: "#comment",
        value: child.textContent,
        attributes: {},
        children: [],
        isComment: true,
      });
    }
  }

  return {
    name: el.nodeName,
    value: children.length === 0 ? textValue : null,
    attributes,
    children,
    isComment: false,
  };
}

function collectContainers(node: XmlNode, path: string, out: Set<string>) {
  if (node.children.length > 0) {
    out.add(path);
    node.children.forEach((c, i) =>
      collectContainers(c, path + "/" + i, out),
    );
  }
}

// ---------- 渲染 ----------

function CopyBtn({ node }: { node: XmlNode }) {
  const [done, setDone] = useState(false);
  const t = useT();
  return (
    <button
      className="tree-copy"
      title={t("pv.copy")}
      onClick={async (e) => {
        e.stopPropagation();
        const text =
          node.children.length > 0
            ? `<${node.name}${Object.entries(node.attributes)
                .map(([k, v]) => ` ${k}="${v}"`)
                .join("")}> ... </${node.name}>`
            : node.isComment
              ? `<!-- ${node.value ?? ""} -->`
              : `<${node.name}>${node.value ?? ""}</${node.name}>`;
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

function Attrs({ attrs }: { attrs: Record<string, string> }) {
  const entries = Object.entries(attrs);
  if (entries.length === 0) return null;
  return (
    <span className="xml-attrs">
      {entries.map(([k, v]) => (
        <span key={k} className="xml-attr">
          {" "}
          <span className="xml-attr-name">{k}</span>=
          <span className="xml-attr-val">"{v}"</span>
        </span>
      ))}
    </span>
  );
}

interface Props {
  node: XmlNode;
  command: TreeCommand;
}

export function XmlTree({ node, command }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const lastSeq = useRef(0);
  const t = useT();

  useEffect(() => {
    if (command.seq === lastSeq.current) return;
    lastSeq.current = command.seq;
    if (command.action === "expand") {
      setCollapsed(new Set());
    } else {
      const s = new Set<string>();
      collectContainers(node, "", s);
      setCollapsed(s);
    }
  }, [command, node]);

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const ctx = { n: 0 };

  const renderNode = (n: XmlNode, path: string): ReactNode => {
    const line = ++ctx.n;
    const hasChildren = n.children.length > 0;
    const isOpen = !collapsed.has(path);

    if (n.isComment) {
      return (
        <div className="tree-node" key={path}>
          <div className="tree-row xml-comment">
            <span className="tree-lineno">{line}</span>
            <span className="toggle placeholder" />
            <span>{`<!-- ${n.value ?? ""} -->`}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="tree-node" key={path}>
        <div className="tree-row">
          <span className="tree-lineno">{line}</span>
          {hasChildren ? (
            <span className="toggle" onClick={() => toggle(path)}>
              {isOpen ? "▼" : "▶"}
            </span>
          ) : (
            <span className="toggle placeholder" />
          )}
          <span className="xml-tag-open">
            {"<"}
            <span className="xml-tag-name">{n.name}</span>
            <Attrs attrs={n.attributes} />
            {hasChildren ? ">" : " /"}
            {!hasChildren && n.value !== null && (
              <span className="xml-text">{n.value}</span>
            )}
            {!hasChildren && ">"}
          </span>
          {hasChildren && !isOpen && (
            <span className="collapsed">
              {" "}
              {t("pv.children", { n: n.children.length })}{" "}
            </span>
          )}
          <CopyBtn node={n} />
        </div>
        {hasChildren && isOpen && (
          <div className="tree-children">
            {n.children.map((c, i) => renderNode(c, path + "/" + i))}
            <div className="tree-row">
              <span className="tree-lineno">{++ctx.n}</span>
              <span className="toggle placeholder" />
              <span className="xml-tag-close">
                {"</"}
                <span className="xml-tag-name">{n.name}</span>
                {">"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <div className="xml-tree">{renderNode(node, "")}</div>;
}
