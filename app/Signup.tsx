'use client';
import { useState } from 'react';

export default function Signup({ plan }: { plan?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const company = (new FormData(e.currentTarget).get('company') as string) || '';
    try {
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, plan, company }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setState('done'); return; }
      setState('error'); setMsg(j.error || 'The list could not be reached. Try again in a minute.');
    } catch {
      setState('error'); setMsg('No connection. Check your internet and try again.');
    }
  }

  if (state === 'done') {
    return <p className="signup-done" role="status">You’re on the list. We’ll email {email} when founder access opens.</p>;
  }
  return (
    <form className="signup" onSubmit={submit}>
      <label className="sr" htmlFor="email">Email</label>
      <input id="email" type="email" required autoComplete="email" placeholder="you@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="hp" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden />
      <button type="submit" className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Joining…' : 'Join early access'}</button>
      {state === 'error' ? <p className="signup-err" role="alert">{msg}</p> : null}
    </form>
  );
}
