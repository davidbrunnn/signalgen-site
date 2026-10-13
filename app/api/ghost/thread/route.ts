// The order thread. GET: the buyer (?id&k) or the producer (admin key) reads stage + messages. POST: one message (and, for the
// producer, the stage). The buyer page polls this every few seconds; nothing here exposes another order or the producer's e-mail.
import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/site';
import { cookies } from 'next/headers';
import { readGhost, tokenOk, adminOk, post, publicView } from '@/lib/ghost';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const admin = (req: Request) => adminOk(req.headers.get('x-admin') || cookies().get('ghost_admin')?.value);

export async function GET(req: Request) {
  const u = new URL(req.url);
  const o = await readGhost(u.searchParams.get('id') || '');
  if (!o || (!tokenOk(o, u.searchParams.get('k')) && !admin(req))) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(publicView(o), { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const o = await readGhost(String(b?.id || ''));
  if (!o) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const site = siteUrl(new URL(req.url).origin);
  if (b?.as === 'producer') {
    if (!admin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const stage = Number.isInteger(b?.stage) ? b.stage : undefined;
    if (!String(b?.text || '').trim() && stage === undefined) return NextResponse.json({ error: 'empty' }, { status: 400 });
    return NextResponse.json(publicView(await post(o, 'producer', String(b?.text || ''), site, stage)));
  }
  if (!tokenOk(o, b?.k)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (o.status !== 'paid') return NextResponse.json({ error: 'unpaid' }, { status: 403 });
  if (!String(b?.text || '').trim()) return NextResponse.json({ error: 'empty' }, { status: 400 });
  return NextResponse.json(publicView(await post(o, 'client', String(b.text), site)));
}
