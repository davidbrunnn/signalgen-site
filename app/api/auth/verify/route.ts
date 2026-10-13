// The link from the e-mail lands here: a valid token becomes the session cookie and the buyer goes to /conta.
import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/site';
import { readToken, sessionCookie, COOKIE, cookieOptions } from '@/lib/account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url), site = siteUrl(u.origin);
  const email = readToken('login', u.searchParams.get('t'));
  if (!email) return NextResponse.redirect(`${site}/entrar?e=link`);
  const res = NextResponse.redirect(`${site}/conta`);
  res.cookies.set(COOKIE, sessionCookie(email), cookieOptions);
  return res;
}
