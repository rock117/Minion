import { useState } from "react";
import { useStore } from "../store";
import { type Connection, emptyConnection } from "../api";
import { useDialogs } from "../dialogs";
import { useT } from "../i18n";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

export function ConnectionSidebar() {
  const {
    connections,
    activeConnId,
    setActiveConn,
    upsertConnection,
    removeConnection,
    loadBuckets,
    test,
  } = useStore();
  const { confirm } = useDialogs();
  const t = useT();

  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const startNew = () => setEditing(emptyConnection());
  const startEdit = (c: Connection) => setEditing({ ...c });

  const save = async () => {
    if (!editing) return;
    const saved = await upsertConnection(editing);
    setEditing(null);
    setActiveConn(saved.id);
    await loadBuckets();
  };

  const onTest = async () => {
    if (!editing) return;
    setTesting(true);
    setTestMsg(null);
    try {
      const buckets = await test(editing);
      setTestMsg(t("conn.testOk", { n: buckets.length }));
    } catch (e) {
      setTestMsg(t("conn.testFail", { msg: String(e) }));
    } finally {
      setTesting(false);
    }
  };

  const modal = editing && (
    <div className="modal-mask" onClick={() => setEditing(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing.id ? t("conn.edit") : t("conn.newConn")}</h3>
        <label>
          {t("conn.name")}
          <input
            value={editing.name}
            autoFocus
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
        </label>
        <label>
          {t("conn.endpoint")}
          <input
            value={editing.endpoint}
            placeholder="http://localhost:9000"
            onChange={(e) =>
              setEditing({ ...editing, endpoint: e.target.value })
            }
          />
        </label>
        <label>
          {t("conn.region")}
          <input
            value={editing.region}
            onChange={(e) => setEditing({ ...editing, region: e.target.value })}
          />
        </label>
        <label>
          {t("conn.accessKey")}
          <input
            value={editing.access_key}
            onChange={(e) =>
              setEditing({ ...editing, access_key: e.target.value })
            }
          />
        </label>
        <label>
          {t("conn.secretKey")}
          <input
            type="password"
            value={editing.secret_key}
            onChange={(e) =>
              setEditing({ ...editing, secret_key: e.target.value })
            }
          />
        </label>
        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={editing.use_path_style}
              onChange={(e) =>
                setEditing({ ...editing, use_path_style: e.target.checked })
              }
            />
            {t("conn.pathStyle")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={editing.allow_http}
              onChange={(e) =>
                setEditing({ ...editing, allow_http: e.target.checked })
              }
            />
            {t("conn.allowHttp")}
          </label>
        </div>

        {testMsg && <div className="test-msg">{testMsg}</div>}

        <div className="modal-actions">
          <button onClick={onTest} disabled={testing}>
            {testing ? t("conn.testing") : t("conn.test")}
          </button>
          <button onClick={save} className="primary">
            {t("conn.save")}
          </button>
          <button onClick={() => setEditing(null)}>{t("conn.cancel")}</button>
        </div>
      </div>
    </div>
  );

  // ---------- 折叠态：窄活动栏 ----------
  if (collapsed) {
    return (
      <aside className="sidebar collapsed">
        <button
          className="collapse-btn"
          title={t("conn.expand")}
          onClick={() => setCollapsed(false)}
        >
          <span className="collapse-icon">
            <PanelLeftOpen size={17} />
          </span>
        </button>
        <button
          className="activity-btn"
          title={t("conn.newConn")}
          onClick={startNew}
        >
          <Plus size={18} />
        </button>
        <div className="activity-conn-list">
          {connections.map((c) => (
            <button
              key={c.id}
              className={`activity-conn ${c.id === activeConnId ? "active" : ""}`}
              title={c.name}
              onClick={async () => {
                setActiveConn(c.id);
                await loadBuckets();
              }}
            >
              {c.name.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
        {modal}
      </aside>
    );
  }

  // ---------- 展开态：完整侧边栏 ----------
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{t("conn.title")}</h2>
        <div className="header-actions">
          <button className="ghost" onClick={startNew} title={t("conn.newConn")}>
            <Plus size={14} /> {t("conn.new")}
          </button>
          <button
            className="icon-btn"
            title={t("conn.collapse")}
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      <ul className="conn-list">
        {connections.map((c) => (
          <li
            key={c.id}
            className={c.id === activeConnId ? "active" : ""}
            onClick={async () => {
              setActiveConn(c.id);
              await loadBuckets();
            }}
          >
            <div className="conn-row">
              <span className="conn-name">{c.name}</span>
              <button
                className="icon-btn"
                title={t("conn.edit")}
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(c);
                }}
              >
                <Pencil size={13} />
              </button>
              <button
                className="icon-btn danger"
                title={t("conn.delete")}
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await confirm({
                    title: t("conn.deleteTitle"),
                    message: t("conn.deleteMsg", { name: c.name }),
                    confirmText: t("dialog.delete"),
                    danger: true,
                  });
                  if (ok) removeConnection(c.id);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="conn-endpoint">{c.endpoint}</div>
          </li>
        ))}
        {connections.length === 0 && (
          <li className="empty-hint">{t("conn.empty")}</li>
        )}
      </ul>

      {modal}
    </aside>
  );
}
