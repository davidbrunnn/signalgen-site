import Link from 'next/link';
import { readCatalog, PRICE_USD, fmtDur, isSold, priceOf } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import Catalog from './Catalog';

export const dynamic = 'force-dynamic';

/* Golden spiral through the 13 × 8 Fibonacci tiling (viewBox units = squares).
   Quarter arcs: 8-square (0,0)-(8,8), 5-square (8,0)-(13,5), 3-square (10,5)-(13,8), 2-square (8,6)-(10,8), 1-squares (8,5) and (9,5). */
const SPIRAL = 'M0 8 A8 8 0 0 1 8 0 A5 5 0 0 1 13 5 A3 3 0 0 1 10 8 A2 2 0 0 1 8 6 A1 1 0 0 1 9 5 A1 1 0 0 1 10 6';

export default async function Home() {
  const cat = await readCatalog();
  const all = cat.tracks.filter((t) => t.kind !== 'pack').sort((a, b) => (b.published > a.published ? 1 : -1));
  const open = all.filter((t) => !isSold(t));
  const signed = all.filter(isSold);
  const tiles = open.slice(0, 5);
  const queue = open.map(toP);
  const sq = ['sq-b', 'sq-c', 'sq-d', 'sq-e', 'sq-f'];
  const genres = Array.from(new Set(open.map((t) => t.genre))).length;

  return (
    <main className="wrap">
      <section className="hero" aria-label="Signal Studio">
        <div className="sq-a">
          <div>
            <h1>Unreleased club records. One owner each.</h1>
            <p className="lede">Tech house, bass house and minimal from Davin’s studio. Every track is <b>mastered</b>, comes as <b>Extended Mix and Radio Edit</b>, and is licensed <b>exactly once</b> — then it leaves the catalog for good.</p>
          </div>
          <div>
            <div className="act">
              <Link href="#catalog" className="btn">Browse {open.length} tracks</Link>
              {tiles[0] ? <PlayButton t={toP(tiles[0])} queue={queue} big /> : null}
              {tiles[0] ? <span className="small muted">Play the newest: {tiles[0].title}</span> : null}
            </div>
            <div className="facts">
              <div><b>${PRICE_USD}</b>per track, both versions</div>
              <div><b>24-bit</b>WAV, 44.1 kHz</div>
              <div><b>{genres}</b>{genres === 1 ? 'genre' : 'genres'}, new every day</div>
            </div>
          </div>
        </div>
        <div className="tiles-m">
          {tiles.map((t, i) => (
            <Link key={t.id} href={`/t/${t.id}`} className={`tile ${sq[i]}`} aria-label={`${t.title}, ${t.bpm} BPM, ${t.genre}`}>
              {t.cover ? <img src={t.cover} alt="" /> : null}
              {i < 2 ? <span className="cap"><span>{t.title}</span><span>${priceOf(t)}</span></span> : null}
            </Link>
          ))}
        </div>
        <svg className="spiral" viewBox="0 0 13 8" preserveAspectRatio="none" aria-hidden="true"><path d={SPIRAL} /></svg>
      </section>

      <section className="block" id="how">
        <header><h2>How buying works</h2><p>No account, no subscription. You pay once and the record is yours to release.</p></header>
        <ol className="steps">
          <li><div className="n">1</div><h3>Listen</h3><p>Every track has a 30-second preview of its final drop. Play the catalog straight through from the bar at the bottom.</p></li>
          <li><div className="n">2</div><h3>License it</h3><p>Pay ${PRICE_USD} through Stripe — card, Apple Pay or Google Pay. The track is removed from the catalog the moment the payment clears.</p></li>
          <li><div className="n">3</div><h3>Download and release</h3><p>Get both WAV files and a license certificate in your name. Release it under your name or your label, royalty-free.</p></li>
        </ol>
      </section>

      <section className="block" id="catalog">
        <header><h2>Catalog</h2><p>{open.length} available. Prices include the Extended Mix and the Radio Edit. Tap a title for details, mastering numbers and the license.</p></header>
        {all.length ? (
          <Catalog rows={all.map((t) => ({ ...toP(t), bpm: t.bpm, camelot: t.camelot, duration: fmtDur(t.duration), published: t.published }))} />
        ) : <div className="empty">The first records are on their way. Check back tonight.</div>}
      </section>

      {signed.length ? (
        <section className="block">
          <header><h2>Recently signed</h2><p>These records found their owner and will never be sold again.</p></header>
          <div className="signed">
            {signed.slice(0, 13).map((t) => (
              <div key={t.id}><div className="c">{t.cover ? <img src={t.cover} alt="" loading="lazy" /> : null}</div><p>{t.title}</p></div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="block" id="license">
        <header><h2>The license, in short</h2><p>The full text is on the <Link href="/license" style={{ textDecoration: 'underline' }}>license page</Link> and on the certificate you download.</p></header>
        <div className="split">
          <ul className="terms">
            <li><b>Exclusive</b><span>Sold once. After your purchase nobody else can buy it here.</span></li>
            <li><b>Yours to release</b><span>Under your artist name or label, on every platform, with no royalties owed to us.</span></li>
            <li><b>Files</b><span>Extended Mix and Radio Edit, WAV 44.1 kHz / 24-bit, mastered for streaming and club play.</span></li>
            <li><b>Cleared</b><span>Original synthesis plus royalty-free licensed sounds. No uncleared samples, nothing to report to a sample house.</span></li>
          </ul>
          <div>
            <details><summary>Can I change the title or edit the track?</summary><p>Yes. Rename it, edit it, remix it, add vocals. The certificate lists the original title so you can prove the license later.</p></details>
            <details><summary>What if two people buy at the same time?</summary><p>The first completed payment wins. Any second payment for the same record is refunded automatically, in full.</p></details>
            <details><summary>How long are the download links valid?</summary><p>Seven days from purchase, and you can reopen your purchase page to get fresh links during that time. Save the files right away.</p></details>
            <details><summary>Who made these records?</summary><p>Davin, working with SignalGen — an engine that builds full arrangements and is measured against commercial references. Read the <a href="/SignalStudio_Whitepaper.pdf" style={{ textDecoration: 'underline' }}>whitepaper</a>.</p></details>
          </div>
        </div>
      </section>
    </main>
  );
}
