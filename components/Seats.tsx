'use client';
// The computers a key is active on (two per key), with a button to free one.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Seats({ session, seats, max, T }: { session: string; seats: { tag: string; name?: string; os?: string; last: string }[]; max: number;
  T: { title: string; none: string; free: string; freeing: string; of: string } }) {
  const r = useRouter();
  const [busy, setBusy] = useState('');
  async function free(tag: string) {
    setBusy(tag);
    try { await fetch('/api/license/release', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ session, tag }) }); } catch { /* the list refreshes anyway */ }
    r.refresh(); setBusy('');
  }
  return (
    <div className="seats">
      <span className="eyebrow">{T.title} · {seats.length} {T.of} {max}</span>
      {seats.length ? (
        <ul>{seats.map((s) => (
          <li key={s.tag}><span><b>{s.name || s.tag.slice(0, 6)}</b>{s.os ? <em> · {s.os}</em> : null}</span>
            <button type="button" className="linkbtn" onClick={() => free(s.tag)} disabled={busy === s.tag}>{busy === s.tag ? T.freeing : T.free}</button></li>
        ))}</ul>
      ) : <p className="muted small">{T.none}</p>}
    </div>
  );
}
