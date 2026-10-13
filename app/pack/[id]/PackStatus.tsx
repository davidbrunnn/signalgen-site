'use client';
import { useEffect, useState } from 'react';

type S = { status: string; title?: string; url?: string; size?: number; note?: string; updated?: string };

export default function PackStatus({ id }: { id: string }) {
  const [s, setS] = useState<S | null>(null);
  useEffect(() => {
    let alive = true;
    async function tick() {
      try { const r = await fetch(`/api/pack/status?id=${encodeURIComponent(id)}`, { cache: 'no-store' }); if (alive) setS(await r.json()); } catch {}
    }
    tick(); const t = setInterval(tick, 15000); return () => { alive = false; clearInterval(t); };
  }, [id]);
  const st = s?.status || 'loading';
  const label: Record<string, string> = { loading: 'Checking…', unknown: 'Waiting for the payment confirmation…', paid: 'In the queue', working: 'Reverse-engineering', done: 'Ready', error: 'Something went wrong' };
  return (
    <section className="packbox">
      <div className="statusline">
        <span className={`dot ${st}`} />
        <b>{label[st] || st}</b>
        {s?.title ? <span className="muted">· {s.title}</span> : null}
      </div>
      {s?.note ? <p className="muted">{s.note}</p> : null}
      {st === 'done' && s?.url ? (
        <div className="act" style={{ marginTop: 18, gap: 20 }}>
          <a className="btn" href={s.url}>Download the pack{s.size ? ` · ${(s.size / 1048576).toFixed(0)} MB` : ''}</a>
          <span className="muted">zip · Ableton Live 12 set, WAV 24-bit, MIDI, presets</span>
        </div>
      ) : st === 'error' ? (
        <p className="muted">We could not process this file. Write to the address on your receipt and we will sort it out or refund you.</p>
      ) : (
        <p className="muted">This page refreshes itself. You can close it and come back later — the link is this page's address.</p>
      )}
    </section>
  );
}
