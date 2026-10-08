// POST (the Buy form) -> a Stripe Checkout session in BRL -> 303 to Stripe's page.
// Payment methods are the ones switched on in the Stripe Dashboard (card + Pix): none are listed here on purpose.
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICE_BRL, PRODUCT, salesOpen } from '@/lib/sales';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const origin = process.env.SITE_URL || new URL(req.url).origin;
  if (!salesOpen()) return NextResponse.redirect(`${origin}/#access`, 303);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const meta = { kind: 'license', product: PRODUCT.id, edition: PRODUCT.edition };
  try {
    const s = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: Math.round(PRICE_BRL * 100),
          product_data: { name: PRODUCT.name, description: 'AU + VST3 for Ableton Live 12 on macOS. One key for two of your computers, updates included.' },
        },
      }],
      metadata: meta,
      payment_intent_data: { metadata: meta },
      allow_promotion_codes: true,
      locale: 'auto',
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });
    return NextResponse.redirect(s.url!, 303);
  } catch (e: any) {
    console.error('checkout', e);
    return NextResponse.json({ error: 'The checkout could not open. Try again in a minute.' }, { status: 502 });
  }
}
