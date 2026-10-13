// GHOST PRODUCTION ON DEMAND (10/10/2026). One order = one JSON: the brief, the payment, the stage the producer is at and the chat.
// Production: Vercel Blob studio/ghost/<id>.json (overwritten on every change). Local: local-data/ghost/<id>.json.
// The buyer reaches the order with ?k=<token> (in the e-mail); the producer through /ghost/admin with GHOST_ADMIN_TOKEN (or PUBLISH_TOKEN).
import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes, timingSafeEqual } from 'crypto';
import { LOCAL } from '@/lib/catalog';
import { sendMail, layout } from '@/lib/mail';
import { t, type Lang } from '@/lib/i18n';
import { ghostMoney, fmt } from '@/lib/region';

/** The price of this order as it was placed (old orders have no currency: reais). */
export const orderLabel = (o: { amount?: number; currency?: string }) => fmt(o.amount || ghostMoney('BR').amount, o.currency === 'USD' ? 'USD' : 'BRL');

// 13/10/2026 (David): ghost production a R$ 1.200 no Brasil e US$ 1,200 fora (lib/region ghostMoney); o pedido guarda a moeda em que nasceu.
/** where new orders and buyer messages arrive (David, 10/10/2026); GHOST_PRODUCER_EMAIL overrides */
export const PRODUCER_EMAIL = process.env.GHOST_PRODUCER_EMAIL || 'brundavin@pm.me';
export const STAGES = 7;                       // 0 order received · 1 brief · 2 sketch · 3 arrangement · 4 mix · 5 master · 6 delivered

export type Brief = { name: string; email: string; artist: string; genre: string; bpm?: string; key?: string; refs?: string; idea?: string };
export type Msg = { id: string; from: 'client' | 'producer' | 'system'; text: string; t: string; stage?: number };
export type GhostOrder = {
  id: string; token: string; lang: Lang; brief: Brief;
  status: 'pending' | 'paid'; stage: number; created: string; paidAt?: string; session?: string; amount: number; currency?: string; test?: boolean;
  messages: Msg[]; updated: string; seenProducer?: string; seenClient?: string;
};

const DIR = path.join(process.cwd(), 'local-data', 'ghost');
const KEY = (id: string) => `studio/ghost/${id}.json`;
const rid = (n: number) => randomBytes(n).toString('base64url').replace(/[-_]/g, '').slice(0, n);

export async function readGhost(id: string): Promise<GhostOrder | null> {
  if (!/^g[a-zA-Z0-9]{6,20}$/.test(id)) return null;
  if (LOCAL) { try { return JSON.parse(await fs.readFile(path.join(DIR, `${id}.json`), 'utf8')); } catch { return null; } }
  try {
    const { blobs } = await list({ prefix: KEY(id), limit: 1 });
    const b = blobs.find((x) => x.pathname === KEY(id)); if (!b) return null;
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as GhostOrder) : null;
  } catch { return null; }
}

export async function writeGhost(o: GhostOrder) {
  o.updated = new Date().toISOString();
  if (LOCAL) { await fs.mkdir(DIR, { recursive: true }); await fs.writeFile(path.join(DIR, `${o.id}.json`), JSON.stringify(o, null, 1)); return; }
  await put(KEY(o.id), JSON.stringify(o), { access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 0 });
}

