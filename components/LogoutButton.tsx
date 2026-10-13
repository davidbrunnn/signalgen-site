'use client';
import { useState } from 'react';

export default function LogoutButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* go home anyway */ }
    window.location.href = '/';
  }
  return <button type="button" className="btn small quiet" onClick={go} disabled={busy}>{busy ? '…' : label}</button>;
}
