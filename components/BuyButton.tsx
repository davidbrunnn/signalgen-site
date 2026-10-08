'use client';
import { useState } from 'react';

export default function BuyButton({ id, price, label, small = false, disabled = false }: { id: string; price: number; label?: string; small?: boolean; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setErr(j.error || 'Checkout is unavailable right now.');
    } catch { setErr('Checkout is unavailable right now. Check your connection and try again.'); }
    setBusy(false);
  }
  if (disabled) return <button className={small ? 'btn small' : 'btn'} disabled>Signed</button>;
  return (
    <>
      <button className={small ? 'btn small' : 'btn'} onClick={go} disabled={busy}>{busy ? 'Opening checkout…' : (label || `Buy, $${price}`)}</button>
      {err ? <div className="err" role="alert">{err}</div> : null}
    </>
  );
}
