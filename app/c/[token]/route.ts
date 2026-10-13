// 13/10/2026: /c/<token> — the link printed on Stripe's receipt e-mail. Maps the random token to the checkout session and
// sends the buyer to the same confirmation page (key + downloads). The page itself checks that the session was paid.
import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { siteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const site = siteUrl(new URL(req.url).origin);
  const tok = (params.token || '').replace(/[^a-f0-9]/g, '');
  if (tok.length === 24) {
    try {
      const { blobs } = await list({ prefix: `studio/claims/${tok}`, limit: 1 });
      if (blobs[0]) {
        const r = await fetch(blobs[0].url, { cache: 'no-store' });
        const j = r.ok ? await r.json() : null;
        if (j?.s) return NextResponse.redirect(`${site}/thanks?session_id=${encodeURIComponent(j.s)}`);
      }
    } catch (e) { console.error('claim lookup', e); }
  }
  return NextResponse.redirect(`${site}/`);
}
