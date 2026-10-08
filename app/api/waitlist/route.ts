// SignalGen early access list.
// POST {email, plan?}  -> one small JSON per signup in Vercel Blob (signalgen/waitlist/), or .data/waitlist.jsonl on localhost
// GET (Bearer PUBLISH_TOKEN) -> every signup, newest first
import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PREFIX = 'signalgen/waitlist/';
const LOCAL = path.join(process.cwd(), '.data', 'waitlist.jsonl');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Entry = { email: string; plan?: string; when: string; ref?: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.company) return NextResponse.json({ ok: true });                 // honeypot: bots fill the hidden field
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) return NextResponse.json({ error: 'That email doesn’t look right. Check it and try again.' }, { status: 400 });
  const entry: Entry = { email, plan: body.plan ? String(body.plan).slice(0, 20) : undefined, when: new Date().toISOString(), ref: req.headers.get('referer') || undefined };

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // random suffix: the public url of each entry can't be guessed or listed without the token
    await put(`${PREFIX}${Date.now()}.json`, JSON.stringify(entry), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
    return NextResponse.json({ ok: true });
  }
  if (process.env.NODE_ENV !== 'production') {                              // localhost: keep it on disk
    await fs.mkdir(path.dirname(LOCAL), { recursive: true });
    await fs.appendFile(LOCAL, JSON.stringify(entry) + '\n');
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Early access opens in a moment. Try again shortly.' }, { status: 503 });
}

export async function GET(req: Request) {
  const want = process.env.PUBLISH_TOKEN;
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!want || got !== want) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const out: Entry[] = [];
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let cursor: string | undefined;
    do {
      const r = await list({ prefix: PREFIX, cursor, limit: 1000 });
      const got = await Promise.all(r.blobs.map((b) => fetch(b.url, { cache: 'no-store' }).then((x) => x.json()).catch(() => null)));
      out.push(...(got.filter(Boolean) as Entry[]));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
  } else {
    const txt = await fs.readFile(LOCAL, 'utf8').catch(() => '');
    txt.split('\n').filter(Boolean).forEach((l) => { try { out.push(JSON.parse(l)); } catch { /* skip */ } });
  }
  out.sort((a, b) => (a.when < b.when ? 1 : -1));
  return NextResponse.json({ count: out.length, signups: out });
}
