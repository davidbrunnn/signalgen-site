'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LocalPay({ id, price }: { id: string; price: number }) {
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pay(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/local/pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, email }) });
    const j = await r.json().catch(() => ({}));
    if (j.url) { window.location.href = j.url; return; }
    setErr(j.error || 'The test payment did not go through.'); setBusy(false);
  }
  return (
    <form onSubmit={pay}>
      <div className="field">
        <label htmlFor="em">Email for the license and receipt</label>
        <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@label.com" autoComplete="email" />
      </div>
      <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} required /> <span>I accept the <Link href="/license" target="_blank">exclusive license terms</Link>.</span></label>
      <div className="err" role="alert">{err}</div>
      <button className="btn" style={{ width: '100%' }} disabled={busy || !ok}>{busy ? 'Paying…' : `Pay $${price} (test)`}</button>
    </form>
  );
}
