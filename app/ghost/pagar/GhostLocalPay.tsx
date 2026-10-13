'use client';
import { useState } from 'react';

export default function GhostLocalPay({ id, k, label }: { id: string; k: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pay() {
    setBusy(true); setErr('');
    const r = await fetch('/api/ghost/local-pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, k }) });
    const j = await r.json().catch(() => ({}));
    if (j.url) { window.location.href = j.url; return; }
    setErr(j.error || 'error'); setBusy(false);
  }
  return (
    <>
      <div className="err" role="alert">{err}</div>
      <button className="btn" style={{ width: '100%' }} onClick={pay} disabled={busy}>{busy ? '…' : label}</button>
    </>
  );
}
