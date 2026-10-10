'use client';
import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { GENRES, KEYS, MOODS } from '@/lib/site';

type Job = { id: string; title: string; status: string; created: string };
const LS = 'sg-license';

export default function Create() {
  const [email, setEmail] = useState(''); const [key, setKey] = useState('');
  const [genre, setGenre] = useState<string>('Tech House'); const [mood, setMood] = useState<string>('Night'); const [tonality, setTonality] = useState('');
  const [platform, setPlatform] = useState<'windows' | 'mac'>('windows');
  const [file, setFile] = useState<File | null>(null); const inp = useRef<HTMLInputElement | null>(null);
  const [info, setInfo] = useState<{ left: number; quota: number; jobs: Job[] } | null>(null);
  const [busy, setBusy] = useState(''); const [err, setErr] = useState('');

  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(LS) || '{}'); if (s.email) setEmail(s.email); if (s.key) setKey(s.key); } catch {} }, []);
  useEffect(() => { if (email && key.length > 40) refresh(); /* eslint-disable-next-line */ }, [email, key]);

  async function refresh() {
    try {
      const r = await fetch(`/api/starter?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}`, { cache: 'no-store' });
      const j = await r.json();
      if (r.ok) { setInfo(j); setErr(''); try { localStorage.setItem(LS, JSON.stringify({ email, key })); } catch {} } else { setInfo(null); setErr(j.error); }
    } catch {}
  }

  async function go() {
    if (busy) return; setErr('');
    try {
      let audio = '';
      if (file) {
        setBusy('Uploading 0%');
        const b = await upload(`starter/in/${file.name}`, file, { access: 'public', handleUploadUrl: '/api/starter/upload', clientPayload: JSON.stringify({ email, key }),
          onUploadProgress: (e) => setBusy(`Uploading ${Math.round(e.percentage)}%`) });
        audio = b.url;
      }
      setBusy('Sending to the engine…');
      const r = await fetch('/api/starter', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, key, genre, mood, tonality: tonality || undefined, platform, audio, filename: file?.name }) });
      const j = await r.json();
      if (j.id) window.location.href = `/create/${j.id}`; else { setErr(j.error || 'Try again'); setBusy(''); }
    } catch (e: any) { setErr(e?.message || 'Upload failed'); setBusy(''); }
  }

  const ready = !!info && info.left > 0;
  return (
    <section className="form glass">
      <div className="f2">
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="the one you bought with" /></label>
        <label>License key<input value={key} onChange={(e) => setKey(e.target.value.trim())} placeholder="SGN1-…" spellCheck={false} /></label>
      </div>
      {info ? <p className="muted"><b className="sky">{info.left}</b> of {info.quota} songstarters left this month.</p> : null}
      <div className="f4">
        <label>Genre<select value={genre} onChange={(e) => setGenre(e.target.value)}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Mood<select value={mood} onChange={(e) => setMood(e.target.value)}>{MOODS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label>Key<select value={tonality} onChange={(e) => setTonality(e.target.value)}><option value="">Any</option>{KEYS.map((k) => <option key={k} value={k + 'm'}>{k} minor</option>)}</select></label>
        <label>I produce on<select value={platform} onChange={(e) => setPlatform(e.target.value as 'windows' | 'mac')}><option value="windows">Windows</option><option value="mac">Mac</option></select></label>
      </div>
      <div className={`drop${file ? ' has' : ''}`} onClick={() => inp.current?.click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
        <input ref={inp} type="file" accept=".wav,.mp3,.aif,.aiff,.m4a,.flac,audio/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="big">{file ? file.name : 'Reference track (optional)'}</div>
        <div className="small">{file ? 'click to change' : 'The engine takes its tempo and key — never its melody.'}</div>
      </div>
      <div className="ctas" style={{ margin: '34px 0 0' }}>
        <button className="btn" disabled={!ready || !!busy} onClick={go}>{busy || 'New songstarter'}</button>
      </div>
      {err ? <p className="muted err">{err}</p> : null}
      {info?.jobs?.length ? (
        <ul className="jobs">{info.jobs.map((j) => <li key={j.id}><a href={`/create/${j.id}`}><b>{j.title}</b><span className="muted">{j.status === 'done' ? 'ready' : j.status === 'error' ? 'failed' : 'in progress'}</span></a></li>)}</ul>
      ) : null}
    </section>
  );
}
