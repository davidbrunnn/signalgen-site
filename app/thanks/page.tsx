import Stripe from 'stripe';
import { readCatalog } from '@/lib/catalog';
import { sign } from '@/lib/sign';

export const dynamic = 'force-dynamic';

export default async function Thanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const sid = searchParams.session_id;
  const key = process.env.STRIPE_SECRET_KEY;
  let paid = false, trackId = '', email = '';
  if (sid && key) {
    try {
      const s = await new Stripe(key).checkout.sessions.retrieve(sid);
      paid = s.payment_status === 'paid'; trackId = s.metadata?.trackId || ''; email = s.customer_details?.email || '';
    } catch { /* fall through */ }
  }
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === trackId);
  if (!paid || !t) {
    return (
      <main className="wrap thanks">
        <h1>Nothing to download here.</h1>
        <p style={{ color: 'var(--muted)' }}>If you just paid, keep this page’s link (it contains your session) and refresh in a moment. Otherwise write to the address on your Stripe receipt.</p>
      </main>
    );
  }
  const ext = t.files.extended ? sign(t.id, 'extended') : '';
  const rad = t.files.radio ? sign(t.id, 'radio') : '';
  return (
    <main className="wrap thanks">
      <div style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', marginBottom: 16 }}>Licensed to {email || 'you'}</div>
      <h1>{t.title} is yours.</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>WAV 44.1 kHz / 24 bit, mastered. The links work for 7 days — save the files now. Your Stripe receipt is the proof of the exclusive license.</p>
      <div className="dl">
        {ext ? <a href={`/api/download?t=${ext}`}>Extended Mix <span>WAV · 24 bit</span></a> : null}
        {rad ? <a href={`/api/download?t=${rad}`}>Radio Edit <span>WAV · 24 bit</span></a> : null}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Keep this page’s address: it regenerates the links while they are valid.</p>
    </main>
  );
}
