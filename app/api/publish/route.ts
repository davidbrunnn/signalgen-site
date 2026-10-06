// the Mac publishes here (Bearer PUBLISH_TOKEN): the files already sit in Blob (uploaded straight from the Mac with the
// BLOB_READ_WRITE_TOKEN, REST PUT), this route only writes the catalog entry. POST {track} · DELETE {id} · GET = catalog
import { NextResponse } from 'next/server';
import { readCatalog, writeCatalog, type Track } from '@/lib/catalog';

export const runtime = 'nodejs';

function authed(req: Request) {
  const want = process.env.PUBLISH_TOKEN;
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return !!want && got === want;
}

export async function GET() {
  return NextResponse.json(await readCatalog());
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const t = body?.track as Track | undefined;
  if (!t?.id || !t.title || !t.files?.extended) return NextResponse.json({ error: 'track needs id, title and files.extended' }, { status: 400 });
  const cat = await readCatalog();
  const i = cat.tracks.findIndex((x) => x.id === t.id);
  const entry: Track = { ...t, artist: t.artist || 'Davin', published: t.published || new Date().toISOString(), sold: i >= 0 ? cat.tracks[i].sold : 0 };
  if (i >= 0) cat.tracks[i] = entry; else cat.tracks.unshift(entry);
  if (t.day && t.pick) {                                                   // only five picks per day: older picks of the same day beyond 5 lose the badge
    const same = cat.tracks.filter((x) => x.day === t.day).sort((a, b) => (a.pick || 9) - (b.pick || 9));
    same.slice(5).forEach((x) => { delete x.pick; });
  }
  await writeCatalog(cat);
  return NextResponse.json({ ok: true, count: cat.tracks.length });
}

export async function DELETE(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const cat = await readCatalog();
  const n = cat.tracks.length; cat.tracks = cat.tracks.filter((x) => x.id !== id);
  await writeCatalog(cat);
  return NextResponse.json({ ok: true, removed: n - cat.tracks.length });
}
