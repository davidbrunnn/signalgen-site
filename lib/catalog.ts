// SIGNAL STUDIO · the catalog.
// Production: Vercel Blob (studio/catalog.json, one small file rewritten on every publish).
// Local mode (no BLOB_READ_WRITE_TOKEN): local-data/catalog.json on disk — `npm run seed` fills it from ~/Desktop/SignalGen/Venda.
import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

/** One catalog item. The name is historical: it covers tracks, the SignalGen software, sample kits and preset packs. */
export type Track = {
  id: string;            // slug
  title: string;
  artist: string;
  bpm: number;
  key: string;           // "Fm", "A#", ... ('' for software and kits)
  camelot?: string;      // "6A"
  genre: string;
  duration: number;      // seconds, extended mix (0 for non-tracks)
  radioDuration?: number;
  lufs?: number;
  truePeak?: number;
  description?: string;  // one paragraph for the track page
  tags?: string[];
  cover?: string;        // public url (jpg)
  preview?: string;      // public url (m4a, 30 s)
  files: { extended?: string; radio?: string; [key: string]: string | undefined };   // blob urls / file: paths (never shown; served through /api/download)
  downloads?: { key: string; label: string; note?: string }[];   // what the thank-you page offers (defaults to extended + radio for tracks)
  published: string;     // ISO date
  day?: string;          // YYYY-MM-DD of the daily pick
  pick?: number;         // 1..5 rank of that day
  sold?: number;
  score?: number;        // tracks: David's own rating as a fraction (nota 1–5 / 5). Ghost Production sells only score >= GHOST_MIN
  kind?: 'track' | 'pack' | 'software' | 'kit' | 'preset' | 'bundle';
  group?: string;        // sounds: the volume this SKU belongs to (kit id) — the product page shows every format of the volume
  format?: 'wav' | 'serum' | 'bundle' | 'collection';
  vol?: number;
  packType?: string;     // "Full Pack", "Bass Pack", "Serum 2 Preset Pack"...
  keys?: string[];
  specs?: string;        // "48 kHz / 24-bit WAV"
  counts?: { wav?: number; midi?: number; presets?: number };
  inside?: { folder: string; count: number; what: string }[];
  samples?: { name: string; tag: string; src: string }[];
  includes?: string[];   // bundles: the SKUs inside
  wasPrice?: number;     // bundles: what the parts cost alone
  price?: number;
  priceBrl?: number;                                              // 13/10/2026: a pack's own Brazilian price (lib/region soundPrice)
  nonExclusive?: boolean;
  subtitle?: string;     // "Full Pack · 104 sounds · 128 BPM"
  features?: string[];   // bullet list on the product page
  contents?: string;     // "24 one shots · 96 loops"
  sizeMb?: number;
  screenshots?: string[];
  licenseProduct?: 'signalgen' | 'mix' | 'sounds' | 'refiner' | 'monet' | 'ear' | 'bundle';   // software: which SGN1 key to issue
};
export type Product = Track;

export type Catalog = { tracks: Track[]; updated: string };

export type Order = { session: string; trackId: string; email?: string; amount?: number; currency?: string; when: string; refunded?: boolean; key?: string; serial?: number; mailed?: boolean };

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
  // 13/10/2026: the buyer's account (/conta) lists purchases by e-mail — one small index entry per order (lib/account)
  if (o.email) { try { const { indexOrder } = await import('@/lib/account'); await indexOrder(o); } catch (e) { console.error('account index', e); } }
}

/** Marks a paid order once: increments `sold` and stores the order. Returns 'ok' | 'dup' | 'taken' (exclusive track already sold). */
export async function recordSale(o: Order): Promise<'ok' | 'dup' | 'taken'> {
  if (await readOrder(o.session)) return 'dup';
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === o.trackId);
  if (t && t.sold && !t.nonExclusive) { await writeOrder({ ...o, refunded: true }); return 'taken'; }
  if (t) { t.sold = (t.sold || 0) + 1; await writeCatalog(cat); }
  if (t && (o.amount || 0) > 0) { try { const { bump } = await import('@/lib/launch'); await bump(t.id); } catch (e) { console.error('launch counter', e); } }   // one launch seat taken
  if (t?.kind === 'software' && o.email) {                       // the SignalGen key is issued once, at the moment of sale
    try {
      const { issueKey, nextSerial } = await import('@/lib/license');
      o.serial = await nextSerial();
      o.key = await issueKey(o.email, t.licenseProduct || 'bundle', o.serial);
    } catch (e) { console.error('license key not issued', e); }
  }
  if (t && o.email) {                                            // 13/10/2026: the buyer gets the key + the link to the downloads by e-mail
    try { const { purchaseMail } = await import('@/lib/purchase-mail'); o.mailed = (await purchaseMail(t, o)) === 'sent'; } catch (e) { console.error('purchase mail', e); }
  }
  await writeOrder(o);
  return 'ok';
}

