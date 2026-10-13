// Step 2 of the sale: the buyer clicks "Buy exclusive license". With Stripe keys → Stripe Checkout; without (local mode) → the
// local test checkout at /checkout/local, which walks the same flow without charging anything.
import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/site';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { put } from '@vercel/blob';
import { readCatalog, priceOf, isSold, LOCAL, SELL_TRACKS, hrefOf, approved, founderLeft, sgTier } from '@/lib/catalog';
import { priceFor, countryOfRequest, minorUnits } from '@/lib/region';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: 'This track is no longer in the catalog.' }, { status: 404 });
  if (isSold(t)) return NextResponse.json({ error: 'This track was just signed by someone else — exclusive licenses sell once.' }, { status: 409 });
  if (!approved(t)) return NextResponse.json({ error: 'This track is not for sale.' }, { status: 403 });
  if (t.kind === 'track' && !SELL_TRACKS) return NextResponse.json({ error: 'This track is a demo of what SignalGen makes and is not for sale.' }, { status: 403 });
  const money = await priceFor(t, countryOfRequest(req), sgTier(t));          // 13/10/2026: packs in BRL for Brazil (Pix shows up by itself), software by product
  if (money.amount <= 0) return NextResponse.json({ url: `${hrefOf(t)}#free` });   // free items (Tempo) go through /api/free with an e-mail
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (LOCAL) return NextResponse.json({ url: `/checkout/local?id=${encodeURIComponent(t.id)}` });
    return NextResponse.json({ error: 'Payments are not configured yet (STRIPE_SECRET_KEY).' }, { status: 500 });
  }
  const price = priceOf(t);
  const stripe = new Stripe(key);
  const site = siteUrl(new URL(req.url).origin);
  const claim = randomBytes(12).toString('hex');                          // 13/10/2026: personal link printed on Stripe's own receipt (no domain/e-mail sender needed)
  let session: Stripe.Checkout.Session;
  try {
  session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: money.currency.toLowerCase(),
        unit_amount: minorUnits(money),
        product_data: {
          name: t.kind === 'track' ? `${t.artist} — ${t.title}` : t.licenseProduct === 'monet' ? 'MONET — synthesizer' : t.licenseProduct === 'refiner' ? 'REFINER — 24-band EQ' : `SignalGen — ${t.title}${t.kind === 'preset' ? ' (Serum 2 presets)' : t.format === 'bundle' ? ' (Bundle)' : ''}`,
          description: t.kind === 'software' && t.licenseProduct === 'monet' ? 'Lifetime license: MONET synthesizer (AU + VST3). License key issued on the confirmation page.'
            : t.kind === 'software' && t.licenseProduct === 'refiner' ? 'Lifetime license: REFINER, the 24-band EQ that shows you where to cut (AU + VST3). License key issued on the confirmation page.'
            : t.kind === 'software' ? `${founderLeft(t) > 0 ? 'Founder lifetime license (first 100)' : 'Lifetime license'}: SignalGen, Monet, Refiner, Strip, Tempo. License key issued on the confirmation page.`
            : t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle' ? `${t.subtitle || ''}. ${t.contents || ''}. Royalty-free, non-exclusive.`
            : t.kind === 'pack' ? 'Construction kit: 8-bar loops of every bus + MIDI. Royalty-free, non-exclusive.'
            : `${t.bpm} BPM, ${t.key}, ${t.genre}. Extended Mix + Radio Edit, WAV 24-bit, mastered. Exclusive license.`,
          images: t.cover && t.cover.startsWith('http') ? [t.cover] : undefined,
        },
      },
    }],
    payment_intent_data: { description: `Sua chave e downloads / Your key and downloads: ${site}/c/${claim}` },
    metadata: { claim, trackId: t.id, currency: money.currency, country: countryOfRequest(req), ...(t.kind === 'software' ? { tier: sgTier(t) } : {}) },
    customer_creation: 'always',
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,                  // a held checkout lapses after ~30 min (Stripe minimum)
    custom_text: { submit: { message: `By paying you accept the SIGNAL STUDIO ${t.nonExclusive ? 'non-exclusive' : 'exclusive'} license: ${site}/license` } },
    success_url: `${site}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}${hrefOf(t)}`,
    allow_promotion_codes: true,
  });
  } catch (e: any) {                                                        // 13/10/2026: show Stripe's reason instead of a blank 500
    console.error('checkout', e?.type, e?.code, e?.message);
    return NextResponse.json({ error: `Stripe: ${e?.message || 'checkout failed'}`, code: e?.code || e?.type || '' }, { status: 502 });
  }
  if (!LOCAL) { try { await put(`studio/claims/${claim}.json`, JSON.stringify({ s: session.id }), { access: 'public', addRandomSuffix: true, contentType: 'application/json' }); } catch (e) { console.error('claim', e); } }
  return NextResponse.json({ url: session.url });
}
