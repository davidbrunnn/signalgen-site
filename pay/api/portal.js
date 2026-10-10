// POST /api/portal (session_id) → 303 to the Stripe customer portal for the customer who paid that session:
// invoices/receipts, payment method, cancel subscription (at period end). Customers can also use the portal login link.
import { stripe, SITE } from '../lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {});
  const id = String(body.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).send('bad session id');
  try {
    const s = stripe();
    const session = await s.checkout.sessions.retrieve(id);
    if (!session.customer) return res.status(404).send('No customer for this order.');
    const portal = await s.billingPortal.sessions.create({ customer: String(session.customer), return_url: `${SITE}/` });
    return res.redirect(303, portal.url);
  } catch {
    return res.status(404).send('Order not found.');
  }
}
