// POST /api/webhook — Stripe events, signature verified on the raw body.
// Endpoint events to subscribe (Dashboard → Developers → Webhooks):
//   checkout.session.completed · checkout.session.async_payment_succeeded · checkout.session.async_payment_failed
//   invoice.paid · invoice.payment_failed · customer.subscription.updated · customer.subscription.deleted
import { stripe } from '../lib/stripe.js';
import { fulfill } from '../lib/fulfill.js';

export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send('webhook not configured');

  let event;
  try {
    event = stripe().webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'] || '', secret);
  } catch (e) {
    return res.status(400).send('bad signature');
  }

  try {
    const o = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        // Pix and other delayed methods arrive here still unpaid on .completed; fulfill() checks payment_status.
        if (o.mode === 'payment') await fulfill(o.id);
        break;
      case 'checkout.session.async_payment_failed':
        console.warn('async payment failed', o.id);
        break;
      case 'invoice.paid':
        // Subscription renewals: access continues. (One-time purchase invoices also land here; nothing to do.)
        if (o.parent?.subscription_details?.subscription) console.log('subscription paid', o.parent.subscription_details.subscription);
        break;
      case 'invoice.payment_failed':
        // Smart Retries + Stripe's failed-payment emails handle recovery (Dashboard → Billing → Revenue recovery).
        console.warn('invoice payment failed', o.id);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log('subscription', o.id, o.status, o.cancel_at_period_end ? 'cancels at period end' : '');
        break;
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('webhook handler error', event.type, e?.message);
    return res.status(500).send('retry');          // Stripe retries with backoff
  }
}
