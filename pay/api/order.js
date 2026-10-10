// GET /api/order?session_id=cs_…  →  what the thank-you page shows: status, download link or license key.
// The session id is the buyer's proof of purchase (it's only in the success redirect and their receipt flow).
import { stripe, cors, downloads } from '../lib/stripe.js';
import { fulfill } from '../lib/fulfill.js';

export default async function handler(req, res) {
  cors(res);
  res.setHeader('Cache-Control', 'no-store');
  const id = String(req.query.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'bad session id' });
  try {
    const r = await fulfill(id);
    const s = r.session;
    const base = { product: s.line_items?.data?.[0]?.description || '', email: s.customer_details?.email || '', mode: s.mode };
    if (s.mode === 'subscription') {
      const sub = s.subscription ? await stripe().subscriptions.retrieve(String(s.subscription)) : null;
      return res.json({ ...base, status: sub?.status || s.status, portal: true });
    }
    if (!r.paid) return res.json({ ...base, status: 'pending' });
    const zip = downloads()[r.lookup];
    return res.json({ ...base, status: 'paid', download: zip ? `https://${req.headers.host}/api/download?session_id=${encodeURIComponent(id)}` : null, license: r.license || null, portal: true });
  } catch (e) {
    console.error('order lookup failed', e?.code);
    return res.status(404).json({ error: 'order not found' });
  }
}
