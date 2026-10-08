import Link from 'next/link';
import { readCatalog, downloadsOf } from '@/lib/catalog';
import { sign } from '@/lib/sign';
import { paidSession, licenseNo } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your purchase · SignalGen' };

// After payment (Stripe, or the local test checkout). Software: license key + installer. Kits/presets: the zip. Tracks: both WAVs + certificate.
export default async function Thanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const p = await paidSession(searchParams.session_id);
  const t = p ? (await readCatalog()).tracks.find((x) => x.id === p.trackId) : undefined;
  if (!p || !p.paid || !t) {
    return (
      <main className="wrap narrow">
        <h1>We could not find this purchase.</h1>
        <p className="muted">If you just paid, wait a few seconds and refresh — the payment can take a moment to confirm. The link to this page is in your Stripe receipt. Still nothing? Reply to the receipt email and we will send your files.</p>
        <Link href="/" className="btn quiet">Back to SignalGen</Link>
      </main>
    );
  }
  if (p.refunded) {
    return (
      <main className="wrap narrow">
        <h1>Someone signed it first.</h1>
        <p className="muted">Another buyer completed payment for {t.title} a moment before you. Exclusive licenses sell once, so your payment of ${p.amount} has been refunded in full. It will appear on your statement in 5–10 days.</p>
        <Link href="/ghost" className="btn">Back</Link>
      </main>
    );
  }
  const sid = p.session, soft = t.kind === 'software';
  const dls = downloadsOf(t).map((d) => ({ ...d, token: sign(t.id, d.key, soft ? 30 : 7) }));
  return (
    <main className="wrap narrow">
      {p.test ? <div className="note warn">Test purchase — no money was charged.</div> : null}
      <h1>{soft ? 'SignalGen is yours.' : `${t.title} is yours.`}</h1>
      {soft ? (
        <>
          <p className="muted">Licensed to {p.email}. This key is personal and works offline on up to two of your computers. It has also been sent to your email.</p>
          <div className="key" aria-label="License key">{p.key || 'Your key is being issued — refresh this page in a moment.'}</div>
          <ol className="steps-mini">
            <li>Download and run the installer below (macOS 11+, Apple Silicon or Intel).</li>
            <li>Ableton Live: Settings → Plug-Ins → turn on Audio Units and VST3, press Rescan.</li>
            <li>Put SignalGen on a MIDI track, click Activate (top right), paste your email and this key.</li>
          </ol>
        </>
      ) : (
        <p className="muted">License {licenseNo(sid)}, issued to {p.email || 'you'}. {t.kind === 'track' ? 'The record has been removed from the catalog. ' : ''}Download now — the links stay valid for 7 days and this page can regenerate them.</p>
      )}
      <div className="dl">
        {dls.map((d) => <a key={d.key} href={`/api/download?t=${d.token}`}>{d.label} <span>{d.note}</span><i>Download</i></a>)}
        <Link href={`/license/${sid}`}>License certificate <span>Printable, save as PDF</span><i>Open</i></Link>
      </div>
      <p className="muted small">Keep this page’s address and your receipt — together with the certificate they are your proof of license. Questions: reply to the receipt email.</p>
    </main>
  );
}
