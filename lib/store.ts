// The small JSON files every page reads (the catalog, the launch counters) — 13/10/2026.
// Before: each read was a Blob listing + a download, on every page and every click (the language switch waited for four round
// trips). Now: one download straight from the store's public address, remembered for a few seconds in this instance.
// The catalog's name is derived from the store token, so its address cannot be guessed: it holds the links of the paid downloads.
import { put, list, del } from '@vercel/blob';
import { createHash } from 'crypto';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
/** https://<store id>.public.blob.vercel-storage.com — the id is the 4th piece of the token (vercel_blob_rw_<id>_<secret>). */
const BASE = (() => { const id = TOKEN.split('_')[3]; return id ? `https://${id.toLowerCase()}.public.blob.vercel-storage.com` : ''; })();
/** The catalog's unguessable path (the Mac's loja_produtos.py derives the same one from the same token). */
export const CATALOG_KEY = TOKEN ? `studio/c-${createHash('sha256').update(`sg-catalog|${TOKEN}`).digest('hex').slice(0, 32)}.json` : 'studio/catalog.json';
export const OLD_CATALOG_KEY = 'studio/catalog.json';

const mem = new Map<string, { at: number; v: unknown }>();
const TTL = 15_000;

async function download<T>(key: string): Promise<T | null | undefined> {          // undefined = could not tell
  if (BASE) {
    try {
      const r = await fetch(`${BASE}/${key}?v=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) return (await r.json()) as T;
      if (r.status === 404) return null;
    } catch { /* fall back to the listing */ }
  }
  try {
    const { blobs } = await list({ prefix: key, limit: 1 });
    const b = blobs.find((x) => x.pathname === key);
    if (!b) return null;
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as T) : undefined;
  } catch { return undefined; }
}

/** Reads a fixed-path JSON from Blob. `fresh` skips the memory (money decisions: the checkout). */
export async function readBlobJson<T>(key: string, fresh = false): Promise<T | null> {
  const m = mem.get(key);
  if (!fresh && m && Date.now() - m.at < TTL) return m.v as T | null;
  const v = await download<T>(key);
  if (v === undefined) return m ? (m.v as T | null) : null;                        // the store hiccuped: the last known value
  mem.set(key, { at: Date.now(), v });
  return v;
}

export async function writeBlobJson(key: string, v: unknown, maxAge = 0) {
  await put(key, JSON.stringify(v), { access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: maxAge });
  mem.set(key, { at: Date.now(), v });
}

/** Removes a fixed-path blob (the old public catalog, once it has been moved). */
export async function removeBlob(key: string) {
  try { const { blobs } = await list({ prefix: key, limit: 5 }); const hit = blobs.filter((b) => b.pathname === key); if (hit.length) await del(hit.map((b) => b.url)); } catch (e) { console.error('removeBlob', key, e); }
  mem.delete(key);
}