export async function listGhosts(): Promise<GhostOrder[]> {
  let all: GhostOrder[] = [];
  if (LOCAL) {
    try { for (const f of await fs.readdir(DIR)) if (f.endsWith('.json')) { try { all.push(JSON.parse(await fs.readFile(path.join(DIR, f), 'utf8'))); } catch { /* skip */ } } } catch { /* none yet */ }
  } else {
    try {
      const { blobs } = await list({ prefix: 'studio/ghost/', limit: 1000 });
      all = (await Promise.all(blobs.map(async (b) => { try { const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' }); return r.ok ? ((await r.json()) as GhostOrder) : null; } catch { return null; } })))
        .filter(Boolean) as GhostOrder[];
    } catch { /* none */ }
  }
  return all.sort((a, b) => (b.updated > a.updated ? 1 : -1));
}

export function tokenOk(o: GhostOrder | null, k?: string | null): o is GhostOrder {
  if (!o || !k || k.length !== o.token.length) return false;
  return timingSafeEqual(Buffer.from(k), Buffer.from(o.token));
}

export function adminOk(k?: string | null) {
  const want = process.env.GHOST_ADMIN_TOKEN || process.env.PUBLISH_TOKEN;
  if (!want) return LOCAL;                                       // the local store, with no token set: the desk is open on localhost
  return !!k && k.length === want.length && timingSafeEqual(Buffer.from(k), Buffer.from(want));
}

const clean = (s: unknown, n: number) => String(s ?? '').replace(/\r/g, '').trim().slice(0, n);

export function newGhost(b: Partial<Brief>, lang: Lang, cc = 'BR'): GhostOrder | string {
  const brief: Brief = {
    name: clean(b.name, 80), email: clean(b.email, 120).toLowerCase(), artist: clean(b.artist, 80), genre: clean(b.genre, 40),
    bpm: clean(b.bpm, 8), key: clean(b.key, 12), refs: clean(b.refs, 1500), idea: clean(b.idea, 3000),
  };
  if (!brief.name || !brief.artist || !brief.genre) return 'missing';
  if (!/^\S+@\S+\.\S+$/.test(brief.email)) return 'email';
  const now = new Date().toISOString();
  return { id: `g${rid(10)}`, token: rid(24), lang, brief, status: 'pending', stage: 0, created: now, amount: ghostMoney(cc).amount, currency: ghostMoney(cc).currency, messages: [], updated: now };
}

export const orderUrl = (o: GhostOrder, site: string) => `${site}/ghost/o/${o.id}?k=${o.token}&lang=${o.lang}`;
export const msg = (from: Msg['from'], text: string, stage?: number): Msg => ({ id: rid(8), from, text, t: new Date().toISOString(), stage });

/** The payment landed (webhook, Stripe return page or the local test checkout). Idempotent: the e-mail goes once. */
export async function markPaid(id: string, info: { session?: string; amount?: number; test?: boolean; site: string }) {
  const o = await readGhost(id); if (!o) return null;
  if (o.status === 'paid') return o;
  const L = t(o.lang, orderLabel(o));
  o.status = 'paid'; o.paidAt = new Date().toISOString(); o.session = info.session; o.test = info.test; if (info.amount) o.amount = info.amount;
  o.stage = 0;
  o.messages.push(msg('system', `${L.stages[0][0]}. ${L.stages[0][1]}`, 0));
  await writeGhost(o);
  const url = orderUrl(o, info.site);
  const m = layout({ title: L.mail.paidSubject, lines: [L.mail.paidHi(o.brief.name.split(' ')[0]), L.mail.paidBody, L.mail.paidFollow], button: L.mail.open, url, foot: L.mail.sign });
  await sendMail({ to: o.brief.email, subject: L.mail.paidSubject, ...m });
  const prod = PRODUCER_EMAIL;
  if (prod) {
    const a = layout({ title: `Novo pedido: ${o.brief.artist} · ${o.brief.genre}`, lines: [`${o.brief.name} <${o.brief.email}>`, `BPM ${o.brief.bpm || '-'} · tom ${o.brief.key || '-'}`, o.brief.refs || '', o.brief.idea || ''].filter(Boolean), button: 'Abrir na mesa do produtor', url: `${info.site}/ghost/admin/${o.id}`, foot: 'SignalGen · ghost production' });
    await sendMail({ to: prod, subject: `Ghost production paga: ${o.brief.artist}`, ...a, replyTo: o.brief.email });
  }
  return o;
}

/** A message in the thread. Producer messages (and stage changes) e-mail the buyer; buyer messages e-mail the producer. */
export async function post(o: GhostOrder, from: 'client' | 'producer', text: string, site: string, stage?: number) {
  const body = clean(text, 2000);
  const L = t(o.lang, orderLabel(o));
  if (from === 'producer' && typeof stage === 'number' && stage >= 0 && stage < STAGES && stage !== o.stage) {
    o.stage = stage;
    o.messages.push(msg('system', `${L.stages[stage][0]}. ${L.stages[stage][1]}`, stage));
  }
  if (body) o.messages.push(msg(from, body));
  if (from === 'client') o.seenClient = new Date().toISOString(); else o.seenProducer = new Date().toISOString();
  await writeGhost(o);
  if (from === 'producer') {
    const lines = [L.mail.updBody, ...(body ? [body] : []), L.mail.stageIs(L.stages[o.stage][0])];
    const m = layout({ title: L.mail.updSubject, lines, button: L.mail.open, url: orderUrl(o, site), foot: L.mail.sign });
    await sendMail({ to: o.brief.email, subject: `${L.mail.updSubject} · ${L.stages[o.stage][0]}`, ...m });
  } else if (PRODUCER_EMAIL && body) {
    const m = layout({ title: `${o.brief.artist}: mensagem nova`, lines: [body], button: 'Responder', url: `${site}/ghost/admin/${o.id}`, foot: 'SignalGen · ghost production' });
    await sendMail({ to: PRODUCER_EMAIL, subject: `Mensagem de ${o.brief.artist}`, ...m, replyTo: o.brief.email });
  }
  return o;
}

/** What the browser gets (never the token of another order, never the e-mail of the producer). */
export function publicView(o: GhostOrder) {
  return { id: o.id, status: o.status, stage: o.stage, created: o.created, paidAt: o.paidAt, brief: o.brief, test: !!o.test, messages: o.messages, lang: o.lang };
}
export type GhostView = ReturnType<typeof publicView>;
