// Signed download. Verifies the token, then redirects to the blob (random-suffix url, never shown elsewhere) —
// or, in local mode, streams the file straight from the Mac's disk (WAV, ZIP or PKG).
import { NextResponse } from 'next/server';
import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { readCatalog, LOCAL } from '@/lib/catalog';
import { verify } from '@/lib/sign';

export const runtime = 'nodejs';
const TYPES: Record<string, string> = { wav: 'audio/wav', zip: 'application/zip', pkg: 'application/octet-stream', mid: 'audio/midi', pdf: 'application/pdf' };

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
    const ext = p.split('.').pop()!.toLowerCase();
    const st = await fs.stat(p).catch(() => null);
    if (!st || !TYPES[ext]) return NextResponse.json({ error: 'file not found' }, { status: 404 });
    const name = p.split('/').pop()!.replace(/"/g, '');
    return new NextResponse(Readable.toWeb(createReadStream(p)) as any, {
      headers: { 'content-type': TYPES[ext], 'content-length': String(st.size), 'content-disposition': `attachment; filename="${name}"` },
    });
  }
  return NextResponse.redirect(url, 302);
}
