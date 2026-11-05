import { create } from "zustand";
import { countObjects, type Connection } from "./api";

export type CountEntry =
  | { count: number; capped: boolean }
  | "loading"
  | "error";

interface FolderCountState {
  entries: Record<string, CountEntry>;
  /** 请求某目录的文件数（带缓存与并发限制） */
  request: (conn: Connection, bucket: string, prefix: string) => void;
}

const MAX_CONCURRENT = 4;

const keyOf = (bucket: string, prefix: string) => `${bucket}::${prefix}`;

export const useFolderCounts = create<FolderCountState>((set, get) => {
  const queue: { conn: Connection; bucket: string; prefix: string; key: string }[] =
    [];
  let active = 0;

  const pump = () => {
    while (active < MAX_CONCURRENT && queue.length > 0) {
      const task = queue.shift()!;
      active++;
      countObjects(task.conn, task.bucket, task.prefix)
        .then((r) =>
          set((s) => ({
            entries: {
              ...s.entries,
              [task.key]: { count: r.count, capped: r.capped },
            },
          })),
        )
        .catch(() =>
          set((s) => ({ entries: { ...s.entries, [task.key]: "error" } })),
        )
        .finally(() => {
          active--;
          pump();
        });
    }
  };

  return {
    entries: {},
    request: (conn, bucket, prefix) => {
      const key = keyOf(bucket, prefix);
      if (get().entries[key]) return;
      set((s) => ({ entries: { ...s.entries, [key]: "loading" } }));
      queue.push({ conn, bucket, prefix, key });
      pump();
    },
  };
});

export const folderCountKey = keyOf;
