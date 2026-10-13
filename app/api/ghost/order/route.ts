// Ghost production on demand · step 1: the brief becomes a pending order, then the buyer goes to pay (Stripe, or the local test checkout).
import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/site';
import Stripe from 'stripe';
import { LOCAL } from '@/lib/catalog';
import { newGhost, writeGhost, orderUrl, GHOST_PRICE_USD } from '@/lib/ghost';
import { isLang, t } from '@/lib/i18n';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const lang = isLang(body?.lang) ? body.lang : 'pt';
  const L = t(lang);
  const o = newGhost(body?.brief || {}, lang);
  if (typeof o === 'string') return NextResponse.json({ error: o === 'email' ? L.form.emailHint : L.form.err }, { status: 400 });
  const site = siteUrl(new URL(req.url).origin);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (!LOCAL) return NextResponse.json({ error: L.form.err }, { status: 500 });
    await writeGhost(o);
    return NextResponse.json({ url: `/ghost/pagar?id=${o.id}&k=${o.token}` });
  }
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: GHOST_PRICE_USD * 100,
      product_data: { name: `${L.pay.item} — ${o.brief.artist}`, description: `${o.brief.genre}. ${L.pay.itemSub}.` } } }],
    customer_email: o.brief.email,
    metadata: { kind: 'ghost', ghostId: o.id },
    success_url: `${orderUrl(o, site)}&s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/ghost/pedido`,
    custom_text: { submit: { message: `${L.form.accept} ${L.form.terms}: ${site}/license` } },
    allow_promotion_codes: true,
  });
  o.session = session.id;
  await writeGhost(o);
  return NextResponse.json({ url: session.url });
}
