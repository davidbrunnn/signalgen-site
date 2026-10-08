// Stripe webhook
//   SignalGen license: checkout.session.completed (card, paid at once) or checkout.session.async_payment_succeeded (Pix, paid a
//   little later) -> the SGN1 key is made, kept in Blob and emailed (lib/sales.ts deliver)
//   older paths still served: SIGNALGEN PACK jobs and marketplace tracks
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { put } from '@vercel/blob';
import { readCatalog, writeCatalog } from '@/lib/catalog';
import { writeJob } from '@/lib/pack';
import { deliver } from '@/lib/sales';

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
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
    const s = ev.data.object as Stripe.Checkout.Session;
    if (s.metadata?.kind === 'license') {
      if (s.payment_status !== 'paid') return NextResponse.json({ ok: true, waiting: true });   // Pix not paid yet: the async event follows
      try { await deliver(s); }
      catch (e: any) { console.error('license delivery', e); return NextResponse.json({ error: e.message }, { status: 500 }); }   // Stripe retries
      return NextResponse.json({ ok: true });
    }
    if (ev.type !== 'checkout.session.completed') return NextResponse.json({ ok: true });
    if (s.metadata?.kind === 'pack' && s.metadata.packId && s.payment_status === 'paid') {        // SIGNALGEN PACK: the paid song becomes a job for the Mac
      await writeJob({ id: s.metadata.packId, title: s.metadata.title || 'song', filename: s.metadata.filename || '', audio: s.metadata.audio || '',
        email: s.customer_details?.email || undefined, status: 'paid', created: new Date().toISOString(), updated: new Date().toISOString(), session: s.id });
      return NextResponse.json({ ok: true });
    }
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
