'use client';
// The support form: the message goes to the shop's inbox (POST /api/support). If the site cannot send it right now, the form
// hands the visitor a ready e-mail (mailto) so nothing is lost.
import { useState } from 'react';
import { UI_TX } from '@/lib/i18n-ui';
import type { Lang } from '@/lib/i18n-shared';

export default function SupportForm({ lang, email: known, topic: t0, about }: { lang: Lang; email?: string; topic?: number; about?: string }) {
  const T = UI_TX[lang].support;
  const [name, setName] = useState('');
  const [email, setEmail] = useState(known || '');
  const [topic, setTopic] = useState(T.topics[t0 ?? 0] || T.topics[0]);
  const [message, setMessage] = useState(about ? `${about}: ` : '');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'idle' | 'ok' | 'err' | 'slow'>('idle');
  const [mailto, setMailto] = useState('');

  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setState('idle'); setMailto('');
    try {
      const r = await fetch('/api/support', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, email, topic, message, lang, page: window.location.pathname }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { setState('ok'); setMessage(''); }
      else if (j.mailto) setMailto(j.mailto);
      else setState(r.status === 429 ? 'slow' : 'err');
    } catch { setState('err'); }
    setBusy(false);
  }

  if (state === 'ok') return <div className="note" role="status">{T.ok}</div>;
  return (
    <form className="login support" onSubmit={go}>
      <div className="row2">
        <div className="field"><label htmlFor="sp-name">{T.name}</label><input id="sp-name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="sp-email">{T.email}</label><input id="sp-email" type="email" required autoComplete="email" maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <div className="field"><label htmlFor="sp-topic">{T.topic}</label>
        <select id="sp-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>{T.topics.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
      <div className="field"><label htmlFor="sp-msg">{T.message}</label>
        <textarea id="sp-msg" required rows={6} maxLength={4000} placeholder={T.messagePh} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      <button className="btn" type="submit" disabled={busy}>{busy ? T.sending : T.send}</button>
      {mailto ? <div className="note" role="status">{T.fallback} <a className="btn small quiet" href={mailto} style={{ marginLeft: 8 }}>{T.openMail}</a></div> : null}
      {state === 'err' ? <div className="err" role="alert">{T.err}</div> : null}
      {state === 'slow' ? <div className="err" role="alert">{T.slow}</div> : null}
    </form>
  );
}
