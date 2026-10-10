// One StripeClient for every function. The key comes from the environment (a restricted key, rk_…), never from code.
import Stripe from 'stripe';

export const API_VERSION = '2026-08-26.dahlia';

let client;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  if (!client) client = new Stripe(key, { apiVersion: API_VERSION, appInfo: { name: 'signalgen-pay' } });
  return client;
}

// Site the buyer comes back to (GitHub Pages). No trailing slash.
export const SITE = (process.env.SITE_URL || 'https://davidbrunnn.github.io/signalgen-site').replace(/\/$/, '');

// Only answer the store's own origin from the browser.
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', new URL(SITE).origin);
  res.setHeader('Vary', 'Origin');
}

// What each product delivers. Download URLs live in env (DOWNLOADS = {"<lookup_key>": "<unguessable zip url>"}), not in git.
export function downloads() {
  try { return JSON.parse(process.env.DOWNLOADS || '{}'); } catch { return {}; }
}
