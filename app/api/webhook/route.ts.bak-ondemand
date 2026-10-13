// Stripe webhook (production): checkout.session.completed → the order is recorded once and the exclusive track leaves the catalog.
// If two buyers paid for the same exclusive track at the same moment, the second payment is refunded automatically.
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { recordSale } from '@/lib/catalog';
import { writeJob } from '@/lib/pack';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY, wh = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !wh) return NextResponse.json({ error: 'not configured' }, { status: 500 });
  const stripe = new Stripe(key);
  const sig = req.headers.get('stripe-signature') || '';
  const body = await req.text();
  let ev: Stripe.Event;
  try { ev = stripe.webhooks.constructEvent(body, sig, wh); }
  catch (e: any) { return NextResponse.json({ error: `bad signature: ${e.message}` }, { status: 400 }); }
  if (ev.type === 'checkout.session.completed') {
    const s = ev.data.object as Stripe.Checkout.Session;
    if (s.metadata?.kind === 'pack' && s.metadata.packId && s.payment_status === 'paid') {        // SIGNALGEN PACK: the paid song becomes a job for the Mac
      await writeJob({ id: s.metadata.packId, title: s.metadata.title || 'song', filename: s.metadata.filename || '', audio: s.metadata.audio || '',
        email: s.customer_details?.email || undefined, status: 'paid', created: new Date().toISOString(), updated: new Date().toISOString(), session: s.id });
      return NextResponse.json({ ok: true });
    }
    const trackId = s.metadata?.trackId;
    if (trackId && s.payment_status === 'paid') {
      const r = await recordSale({ session: s.id, trackId, email: s.customer_details?.email || undefined, amount: (s.amount_total || 0) / 100, when: new Date().toISOString() });
      if (r === 'taken' && s.payment_intent) {
        await stripe.refunds.create({ payment_intent: String(s.payment_intent), reason: 'duplicate' }).catch(() => null);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
