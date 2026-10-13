'use client';
import { useState } from 'react';
import Link from 'next/link';

type Tx = { email: string; accept: string; terms: string; pay: string; paying: string; fail: string };
export default function LocalPay({ id, price, shown, tx }: { id: string; price: number; shown?: string; tx?: Tx }) {
  const T: Tx = tx || { email: 'Email for the license and receipt', accept: 'I accept the', terms: 'license terms', pay: `Pay ${shown || `$${price}`} (test)`, paying: 'Paying…', fail: 'The test payment did not go through.' };
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pay(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/local/pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, email }) });
    const j = await r.json().catch(() => ({}));
    if (j.url) { window.location.href = j.url; return; }
    setErr(j.error || T.fail); setBusy(false);
  }
  return (
    <form onSubmit={pay}>
      <div className="field">
        <label htmlFor="em">{T.email}</label>
        <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@label.com" autoComplete="email" />
      </div>
      <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} required /> <span>{T.accept} <Link href="/license" target="_blank">{T.terms}</Link>.</span></label>
      <div className="err" role="alert">{err}</div>
      <button className="btn" style={{ width: '100%' }} disabled={busy || !ok}>{busy ? T.paying : T.pay}</button>
    </form>
  );
}
