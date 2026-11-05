import { useStore } from "../store";
import { createBucket, deleteBucket } from "../api";
import { useDialogs } from "../dialogs";
import { Plus, Trash2, Database } from "lucide-react";

export function BucketList() {
  const {
    buckets,
    activeBucket,
    setActiveBucket,
    loadObjects,
    activeConn,
    loadBuckets,
  } = useStore();
  const { confirm, prompt, toast } = useDialogs();

  const onCreate = async () => {
    const conn = activeConn();
    if (!conn) return;
    const name = await prompt({
      title: "新建 Bucket",
      message: "输入 bucket 名称（仅小写字母、数字、连字符）",
      placeholder: "my-bucket",
      confirmText: "创建",
    });
    if (!name) return;
    try {
      await createBucket(conn, name);
      await loadBuckets();
      toast(`已创建 bucket「${name}」`, "success");
    } catch (e) {
      toast(`创建失败: ${e}`, "error");
    }
  };

  const onDelete = async (name: string) => {
    const conn = activeConn();
    if (!conn) return;
    const ok = await confirm({
      title: "删除 Bucket",
      message: `确定删除 bucket「${name}」？Bucket 必须为空才能删除。`,
      confirmText: "删除",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBucket(conn, name);
      if (activeBucket === name) setActiveBucket("");
      await loadBuckets();
      toast("已删除 bucket", "success");
    } catch (e) {
      toast(`删除失败: ${e}`, "error");
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
        <button className="icon-btn" onClick={onCreate} title="新建 bucket">
          <Plus size={15} />
        </button>
      </div>
      <ul className="bucket-list">
        {buckets.map((b) => (
          <li
            key={b.name}
            className={b.name === activeBucket ? "active" : ""}
            onClick={() => onSelect(b.name)}
          >
            <span className="bucket-icon">
              <Database size={14} />
            </span>
            <span className="bucket-name">{b.name}</span>
            <button
              className="icon-btn danger"
              title="删除"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(b.name);
              }}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
        {buckets.length === 0 && (
          <li className="empty-hint">
            {activeConn()
              ? "暂无 bucket，点击上方 + 新建"
              : "请先在左侧选择一个连接"}
          </li>
        )}
      </ul>
    </div>
  );
}
