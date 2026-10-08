// GET (Bearer PUBLISH_TOKEN) -> every license sold online, newest first (email, serial, key), to resend a key or keep the books
import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/sales';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const tok = process.env.PUBLISH_TOKEN;
  if (!tok || req.headers.get('authorization') !== `Bearer ${tok}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ orders: await listOrders() });
}
