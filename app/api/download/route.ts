// Step 4 of the sale: signed download. Verifies the token, then redirects to the blob (random-suffix url, never shown elsewhere) —
// or, in local mode, streams the WAV straight from the Mac's disk.
import { NextResponse } from 'next/server';
import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { readCatalog, LOCAL } from '@/lib/catalog';
import { verify } from '@/lib/sign';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') || '';
  const v = verify(t);
  if (!v) return NextResponse.json({ error: 'This download link has expired or is invalid. Open your purchase page again to get fresh links.' }, { status: 403 });
  const cat = await readCatalog();
  const tr = cat.tracks.find((x) => x.id === v.trackId);
  const url = tr?.files[v.version];
  if (!tr || !url) return NextResponse.json({ error: 'file not found' }, { status: 404 });
  if (url.startsWith('file:')) {
    if (!LOCAL) return NextResponse.json({ error: 'file not found' }, { status: 404 });
    const p = url.slice(5);
    const st = await fs.stat(p).catch(() => null);
    if (!st || !p.toLowerCase().endsWith('.wav')) return NextResponse.json({ error: 'file not found' }, { status: 404 });
    const name = `${tr.artist} - ${tr.title} (${v.version === 'extended' ? 'Extended Mix' : 'Radio Edit'}).wav`;
    return new NextResponse(Readable.toWeb(createReadStream(p)) as any, {
      headers: { 'content-type': 'audio/wav', 'content-length': String(st.size), 'content-disposition': `attachment; filename="${name.replace(/"/g, '')}"` },
    });
  }
  return NextResponse.redirect(url, 302);
}
