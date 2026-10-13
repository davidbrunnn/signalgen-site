// Way in nº 3: the buyer has just paid. The confirmation page posts its checkout session here and, while the purchase is fresh
// (2 hours), the account opens by itself — nobody has to sign in to download what they have just bought.
import { NextResponse } from 'next/server';
import { paidSession } from '@/lib/session';
import { cleanEmail, isEmail, sessionCookie, COOKIE, cookieOptions } from '@/lib/account';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { session_id } = await req.json().catch(() => ({}));
  const p = await paidSession(typeof session_id === 'string' ? session_id : undefined);
  const email = cleanEmail(p?.email);
  if (!p || !p.paid || p.refunded || !isEmail(email)) return NextResponse.json({ ok: false }, { status: 401 });
  if (Date.now() - new Date(p.when).getTime() > 2 * 3600e3) return NextResponse.json({ ok: false, old: true }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sessionCookie(email), cookieOptions);
  return res;
}
