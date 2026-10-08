'use client';
import { useEffect, useRef, useState } from 'react';
import { fmtTime } from '@/lib/site';

let current: HTMLAudioElement | null = null;   // one preview at a time across the page

/** Play button + a seek bar (a real range input: click, drag or use the arrow keys). */
export default function Player({ src, label, size = 'md' }: { src: string; label: string; size?: 'md' | 'lg' }) {
  const a = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(30);

  useEffect(() => () => { a.current?.pause(); }, []);
  useEffect(() => { a.current?.pause(); a.current = null; setOn(false); setTime(0); }, [src]);

  function audio() {
    if (!a.current) {
      const el = new Audio(src);
      el.preload = 'metadata';
      el.onplay = () => setOn(true);
      el.onpause = () => setOn(false);
      el.onended = () => { setOn(false); setTime(0); };
      el.onloadedmetadata = () => setDur(el.duration || 30);
      el.ontimeupdate = () => setTime(el.currentTime);
      a.current = el;
    }
    return a.current;
  }
  function play() {
    const el = audio();
    if (current && current !== el) current.pause();
    current = el;
    el.play().catch(() => setOn(false));
  }
  function toggle() { on ? audio().pause() : play(); }
  function seek(v: number) {
    const el = audio();
    const go = () => { el.currentTime = v; setTime(v); };
    if (el.readyState >= 1) go(); else el.addEventListener('loadedmetadata', go, { once: true });
    if (!on) play();
  }

  return (
    <div className={`player player-${size}`} data-on={on ? '1' : '0'}>
      <button type="button" className="play" onClick={toggle} aria-label={`${on ? 'Pause' : 'Play'} ${label}`}>
        {on ? <svg viewBox="0 0 16 16" aria-hidden><rect x="3" y="2" width="3.5" height="12" rx="1" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" /></svg>
            : <svg viewBox="0 0 16 16" aria-hidden><path d="M4 2.2v11.6c0 .6.7 1 1.2.7l9-5.8c.5-.3.5-1 0-1.3l-9-5.9C4.7 1.2 4 1.6 4 2.2z" /></svg>}
      </button>
      <div className="scrub">
        <input type="range" min={0} max={dur} step={0.1} value={time} aria-label={`Seek ${label}`}
          style={{ '--p': `${(time / dur) * 100}%` } as React.CSSProperties} onChange={(e) => seek(Number(e.target.value))} />
        <div className="clock"><span>{fmtTime(time)}</span><span>{fmtTime(dur)}</span></div>
      </div>
    </div>
  );
}
