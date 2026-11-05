import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

type ToastKind = "info" | "success" | "error";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  toast: (message: string, kind?: ToastKind) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogs(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialogs 必须在 DialogProvider 内使用");
  return ctx;
}

interface ConfirmState {
  opts: ConfirmOptions;
  resolve: (v: boolean) => void;
}

interface PromptState {
  opts: PromptOptions;
  value: string;
  resolve: (v: string | null) => void;
}

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ opts, resolve })),
    [],
  );

  const prompt = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) =>
        setPromptState({ opts, value: opts.defaultValue ?? "", resolve }),
      ),
    [],
  );

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const closeConfirm = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  const closePrompt = (v: string | null) => {
    promptState?.resolve(v);
    setPromptState(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, toast }}>
      {children}

      {/* 确认对话框 */}
      {confirmState && (
        <div className="dlg-mask" onClick={() => closeConfirm(false)}>
          <div
            className="dlg"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeConfirm(false);
            }}
          >
            <div className="dlg-head">
              <span
                className={`dlg-icon ${
                  confirmState.opts.danger ? "danger" : "info"
                }`}
              >
                <AlertTriangle size={17} />
              </span>
              <div className="dlg-title">{confirmState.opts.title}</div>
            </div>
            {confirmState.opts.message && (
              <div className="dlg-message">{confirmState.opts.message}</div>
            )}
            <div className="dlg-actions">
              <button onClick={() => closeConfirm(false)}>
                {confirmState.opts.cancelText ?? "取消"}
              </button>
              <button
                className={confirmState.opts.danger ? "danger-solid" : "primary"}
                autoFocus
                onClick={() => closeConfirm(true)}
              >
                {confirmState.opts.confirmText ?? "确定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 输入对话框 */}
      {promptState && (
        <div className="dlg-mask" onClick={() => closePrompt(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-head">
              <div className="dlg-title">{promptState.opts.title}</div>
            </div>
            {promptState.opts.message && (
              <div className="dlg-message">{promptState.opts.message}</div>
            )}
            <input
              className="dlg-input"
              autoFocus
              value={promptState.value}
              placeholder={promptState.opts.placeholder}
              onChange={(e) =>
                setPromptState((s) => (s ? { ...s, value: e.target.value } : s))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  closePrompt(promptState.value.trim() || null);
                else if (e.key === "Escape") closePrompt(null);
              }}
            />
            <div className="dlg-actions">
              <button onClick={() => closePrompt(null)}>
                {promptState.opts.cancelText ?? "取消"}
              </button>
              <button
                className="primary"
                onClick={() => closePrompt(promptState.value.trim() || null)}
              >
                {promptState.opts.confirmText ?? "确定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div className={`toast ${t.kind}`} key={t.id}>
            <span className="toast-icon">
              {t.kind === "success" ? (
                <CheckCircle2 size={15} />
              ) : t.kind === "error" ? (
                <XCircle size={15} />
              ) : (
                <Info size={15} />
              )}
            </span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}
