// public: the status page polls this (the id is the secret; the zip url has its own random suffix)
import { NextResponse } from 'next/server';
import { readJob } from '@/lib/pack';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') || '';
  const j = await readJob(id);
  if (!j) return NextResponse.json({ status: 'unknown' }, { status: 404 });
  return NextResponse.json({ id: j.id, title: j.title, status: j.status, url: j.url, size: j.size, note: j.note, created: j.created, updated: j.updated });
}
