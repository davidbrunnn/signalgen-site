// Step 2 of the sale: the buyer clicks "Buy exclusive license". With Stripe keys → Stripe Checkout; without (local mode) → the
// local test checkout at /checkout/local, which walks the same flow without charging anything.
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { readCatalog, priceOf, isSold, LOCAL } from '@/lib/catalog';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: 'This track is no longer in the catalog.' }, { status: 404 });
  if (isSold(t)) return NextResponse.json({ error: 'This track was just signed by someone else — exclusive licenses sell once.' }, { status: 409 });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (LOCAL) return NextResponse.json({ url: `/checkout/local?id=${encodeURIComponent(t.id)}` });
    return NextResponse.json({ error: 'Payments are not configured yet (STRIPE_SECRET_KEY).' }, { status: 500 });
  }
  const price = priceOf(t);
  const stripe = new Stripe(key);
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(price * 100),
        product_data: {
          name: `${t.artist} — ${t.title}`,
          description: t.kind === 'pack'
            ? 'Construction kit: 8-bar loops of every bus + MIDI. Royalty-free, non-exclusive.'
            : `${t.bpm} BPM, ${t.key}, ${t.genre}. Extended Mix + Radio Edit, WAV 24-bit, mastered. Exclusive license.`,
          images: t.cover && t.cover.startsWith('http') ? [t.cover] : undefined,
        },
      },
    }],
    metadata: { trackId: t.id },
    customer_creation: 'always',
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,                  // a held checkout lapses after ~30 min (Stripe minimum)
    custom_text: { submit: { message: `By paying you accept the SIGNAL STUDIO ${t.nonExclusive ? 'non-exclusive' : 'exclusive'} license: ${site}/license` } },
    success_url: `${site}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/t/${t.id}`,
    allow_promotion_codes: true,
  });
  return NextResponse.json({ url: session.url });
}
