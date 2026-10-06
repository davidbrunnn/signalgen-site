'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Track } from '@/lib/catalog';
import { fmtDur } from '@/lib/catalog';

let current: HTMLAudioElement | null = null;   // one preview at a time

export function BuyButton({ id, price, label = 'Buy' }: { id: string; price: number; label?: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await r.json();
      if (j.url) window.location.href = j.url; else { alert(j.error || 'Checkout unavailable'); setBusy(false); }
    } catch { setBusy(false); }
  }
  return <button className="btn" onClick={go} disabled={busy}>{busy ? '…' : `${label} · $${price}`}</button>;
}

export function Preview({ src, big = false }: { src?: string; big?: boolean }) {
  const a = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => () => { a.current?.pause(); }, []);
  if (!src) return null;
  function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!a.current) { a.current = new Audio(src); a.current.onended = () => setOn(false); a.current.onpause = () => setOn(false); }
    if (on) { a.current.pause(); return; }
    if (current && current !== a.current) current.pause();
    current = a.current; a.current.currentTime = 0; a.current.play(); setOn(true);
  }
  return (
    <button className="play" data-on={on ? '1' : '0'} onClick={toggle} aria-label={on ? 'Pause preview' : 'Play preview'} style={big ? { position: 'static', width: 64, height: 64 } : undefined}>
      {on ? '❚❚' : '▶'}
    </button>
  );
}

export function Bars({ on }: { on?: boolean }) {
  const h = [8, 14, 22, 12, 18, 9, 20, 15, 11, 19, 7, 16];
  return <div className="bars" data-on={on ? '1' : '0'}>{h.map((v, i) => <i key={i} style={{ height: v, animationDelay: `${i * 60}ms` }} />)}</div>;
}

export default function TrackCard({ t, price }: { t: Track; price: number }) {
  return (
    <article className="card">
      <Link href={`/t/${t.id}`} className="cover">
        {t.cover ? <img src={t.cover} alt="" loading="lazy" /> : null}
        {t.pick ? <span className="rank">PICK {t.pick} · {t.day}</span> : null}
        <Preview src={t.preview} />
      </Link>
      <div className="meta">
        <Link href={`/t/${t.id}`} className="title">{t.title}</Link>
        <div className="sub">{t.bpm} BPM · {t.key} · {t.genre} · {fmtDur(t.duration)}</div>
        <div className="row">
          <span className="usd">${price}</span>
          <BuyButton id={t.id} price={price} />
        </div>
      </div>
    </article>
  );
}
