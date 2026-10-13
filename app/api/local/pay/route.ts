// Local test purchase (only when the site runs without Blob and without Stripe): records the order exactly like the webhook would.
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { readCatalog, recordSale, priceOf, isSold, LOCAL, SELL_TRACKS, approved, tierOf, forSale } from '@/lib/catalog';
import { priceFor, countryOfRequest } from '@/lib/region';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!LOCAL || process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'not available' }, { status: 404 });
  const { id, email } = await req.json().catch(() => ({}));
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter the email the license should be issued to.' }, { status: 400 });
  const t = (await readCatalog()).tracks.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: 'This track is no longer in the catalog.' }, { status: 404 });
  if (isSold(t)) return NextResponse.json({ error: 'This track was just signed by someone else.' }, { status: 409 });
  if (!approved(t)) return NextResponse.json({ error: 'This track is not for sale.' }, { status: 403 });
  if (t.kind === 'track' && !SELL_TRACKS) return NextResponse.json({ error: 'This track is a demo and is not for sale.' }, { status: 403 });
  const session = `local_${randomBytes(9).toString('base64url')}`;
  if (!forSale(t)) return NextResponse.json({ error: 'Em breve · Coming soon.' }, { status: 403 });
  const m = await priceFor(t, countryOfRequest(req), await tierOf(t));
  await recordSale({ session, trackId: t.id, email, amount: m.amount, currency: m.currency, when: new Date().toISOString() });
  return NextResponse.json({ url: `/thanks?session_id=${session}` });
}
