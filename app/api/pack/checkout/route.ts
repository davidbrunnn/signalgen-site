// the song is already in Blob; this creates the job id and the Stripe session (metadata.kind = pack)
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PACK_PRICE_USD, packId } from '@/lib/pack';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe is not configured yet (STRIPE_SECRET_KEY).' }, { status: 500 });
  const { audio, filename } = await req.json().catch(() => ({}));
  if (typeof audio !== 'string' || !/^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\//.test(audio)) return NextResponse.json({ error: 'upload first' }, { status: 400 });
  const name = String(filename || 'song').replace(/\.[a-z0-9]+$/i, '').slice(0, 80) || 'song';
  const id = packId();
  const stripe = new Stripe(key);
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd', unit_amount: Math.round(PACK_PRICE_USD * 100),
        product_data: { name: `SIGNALGEN PACK — ${name}`, description: 'Your song reverse-engineered into an Ableton pack: drum kit, chops, loops, MIDI, instruments and the full mastered set.' },
      },
    }],
    metadata: { kind: 'pack', packId: id, audio, filename: String(filename || '').slice(0, 120), title: name },
    success_url: `${site}/pack/${id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/pack`,
    allow_promotion_codes: true,
  });
  return NextResponse.json({ url: session.url, id });
}
