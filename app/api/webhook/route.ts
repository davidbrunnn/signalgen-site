// Stripe webhook: checkout.session.completed -> the track is marked sold (exclusive) and the order is kept in Blob
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { put } from '@vercel/blob';
import { readCatalog, writeCatalog } from '@/lib/catalog';

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
    const trackId = s.metadata?.trackId;
    if (trackId && s.payment_status === 'paid') {
      const cat = await readCatalog();
      const t = cat.tracks.find((x) => x.id === trackId);
      if (t) { t.sold = (t.sold || 0) + 1; await writeCatalog(cat); }
      await put(`studio/orders/${s.id}.json`, JSON.stringify({ session: s.id, trackId, email: s.customer_details?.email, amount: s.amount_total, when: new Date().toISOString() }),
        { access: 'public', addRandomSuffix: true, contentType: 'application/json' });   // the suffix keeps the url unguessable
    }
  }
  return NextResponse.json({ ok: true });
}
