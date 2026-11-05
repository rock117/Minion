// XML 解析 + 树状渲染（使用浏览器内置 DOMParser）

export interface XmlNode {
  name: string;
  value: string | null; // 文本节点内容
  attributes: Record<string, string>;
  children: XmlNode[];
  isText: boolean;
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
      if (t) {
        textValue = (textValue ?? "") + t;
      }
    } else if (child.nodeType === Node.COMMENT_NODE) {
      children.push({
        name: "#comment",
        value: child.textContent,
        attributes: {},
        children: [],
        isText: false,
        isComment: true,
      });
    }
  }

  return {
    name: el.nodeName,
    value: children.length === 0 ? textValue : null,
    attributes,
    children,
    isText: false,
    isComment: false,
  };
}

import { useState } from "react";

function Attrs({ attrs }: { attrs: Record<string, string> }) {
  const entries = Object.entries(attrs);
  if (entries.length === 0) return null;
  return (
    <span className="xml-attrs">
      {entries.map(([k, v]) => (
        <span key={k} className="xml-attr">
          {" "}
          <span className="xml-attr-name">{k}</span>
          =
          <span className="xml-attr-val">"{v}"</span>
        </span>
      ))}
    </span>
  );
}

function XmlTreeNode({ node }: { node: XmlNode }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  if (node.isComment) {
    return (
      <div className="tree-node">
        <div className="tree-row xml-comment">
          <span className="toggle placeholder" />
          <span>{`<!-- ${node.value} -->`}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-node">
      <div className="tree-row">
        {hasChildren ? (
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
        <span className="xml-tag-open">
          {"<"}
          <span className="xml-tag-name">{node.name}</span>
          <Attrs attrs={node.attributes} />
          {hasChildren ? ">" : " /"}
          {!hasChildren && node.value !== null && (
            <span className="xml-text">{node.value}</span>
          )}
          {!hasChildren && ">"}
        </span>
      </div>
      {hasChildren && open && (
        <div className="tree-children">
          {node.children.map((c, i) => (
            <XmlTreeNode key={i} node={c} />
          ))}
          <div className="tree-row">
            <span className="toggle placeholder" />
            <span className="xml-tag-close">
              {"</"}
              <span className="xml-tag-name">{node.name}</span>
              {">"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function XmlTree({ node }: { node: XmlNode }) {
  return (
    <div className="xml-tree">
      <XmlTreeNode node={node} />
    </div>
  );
}
