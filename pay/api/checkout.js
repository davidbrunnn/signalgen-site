// POST /api/checkout  (form field or JSON: product=<price lookup_key>)  →  303 to Stripe-hosted Checkout.
// One-time prices open a payment session with an invoice; recurring prices open a subscription session.
// No payment_method_types: methods (card, Pix, Link, wallets) come from Dashboard → Settings → Payment methods.
import { stripe, SITE } from '../lib/stripe.js';

const FLOW = 'signalgen-store-qkzmwhtr';           // integration_identifier: groups this flow in the Dashboard

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).send('POST only'); }
  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {});
  const lookup = String(body.product || '').trim();
  if (!/^[a-z0-9-]{3,64}$/.test(lookup)) return res.status(400).send('Unknown product');

  try {
    const s = stripe();
    const { data } = await s.prices.list({ lookup_keys: [lookup], active: true, expand: ['data.product'], limit: 1 });
    const price = data[0];
    if (!price || !price.product?.active) return res.status(404).send('This product is not on sale');

    const recurring = price.type === 'recurring';
    const params = {
      mode: recurring ? 'subscription' : 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      integration_identifier: FLOW,
      metadata: { lookup_key: lookup },
      success_url: `${SITE}/obrigado.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/#${encodeURIComponent(lookup)}`,
    };
    if (recurring) {
      params.subscription_data = { metadata: { lookup_key: lookup } };   // subscriptions create their own invoices
    } else {
      params.customer_creation = 'always';                              // buyer can later use the customer portal
      params.invoice_creation = { enabled: true, invoice_data: { metadata: { lookup_key: lookup } } };
      params.payment_intent_data = { metadata: { lookup_key: lookup } };
    }
    // Stripe Tax is not available for Brazilian accounts yet, so automatic_tax stays off on purpose (see pay/README.md).

    const session = await s.checkout.sessions.create(params);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(303, session.url);
  } catch (e) {
    console.error('checkout failed', e?.type, e?.code, e?.requestId);
    return res.status(500).send('Checkout is unavailable right now. Please try again in a minute.');
  }
}
