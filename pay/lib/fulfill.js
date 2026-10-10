// Fulfillment, shared by the webhook (source of truth) and the thank-you page (fallback if the webhook is late).
// Idempotent: the result is stored on the PaymentIntent metadata, so a retried event or a page reload never issues twice.
import { stripe } from './stripe.js';
import { issueKey, serialFor, EDITIONS } from './license.js';
import { mailLicense } from './mail.js';

export async function fulfill(sessionId) {
  const s = stripe();
  const session = await s.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price.product', 'payment_intent'] });
  if (session.payment_status === 'unpaid') return { session, paid: false };     // Pix/boleto still pending, or failed

  const item = session.line_items?.data?.[0];
  const product = item?.price?.product;
  const lookup = item?.price?.lookup_key || session.metadata?.lookup_key || '';
  const kind = product?.metadata?.kind || 'pack';
  const email = session.customer_details?.email || '';
  const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;

  const done = { lookup, kind, email, license: pi?.metadata?.license_key || '' };
  if (pi?.metadata?.fulfilled_at) return { session, paid: true, ...done };

  if (kind === 'license' && !done.license && email) {
    done.license = issueKey(email, product?.metadata?.license_product || 'signalgen', serialFor(session.id), EDITIONS[product?.metadata?.license_edition] || 2);
  }
  // the key also goes by e-mail (day or night, the buyer never depends on this page); a failed e-mail throws -> the webhook answers 500
  // and Stripe retries; the key stays the same (it is stored on the PaymentIntent below / the serial comes from the session id)
  let mailed = pi?.metadata?.license_mailed_at || '';
  if (kind === 'license' && done.license && !mailed) {
    const m = await mailLicense(email, product?.name || 'SignalGen', done.license);
    if (m.ok) mailed = new Date().toISOString();
  }
  if (pi) {
    await s.paymentIntents.update(pi.id, {
      metadata: { ...pi.metadata, fulfilled_at: new Date().toISOString(), lookup_key: lookup, ...(done.license ? { license_key: done.license } : {}), ...(mailed ? { license_mailed_at: mailed } : {}) },
    });
  }
  return { session, paid: true, ...done };
}
