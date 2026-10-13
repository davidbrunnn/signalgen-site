'use client';
import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function PackUpload({ price }: { price: number }) {
  const inp = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState<'' | 'upload' | 'checkout'>('');
  const [err, setErr] = useState('');
  const ok = (f: File) => /\.(wav|mp3|aiff?|m4a|flac)$/i.test(f.name) && f.size <= 200 * 1024 * 1024;

  async function go() {
    if (!file || busy) return;
    setErr('');
    try {
      setBusy('upload');
      const blob = await upload(`pack/in/${file.name}`, file, { access: 'public', handleUploadUrl: '/api/pack/upload', onUploadProgress: (e) => setPct(Math.round(e.percentage)) });
      setBusy('checkout');
      const r = await fetch('/api/pack/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ audio: blob.url, filename: file.name }) });
      const j = await r.json();
      if (j.url) window.location.href = j.url; else { setErr(j.error || 'Checkout unavailable'); setBusy(''); }
    } catch (e: any) { setErr(e?.message || 'Upload failed'); setBusy(''); }
  }
  return (
    <section className="packbox">
      <div className={`drop${file ? ' has' : ''}`} onClick={() => inp.current?.click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && ok(f)) setFile(f); else setErr('wav, mp3, aiff, m4a or flac up to 200 MB'); }}>
        <input ref={inp} type="file" accept=".wav,.mp3,.aif,.aiff,.m4a,.flac,audio/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f && ok(f)) { setFile(f); setErr(''); } else if (f) setErr('wav, mp3, aiff, m4a or flac up to 200 MB'); }} />
        <div className="big">{file ? file.name : 'Drop your song'}</div>
        <div className="small">{file ? `${(file.size / 1048576).toFixed(1)} MB · click to change` : 'wav · mp3 · aiff · m4a · flac · up to 200 MB'}</div>
      </div>
      <div className="act" style={{ marginTop: 18, gap: 20 }}>
        <button className="btn" disabled={!file || !!busy} onClick={go}>{busy === 'upload' ? `Uploading ${pct}%` : busy === 'checkout' ? '…' : `Make my pack · $${price}`}</button>
        <span className="muted">Pay with Stripe. Your link appears on the next page and keeps working.</span>
      </div>
      {err ? <p className="muted" style={{ color: '#ff8a8a' }}>{err}</p> : null}
    </section>
  );
}
