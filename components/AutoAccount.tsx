'use client';
// On the confirmation page: a fresh paid checkout opens the buyer's account by itself (POST /api/auth/session), so the header
// already shows "Minha conta" and the purchase is one click away next time.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoAccount({ session, signedIn }: { session: string; signedIn: boolean }) {
  const r = useRouter();
  useEffect(() => {
    if (signedIn) return;
    fetch('/api/auth/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ session_id: session }) })
      .then((x) => { if (x.ok) r.refresh(); }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, signedIn]);
  return null;
}
