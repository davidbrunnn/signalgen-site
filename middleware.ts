// The front door (13/10/2026).
//   Pages: ?lang=pt|es|en is remembered in the `lang` cookie (links in the e-mails carry the buyer's language); in the local store
//          ?country=XX sets the price country for testing (online the country is always the visitor's own — lib/region).
//   API:   · a request that changes something must come from this site (Origin check) unless it carries a Bearer token (the Mac)
//            or is Stripe's webhook (verified by signature in the route);
//          · a brake per address on the routes that send e-mail, issue keys or open checkouts;
//          · bodies larger than the route can need are refused before they are read.
// The brake lives in the memory of each edge instance: it stops a loop from one address, not a distributed flood (that is the
// host's firewall's job).
import { NextResponse, type NextRequest } from 'next/server';

const ONLINE = process.env.VERCEL === '1' || !!process.env.BLOB_READ_WRITE_TOKEN;

type Rule = { max: number; windowMs: number };
const MIN = 60_000;
const LIMITS: [RegExp, Rule][] = [
  [/^\/api\/auth\//, { max: 10, windowMs: 10 * MIN }],
  [/^\/api\/free$/, { max: 5, windowMs: 10 * MIN }],
  [/^\/api\/license\//, { max: 20, windowMs: 10 * MIN }],
  [/^\/api\/(checkout|pack\/checkout|ghost\/order)$/, { max: 12, windowMs: 10 * MIN }],
  [/^\/api\/(ghost\/thread|judge|pack\/upload)$/, { max: 40, windowMs: 10 * MIN }],
  [/^\/api\//, { max: 240, windowMs: MIN }],
];
const hits = new Map<string, { n: number; until: number }>();
function limited(key: string, r: Rule) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.until < now) { hits.set(key, { n: 1, until: now + r.windowMs }); if (hits.size > 20_000) for (const [k, v] of hits) if (v.until < now) hits.delete(k); return false; }
  h.n += 1;
  return h.n > r.max;
}
const deny = (status: number, error: string, extra?: Record<string, string>) =>
  new NextResponse(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...(extra || {}) } });

function api(req: NextRequest) {
  const path = req.nextUrl.pathname, method = req.method.toUpperCase();
  const write = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  const webhook = path === '/api/webhook';
  const bearer = /^Bearer\s+\S+/i.test(req.headers.get('authorization') || '');
  if (write && !webhook && !bearer) {
    // browsers always send Origin on a cross-site POST: a different one is another site driving the visitor's browser
    const origin = req.headers.get('origin');
    if (origin) {
      let host = '';
      try { host = new URL(origin).host; } catch { /* not a url */ }
      if (host !== req.nextUrl.host && host !== (req.headers.get('x-forwarded-host') || req.headers.get('host'))) return deny(403, 'forbidden');
    }
    const site = req.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') return deny(403, 'forbidden');
    const len = Number(req.headers.get('content-length') || 0);
    if (len > 64 * 1024 && path !== '/api/publish') return deny(413, 'too large');
  }
  if (write && !webhook && !bearer || path.startsWith('/api/license/')) {
    const ip = (req as unknown as { ip?: string }).ip || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const rule = LIMITS.find(([re]) => re.test(path));
    if (rule && limited(`${ip}|${rule[0].source}`, rule[1])) return deny(429, 'slow', { 'retry-after': String(Math.ceil(rule[1].windowMs / 1000)) });
  }
  return NextResponse.next();
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) return api(req);
  const l = req.nextUrl.searchParams.get('lang'), c = (req.nextUrl.searchParams.get('country') || '').toUpperCase();
  const okL = l === 'pt' || l === 'es' || l === 'en', okC = !ONLINE && (/^[A-Z]{2}$/.test(c) || c === 'AUTO');
  if (!okL && !okC) return NextResponse.next();
  const res = NextResponse.next();
  if (okL) res.cookies.set('lang', l!, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  if (okC) { if (c === 'AUTO') res.cookies.delete('country'); else res.cookies.set('country', c, { path: '/', maxAge: 2592000, sameSite: 'lax' }); }
  return res;
}

export const config = { matcher: ['/((?!_next|product|sounds|media|local|favicon).*)'] };
