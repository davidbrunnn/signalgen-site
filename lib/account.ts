// The buyer's account (13/10/2026, David: "insira uma área de login e dashboard do user").
// An account is an e-mail: no password to keep. Three ways in —
//   1. a link sent to the e-mail (lib/mail, 30 min)            POST /api/auth/link → GET /api/auth/verify
//   2. the e-mail + a license key bought with it               POST /api/auth/key
//   3. arriving from the checkout (a paid session, < 2 h old)  POST /api/auth/session
// The session is a signed cookie (HMAC, 60 days). Purchases are found by e-mail: one small index entry per order in Blob
// (studio/accounts/<hmac of the e-mail>/<session>.json), or local-data/orders.json in the local store.
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { put, list } from '@vercel/blob';
import { secretFor } from '@/lib/secret';
import { readOrders, LOCAL, type Order } from '@/lib/catalog';

export const COOKIE = 'sg_account';
const DAYS = 60;
const mac = (msg: string) => createHmac('sha256', secretFor('auth')).update(msg).digest('base64url');
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const cleanEmail = (e: unknown) => String(e ?? '').trim().toLowerCase().slice(0, 160);
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** A signed, expiring token: purpose|email|exp|mac (base64url). */
export function token(purpose: 'login' | 'session', email: string, seconds: number) {
  const exp = Math.floor(Date.now() / 1000) + seconds;
  const msg = `${purpose}|${email}|${exp}`;
  return Buffer.from(`${msg}|${mac(msg)}`).toString('base64url');
}
export function readToken(purpose: 'login' | 'session', tok?: string | null): string | null {
  if (!tok) return null;
  try {
    const parts = Buffer.from(tok, 'base64url').toString().split('|');
    if (parts.length !== 4) return null;
    const [p, email, exp, m] = parts;
    if (p !== purpose || !isEmail(email) || Number(exp) < Math.floor(Date.now() / 1000)) return null;
    return same(m, mac(`${p}|${email}|${exp}`)) ? email : null;
  } catch { return null; }
}

export const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 };
export const sessionCookie = (email: string) => token('session', email, DAYS * 86400);
/** The signed-in e-mail of this request, or null. */
export function currentEmail(): string | null {
  try { return readToken('session', cookies().get(COOKIE)?.value); } catch { return null; }
}

// ───── purchases by e-mail
const emailKey = (email: string) => createHmac('sha256', secretFor('auth')).update(`acct|${email}`).digest('hex').slice(0, 40);
const MARK = 'studio/accounts/_indexed-v1.json';

export async function indexOrder(o: Order) {
  if (LOCAL || !o.email) return;
  await put(`studio/accounts/${emailKey(cleanEmail(o.email))}/${o.session}.json`, JSON.stringify(o), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
}

async function getJson<T>(url: string): Promise<T | null> {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? ((await r.json()) as T) : null; } catch { return null; }
}

/** Orders recorded before the accounts existed get their index entry once (the first time anyone opens an account). */
async function backfill() {
  try {
    const { blobs: m } = await list({ prefix: MARK, limit: 1 });
    if (m.length) return;
    let cursor: string | undefined; const all: string[] = [];
    do {
      const r = await list({ prefix: 'studio/orders/', limit: 1000, cursor });
      all.push(...r.blobs.map((b) => b.url)); cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor && all.length < 3000);
    for (let i = 0; i < all.length; i += 12) {
      const part = await Promise.all(all.slice(i, i + 12).map((u) => getJson<Order>(u)));
      await Promise.all(part.filter((o): o is Order => !!o && !!o.email && !!o.session).map((o) => indexOrder(o).catch(() => null)));
    }
    await put(MARK, JSON.stringify({ at: new Date().toISOString(), n: all.length }), { access: 'public', addRandomSuffix: false, contentType: 'application/json' });
  } catch (e) { console.error('account backfill', e); }
}

/** Every order of this e-mail, newest first (refunded ones left out). */
export async function ordersOf(email: string): Promise<Order[]> {
  const e = cleanEmail(email);
  let found: Order[] = [];
  if (LOCAL) found = (await readOrders()).filter((o) => cleanEmail(o.email) === e);
  else {
    await backfill();
    try {
      const { blobs } = await list({ prefix: `studio/accounts/${emailKey(e)}/`, limit: 300 });
      found = (await Promise.all(blobs.map((b) => getJson<Order>(b.url)))).filter((o): o is Order => !!o && cleanEmail(o.email) === e);
    } catch (err) { console.error('account orders', err); }
  }
  const seen = new Set<string>();
  return found.filter((o) => !o.refunded && !seen.has(o.session) && !!seen.add(o.session)).sort((a, b) => (b.when > a.when ? 1 : -1));
}

const normKey = (k: unknown) => String(k ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
/** Way in nº 2: the e-mail plus a license key issued to it. */
export async function keyMatches(email: string, key: string) {
  const k = normKey(key);
  if (k.length < 20) return false;
  return (await ordersOf(email)).some((o) => !!o.key && same(normKey(o.key), k));
}

// a light brake on the sign-in routes (per instance; enough to stop a loop hammering one address)
const hits = new Map<string, number[]>();
export function tooMany(id: string, max = 6, windowMs = 10 * 60e3) {
  const now = Date.now(), a = (hits.get(id) || []).filter((t) => now - t < windowMs);
  a.push(now); hits.set(id, a);
  if (hits.size > 5000) hits.clear();
  return a.length > max;
}
