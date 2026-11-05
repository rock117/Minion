import { create } from "zustand";
import {
  type Connection,
  listConnections,
  saveConnection,
  deleteConnection,
  testConnection,
  listBuckets,
  type BucketInfo,
  listObjects,
  type ObjectInfo,
} from "./api";

interface AppState {
  // 连接
  connections: Connection[];
  activeConnId: string | null;
  loadConnections: () => Promise<void>;
  upsertConnection: (c: Connection) => Promise<Connection>;
  removeConnection: (id: string) => Promise<void>;
  setActiveConn: (id: string) => void;
  activeConn: () => Connection | null;
  test: (c: Connection) => Promise<BucketInfo[]>;

  // bucket
  buckets: BucketInfo[];
  activeBucket: string | null;
  loadBuckets: () => Promise<void>;
  setActiveBucket: (name: string) => void;

  // object
  objects: ObjectInfo[];
  prefix: string;
  loadObjects: () => Promise<void>;
  enterDir: (key: string) => Promise<void>;
  goUp: () => Promise<void>;
  setPrefix: (p: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  connections: [],
  activeConnId: null,
  loadConnections: async () => {
    const conns = await listConnections();
    set({ connections: conns });
    if (!get().activeConnId && conns.length > 0) {
      set({ activeConnId: conns[0].id });
    }
  },
  upsertConnection: async (c) => {
    const saved = await saveConnection(c);
    await get().loadConnections();
    return saved;
  },
  removeConnection: async (id) => {
    await deleteConnection(id);
    if (get().activeConnId === id) set({ activeConnId: null, buckets: [], objects: [] });
    await get().loadConnections();
  },
  setActiveConn: (id) =>
    set({ activeConnId: id, buckets: [], activeBucket: null, objects: [], prefix: "" }),
  activeConn: () => get().connections.find((c) => c.id === get().activeConnId) ?? null,
  test: async (c) => testConnection(c),

  buckets: [],
  activeBucket: null,
  loadBuckets: async () => {
    const conn = get().activeConn();
    if (!conn) return;
    const buckets = await listBuckets(conn);
    set({ buckets });
  },
  setActiveBucket: (name) =>
    set({ activeBucket: name, objects: [], prefix: "" }),

  objects: [],
  prefix: "",
  loadObjects: async () => {
    const conn = get().activeConn();
    const bucket = get().activeBucket;
    if (!conn || !bucket) return;
    const objs = await listObjects(conn, bucket, get().prefix, "/");
    set({ objects: objs });
  },
  enterDir: async (key) => {
    set({ prefix: key });
    await get().loadObjects();
  },
  goUp: async () => {
    const p = get().prefix;
    if (!p) return;
    const parts = p.split("/").filter(Boolean);
    parts.pop();
    const up = parts.length === 0 ? "" : parts.join("/") + "/";
    set({ prefix: up });
    await get().loadObjects();
  },
  setPrefix: (p) => set({ prefix: p }),
}));
