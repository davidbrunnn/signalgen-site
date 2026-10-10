// the Mac worker (Bearer PUBLISH_TOKEN): GET [?kind=pack|starter|all] = paid/working jobs · POST {id, status, url?, size?, note?} = progress
import { NextResponse } from 'next/server';
import { listJobs, readJob, writeJob } from '@/lib/pack';

export const runtime = 'nodejs';

function authed(req: Request) {
  const want = process.env.PUBLISH_TOKEN;
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return !!want && got === want;
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const kind = new URL(req.url).searchParams.get('kind') || 'pack';          // the old pack worker never sees songstarters
  const all = (await listJobs()).filter((j) => (j.status === 'paid' || j.status === 'working') && (kind === 'all' || (j.kind || 'pack') === kind));
  return NextResponse.json({ jobs: all });
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const j = await readJob(String(b.id || ''));
  if (!j) return NextResponse.json({ error: 'job not found' }, { status: 404 });
  if (['paid', 'working', 'done', 'error'].includes(b.status)) j.status = b.status;
  if (typeof b.url === 'string') j.url = b.url;
  if (typeof b.size === 'number') j.size = b.size;
  if (typeof b.note === 'string') j.note = b.note.slice(0, 400);
  await writeJob(j);
  return NextResponse.json({ ok: true, job: j });
}
