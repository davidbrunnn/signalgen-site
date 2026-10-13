// Way in nº 2: the e-mail of the purchase + a license key issued to it. Works with no mail server at all.
import { NextResponse } from 'next/server';
import { cleanEmail, isEmail, keyMatches, sessionCookie, tooMany, COOKIE, cookieOptions } from '@/lib/account';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  if (!isEmail(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  if (tooMany(`key|${email}`, 8)) return NextResponse.json({ error: 'slow' }, { status: 429 });
  if (!(await keyMatches(email, body.key))) return NextResponse.json({ error: 'nomatch' }, { status: 401 });
  const res = NextResponse.json({ ok: true, url: '/conta' });
  res.cookies.set(COOKIE, sessionCookie(email), cookieOptions);
  return res;
}
