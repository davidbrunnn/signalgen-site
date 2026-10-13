// ?lang=pt|es|en on any page is remembered in the `lang` cookie (links in the e-mails carry the buyer's language).
import { NextResponse, type NextRequest } from 'next/server';

// ?country=MX (any 2 letters) sets the price country the same way; ?country=auto goes back to the visitor's real location.
export function middleware(req: NextRequest) {
  const l = req.nextUrl.searchParams.get('lang'), c = (req.nextUrl.searchParams.get('country') || '').toUpperCase();
  const okL = l === 'pt' || l === 'es' || l === 'en', okC = /^[A-Z]{2}$/.test(c) || c === 'AUTO';
  if (!okL && !okC) return NextResponse.next();
  const res = NextResponse.next();
  if (okL) res.cookies.set('lang', l!, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  if (okC) { if (c === 'AUTO') res.cookies.delete('country'); else res.cookies.set('country', c, { path: '/', maxAge: 2592000, sameSite: 'lax' }); }
  return res;
}

export const config = { matcher: ['/((?!api|_next|product|sounds|media|local|favicon).*)'] };
