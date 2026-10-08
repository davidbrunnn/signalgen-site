// SIGNAL STUDIO · the catalog.
// Production: Vercel Blob (studio/catalog.json, one small file rewritten on every publish).
// Local mode (no BLOB_READ_WRITE_TOKEN): local-data/catalog.json on disk — `npm run seed` fills it from ~/Desktop/SignalGen/Venda.
import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

export type Track = {
  id: string;            // slug: titulo-bpm-key
  title: string;
  artist: string;
  bpm: number;
  key: string;           // "Fm", "A#", ...
  camelot?: string;      // "6A"
  genre: string;
  duration: number;      // seconds, extended mix
  radioDuration?: number;
  lufs?: number;
  truePeak?: number;
  description?: string;  // one paragraph for the track page
  tags?: string[];
  cover?: string;        // public url (jpg)
  preview?: string;      // public url (m4a, 30 s)
  files: { extended?: string; radio?: string };   // blob urls / file: paths (never shown; served through /api/download)
  published: string;     // ISO date
  day?: string;          // YYYY-MM-DD of the daily pick
  pick?: number;         // 1..5 rank of that day
  sold?: number;
  kind?: 'track' | 'pack';
  price?: number;
  nonExclusive?: boolean;
};

export type Catalog = { tracks: Track[]; updated: string };

export type Order = { session: string; trackId: string; email?: string; amount?: number; when: string; refunded?: boolean };

export const LOCAL = !process.env.BLOB_READ_WRITE_TOKEN;
const DATA = path.join(process.cwd(), 'local-data');
const KEY = 'studio/catalog.json';

async function readJson<T>(file: string, empty: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(path.join(DATA, file), 'utf8')) as T; } catch { return empty; }
}
async function writeJson(file: string, v: unknown) {
  await fs.mkdir(DATA, { recursive: true });
  await fs.writeFile(path.join(DATA, file), JSON.stringify(v, null, 1));
}

export async function readCatalog(): Promise<Catalog> {
  if (LOCAL) return readJson<Catalog>('catalog.json', { tracks: [], updated: '' });
  try {
    const { blobs } = await list({ prefix: KEY, limit: 1 });
    const b = blobs.find((x) => x.pathname === KEY);
    if (!b) return { tracks: [], updated: '' };
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });   // the query busts the CDN copy
    if (!r.ok) return { tracks: [], updated: '' };
    return (await r.json()) as Catalog;
  } catch {
    return { tracks: [], updated: '' };
  }
}

export async function writeCatalog(c: Catalog) {
  c.updated = new Date().toISOString();
  if (LOCAL) return writeJson('catalog.json', c);
  await put(KEY, JSON.stringify(c), { access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60 });
}

/** Orders: Blob keeps one file per order (random suffix); local mode keeps a list. Used for idempotency and the license page. */
export async function readOrder(session: string): Promise<Order | null> {
  if (LOCAL) return (await readJson<Order[]>('orders.json', [])).find((o) => o.session === session) || null;
  try {
    const { blobs } = await list({ prefix: `studio/orders/${session}`, limit: 1 });
    if (!blobs[0]) return null;
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as Order) : null;
  } catch { return null; }
}

export async function writeOrder(o: Order) {
  if (LOCAL) {
    const all = await readJson<Order[]>('orders.json', []);
    const i = all.findIndex((x) => x.session === o.session);
    if (i >= 0) all[i] = o; else all.push(o);
    return writeJson('orders.json', all);
  }
  await put(`studio/orders/${o.session}.json`, JSON.stringify(o), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
}

/** Marks a paid order once: increments `sold` and stores the order. Returns 'ok' | 'dup' | 'taken' (exclusive track already sold). */
export async function recordSale(o: Order): Promise<'ok' | 'dup' | 'taken'> {
  if (await readOrder(o.session)) return 'dup';
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === o.trackId);
  if (t && t.sold && !t.nonExclusive) { await writeOrder({ ...o, refunded: true }); return 'taken'; }
  if (t) { t.sold = (t.sold || 0) + 1; await writeCatalog(cat); }
  await writeOrder(o);
  return 'ok';
}

export const PRICE_USD = Number(process.env.PRICE_USD || 59);

export function priceOf(t: Track) { return t.price || PRICE_USD; }
export function isSold(t: Track) { return !!t.sold && !t.nonExclusive; }

export function fmtDur(s?: number) {
  if (!s) return '';
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
