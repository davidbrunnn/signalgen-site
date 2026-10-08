// SignalGen sales · one product for now: the SignalGen lifetime license, paid with Pix or card through Stripe Checkout.
// The checkout opens only when the Stripe key is set and the license private key is the plugins' pair; until then the page
// keeps the early access list.
import { put, list } from '@vercel/blob';
import { keyForOrder, seedMatchesPlugin } from './license';

export const PRICE_BRL = Number(process.env.PRICE_BRL || 249);
export const PRODUCT = { id: 'signalgen', edition: 'full', name: 'SignalGen · lifetime license' };

export function salesOpen() {
  return Boolean(process.env.STRIPE_SECRET_KEY) && seedMatchesPlugin();
}

export function brl(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export type Order = {
  session: string; email: string; name?: string; amount: number; currency: string; method?: string;
  product: string; serial: number; key: string; created: string; emailed?: boolean;
};

const PREFIX = 'signalgen/orders/';

export async function findOrder(session: string): Promise<Order | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: `${PREFIX}${session}`, limit: 1 });
  if (!blobs.length) return null;
  const r = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: 'no-store' });
  return r.ok ? ((await r.json()) as Order) : null;
}

export async function listOrders(): Promise<Order[]> {
  const out: Order[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const r = await fetch(b.url, { cache: 'no-store' });
      if (r.ok) out.push((await r.json()) as Order);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => (b.created > a.created ? 1 : -1));
}

/** A paid Checkout session -> its license (deterministic) -> kept in Blob and emailed once. Safe to call twice. */
export async function deliver(s: { id: string; created: number; amount_total: number | null; currency: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null; metadata?: Record<string, string> | null;
  payment_method_types?: string[] }) {
  const email = (s.customer_details?.email || '').trim();
  if (!email) throw new Error(`session ${s.id} has no email`);
  const lic = keyForOrder({ orderId: s.id, email, created: s.created, product: s.metadata?.product, edition: s.metadata?.edition });
  const have = await findOrder(s.id);
  if (have?.emailed) return have;
  const order: Order = {
    session: s.id, email, name: s.customer_details?.name || undefined, amount: (s.amount_total || 0) / 100, currency: (s.currency || 'brl').toUpperCase(),
    method: s.payment_method_types?.join(','), product: lic.product, serial: lic.serial, key: lic.key, created: new Date(s.created * 1000).toISOString(),
  };
  order.emailed = await sendLicenseEmail(order).catch((e) => { console.error('license email failed', e); return false; });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // random suffix: the order's url (email + key) can't be guessed; findOrder() lists it by the session id prefix
    await put(`${PREFIX}${s.id}.json`, JSON.stringify(order), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
  }
  return order;
}

/** the license email (Resend, if RESEND_API_KEY and MAIL_FROM are set); Stripe sends the payment receipt itself */
async function sendLicenseEmail(o: Order) {
  const apiKey = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM;
  if (!apiKey || !from) return false;
  const dl = process.env.DOWNLOAD_URL_MAC || '';
  const text = `Olá${o.name ? ', ' + o.name.split(' ')[0] : ''}!

Obrigado por comprar o ${o.product}. Aqui está a sua licença:

Email: ${o.email}
Chave: ${o.key}

Como ativar:
1. Baixe e instale o SignalGen${dl ? ': ' + dl : ' (o .pkg do download)'}.
2. Abra o Ableton Live, Settings > Plug-Ins > Rescan, e coloque o SignalGen numa faixa MIDI.
3. Clique em ACTIVATE (canto superior direito), cole o email e a chave acima e clique em Activate.
Funciona offline. A licença é pessoal: use em até 2 computadores seus.

Qualquer dúvida, é só responder este email.
SignalGen`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [o.email], reply_to: process.env.MAIL_REPLY_TO || undefined, subject: `Sua licença do ${o.product}`, text }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
  return true;
}
