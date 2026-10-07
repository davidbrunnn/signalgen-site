// the public judge: GET = a random pair of catalog previews · POST {a, b, winner} = a visitor's vote (kept in Blob judge/votes/)
// GET ?all=1 with Bearer PUBLISH_TOKEN = every vote (the Mac's `v2 juiz aprende` reads them as weak duels)
import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { readCatalog } from '@/lib/catalog';

export const runtime = 'nodejs';

function authed(req: Request) {
  const want = process.env.PUBLISH_TOKEN;
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return !!want && got === want;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  if (u.searchParams.get('all') === '1') {
    if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const votes: any[] = [];
    try {
      const { blobs } = await list({ prefix: 'judge/votes/', limit: 1000 });
      await Promise.all(blobs.map(async (b) => { try { const r = await fetch(b.url, { cache: 'no-store' }); if (r.ok) votes.push(await r.json()); } catch {} }));
    } catch {}
    return NextResponse.json({ votes });
  }
  const cat = await readCatalog();
  const pool = cat.tracks.filter((t) => t.preview);
  if (pool.length < 2) return NextResponse.json({ pair: null });
  const i = Math.floor(Math.random() * pool.length); let j = Math.floor(Math.random() * (pool.length - 1)); if (j >= i) j++;
  const pick = (t: typeof pool[number]) => ({ id: t.id, preview: t.preview, bpm: t.bpm, key: t.key, genre: t.genre });
  return NextResponse.json({ pair: [pick(pool[i]), pick(pool[j])] });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const ok = (x: unknown) => typeof x === 'string' && /^[a-z0-9-]{3,80}$/.test(x);
  if (!ok(b.a) || !ok(b.b) || b.a === b.b || !['a', 'b', 'tie'].includes(b.winner)) return NextResponse.json({ error: 'bad vote' }, { status: 400 });
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await put(`judge/votes/${id}.json`, JSON.stringify({ id, a: b.a, b: b.b, winner: b.winner, when: new Date().toISOString() }), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
  return NextResponse.json({ ok: true });
}
