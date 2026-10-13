// The local store only (no Stripe key, no Blob): the test payment of a ghost order — the same markPaid the webhook calls.
import { NextResponse } from 'next/server';
import { LOCAL } from '@/lib/catalog';
import { readGhost, tokenOk, markPaid, orderUrl } from '@/lib/ghost';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!LOCAL || process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'not available' }, { status: 404 });
  const { id, k } = await req.json().catch(() => ({}));
  const o = await readGhost(String(id || ''));
  if (!tokenOk(o, k)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const site = new URL(req.url).origin;
  const p = await markPaid(o.id, { session: `local_${o.id}`, amount: o.amount, test: true, site });
  return NextResponse.json({ url: orderUrl(p || o, site).replace(site, '') });
}
