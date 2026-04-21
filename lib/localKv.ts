import { promises as fs } from "node:fs";
import path from "node:path";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

type StoreFile = {
  kv: Record<string, Json>;
  sets: Record<string, string[]>;
};

function dataFilePath() {
  const p = process.env.LOCAL_KV_FILE || path.join(process.cwd(), ".data", "local-kv.json");
  return p;
}

async function readStore(): Promise<StoreFile> {
  const p = dataFilePath();
  try {
    const txt = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(txt) as Partial<StoreFile>;
    return {
      kv: typeof parsed.kv === "object" && parsed.kv ? (parsed.kv as StoreFile["kv"]) : {},
      sets:
        typeof parsed.sets === "object" && parsed.sets ? (parsed.sets as StoreFile["sets"]) : {},
    };
  } catch {
    return { kv: {}, sets: {} };
  }
}

async function writeStore(store: StoreFile) {
  const p = dataFilePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(store, null, 2), "utf8");
}

// Very small, non-concurrent-safe local store (fine for single-user dev).
// Matches only the methods this app uses.
export const localKv = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const s = await readStore();
    return (s.kv[key] as T) ?? null;
  },
  async set(key: string, value: Json): Promise<void> {
    const s = await readStore();
    s.kv[key] = value;
    await writeStore(s);
  },
  async del(key: string): Promise<void> {
    const s = await readStore();
    delete s.kv[key];
    await writeStore(s);
  },
  async mget<T = unknown>(...keys: string[]): Promise<Array<T | null>> {
    const s = await readStore();
    return keys.map((k) => ((s.kv[k] as T) ?? null));
  },
  async sadd(key: string, member: string): Promise<void> {
    const s = await readStore();
    const existing = new Set(s.sets[key] ?? []);
    existing.add(member);
    s.sets[key] = Array.from(existing);
    await writeStore(s);
  },
  async srem(key: string, member: string): Promise<void> {
    const s = await readStore();
    const existing = new Set(s.sets[key] ?? []);
    existing.delete(member);
    s.sets[key] = Array.from(existing);
    await writeStore(s);
  },
  async smembers(key: string): Promise<string[]> {
    const s = await readStore();
    return (s.sets[key] ?? []).slice();
  },
};

