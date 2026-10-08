'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GENRES, KEYS, MOODS, demoFor } from '@/lib/site';
import Player from './Player';

// The hero: the plugin's own four choices and NEW STARTER. The arrangement is drawn here in the browser to show what
// the engine does; the audio under it is a real render from the engine (lib/site.ts DEMOS).

const LANES = ['Kick', 'Clap', 'Hats', 'Perc', 'Sub', 'Bassline', 'Stab', 'Chords', 'Lead', 'Pad', 'Vocal', 'FX'] as const;
type Kind = 'intro' | 'groove' | 'break' | 'build' | 'drop' | 'outro' | 'verse' | 'hook' | 'bridge';
type Section = { kind: Kind; name: string; bars: number };

// which lanes play in each kind of section, and how busy they are (0..1)
const ENERGY: Record<Kind, Partial<Record<(typeof LANES)[number], number>>> = {
  intro:  { Kick: 1, Hats: .7, Perc: .4, FX: .25 },
  groove: { Kick: 1, Clap: 1, Hats: .9, Perc: .7, Sub: .9, Bassline: .8, Vocal: .3, FX: .2 },
  break:  { Chords: .9, Pad: 1, Lead: .5, Vocal: .5, FX: .35, Hats: .2 },
  build:  { Clap: .9, Hats: 1, Chords: .7, Lead: .8, Pad: .6, FX: .9, Vocal: .4 },
  drop:   { Kick: 1, Clap: 1, Hats: 1, Perc: .9, Sub: 1, Bassline: 1, Stab: .7, Lead: .8, Chords: .4, Vocal: .4, FX: .3 },
  outro:  { Kick: 1, Hats: .8, Perc: .5, Sub: .4, FX: .3 },
  verse:  { Kick: .8, Clap: .9, Hats: .9, Sub: .9, Bassline: .7, Chords: .8, Vocal: .7 },
  hook:   { Kick: .9, Clap: 1, Hats: 1, Perc: .6, Sub: 1, Bassline: .9, Chords: .9, Lead: .9, Pad: .5, Vocal: .9, Stab: .5 },
  bridge: { Chords: 1, Pad: 1, Lead: .5, Vocal: .5, FX: .4 },
};

const BPM: Record<string, number> = { House: 124, 'Tech House': 126, 'Bass House': 128, 'UK Garage': 132, Minimal: 128, 'Hip-Hop': 92, Boombap: 88, 'R&B Soul': 80 };
const SLOW = ['Hip-Hop', 'Boombap', 'R&B Soul'];

