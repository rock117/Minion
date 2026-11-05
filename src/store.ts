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

  // object（分页）
  objects: ObjectInfo[];
  prefix: string;
  nextToken: string | null;
  isLoading: boolean;
  hasMore: boolean;
  loadObjects: () => Promise<void>;
  loadMoreObjects: () => Promise<void>;
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
    if (get().activeConnId === id)
      set({ activeConnId: null, buckets: [], objects: [], prefix: "" });
    await get().loadConnections();
  },
  setActiveConn: (id) =>
    set({
      activeConnId: id,
      buckets: [],
      activeBucket: null,
      objects: [],
      prefix: "",
      nextToken: null,
      hasMore: false,
    }),
  activeConn: () =>
    get().connections.find((c) => c.id === get().activeConnId) ?? null,
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
    set({
      activeBucket: name,
      objects: [],
      prefix: "",
      nextToken: null,
      hasMore: false,
    }),

  objects: [],
  prefix: "",
  nextToken: null,
  isLoading: false,
  hasMore: false,

  // 加载第一页（重置）
  loadObjects: async () => {
    const conn = get().activeConn();
    const bucket = get().activeBucket;
    if (!conn || !bucket) return;
    set({ isLoading: true, objects: [], nextToken: null, hasMore: false });
    try {
      const result = await listObjects(conn, bucket, get().prefix, "/");
      set({
        objects: result.objects,
        nextToken: result.next_continuation_token,
        hasMore: result.is_truncated,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // 加载下一页（追加）
  loadMoreObjects: async () => {
    const conn = get().activeConn();
    const bucket = get().activeBucket;
    if (!conn || !bucket) return;
    if (get().isLoading || !get().hasMore) return;
    const token = get().nextToken;
    if (!token) return;
    set({ isLoading: true });
    try {
      const result = await listObjects(
        conn,
        bucket,
        get().prefix,
        "/",
        token,
      );
      set({
        objects: [...get().objects, ...result.objects],
        nextToken: result.next_continuation_token,
        hasMore: result.is_truncated,
      });
    } finally {
      set({ isLoading: false });
    }
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
