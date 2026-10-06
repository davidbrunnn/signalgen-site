import { readCatalog, PRICE_USD } from '@/lib/catalog';
import TrackCard from './TrackCard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cat = await readCatalog();
  const tracks = [...cat.tracks].sort((a, b) => (b.published > a.published ? 1 : -1));
  const lastDay = tracks.find((t) => t.day)?.day;
  const today = lastDay ? tracks.filter((t) => t.day === lastDay).sort((a, b) => (a.pick || 9) - (b.pick || 9)) : [];
  const rest = tracks.filter((t) => !today.includes(t));
  return (
    <main className="wrap">
      <section className="hero">
        <h1>Unreleased<br />club tracks,<br /><em>ready to sign.</em></h1>
        <p>Every day the five best productions from the SignalGen engine, chosen by taste and mastered with Ableton Live native devices. Extended mix and radio edit, WAV 44.1 kHz / 24 bit, exclusive license: once a track is sold it leaves the catalog.</p>
        <div className="price"><b>${PRICE_USD}</b><small>per track · both versions</small></div>
      </section>

      <section className="section" id="today">
        <h2>Today’s five{lastDay ? ` · ${lastDay}` : ''}</h2>
        {today.length ? <div className="grid">{today.map((t) => <TrackCard key={t.id} t={t} price={PRICE_USD} />)}</div> : <div className="empty">The first drop is on its way.</div>}
      </section>

      {rest.length ? (
        <section className="section" id="all">
          <h2>Catalog · {rest.length} tracks</h2>
          <div className="grid">{rest.map((t) => <TrackCard key={t.id} t={t} price={PRICE_USD} />)}</div>
        </section>
      ) : null}

      <section className="section" id="license">
        <h2>License</h2>
        <ul className="license">
          <li>Exclusive: the track is sold once and removed from the catalog.</li>
          <li>You receive the Extended Mix and the Radio Edit as WAV 44.1 kHz / 24 bit, mastered, with a 30-second preview.</li>
          <li>You may release it under your name or your label, on any platform, with no royalty to SIGNAL STUDIO.</li>
          <li>Download links are valid for 7 days after purchase; the receipt from Stripe keeps your proof of license.</li>
        </ul>
      </section>
    </main>
  );
}
