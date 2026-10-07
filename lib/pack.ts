// SIGNALGEN PACK · jobs live in Vercel Blob as pack/jobs/<id>.json (one small file per job, rewritten on every status change)
import { put, list } from '@vercel/blob';

export type PackJob = {
  id: string;
  title: string;           // the song's name, from the file name
  filename: string;
  audio: string;           // public blob url of the upload
  email?: string;
  status: 'paid' | 'working' | 'done' | 'error';
  created: string;         // ISO
  updated: string;
  url?: string;            // public blob url of the zip (random suffix: unguessable)
  size?: number;
  note?: string;           // progress / error text from the Mac
  session?: string;        // stripe session id
};

export const PACK_PRICE_USD = Number(process.env.PACK_PRICE_USD || 19);
const KEY = (id: string) => `pack/jobs/${id}.json`;

export function packId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function readJob(id: string): Promise<PackJob | null> {
  if (!/^[a-z0-9]{8,16}$/.test(id)) return null;
  try {
    const { blobs } = await list({ prefix: KEY(id), limit: 1 });
    const b = blobs.find((x) => x.pathname === KEY(id));
    if (!b) return null;
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as PackJob) : null;
  } catch { return null; }
}

export async function writeJob(j: PackJob) {
  j.updated = new Date().toISOString();
  await put(KEY(j.id), JSON.stringify(j), { access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 30 });
}

export async function listJobs(): Promise<PackJob[]> {
  const out: PackJob[] = [];
  try {
    const { blobs } = await list({ prefix: 'pack/jobs/', limit: 500 });
    await Promise.all(blobs.map(async (b) => {
      try { const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' }); if (r.ok) out.push((await r.json()) as PackJob); } catch {}
    }));
  } catch {}
  return out.sort((a, b) => (a.created < b.created ? -1 : 1));
}
