// One place that answers "was this checkout paid, and for what?" — Stripe sessions (cs_…) or local test purchases (local_…).
import Stripe from 'stripe';
import { readOrder, recordSale, LOCAL } from '@/lib/catalog';

export type Paid = { paid: boolean; trackId: string; email: string; amount: number; when: string; session: string; refunded?: boolean; test?: boolean };

export async function paidSession(sid?: string): Promise<Paid | null> {
  if (!sid) return null;
  if (sid.startsWith('local_')) {
    if (!LOCAL) return null;
    const o = await readOrder(sid);
    return o ? { paid: true, trackId: o.trackId, email: o.email || '', amount: o.amount || 0, when: o.when, session: sid, test: true } : null;
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const s = await new Stripe(key).checkout.sessions.retrieve(sid);
    const p: Paid = {
      paid: s.payment_status === 'paid', trackId: s.metadata?.trackId || '', email: s.customer_details?.email || '',
      amount: (s.amount_total || 0) / 100, when: new Date(s.created * 1000).toISOString(), session: s.id, test: !s.livemode,
    };
    // local mode has no webhook: the thank-you page records the sale itself (idempotent)
    if (LOCAL && p.paid && p.trackId) {
      const r = await recordSale({ session: s.id, trackId: p.trackId, email: p.email, amount: p.amount, when: p.when });
      if (r === 'taken') p.refunded = true;
    }
    const o = await readOrder(s.id);
    if (o?.refunded) p.refunded = true;
    return p;
  } catch { return null; }
}

/** Short, human license number derived from the session id. */
export function licenseNo(session: string) {
  let h = 2166136261;
  for (const ch of session) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return `SS-${(h >>> 0).toString(36).toUpperCase().padStart(7, '0')}`;
}
