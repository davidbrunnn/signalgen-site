// SIGNAL STUDIO · the catalog lives in Vercel Blob as catalog.json (one small file, rewritten on every publish)
import { put, list } from '@vercel/blob';

export type Track = {
  id: string;            // slug: titulo-bpm-key
  title: string;
  artist: string;
  bpm: number;
  key: string;           // "Fm", "A#", ...
  genre: string;
  duration: number;      // seconds, extended mix
  radioDuration?: number;
  lufs?: number;
  truePeak?: number;
  cover?: string;        // public blob url (jpg)
  preview?: string;      // public blob url (m4a, 30 s)
  files: { extended?: string; radio?: string };   // blob urls (never shown; served through /api/download)
  published: string;     // ISO date
  day?: string;          // YYYY-MM-DD of the daily pick
  pick?: number;         // 1..5 rank of that day
  sold?: number;
};

export type Catalog = { tracks: Track[]; updated: string };

const KEY = 'studio/catalog.json';

export async function readCatalog(): Promise<Catalog> {
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
  await put(KEY, JSON.stringify(c), { access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60 });
}

export const PRICE_USD = Number(process.env.PRICE_USD || 59);

export function fmtDur(s?: number) {
  if (!s) return '';
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
