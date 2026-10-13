'use client';
// The order page, live: the stages on the left, the chat on the right. The buyer and the producer see the same thread;
// it refreshes every 6 s (and right after you send). The producer also moves the stage from here.
import { useEffect, useRef, useState } from 'react';

type Msg = { id: string; from: 'client' | 'producer' | 'system'; text: string; t: string; stage?: number };
export type View = { id: string; status: 'pending' | 'paid'; stage: number; created: string; paidAt?: string; test: boolean; messages: Msg[];
  brief: { name: string; email: string; artist: string; genre: string; bpm?: string; key?: string; refs?: string; idea?: string }; lang: string };
type Labels = { stageNow: string; chat: string; placeholder: string; send: string; sending: string; you: string; producer: string; system: string; brief: string };

const URL_RE = /(https?:\/\/[^\s]+)/g;
function linkify(s: string) {
  return s.split(URL_RE).map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noreferrer noopener">{p}</a> : <span key={i}>{p}</span>));
}
const when = (iso: string, lang: string) => { try { return new Date(iso).toLocaleString(lang === 'pt' ? 'pt-BR' : lang, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };

export default function Thread({ initial, k, role, L, stages, briefLabels }: { initial: View; k?: string; role: 'client' | 'producer'; L: Labels; stages: [string, string][];
  briefLabels: { artist: string; genre: string; bpm: string; key: string; refs: string; idea: string; name: string; email: string } }) {
  const [v, setV] = useState<View>(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const box = useRef<HTMLDivElement | null>(null);
  const n = useRef(initial.messages.length);

  async function refresh() {
    const q = new URLSearchParams({ id: v.id }); if (k) q.set('k', k);
    const r = await fetch(`/api/ghost/thread?${q}`, { cache: 'no-store' }).catch(() => null);
    if (r?.ok) setV(await r.json());
  }
  useEffect(() => { const h = setInterval(refresh, 6000); return () => clearInterval(h); });   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (v.messages.length !== n.current && box.current) { box.current.scrollTop = box.current.scrollHeight; n.current = v.messages.length; } }, [v.messages.length]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, []);

  async function send(stage?: number) {
    if (!text.trim() && stage === undefined) return;
    setBusy(true); setErr('');
    const r = await fetch('/api/ghost/thread', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: v.id, k, text, ...(role === 'producer' ? { as: 'producer', stage } : {}) }) }).catch(() => null);
    if (r?.ok) { setV(await r.json()); setText(''); } else setErr('!');
    setBusy(false);
  }
  const who = (m: Msg) => (m.from === 'system' ? L.system : m.from === role ? L.you : m.from === 'producer' ? L.producer : v.brief.artist || v.brief.name);
  const b = v.brief;
  return (
    <div className="thread">
      <aside>
        <span className="eyebrow">{L.stageNow}</span>
        <ol className="g-stages">
          {stages.map(([h, p], i) => (
            <li key={h} data-state={i < v.stage || v.stage === stages.length - 1 ? 'done' : i === v.stage ? 'now' : 'next'}>
              <i /><div><b>{h}</b><span>{p}</span>
                {role === 'producer' && i !== v.stage ? <button type="button" className="btn small quiet" disabled={busy} onClick={() => send(i)}>→ {h}</button> : null}
              </div>
            </li>
          ))}
        </ol>
        <details className="g-brief">
          <summary>{L.brief}</summary>
          <dl>
            {role === 'producer' ? <><dt>{briefLabels.name}</dt><dd>{b.name}</dd><dt>{briefLabels.email}</dt><dd><a href={`mailto:${b.email}`}>{b.email}</a></dd></> : null}
            <dt>{briefLabels.artist}</dt><dd>{b.artist}</dd>
            <dt>{briefLabels.genre}</dt><dd>{b.genre}{b.bpm ? ` · ${b.bpm} BPM` : ''}{b.key ? ` · ${b.key}` : ''}</dd>
            {b.refs ? <><dt>{briefLabels.refs}</dt><dd className="pre">{linkify(b.refs)}</dd></> : null}
            {b.idea ? <><dt>{briefLabels.idea}</dt><dd className="pre">{b.idea}</dd></> : null}
          </dl>
        </details>
      </aside>
      <section className="chat" aria-label={L.chat}>
        <header><b>{L.chat}</b><span className="live" aria-hidden="true" /></header>
        <div className="msgs" ref={box}>
          {v.messages.map((m) => (
            m.from === 'system'
              ? <div key={m.id} className="sys"><span>{m.text}</span><time>{when(m.t, v.lang)}</time></div>
              : <div key={m.id} className={`m ${m.from === role ? 'me' : 'them'}`}><div className="who">{who(m)} <time>{when(m.t, v.lang)}</time></div><div className="txt">{linkify(m.text)}</div></div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={L.placeholder}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} maxLength={2000} />
          <button className="btn" disabled={busy || !text.trim()}>{busy ? L.sending : L.send}</button>
        </form>
        {err ? <div className="err" role="alert">{err}</div> : null}
      </section>
    </div>
  );
}
