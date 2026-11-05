import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { PreviewTone } from "./previewUtils";

interface Props {
  tone: PreviewTone;
  badge: string;
  fileName: string;
  path: string;
  chips?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}

/** 统一的预览弹窗外壳：类型徽章 + 文件名 + 路径 + 元信息 + 工具栏 + 内容 + 状态栏 */
export function PreviewShell({
  tone,
  badge,
  fileName,
  path,
  chips,
  toolbar,
  footer,
  onClose,
  wide,
  children,
}: Props) {
  return (
    <div className="pv-mask" onClick={onClose}>
      <div
        className={`pv-shell ${wide ? "pv-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-head">
          <span className={`pv-badge tone-${tone}`}>{badge}</span>
          <div className="pv-head-text">
            <div className="pv-file" title={fileName}>
              {fileName}
            </div>
            <div className="pv-path" title={path}>
              {path}
            </div>
          </div>
          <button className="pv-close" onClick={onClose} title="关闭 (ESC)">
            <X size={17} />
          </button>
        </div>

        {chips && <div className="pv-chips">{chips}</div>}
        {toolbar && <div className="pv-toolbar">{toolbar}</div>}

        <div className="pv-content">{children}</div>

        {footer && <div className="pv-footer">{footer}</div>}
      </div>
    </div>
  );
}
