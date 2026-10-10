// GET /api/download?session_id=cs_…  →  302 to the pack's zip, only for a paid session.
import { stripe, downloads } from '../lib/stripe.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const id = String(req.query.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).send('bad session id');
  try {
    const s = await stripe().checkout.sessions.retrieve(id, { expand: ['line_items.data.price'] });
    if (s.mode !== 'payment' || s.payment_status === 'unpaid') return res.status(402).send('Payment not completed yet.');
    const lookup = s.line_items?.data?.[0]?.price?.lookup_key || s.metadata?.lookup_key;
    const url = downloads()[lookup];
    if (!url) return res.status(404).send('File not available. Reply to your receipt email and we will send it.');
    return res.redirect(302, url);
  } catch {
    return res.status(404).send('Order not found.');
  }
}
