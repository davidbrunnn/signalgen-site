'use client';
import { useEffect, useState } from 'react';

type S = { status: string; title?: string; url?: string; size?: number; note?: string };
const LABEL: Record<string, string> = { loading: 'Checking…', unknown: 'Not found', paid: 'In the queue', working: 'The engine is writing your set', done: 'Ready', error: 'Something went wrong' };

export default function Status({ id }: { id: string }) {
  const [s, setS] = useState<S | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => { try { const r = await fetch(`/api/pack/status?id=${encodeURIComponent(id)}`, { cache: 'no-store' }); if (alive) setS(await r.json()); } catch {} };
    tick(); const t = setInterval(tick, 15000); return () => { alive = false; clearInterval(t); };
  }, [id]);
  const st = s?.status || 'loading';
  return (
    <section className="form glass">
      <div className="statusline"><span className={`dot ${st}`} /><b>{LABEL[st] || st}</b>{s?.title ? <span className="muted"> · {s.title}</span> : null}</div>
      {s?.note ? <p className="muted">{s.note}</p> : null}
      {st === 'done' && s?.url ? (
        <div className="ctas" style={{ margin: '34px 0 0' }}>
          <a className="btn" href={s.url}>Download{s.size ? ` · ${(s.size / 1048576).toFixed(0)} MB` : ''}</a>
          <span className="muted">zip · Live set, WAV stems, MIDI of every part</span>
        </div>
      ) : st === 'error' ? (
        <p className="muted">This one did not come out. It does not count against your month — start another, or reply to your license e-mail.</p>
      ) : (
        <p className="muted">Usually ready within a few hours. This page refreshes itself; its address is your download link.</p>
      )}
    </section>
  );
}
