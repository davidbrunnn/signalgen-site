import Link from 'next/link';
import { readCatalog, fmtDur, isSold, priceOf } from '@/lib/catalog';
import { toP } from '@/lib/view';
import Catalog from '../Catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ghost production · SignalGen', description: 'Unreleased club tracks, mastered, Extended Mix + Radio Edit. Exclusive: each one is sold once.' };

// The secondary door: finished tracks for producers and labels who want a record, not sounds.
export default async function Ghost() {
  const cat = await readCatalog();
  const tracks = cat.tracks.filter((t) => t.kind === 'track').sort((a, b) => (b.published > a.published ? 1 : -1));
  const open = tracks.filter((t) => !isSold(t));
  const rows = tracks.map((t) => ({ ...toP(t), camelot: t.camelot, duration: fmtDur(t.duration), published: t.published, bpm: t.bpm }));
  const from = open.length ? Math.min(...open.map(priceOf)) : 0;
  return (
    <main className="wrap">
      <Link href="/" className="back">Sample packs and presets</Link>
      <section className="hero-plain">
        <span className="eyebrow">Ghost production</span>
        <h1>A finished record, <em className="muted">yours alone.</em></h1>
        <p>Unreleased tech house, minimal and bass house, mastered and ready to sign: Extended Mix and Radio Edit, WAV 24-bit. Each track is sold once and leaves the store the moment it is paid — release it under your name or your label, royalty-free.</p>
        {from ? <div className="price"><b>${from}</b><small>per track, both versions</small></div> : null}
      </section>
      <section className="block" style={{ paddingTop: 'var(--s4)' }}>
        {rows.length ? <Catalog rows={rows} /> : <div className="empty">No tracks available right now. New ones arrive every week.</div>}
      </section>
    </main>
  );
}
