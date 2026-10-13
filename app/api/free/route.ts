// Free software (13/10/2026: the Tempo). The visitor leaves an e-mail, the key is issued at once and the thank-you page serves the installer.
// The order record doubles as the mailing list (studio/orders, amount 0).
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { readCatalog, recordSale, isFree } from '@/lib/catalog';
import { countryOfRequest } from '@/lib/region';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { id, email } = await req.json().catch(() => ({}));
  if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) return NextResponse.json({ error: 'email' }, { status: 400 });
  const t = (await readCatalog()).tracks.find((x) => x.id === id);
  if (!t || !isFree(t)) return NextResponse.json({ error: 'This item is not free.' }, { status: 403 });
  const session = `free_${randomBytes(9).toString('base64url')}`;
  await recordSale({ session, trackId: t.id, email: String(email).trim().toLowerCase(), amount: 0, currency: countryOfRequest(req) === 'BR' ? 'BRL' : 'USD', when: new Date().toISOString() });
  return NextResponse.json({ url: `/thanks?session_id=${session}` });
}
