// Launch offers (13/10/2026, David): Refiner R$ 49 and Monet R$ 99 for the first 10 buyers of each, then the regular price.
// `start` is how many launch seats were still open when the counter went live (Refiner 2, Monet 1); every paid sale on the site
// takes one (studio/counters.json in Blob, local-data/counters.json locally) and at zero the price moves up by itself — the number
// on the page is always the real one.
import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

const LOCAL = !process.env.BLOB_READ_WRITE_TOKEN;
const KEY = 'studio/counters.json';
const FILE = path.join(process.cwd(), 'local-data', 'counters.json');

export const LAUNCH: Record<string, { seats: number; start: number }> = {
  refiner: { seats: 10, start: Number(process.env.REFINER_LAUNCH_LEFT || 2) },
  monet: { seats: 10, start: Number(process.env.MONET_LAUNCH_LEFT || 1) },
};
export type Counters = Record<string, number>;
export type Tier = 'founder' | 'lifetime';
export type Offer = { seats: number; left: number; tier: Tier };

export async function readCounters(): Promise<Counters> {
  if (LOCAL) { try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return {}; } }
  try {
    const { blobs } = await list({ prefix: KEY, limit: 1 });
    const b = blobs.find((x) => x.pathname === KEY);
    if (!b) return {};
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as Counters) : {};
  } catch { return {}; }
}

/** One paid sale of a launch product. */
export async function bump(id: string) {
  if (!LAUNCH[id]) return;
  const c = await readCounters();
  c[id] = (c[id] || 0) + 1;
  if (LOCAL) { await fs.mkdir(path.dirname(FILE), { recursive: true }); await fs.writeFile(FILE, JSON.stringify(c)); return; }
  await put(KEY, JSON.stringify(c), { access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 0 });
}

export function offerFrom(id: string, c: Counters): Offer | null {
  const L = LAUNCH[id]; if (!L) return null;
  const left = Math.max(0, Math.min(L.seats, L.start - (c[id] || 0)));
  return { seats: L.seats, left, tier: left > 0 ? 'founder' : 'lifetime' };
}
export async function offerOf(id: string) { return offerFrom(id, await readCounters()); }
