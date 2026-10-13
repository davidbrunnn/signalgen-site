// 13/10/2026 · hardening: every answer carries the security headers below.
//   CSP: only our own code and the Blob store (covers, previews, uploads) load; no page can be framed (clickjacking); forms post
//   only to us (the checkout leaves by redirect, not by form). 'unsafe-inline' stays for Next's bootstrap and the inline styles.
const dev = process.env.NODE_ENV !== 'production';
const blob = 'https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://blob.vercel-storage.com';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${blob}`,
  `media-src 'self' blob: ${blob}`,
  `connect-src 'self' ${blob} https://vercel.com${dev ? ' ws:' : ''}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ');
const headers = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];
// pages with a secret in the address or personal data: never cached by anything in between, never sent as referrer
const priv = [{ key: 'Cache-Control', value: 'private, no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  async headers() {
    return [
      { source: '/:path*', headers },
      ...['/conta', '/entrar', '/thanks', '/license/:s*', '/c/:t*', '/ghost/o/:id*', '/ghost/admin/:p*', '/ghost/pagar', '/pack/:id+', '/api/:path*'].map((source) => ({ source, headers: priv })),
    ];
  },
};
export default nextConfig;
