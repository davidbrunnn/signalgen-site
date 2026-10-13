// The buyer frees one of the two computers of a key, from the account page. Only for a key bought with the signed-in e-mail.
import { NextResponse } from 'next/server';
import { currentEmail, ordersOf } from '@/lib/account';
import { serialOf, releaseSeat } from '@/lib/license';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const email = currentEmail();
  if (!email) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const { session, tag } = await req.json().catch(() => ({}));
  const o = (await ordersOf(email)).find((x) => x.session === session);
  const serial = serialOf(o?.key);
  if (!o || serial === null || typeof tag !== 'string' || !/^[0-9a-f]{16}$/.test(tag)) return NextResponse.json({ error: 'notfound' }, { status: 404 });
  return NextResponse.json({ ok: await releaseSeat(serial, tag) });
}
