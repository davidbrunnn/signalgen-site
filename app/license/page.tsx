import { TERMS } from './terms';
import Link from 'next/link';

export const metadata = { title: 'License terms · Signal Studio' };

export default function License() {
  return (
    <main className="wrap narrow">
      <h1>License terms</h1>
      <p className="muted">One license for every record in the catalog. You get a certificate with these terms, your name and a license number when you buy.</p>
      <ol className="terms" style={{ marginTop: 34 }}>
        {TERMS.map((x, i) => <li key={i}><b>{i + 1}</b><span>{x}</span></li>)}
      </ol>
      <p className="muted small" style={{ marginTop: 34 }}>Packs from the Pack page are non-exclusive and royalty-free: use the loops and MIDI in your own releases, but do not resell them as samples. Questions? Reply to your Stripe receipt.</p>
      <Link href="/#catalog" className="btn quiet" style={{ marginTop: 21 }}>Back to the catalog</Link>
    </main>
  );
}
