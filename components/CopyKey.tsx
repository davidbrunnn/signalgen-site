'use client';
// A license key with a copy button.
import { useState } from 'react';

export default function CopyKey({ value, copy, copied }: { value: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  async function go() {
    try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* the key is selectable anyway */ }
  }
  return (
    <div className="keyrow">
      <code className="key">{value}</code>
      <button type="button" className="btn small quiet" onClick={go} aria-live="polite">{done ? copied : copy}</button>
    </div>
  );
}