export const PRICE_USD = Number(process.env.PRICE_USD || 59);

/** SignalGen (10/10/2026): founder price for the first 100 licenses, then lifetime — R$ 199 / R$ 299 in Brazil, US$ 49 / US$ 74 abroad,
 *  the Brazilian price in local currency in Latin America (lib/region sgPrice). priceOf gives the US$ figure (records, fallbacks). */
export const FOUNDER_SEATS = Number(process.env.FOUNDER_SEATS || 100);
export function founderLeft(t?: Pick<Track, 'sold'> | null) { return Math.max(0, FOUNDER_SEATS - (t?.sold || 0)); }
export const sgTier = (t?: Pick<Track, 'sold'> | null): 'founder' | 'lifetime' => (founderLeft(t) > 0 ? 'founder' : 'lifetime');
export function priceOf(t: Track) {
  if (t.kind === 'software' && t.licenseProduct === 'monet') return 19.9;
  if (t.kind === 'software' && t.licenseProduct === 'refiner') return 9.9;
  if (t.kind === 'software' && t.licenseProduct === 'ear') return 0;                        // Tempo is free (13/10/2026)
  if (t.kind === 'software') return sgTier(t) === 'founder' ? Number(process.env.FOUNDER_PRICE_USD || 49) : Number(process.env.LIFETIME_PRICE_USD || 74);
  return t.price || PRICE_USD;
}
export function isSold(t: Track) { return !!t.sold && !t.nonExclusive; }
/** Ghost Production (10/10/2026): only tracks rated and approved for sale — David's nota >= 80 % (4 of 5). GHOST_MIN changes the bar. */
export const GHOST_MIN = Number(process.env.GHOST_MIN || 0.8);
export function approved(t: Track) { return t.kind !== 'track' || (t.score ?? 0) >= GHOST_MIN - 1e-9; }
export const SELL_TRACKS = process.env.SELL_TRACKS !== '0';    // ghost productions: each track sold once; SELL_TRACKS=0 turns the tracks into demos
/** Where a product lives on the site. */
export function hrefOf(t: Pick<Track, 'id' | 'kind'>) {
  return t.kind === 'track' ? `/t/${t.id}` : t.kind === 'software' ? (t.id === 'monet' ? '/monet' : t.id === 'refiner' ? '/refiner' : t.id === 'tempo' ? '/tempo' : '/signalgen') : `/p/${t.id}`;
}
/** 13/10/2026 (David: "bloqueie todos os outros produtos"): the only things on sale. Everything else in the catalog is "coming soon"
 *  (the SignalGen) or out of the window. FOR_SALE in the environment can widen it (comma-separated ids). */
export const FOR_SALE = new Set((process.env.FOR_SALE || 'refiner,monet,tempo').split(',').map((s) => s.trim()).filter(Boolean));
/** 13/10/2026 (David): the sample packs are "em breve" too and the vocals left the window — no pack is sold until PACKS_OPEN=1. */
export const PACKS_OPEN = process.env.PACKS_OPEN === '1';
export const forSale = (t?: Pick<Track, 'id' | 'kind'> | null) =>
  !!t && FOR_SALE.has(t.id) && (PACKS_OPEN || !(t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle'));
export const soonLabel = (lang: string) => (lang === 'en' ? 'Coming soon' : lang === 'es' ? 'Próximamente' : 'Em breve');
/** The SignalGen itself (the Monet is also kind 'software'). */
export const isSignalGen = (t: Track) => t.kind === 'software' && !['monet', 'refiner', 'ear'].includes(t.licenseProduct || '');
export const isFree = (t: Track) => t.kind === 'software' && t.licenseProduct === 'ear';
export const isSound = (t: Track) => t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle';
export function downloadsOf(t: Track) {
  if (t.downloads?.length) return t.downloads.filter((d) => t.files[d.key]);
  const d: { key: string; label: string; note?: string }[] = [];
  if (t.files.extended) d.push({ key: 'extended', label: 'Extended Mix', note: 'WAV 24-bit' });
  if (t.files.radio) d.push({ key: 'radio', label: 'Radio Edit', note: 'WAV 24-bit' });
  return d;
}
/** How a launch product is priced right now ('founder' = launch seats left). The SignalGen keeps its own founder ladder. */
export async function tierOf(t: Track): Promise<'founder' | 'lifetime'> {
  if (isSignalGen(t)) return sgTier(t);
  const { offerOf } = await import('@/lib/launch');
  return (await offerOf(t.id))?.tier || 'lifetime';
}
export async function readOrders(): Promise<Order[]> {
  if (LOCAL) return readJson<Order[]>('orders.json', []);
  try { const { blobs } = await list({ prefix: 'studio/orders/', limit: 1000 }); return blobs.map((b) => ({ session: b.pathname.split('/').pop()!.split('.')[0] } as Order)); } catch { return []; }
}

export function fmtDur(s?: number) {
  if (!s) return '';
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
