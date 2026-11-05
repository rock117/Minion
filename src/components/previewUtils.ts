// 预览相关共享工具

export type PreviewTone = "json" | "xml" | "text" | "image";

/** 树的展开/折叠命令：seq 变化时触发一次 */
export interface TreeCommand {
  seq: number;
  action: "expand" | "collapse";
}

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico", "avif"];

export function getExt(key: string): string {
  const lower = key.toLowerCase();
  const base = lower.split("/").pop() || lower;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1) : "";
}

export function getFileBadge(key: string): { label: string; tone: PreviewTone } {
  const ext = getExt(key);
  if (ext === "json") return { label: "JSON", tone: "json" };
  if (ext === "xml") return { label: "XML", tone: "xml" };
  if (IMAGE_EXT.includes(ext)) return { label: ext.toUpperCase(), tone: "image" };
  if (ext) return { label: ext.toUpperCase(), tone: "text" };
  return { label: "TEXT", tone: "text" };
}

export function isImageKey(key: string): boolean {
  return IMAGE_EXT.includes(getExt(key));
}

export function splitPath(key: string): string[] {
  return key.split("/").filter(Boolean);
}

export function countLines(s: string): number {
  if (!s) return 0;
  let n = 1;
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) === 10) n++;
  }
  return n;
}

/** 复制文本，优先 clipboard API，失败回退 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
