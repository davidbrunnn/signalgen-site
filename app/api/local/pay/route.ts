// Local test purchase (only when the site runs without Blob and without Stripe): records the order exactly like the webhook would.
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { readCatalog, recordSale, priceOf, isSold, LOCAL } from '@/lib/catalog';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!LOCAL || process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'not available' }, { status: 404 });
  const { id, email } = await req.json().catch(() => ({}));
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter the email the license should be issued to.' }, { status: 400 });
  const t = (await readCatalog()).tracks.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: 'This track is no longer in the catalog.' }, { status: 404 });
  if (isSold(t)) return NextResponse.json({ error: 'This track was just signed by someone else.' }, { status: 409 });
  const session = `local_${randomBytes(9).toString('base64url')}`;
  await recordSale({ session, trackId: t.id, email, amount: priceOf(t), when: new Date().toISOString() });
  return NextResponse.json({ url: `/thanks?session_id=${session}` });
}
