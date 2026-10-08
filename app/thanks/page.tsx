import Link from 'next/link';
import { readCatalog } from '@/lib/catalog';
import { sign } from '@/lib/sign';
import { paidSession, licenseNo } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your record · Signal Studio' };

// Step 3 of the sale: the buyer lands here from Stripe (or the local test checkout) with their session id.
export default async function Thanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const p = await paidSession(searchParams.session_id);
  const t = p ? (await readCatalog()).tracks.find((x) => x.id === p.trackId) : undefined;
  if (!p || !p.paid || !t) {
    return (
      <main className="wrap narrow">
        <h1>We could not find this purchase.</h1>
        <p className="muted">If you just paid, wait a few seconds and refresh — the payment can take a moment to confirm. The link to this page is in your Stripe receipt. Still nothing? Reply to the receipt email and we will send your files.</p>
        <Link href="/#catalog" className="btn quiet">Back to the catalog</Link>
      </main>
    );
  }
  if (p.refunded) {
    return (
      <main className="wrap narrow">
        <h1>Someone signed it first.</h1>
        <p className="muted">Another buyer completed payment for {t.title} a moment before you. Exclusive licenses sell once, so your payment of ${p.amount} has been refunded in full. It will appear on your statement in 5–10 days.</p>
        <Link href="/#catalog" className="btn">Find another record</Link>
      </main>
    );
  }
  const sid = p.session;
  const ext = t.files.extended ? sign(t.id, 'extended') : '';
  const rad = t.files.radio ? sign(t.id, 'radio') : '';
  return (
    <main className="wrap narrow">
      {p.test ? <div className="note warn">Test purchase — no money was charged.</div> : null}
      <h1>{t.title} is yours.</h1>
      <p className="muted">License {licenseNo(sid)}, issued to {p.email || 'you'}. The record has been removed from the catalog. Download both files now — the links stay valid for 7 days and this page can regenerate them.</p>
      <div className="dl">
        {ext ? <a href={`/api/download?t=${ext}`}>Extended Mix <span>WAV 24-bit</span><i>Download</i></a> : null}
        {rad ? <a href={`/api/download?t=${rad}`}>Radio Edit <span>WAV 24-bit</span><i>Download</i></a> : null}
        <Link href={`/license/${sid}`}>License certificate <span>Printable, save as PDF</span><i>Open</i></Link>
      </div>
      <p className="muted small">Keep this page’s address and your receipt. Together with the certificate they prove the exclusive license if a distributor or label asks.</p>
    </main>
  );
}
