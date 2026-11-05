import { useState } from "react";
import { useStore } from "../store";
import { type Connection, emptyConnection } from "../api";

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
      setTestMsg(`连接成功，共 ${buckets.length} 个 bucket`);
    } catch (e) {
      setTestMsg(`失败: ${e}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>连接</h2>
        <button onClick={startNew}>+ 新建</button>
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
                title="编辑"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(c);
                }}
              >
                ✎
              </button>
              <button
                className="icon-btn danger"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`删除连接 "${c.name}"?`)) removeConnection(c.id);
                }}
              >
                ✕
              </button>
            </div>
            <div className="conn-endpoint">{c.endpoint}</div>
          </li>
        ))}
        {connections.length === 0 && (
          <li className="empty-hint">还没有连接，点击"新建"添加</li>
        )}
      </ul>

      {editing && (
        <div className="modal-mask" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? "编辑连接" : "新建连接"}</h3>
            <label>
              名称
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>
            <label>
              Endpoint
              <input
                value={editing.endpoint}
                placeholder="http://localhost:9000"
                onChange={(e) =>
                  setEditing({ ...editing, endpoint: e.target.value })
                }
              />
            </label>
            <label>
              Region
              <input
                value={editing.region}
                onChange={(e) =>
                  setEditing({ ...editing, region: e.target.value })
                }
              />
            </label>
            <label>
              Access Key
              <input
                value={editing.access_key}
                onChange={(e) =>
                  setEditing({ ...editing, access_key: e.target.value })
                }
              />
            </label>
            <label>
              Secret Key
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
                Path Style
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editing.allow_http}
                  onChange={(e) =>
                    setEditing({ ...editing, allow_http: e.target.checked })
                  }
                />
                允许 HTTP
              </label>
            </div>

            {testMsg && <div className="test-msg">{testMsg}</div>}

            <div className="modal-actions">
              <button onClick={onTest} disabled={testing}>
                {testing ? "测试中..." : "测试连接"}
              </button>
              <button onClick={save} className="primary">
                保存
              </button>
              <button onClick={() => setEditing(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
