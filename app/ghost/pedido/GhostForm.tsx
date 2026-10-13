'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Lang } from '@/lib/i18n-shared';

type F = { name: string; email: string; emailHint: string; artist: string; artistHint: string; genre: string; genres: string[]; bpm: string; key: string; keyHint: string;
  refs: string; refsHint: string; idea: string; ideaHint: string; accept: string; terms: string; pay: string; paying: string; err: string; note: string };

export default function GhostForm({ lang, F }: { lang: Lang; F: F }) {
  const [v, setV] = useState({ name: '', email: '', artist: '', genre: F.genres[0], bpm: '', key: '', refs: '', idea: '' });
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/ghost/order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brief: v, lang }) });
      const j = await r.json().catch(() => ({}));
      if (j.url) { window.location.href = j.url; return; }
      setErr(j.error || F.err);
    } catch { setErr(F.err); }
    setBusy(false);
  }
  return (
    <form className="gform" onSubmit={go}>
      <div className="row2">
        <div className="field"><label htmlFor="n">{F.name}</label><input id="n" required value={v.name} onChange={set('name')} autoComplete="name" /></div>
        <div className="field"><label htmlFor="e">{F.email}</label><input id="e" type="email" required value={v.email} onChange={set('email')} autoComplete="email" /><small>{F.emailHint}</small></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="a">{F.artist}</label><input id="a" required value={v.artist} onChange={set('artist')} /><small>{F.artistHint}</small></div>
        <div className="field"><label htmlFor="g">{F.genre}</label><select id="g" value={v.genre} onChange={set('genre')}>{F.genres.map((g) => <option key={g}>{g}</option>)}</select></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="b">{F.bpm}</label><input id="b" inputMode="numeric" value={v.bpm} onChange={set('bpm')} placeholder="126" /></div>
        <div className="field"><label htmlFor="k">{F.key}</label><input id="k" value={v.key} onChange={set('key')} placeholder="Fm" /><small>{F.keyHint}</small></div>
      </div>
      <div className="field"><label htmlFor="r">{F.refs}</label><textarea id="r" rows={3} value={v.refs} onChange={set('refs')} placeholder="https://open.spotify.com/track/…" /><small>{F.refsHint}</small></div>
      <div className="field"><label htmlFor="i">{F.idea}</label><textarea id="i" rows={5} value={v.idea} onChange={set('idea')} /><small>{F.ideaHint}</small></div>
      <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} required /> <span>{F.accept} <Link href="/license" target="_blank">{F.terms}</Link>.</span></label>
      <div className="err" role="alert">{err}</div>
      <button className="btn" style={{ width: '100%' }} disabled={busy || !ok}>{busy ? F.paying : F.pay}</button>
      <p className="muted small" style={{ marginTop: 'var(--s2)' }}>{F.note}</p>
    </form>
  );
}
