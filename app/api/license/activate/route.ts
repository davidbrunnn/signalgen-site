// The plugins call this to activate (13/10/2026): POST {key, email, product, device, name, os} → {ok, token} or {ok:false, message}.
// Always HTTP 200 for an answer the plugin should show (some hosts' HTTP stacks drop the body of a 4xx).
import { NextResponse } from 'next/server';
import { activate } from '@/lib/license';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.key !== 'string' || typeof b.email !== 'string') return NextResponse.json({ ok: false, error: 'invalid', message: 'Type the email of the purchase and paste the key.' });
  try {
    const r = await activate({ key: b.key.slice(0, 400), email: b.email.slice(0, 160), product: Number(b.product), device: String(b.device || ''), name: typeof b.name === 'string' ? b.name : '', os: typeof b.os === 'string' ? b.os : '' });
    return NextResponse.json(r, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    console.error('activate', e);
    return NextResponse.json({ ok: false, error: 'server', message: 'The activation server had a problem. Try again in a moment.' });
  }
}
