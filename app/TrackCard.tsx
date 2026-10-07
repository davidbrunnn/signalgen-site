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

function clock(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Play button + a seek bar: click anywhere on the bar to jump the preview to that point (starts playing if paused). */
export function Preview({ src, big = false }: { src?: string; big?: boolean }) {
  const a = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [pos, setPos] = useState(0);        // 0..1
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  useEffect(() => () => { a.current?.pause(); }, []);
  if (!src) return null;

  function audio() {
    if (!a.current) {
      const el = new Audio(src);
      el.preload = 'metadata';
      el.onended = () => { setOn(false); setPos(0); setTime(0); };
      el.onpause = () => setOn(false);
      el.onplay = () => setOn(true);
      el.onloadedmetadata = () => setDur(el.duration || 0);
      el.ontimeupdate = () => { const d = el.duration || 0; setTime(el.currentTime); setPos(d ? el.currentTime / d : 0); };
      a.current = el;
    }
    return a.current;
  }
  function play(el: HTMLAudioElement) {
    if (current && current !== el) current.pause();
    current = el; el.play();
  }
  function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const el = audio();
    if (on) { el.pause(); return; }
    play(el);
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const el = audio();
    const go = () => { const d = el.duration || 0; if (d) { el.currentTime = frac * d; setPos(frac); setTime(frac * d); } };
    if (el.duration) go(); else el.addEventListener('loadedmetadata', go, { once: true });
    if (!on) play(el);
  }
  const bar = (
    <div className={big ? 'seek big' : 'seek'} onClick={seek} role="slider" aria-label="Seek preview" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos * 100)}>
      <i style={{ width: `${pos * 100}%` }} />
    </div>
  );
  const btn = (
    <button className="play" data-on={on ? '1' : '0'} onClick={toggle} aria-label={on ? 'Pause preview' : 'Play preview'} style={big ? { position: 'static', width: 64, height: 64, flex: 'none' } : undefined}>
      {on ? '❚❚' : '▶'}
    </button>
  );
  if (big) {
    return (
      <div className="player">
        {btn}
        <div className="track">
          {bar}
          <div className="clock"><span>{clock(time)}</span><span>{clock(dur)}</span></div>
        </div>
      </div>
    );
  }
  return <>{btn}{bar}</>;
}

export function Bars({ on }: { on?: boolean }) {
  const h = [8, 14, 22, 12, 18, 9, 20, 15, 11, 19, 7, 16];
  return <div className="bars" data-on={on ? '1' : '0'}>{h.map((v, i) => <i key={i} style={{ height: v, animationDelay: `${i * 60}ms` }} />)}</div>;
}

export default function TrackCard({ t, price }: { t: Track; price: number }) {
  const p = t.price || price;
  return (
    <article className="card">
      <Link href={`/t/${t.id}`} className="cover">
        {t.cover ? <img src={t.cover} alt="" loading="lazy" /> : null}
        {t.kind === 'pack' ? <span className="rank">PACK · {t.day}</span> : t.pick ? <span className="rank">PICK {t.pick} · {t.day}</span> : null}
        <Preview src={t.preview} />
      </Link>
      <div className="meta">
        <Link href={`/t/${t.id}`} className="title">{t.title}</Link>
        <div className="sub">{t.kind === 'pack' ? t.genre : `${t.bpm} BPM · ${t.key} · ${t.genre} · ${fmtDur(t.duration)}`}</div>
        <div className="row">
          <span className="usd">${p}</span>
          <BuyButton id={t.id} price={p} />
        </div>
      </div>
    </article>
  );
}
