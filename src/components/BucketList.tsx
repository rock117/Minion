import { useStore } from "../store";
import { createBucket, deleteBucket } from "../api";

export function BucketList() {
  const {
    buckets,
    activeBucket,
    setActiveBucket,
    loadObjects,
    activeConn,
    loadBuckets,
  } = useStore();

  const onCreate = async () => {
    const conn = activeConn();
    if (!conn) return;
    const name = prompt("新 bucket 名称:");
    if (!name) return;
    try {
      await createBucket(conn, name);
      await loadBuckets();
    } catch (e) {
      alert(`创建失败: ${e}`);
    }
  };

  const onDelete = async (name: string) => {
    const conn = activeConn();
    if (!conn) return;
    if (!confirm(`删除 bucket "${name}"?`)) return;
    try {
      await deleteBucket(conn, name);
      if (activeBucket === name) setActiveBucket("");
      await loadBuckets();
    } catch (e) {
      alert(`删除失败: ${e}`);
    }
  };

  const onSelect = async (name: string) => {
    setActiveBucket(name);
    await loadObjects();
  };

  return (
    <div className="bucket-panel">
      <div className="panel-header">
        <h2>Buckets</h2>
        <button onClick={onCreate}>+ 新建</button>
      </div>
      <ul className="bucket-list">
        {buckets.map((b) => (
          <li
            key={b.name}
            className={b.name === activeBucket ? "active" : ""}
            onClick={() => onSelect(b.name)}
          >
            <span className="bucket-icon">🪣</span>
            <span className="bucket-name">{b.name}</span>
            <button
              className="icon-btn danger"
              title="删除"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(b.name);
              }}
            >
              ✕
            </button>
          </li>
        ))}
        {buckets.length === 0 && (
          <li className="empty-hint">选择一个连接后查看 buckets</li>
        )}
      </ul>
    </div>
  );
}
