import { TERMS, KIT_TERMS, SOFTWARE_TERMS } from './terms';
import Link from 'next/link';

export const metadata = { title: 'License terms · Signal Studio' };

export default function License() {
  return (
    <main className="wrap narrow">
      <h1>License terms</h1>
      <p className="muted">Three licenses, one per kind of product. You get a certificate with the matching terms, your name and a license number when you buy.</p>
      <h2 style={{ fontSize: 26, letterSpacing: '-.03em', marginTop: 55 }}>SignalGen software</h2>
      <ol className="terms">{SOFTWARE_TERMS.map((x, i) => <li key={i}><b>{i + 1}</b><span>{x}</span></li>)}</ol>
      <h2 style={{ fontSize: 26, letterSpacing: '-.03em', marginTop: 55 }}>Sample kits and preset packs</h2>
      <ol className="terms">{KIT_TERMS.map((x, i) => <li key={i}><b>{i + 1}</b><span>{x}</span></li>)}</ol>
      <h2 style={{ fontSize: 26, letterSpacing: '-.03em', marginTop: 55 }}>Exclusive tracks</h2>
      <ol className="terms">{TERMS.map((x, i) => <li key={i}><b>{i + 1}</b><span>{x}</span></li>)}</ol>
      <p className="muted small" style={{ marginTop: 34 }}>Packs from the Pack page are non-exclusive and royalty-free: use the loops and MIDI in your own releases, but do not resell them as samples. Questions? Reply to your Stripe receipt.</p>
      <Link href="/#catalog" className="btn quiet" style={{ marginTop: 21 }}>Back to the catalog</Link>
    </main>
  );
}
