'use client';
// Free software (Tempo): an e-mail in, the license key and the installer on the next page. Posts to /api/free.
import { useState } from 'react';

export default function FreeForm({ id, placeholder, cta, err: errText }: { id: string; placeholder: string; cta: string; err: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/free', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, email }) });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setErr(errText);
    } catch { setErr(errText); }
    setBusy(false);
  }
  return (
    <form className="freeform" id="free" onSubmit={go}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholder} autoComplete="email" />
      <button className="btn" type="submit" disabled={busy}>{busy ? '…' : cta}</button>
      {err ? <div className="err" role="alert">{err}</div> : null}
    </form>
  );
}
