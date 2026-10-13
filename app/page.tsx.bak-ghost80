import Link from 'next/link';
import { readCatalog, priceOf } from '@/lib/catalog';
import type { Track } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import Storefront, { type Tile } from './Storefront';

export const dynamic = 'force-dynamic';

// The store: sample packs and Serum 2 presets first. Ghost productions live one click away (/ghost), as a secondary door.
export default async function Home() {
  const cat = await readCatalog();
  const sounds = cat.tracks.filter((t) => t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle');
  const byGroup = (g?: string) => sounds.filter((t) => t.group === g);
  const kits = sounds.filter((t) => t.kind === 'kit').sort((a, b) => (b.vol || 0) - (a.vol || 0));
  const featured = kits.find((t) => t.packType === 'Full Pack') || kits[0];
  const fBundle = featured ? byGroup(featured.group).find((t) => t.kind === 'bundle') : undefined;
  const collection = sounds.find((t) => t.id === 'complete-collection');
  const ghosts = cat.tracks.filter((t) => t.kind === 'track' && !(t.sold && !t.nonExclusive)).length;

  const tile = (t: Track): Tile => {
    const sibs = byGroup(t.group);
    const serum = sibs.find((x) => x.kind === 'preset');
    return {
      ...toP(t), kind: t.kind || 'kit', published: t.published, href: `/p/${t.id}`, genre: t.genre,
      sub: `Vol. ${String(t.vol || '').padStart(2, '0')} · ${t.packType}`, cta: 'Get the pack',
      subtitle: [t.kind === 'bundle' && t.format === 'collection' ? t.subtitle : `${t.packType}`, t.bpm ? `${t.bpm} BPM` : '', t.genre].filter(Boolean).join(' · '),
      eyebrow: t.format === 'collection' ? 'Everything' : `Vol. ${String(t.vol).padStart(2, '0')}`,
      badge: t.format === 'collection' ? `Save $${(t.wasPrice || 0) - priceOf(t)}` : t.kind === 'bundle' ? `Save $${(t.wasPrice || 0) - priceOf(t)}` : t === featured ? 'New' : undefined,
      extra: t.kind === 'kit' && serum ? '+ Serum 2 presets' : undefined,
      wasPrice: t.wasPrice,
    };
  };
  const order = (a: Track, b: Track) => (b.vol || 0) - (a.vol || 0);
  const tiles: Tile[] = [
    ...kits.map(tile),
    ...sounds.filter((t) => t.kind === 'preset').sort(order).map(tile),
    ...sounds.filter((t) => t.kind === 'bundle' && t.format === 'bundle').sort(order).map(tile),
    ...(collection ? [tile(collection)] : []),
  ];
  const nWav = kits.reduce((a, t) => a + (t.counts?.wav || 0), 0);
  const nPre = sounds.filter((t) => t.kind === 'preset').reduce((a, t) => a + (t.counts?.presets || 0), 0);

  return (
    <main className="wrap">
      <section className="shero">
        <div className="sh-copy">
          <span className="eyebrow">SignalGen Sounds</span>
          <h1>Sounds nobody else has.</h1>
          <p className="lede">Sample packs and Serum 2 presets synthesized in-house, for tech house and the music around it. Key and tempo in every file name, MIDI with every loop, royalty-free — nothing to clear, nothing that sounds like everyone else’s pack.</p>
          <div className="act">
            <Link href="#store" className="btn">Browse the packs</Link>
            {collection ? <Link href={`/p/${collection.id}`} className="btn quiet">All of it, ${priceOf(collection)}</Link> : null}
          </div>
          <ul className="facts">
            <li><b>{kits.length}</b>sample packs</li>
            <li><b>{nWav}</b>sounds</li>
            <li><b>{nPre}</b>Serum 2 presets</li>
          </ul>
        </div>
        {featured ? (
          <Link href={`/p/${featured.id}`} className="feature" aria-label={`${featured.title}, featured pack`}>
            <div className="fc">
              {featured.cover ? <img src={featured.cover} alt="" /> : null}
              <span className="pb"><PlayButton t={{ ...toP(featured), sub: `Demo · ${featured.packType}`, cta: 'Get the pack' }} big /></span>
            </div>
            <div className="fm">
              <div>
                <span className="eyebrow">New · Vol. {String(featured.vol).padStart(2, '0')} · {featured.packType}</span>
                <b>{featured.title}</b>
                <span className="muted small">{featured.contents}</span>
              </div>
              <div className="fp"><b>${priceOf(featured)}</b>{fBundle ? <span className="muted small">with Serum 2 presets ${priceOf(fBundle)}</span> : null}</div>
            </div>
          </Link>
        ) : null}
      </section>

      <section className="block" id="store" style={{ paddingTop: 'var(--s5)' }}>
        <Storefront tiles={tiles} />
      </section>

      <section className="block" id="standard">
        <header><h2>Built the way producers expect a pack to be.</h2><p>Every volume follows the conventions of the big sample stores, so it drops straight into your workflow.</p></header>
        <ul className="std">
          <li><b>Demo track</b><span>Every pack has a demo made only from its own sounds — what you hear is what you get.</span></li>
          <li><b>Key and tempo in the name</b><span>“Bass 04 · G#m · 128 BPM”. Sort by key in your browser and it is all there.</span></li>
          <li><b>MIDI with every loop</b><span>Change the notes, keep the sound. Each loop also ships as a one shot of the same patch.</span></li>
          <li><b>48 kHz / 24-bit WAV</b><span>Levelled across the pack, loops cut to exact bars. Works in any DAW.</span></li>
          <li><b>Serum 2 editions</b><span>The exact patches that play the loops, with previews and MIDI. Load, play, done.</span></li>
          <li><b>100 % original</b><span>Synthesized by SignalGen. No third-party samples, no factory presets, nothing to clear.</span></li>
        </ul>
      </section>

      {collection ? (
        <section className="block">
          <Link href={`/p/${collection.id}`} className="band">
            <div>
              <span className="eyebrow">The Complete Collection</span>
              <h2>Every pack and every preset bank, in one download.</h2>
              <p className="muted">{collection.subtitle}. {collection.contents}.</p>
            </div>
            <div className="bp"><s>${collection.wasPrice}</s><b>${priceOf(collection)}</b><span className="btn">See what is inside</span></div>
          </Link>
        </section>
      ) : null}

      <section className="block" id="license">
        <header><h2>One license. Plain language.</h2><p>The full text is on the <Link href="/license" style={{ textDecoration: 'underline' }}>license page</Link>; every purchase comes with a certificate in your name.</p></header>
        <div className="three">
          <div><h3>Use it anywhere</h3><p>Releases, remixes, sync, streams, client work — commercial or not. No royalties, no credit required.</p></div>
          <div><h3>Keep it yours</h3><p>The only thing you can’t do is resell or share the sounds or presets themselves, alone or inside another pack.</p></div>
          <div><h3>Download at once</h3><p>Pay with card or wallet; the files are on the next page, and the links stay valid for 7 days.</p></div>
        </div>
      </section>

      {ghosts ? (
        <section className="block">
          <div className="ghostline">
            <p><b>Need a finished record instead?</b> <span className="muted">Ghost productions: unreleased tracks, mastered, sold once each.</span></p>
            <Link href="/ghost" className="btn small quiet">Ghost production</Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
