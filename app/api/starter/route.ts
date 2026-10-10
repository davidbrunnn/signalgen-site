// SONGSTARTER request: a licensed customer asks the studio engine for a new set.
// POST {email, key, genre, mood, tonality?, platform, audio?, filename?} -> a kind=starter job in the same Blob queue the Mac
// worker already reads (/api/pack/jobs). Quota: STARTER_QUOTA per license per month. GET ?email&key -> what is left + the jobs.
import { NextResponse } from 'next/server';
import { checkKey, type License } from '@/lib/license';
import { listJobs, packId, starterCount, STARTER_QUOTA, writeJob } from '@/lib/pack';
import { GENRES, KEYS, MOODS } from '@/lib/site';

export const runtime = 'nodejs';
const OK_PRODUCTS = ['signalgen', 'bundle'];

function lic(email: string, key: string): { l?: License; err?: string } {
  const l = checkKey(key, email);
  if (!l) return { err: 'This license key does not match that e-mail. Use the address you bought with.' };
  if (!OK_PRODUCTS.includes(l.product)) return { err: 'This key is for another plugin. Songstarters come with SignalGen and the Bundle.' };
  return { l };
}

export async function GET(req: Request) {
  const u = new URL(req.url); const email = (u.searchParams.get('email') || '').trim().toLowerCase();
  const r = lic(email, u.searchParams.get('key') || '');
  const l = r.l; if (!l) return NextResponse.json({ error: r.err }, { status: 403 });
  const mine = (await listJobs()).filter((j) => j.kind === 'starter' && j.serial === l.serial).reverse().slice(0, 30)
    .map((j) => ({ id: j.id, title: j.title, status: j.status, created: j.created, genre: j.genre }));
  return NextResponse.json({ left: Math.max(0, STARTER_QUOTA - (await starterCount(l.serial))), quota: STARTER_QUOTA, edition: l.edition, jobs: mine });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const r = lic(email, String(b.key || ''));
  const l = r.l; if (!l) return NextResponse.json({ error: r.err }, { status: 403 });
  const used = await starterCount(l.serial);
  if (used >= STARTER_QUOTA) return NextResponse.json({ error: `You used your ${STARTER_QUOTA} songstarters this month. New ones on the 1st.` }, { status: 429 });
  const genre = (GENRES as readonly string[]).includes(b.genre) ? b.genre : 'Tech House';
  const mood = (MOODS as readonly string[]).includes(b.mood) ? b.mood : 'Night';
  const tonality = (KEYS as readonly string[]).includes(String(b.tonality || '').replace(/m$/, '')) ? String(b.tonality) : undefined;
  const audio = typeof b.audio === 'string' && /^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\//.test(b.audio) ? b.audio : '';
  const id = packId(); const now = new Date().toISOString();
  await writeJob({ id, kind: 'starter', serial: l.serial, email, genre, mood, key: tonality, platform: b.platform === 'mac' ? 'mac' : 'windows',
    title: audio ? String(b.filename || 'reference').replace(/\.[a-z0-9]+$/i, '').slice(0, 80) : `${genre} · ${mood}`,
    filename: audio ? String(b.filename || '').slice(0, 120) : '', audio, status: 'paid', created: now, updated: now });
  return NextResponse.json({ id, left: STARTER_QUOTA - used - 1 });
}
