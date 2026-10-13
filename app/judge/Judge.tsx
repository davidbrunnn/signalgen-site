'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

type T = { id: string; preview: string; bpm: number; key: string; genre: string };

export default function Judge() {
  const [pair, setPair] = useState<T[] | null>(null);
  const [on, setOn] = useState<'a' | 'b' | ''>('');
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const audio = useRef<Record<'a' | 'b', HTMLAudioElement | null>>({ a: null, b: null });

  const load = useCallback(async () => {
    Object.values(audio.current).forEach((x) => x?.pause()); audio.current = { a: null, b: null }; setOn('');
    try { const r = await fetch('/api/judge', { cache: 'no-store' }); const j = await r.json(); setPair(j.pair); } catch { setPair(null); }
  }, []);
  useEffect(() => { load(); try { setCount(Number(localStorage.getItem('judge.count') || 0)); } catch {} }, [load]);

  function play(side: 'a' | 'b') {
    if (!pair) return;
    const other = side === 'a' ? 'b' : 'a'; audio.current[other]?.pause();
    if (!audio.current[side]) { const el = new Audio(pair[side === 'a' ? 0 : 1].preview); el.onended = () => setOn(''); el.onpause = () => setOn((o) => (o === side ? '' : o)); audio.current[side] = el; }
    const el = audio.current[side]!;
    if (on === side) { el.pause(); return; }
    el.play(); setOn(side);
  }
  async function vote(winner: 'a' | 'b' | 'tie') {
    if (!pair || busy) return; setBusy(true);
    try { await fetch('/api/judge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: pair[0].id, b: pair[1].id, winner }) }); } catch {}
    const n = count + 1; setCount(n); try { localStorage.setItem('judge.count', String(n)); } catch {}
    setBusy(false); load();
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'a' || e.key === 'A') vote('a'); if (e.key === 'b' || e.key === 'B') vote('b'); if (e.key === ' ') { e.preventDefault(); play(on === 'a' ? 'b' : 'a'); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  });
  if (pair === null) return <p className="muted">Not enough tracks to compare yet.</p>;
  if (!pair) return <p className="muted">Loading…</p>;
  return (
    <section className="judge">
      <div className="pair">
        {(['a', 'b'] as const).map((side, i) => (
          <div key={side} className={`side${on === side ? ' on' : ''}`}>
            <div className="letter">{side.toUpperCase()}</div>
            <button className="playbtn big" data-on={on === side ? '1' : '0'} onClick={() => play(side)} aria-label={`Play ${side}`} style={{ margin: '0 auto', color: 'var(--night)', fontSize: 16 }}>{on === side ? '❚❚' : '▶'}</button>
            <div className="muted" style={{ marginTop: 14 }}>{pair[i].bpm} BPM · {pair[i].key} · {pair[i].genre}</div>
            <button className="btn" style={{ marginTop: 18 }} disabled={busy} onClick={() => vote(side)}>{side.toUpperCase()} wins</button>
          </div>
        ))}
      </div>
      <div className="act" style={{ justifyContent: 'center', gap: 18, marginTop: 22 }}>
        <button className="btn quiet" disabled={busy} onClick={() => vote('tie')}>Can&apos;t decide</button>
        <span className="muted">{count ? `${count} judged` : 'space = play · a / b = vote'}</span>
      </div>
    </section>
  );
}
