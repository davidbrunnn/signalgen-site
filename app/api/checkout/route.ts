import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { readCatalog, PRICE_USD } from '@/lib/catalog';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe is not configured yet (STRIPE_SECRET_KEY).' }, { status: 500 });
  const { id } = await req.json().catch(() => ({}));
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: 'Track not found.' }, { status: 404 });
  if (t.sold) return NextResponse.json({ error: 'This track has already been sold (exclusive license).' }, { status: 409 });
  const stripe = new Stripe(key);
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(PRICE_USD * 100),
        product_data: {
          name: `${t.artist} — ${t.title}`,
          description: `${t.bpm} BPM · ${t.key} · ${t.genre} · Extended Mix + Radio Edit (WAV 24-bit) · exclusive license`,
          images: t.cover ? [t.cover] : undefined,
        },
      },
    }],
    metadata: { trackId: t.id },
    success_url: `${site}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/t/${t.id}`,
    allow_promotion_codes: true,
  });
  return NextResponse.json({ url: session.url });
}
