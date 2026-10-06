// signed download: verifies the token, then redirects to the blob (its url carries a random suffix and is never shown elsewhere)
import { NextResponse } from 'next/server';
import { readCatalog } from '@/lib/catalog';
import { verify } from '@/lib/sign';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') || '';
  const v = verify(t);
  if (!v) return NextResponse.json({ error: 'link expired or invalid' }, { status: 403 });
  const cat = await readCatalog();
  const tr = cat.tracks.find((x) => x.id === v.trackId);
  const url = tr?.files[v.version];
  if (!url) return NextResponse.json({ error: 'file not found' }, { status: 404 });
  return NextResponse.redirect(url, 302);
}
