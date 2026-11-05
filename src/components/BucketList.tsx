import { useStore } from "../store";
import { createBucket, deleteBucket } from "../api";
import { useDialogs } from "../dialogs";
import { useT } from "../i18n";
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
  const t = useT();

  const onCreate = async () => {
    const conn = activeConn();
    if (!conn) return;
    const name = await prompt({
      title: t("bucket.createTitle"),
      message: t("bucket.createMsg"),
      placeholder: t("bucket.placeholder"),
      confirmText: t("bucket.create"),
    });
    if (!name) return;
    try {
      await createBucket(conn, name);
      await loadBuckets();
      toast(t("bucket.created", { name }), "success");
    } catch (e) {
      toast(t("bucket.createFail", { msg: String(e) }), "error");
    }
  };

  const onDelete = async (name: string) => {
    const conn = activeConn();
    if (!conn) return;
    const ok = await confirm({
      title: t("bucket.deleteTitle"),
      message: t("bucket.deleteMsg", { name }),
      confirmText: t("dialog.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBucket(conn, name);
      if (activeBucket === name) setActiveBucket("");
      await loadBuckets();
      toast(t("bucket.deleted"), "success");
    } catch (e) {
      toast(t("bucket.deleteFail", { msg: String(e) }), "error");
    }
  };

  const onSelect = async (name: string) => {
    setActiveBucket(name);
    await loadObjects();
  };

  return (
    <div className="bucket-panel">
      <div className="panel-header">
        <h2>{t("bucket.title")}</h2>
        <button className="icon-btn" onClick={onCreate} title={t("bucket.new")}>
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
              title={t("conn.delete")}
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
            {activeConn() ? t("bucket.empty") : t("bucket.emptyNoConn")}
          </li>
        )}
      </ul>
    </div>
  );
}