function rng(seed: number) {            // mulberry32: the same seed draws the same song
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function arrange(genre: string, seed: number): Section[] {
  const r = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  if (SLOW.includes(genre)) {
    return [
      { kind: 'intro', name: 'Intro', bars: pick([4, 8]) }, { kind: 'verse', name: 'Verse', bars: 16 }, { kind: 'hook', name: 'Hook', bars: 8 },
      { kind: 'verse', name: 'Verse', bars: pick([8, 16]) }, { kind: 'hook', name: 'Hook', bars: 8 }, { kind: 'bridge', name: 'Bridge', bars: pick([4, 8]) },
      { kind: 'hook', name: 'Hook', bars: 8 }, { kind: 'outro', name: 'Outro', bars: pick([4, 8]) },
    ];
  }
  // the club form the engine uses (168 bars), with the drop allowed to move a little, as it does
  return [
    { kind: 'intro', name: 'Intro', bars: 16 }, { kind: 'groove', name: 'Groove', bars: pick([8, 16, 16]) }, { kind: 'break', name: 'Break', bars: pick([8, 16]) },
    { kind: 'build', name: 'Build', bars: 8 }, { kind: 'drop', name: 'Drop 1', bars: 32 }, { kind: 'break', name: 'Break', bars: 8 },
    { kind: 'build', name: 'Build', bars: 8 }, { kind: 'drop', name: 'Drop 2', bars: pick([32, 48, 48]) }, { kind: 'outro', name: 'Outro', bars: 16 },
  ];
}

// notes drawn like a piano roll: x in bars, y inside the lane (10 units tall); drums sit on one line, melodic parts move in pitch
type Note = { x: number; y: number; w: number; h: number; o: number };
const DRUM = new Set(['Kick', 'Clap', 'Hats', 'Perc']);

function notes(secs: Section[], seed: number) {
  const r = rng(seed * 7 + 3);
  const out: Note[] = [];
  let at = 0;
  for (const s of secs) {
    LANES.forEach((lane, li) => {
      const d = ENERGY[s.kind][lane];
      if (!d) return;
      const top = li * 10;
      const o = 0.45 + d * 0.45;
      const motif = Array.from({ length: 8 }, () => Math.floor(r() * 16));      // a phrase that repeats inside the section
      const pitch = Array.from({ length: 8 }, () => r());
      for (let b = 0; b < s.bars; b++) {
        if (r() > Math.max(d, 0.35) && !DRUM.has(lane)) continue;
        if (DRUM.has(lane) && r() > d + 0.15) continue;
        const x = at + b;
        if (lane === 'Kick') for (let q = 0; q < 4; q++) out.push({ x: x + q / 4, y: top + 2, w: 0.09, h: 6, o });
        else if (lane === 'Clap') { out.push({ x: x + 0.25, y: top + 2, w: 0.09, h: 6, o }); out.push({ x: x + 0.75, y: top + 2, w: 0.09, h: 6, o }); }
        else if (lane === 'Hats') for (let q = 0; q < 4; q++) out.push({ x: x + q / 4 + 0.125, y: top + 3, w: 0.06, h: 4, o: o * 0.85 });
        else if (lane === 'Perc') for (let k = 0; k < 3; k++) out.push({ x: x + motif[k] / 16, y: top + 2 + (k % 2) * 3, w: 0.06, h: 3, o });
        else if (lane === 'Sub') out.push({ x, y: top + 6, w: 0.92, h: 2.4, o });
        else if (lane === 'Bassline') for (let k = 0; k < 4; k++) out.push({ x: x + motif[k] / 16, y: top + 1 + pitch[k] * 6, w: 0.16 + (k % 2) * 0.1, h: 2.2, o });
        else if (lane === 'Stab') for (let k = 0; k < 2; k++) out.push({ x: x + motif[k + 4] / 16, y: top + 2 + pitch[k + 2] * 4, w: 0.07, h: 4, o });
        else if (lane === 'Chords') { if (b % 2 === 0) for (let v = 0; v < 3; v++) out.push({ x, y: top + 1.5 + v * 2.5 + pitch[b % 8] * 0.8, w: Math.min(1.94, s.bars - b - 0.06), h: 1.6, o: o * 0.8 }); }
        else if (lane === 'Lead') { if (b % 2 === 0) for (let k = 0; k < 3; k++) out.push({ x: x + motif[k + 2] / 16 + k * 0.3, y: top + 1 + pitch[(k + b) % 8] * 6, w: 0.22, h: 2, o }); }
        else if (lane === 'Pad') { if (b % 4 === 0) out.push({ x, y: top + 2 + pitch[(b / 4) % 8] * 3, w: Math.min(3.94, s.bars - b - 0.06), h: 3, o: o * 0.7 }); }
        else if (lane === 'Vocal') { if (b % 4 === 1) for (let k = 0; k < 2; k++) out.push({ x: x + motif[k] / 16, y: top + 2 + pitch[k] * 4, w: 0.3, h: 2.4, o }); }
        else if (lane === 'FX') {
          if (s.kind === 'build' && b === 0) out.push({ x, y: top + 3, w: s.bars - 0.1, h: 4, o: 0.35 });
          else if (b % 4 === 3 && r() < 0.6) out.push({ x: x + 0.75, y: top + 2, w: 0.25, h: 6, o });
        }
      }
    });
    at += s.bars;
  }
  return out;
}

const PHASES = ['Writing the arrangement', 'Writing every part on the chords', 'Choosing sounds', 'Mixing', 'Mastering'];
const RUN_MS = 2600;

export default function Starter() {
  const [genre, setGenre] = useState<string>('Tech House');
  const [key, setKey] = useState('F minor');
  const [bpm, setBpm] = useState(126);
  const [mood, setMood] = useState<string>('Night');
  const [seed, setSeed] = useState(471535612);
  const [run, setRun] = useState(0);            // bumps on every NEW STARTER: restarts the reveal
  const [phase, setPhase] = useState(-1);       // -1 = done
  const timers = useRef<number[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1060);   // px of the drawing: keeps every note at least 1 px wide on small screens

  const secs = useMemo(() => arrange(genre, seed), [genre, seed]);
  const bars = secs.reduce((n, s) => n + s.bars, 0);
  const blocks = useMemo(() => notes(secs, seed), [secs, seed]);
  const tempo = Math.min(150, Math.max(70, bpm || 0));
  const seconds = Math.round((bars * 4 * 60) / tempo);
  const demo = demoFor(genre);

  function start() {
    timers.current.forEach(clearTimeout);
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setSeed((s) => (s * 1103515245 + 12345) >>> 0);
    setRun((n) => n + 1);
    if (reduce) { setPhase(-1); return; }
    setPhase(0);
    timers.current = PHASES.map((_, i) => window.setTimeout(() => setPhase(i + 1 < PHASES.length ? i + 1 : -1), ((i + 1) * RUN_MS) / PHASES.length));
  }
  useEffect(() => { start(); return () => timers.current.forEach(clearTimeout); }, []);   // one reveal on load
  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width || 1060));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const minW = bars / Math.max(width, 1);
  function changeGenre(g: string) { setGenre(g); setBpm(BPM[g] || 126); }

  const busy = phase >= 0;
  return (
    <div className="starter glass">
      <div className="controls">
        <label><span>GENRE</span>
          <select value={genre} onChange={(e) => changeGenre(e.target.value)}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        <label><span>KEY</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {['minor', 'major'].flatMap((m) => KEYS.map((k) => `${k} ${m}`)).map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label><span>BPM</span>
          <input type="number" min={70} max={150} value={bpm} onChange={(e) => setBpm(Number(e.target.value) || 0)} onBlur={() => setBpm(tempo)} />
        </label>
        <label><span>MOOD</span>
          <select value={mood} onChange={(e) => setMood(e.target.value)}>{MOODS.map((m) => <option key={m}>{m}</option>)}</select>
        </label>
        <button type="button" className="new" onClick={start} disabled={busy}>NEW STARTER</button>
      </div>

      <div className="arr" aria-hidden>
        <div className="sections">
          {secs.map((s, i) => <div key={i} className={`sec sec-${s.kind}`} style={{ flexGrow: s.bars }}><span>{s.name}</span></div>)}
        </div>
        <div className="lanes">
          <div className="names">{LANES.map((l) => <span key={l}>{l}</span>)}</div>
          <div className="grid" ref={gridRef}>
            <svg viewBox={`0 0 ${bars} ${LANES.length * 10}`} preserveAspectRatio="none">
              {blocks.map((n, i) => <rect key={i} x={n.x} y={n.y} width={Math.max(n.w, minW)} height={n.h} opacity={n.o} />)}
            </svg>
            <div key={run} className={`reveal ${busy ? 'go' : 'done'}`} style={{ '--run': `${RUN_MS}ms` } as React.CSSProperties} />
          </div>
        </div>
      </div>

      <p className="status" aria-live="polite">
        {busy ? `${PHASES[phase]}…` : `${genre} in ${key}, ${tempo} BPM, ${mood.toLowerCase()} mood. ${bars} bars, ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}, ${new Set(blocks.map((n) => Math.floor(n.y / 10))).size} instruments, mixed and mastered.`}
      </p>

      <div className="heard">
        <Player src={`/demos/${demo.slug}.m4a`} label={demo.title} size="lg" />
        <p>
          <b>{demo.genre === genre ? `Hear one it made: ${demo.title}` : `Hear one it made in ${demo.genre}: ${demo.title}`}</b>
          <span>{demo.genre}, {demo.key}, {demo.bpm} BPM. The drawing above shows the process; this audio is a real SignalGen render.</span>
        </p>
      </div>
    </div>
  );
}
