'use client';
// Sign-in without a password: a link sent to the e-mail, or the e-mail + a license key bought with it.
import { useState } from 'react';
import type { UIText } from '@/lib/i18n-ui';
import type { Lang } from '@/lib/i18n-shared';
import { UI_TX } from '@/lib/i18n-ui';

export default function LoginForm({ lang, initialError }: { lang: Lang; initialError?: string }) {
  const T: UIText['login'] = UI_TX[lang].login;
  const [mode, setMode] = useState<'link' | 'key'>('link');
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(initialError === 'link' ? T.eLink : '');
  const [sent, setSent] = useState('');
  const [dev, setDev] = useState('');

  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setSent(''); setDev('');
    try {
      const r = await fetch(mode === 'link' ? '/api/auth/link' : '/api/auth/key', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(mode === 'link' ? { email, lang } : { email, key }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && mode === 'key') { window.location.href = j.url || '/conta'; return; }
      if (r.ok) { setSent(T.sent(email.trim())); if (j.dev) setDev(j.dev); }
      else if (j.error === 'mail') { setErr(T.eMail); setMode('key'); }
      else if (j.error === 'slow') setErr(T.eSlow);
      else if (j.error === 'nomatch') setErr(T.eKey);
      else setErr(T.eEmail);
    } catch { setErr(T.eEmail); }
    setBusy(false);
  }

  return (
    <form className="login" onSubmit={go} noValidate={false}>
      <div className="field">
        <label htmlFor="lg-email">{T.email}</label>
        <input id="lg-email" type="email" required autoComplete="email" inputMode="email" placeholder={T.ph} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode === 'key' ? (
        <div className="field">
          <label htmlFor="lg-key">{T.key}</label>
          <input id="lg-key" type="text" required autoComplete="off" spellCheck={false} placeholder={T.keyPh} value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
      ) : null}
      <button className="btn" type="submit" disabled={busy}>{busy ? (mode === 'link' ? T.sending : T.entering) : mode === 'link' ? T.send : T.enter}</button>
      {sent ? <div className="note" role="status">{sent}{dev ? <> <a href={dev} style={{ textDecoration: 'underline' }}>{T.dev}</a></> : null}</div> : null}
      {err ? <div className="err" role="alert">{err}</div> : null}
      <button type="button" className="linkbtn" onClick={() => { setMode(mode === 'link' ? 'key' : 'link'); setErr(''); setSent(''); }}>{mode === 'link' ? T.useKey : T.useLink}</button>
    </form>
  );
}
