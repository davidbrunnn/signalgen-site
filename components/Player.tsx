'use client';
// One audio element for the whole site: rows, hero tiles and the track page all drive the same sticky player.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export type PTrack = { id: string; title: string; artist: string; cover?: string; preview?: string; bpm?: number; key?: string; genre?: string; price?: number; sold?: boolean };

type Ctx = {
  cur: PTrack | null; on: boolean; time: number; dur: number;
  play: (t: PTrack, queue?: PTrack[]) => void; toggle: () => void; seek: (frac: number) => void; next: () => void; prev: () => void;
};
const C = createContext<Ctx | null>(null);
export const usePlayer = () => useContext(C)!;

export const Icon = {
  play: <svg viewBox="0 0 13 13" aria-hidden="true"><path d="M3 1.5v10l8.5-5z" /></svg>,
  pause: <svg viewBox="0 0 13 13" aria-hidden="true"><path d="M2.5 1.5h3v10h-3zM7.5 1.5h3v10h-3z" /></svg>,
  next: <svg viewBox="0 0 13 13" aria-hidden="true"><path d="M1.5 1.5v10l7-5zM9.5 1.5h2v10h-2z" /></svg>,
  prev: <svg viewBox="0 0 13 13" aria-hidden="true"><path d="M11.5 1.5v10l-7-5zM1.5 1.5h2v10h-2z" /></svg>,
};

export function clock(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const a = useRef<HTMLAudioElement | null>(null);
  const q = useRef<PTrack[]>([]);
  const [cur, setCurS] = useState<PTrack | null>(null);
  const curRef = useRef<PTrack | null>(null);
  const setCur = (t: PTrack | null) => { curRef.current = t; setCurS(t); };
  const [on, setOn] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const el = new Audio(); el.preload = 'metadata'; a.current = el;
    el.onplay = () => setOn(true); el.onpause = () => setOn(false);
    el.ontimeupdate = () => setTime(el.currentTime);
    el.onloadedmetadata = () => setDur(el.duration || 0);
    el.onended = () => { setOn(false); step(1, true); };
    return () => { el.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback((t: PTrack) => {  // eslint-disable-line
    const el = a.current; if (!el || !t.preview) return;
    setCur(t); setTime(0); setDur(0);
    el.src = t.preview; el.play().catch(() => setOn(false));
  }, []);

  function step(d: number, _auto = false) {
    const list = q.current; if (!list.length) return;
    const c = curRef.current;
    const i = c ? list.findIndex((x) => x.id === c.id) : -1;
    const n = list[i + d];
    if (n) load(n);
  }

  const v: Ctx = {
    cur, on, time, dur,
    play: (t, queue) => {
      if (queue) q.current = queue.filter((x) => x.preview);
      const el = a.current; if (!el) return;
      if (cur?.id === t.id) { if (el.paused) el.play(); else el.pause(); return; }
      load(t);
    },
    toggle: () => { const el = a.current; if (!el || !cur) return; if (el.paused) el.play(); else el.pause(); },
    seek: (f) => { const el = a.current; if (!el || !el.duration) return; el.currentTime = Math.max(0, Math.min(1, f)) * el.duration; if (el.paused) el.play(); },
    next: () => step(1), prev: () => step(-1),
  };

  return (
    <C.Provider value={v}>
      {children}
      <div className="player-bar" data-show={cur ? '1' : '0'} aria-hidden={!cur}>
        {cur ? (
          <div className="in">
            <Link href={`/t/${cur.id}`}>{cur.cover ? <img src={cur.cover} alt="" /> : <span />}</Link>
            <div className="who"><b>{cur.title}</b><span>{cur.artist}{cur.bpm ? `, ${cur.bpm} BPM ${cur.key}` : ''}</span></div>
            <div className="ctl">
              <button className="skip" onClick={v.prev} aria-label="Previous track">{Icon.prev}</button>
              <button className="playbtn" data-on={on ? '1' : '0'} onClick={v.toggle} aria-label={on ? 'Pause' : 'Play'}>{on ? Icon.pause : Icon.play}</button>
              <button className="skip" onClick={v.next} aria-label="Next track">{Icon.next}</button>
            </div>
            <div className="prog">
              <span>{clock(time)}</span>
              <div className="rail" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dur ? Math.round((time / dur) * 100) : 0} tabIndex={0}
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); v.seek((e.clientX - r.left) / r.width); }}
                onKeyDown={(e) => { if (dur && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) v.seek((time + (e.key === 'ArrowRight' ? 5 : -5)) / dur); }}>
                <i style={{ width: `${dur ? (time / dur) * 100 : 0}%` }} />
              </div>
              <span>{clock(dur)}</span>
            </div>
            <div className="pbuy">{cur.sold ? <span className="muted small">Signed</span> : <Link className="btn small" href={`/t/${cur.id}`}>Get it, ${cur.price}</Link>}</div>
          </div>
        ) : null}
      </div>
    </C.Provider>
  );
}

/** Round play button bound to the shared player. */
export function PlayButton({ t, queue, big = false }: { t: PTrack; queue?: PTrack[]; big?: boolean }) {
  const p = usePlayer();
  const mine = p.cur?.id === t.id && p.on;
  if (!t.preview) return null;
  return (
    <button className={big ? 'playbtn big' : 'playbtn'} data-on={mine && !big ? '1' : '0'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); p.play(t, queue); }}
      aria-label={mine ? `Pause ${t.title}` : `Play ${t.title} preview`}>
      {mine ? Icon.pause : Icon.play}
    </button>
  );
}

/** Track-page scrubber: a deterministic waveform drawn from the id (the real preview drives the fill). */
export function Wave({ t }: { t: PTrack }) {
  const p = usePlayer();
  const mine = p.cur?.id === t.id;
  const frac = mine && p.dur ? p.time / p.dur : 0;
  const bars = 89;
  let s = 0; for (const ch of t.id) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const h: number[] = [];
  for (let i = 0; i < bars; i++) { s = (s * 1103515245 + 12345) >>> 0; const env = 0.45 + 0.55 * Math.sin((i / bars) * Math.PI) ** 0.6; h.push(Math.max(0.12, env * (0.35 + ((s >>> 16) % 1000) / 1540))); }
  return (
    <div className="wave">
      <PlayButton t={t} big />
      <div className="bar" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const f = (e.clientX - r.left) / r.width; if (!mine) p.play(t); setTimeout(() => p.seek(f), mine ? 0 : 250); }}
        role="slider" aria-label="Seek preview" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(frac * 100)}>
        <svg viewBox={`0 0 ${bars * 3} 34`} preserveAspectRatio="none">
          {h.map((v, i) => <rect key={i} x={i * 3} y={17 - v * 16} width={1.8} height={v * 32} rx={0.9} style={{ fill: i / bars < frac ? 'var(--ice)' : 'rgba(238,234,227,.22)' }} />)}
        </svg>
      </div>
      <span className="t">{mine ? clock(p.time) : '0:30'}</span>
    </div>
  );
}
