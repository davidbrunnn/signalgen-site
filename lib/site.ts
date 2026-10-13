// The public address of the store. SITE_URL may come without the scheme ("signalgen-site.vercel.app") or with a trailing slash:
// Stripe rejects that ("An explicit scheme must be provided"), so it is normalised here. 13/10/2026.
export function siteUrl(fallback?: string): string {
  let s = (process.env.SITE_URL || '').trim();
  if (!s) return (fallback || '').replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s.replace(/\/+$/, '');
}
