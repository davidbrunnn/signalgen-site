import Link from 'next/link';
import { readCatalog, fmtDur, isSold, priceOf } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import Storefront, { type Tile } from './Storefront';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cat = await readCatalog();
  const items = cat.tracks.filter((t) => t.kind !== 'pack');
  const sg = items.find((t) => t.kind === 'software');
  const tracks = items.filter((t) => t.kind === 'track').sort((a, b) => (b.published > a.published ? 1 : -1));
  const kits = items.filter((t) => t.kind === 'kit').sort((a, b) => (a.subtitle || '').localeCompare(b.subtitle || ''));
  const presets = items.filter((t) => t.kind === 'preset');
  const open = tracks.filter((t) => !isSold(t));
  const newest = open[0];

  const tile = (t: typeof items[number]): Tile => ({
    ...toP(t), kind: t.kind || 'track', published: t.published, sold: isSold(t),
    href: t.kind === 'software' ? '/signalgen' : t.kind === 'track' ? `/t/${t.id}` : `/p/${t.id}`,
    subtitle: t.kind === 'track' ? `${t.genre.replace(' / Deep Tech', '')} · ${t.bpm} BPM · ${t.key} · ${fmtDur(t.duration)}` : t.subtitle || '',
    badge: t.kind === 'track' ? (t === newest ? 'New' : 'Exclusive') : t.kind === 'software' ? 'Plugin' : undefined,
  });
  const tiles: Tile[] = [...(sg ? [tile(sg)] : []), ...tracks.map(tile), ...kits.map(tile), ...presets.map(tile)];

  return (
    <main className="wrap">
      <section className="mhero">
        <div>
          <h1>Club records nobody has heard. Sounds nobody else has.</h1>
          <p className="lede">Ghost productions sold once each, sample kits and presets synthesized in-house — all made with <Link href="/signalgen">SignalGen</Link>, the plugin that writes a finished track in Ableton Live in one click.</p>
          <div className="act">
            <Link href="#ghost" className="btn">Browse the store</Link>
            {newest ? <><PlayButton t={toP(newest)} queue={open.map(toP)} big /><span className="small muted">Play the newest record</span></> : null}
          </div>
        </div>
        <ul className="facts">
          <li><b>{open.length}</b>records available, one owner each</li>
          <li><b>{kits.length}</b>sample kits, royalty-free</li>
          <li><b>{presets.length}</b>preset {presets.length === 1 ? 'pack' : 'packs'}</li>
          <li><b>1</b>plugin that made all of it</li>
        </ul>
      </section>

      <section className="block" id="ghost" style={{ paddingTop: 34 }}>
        <Storefront tiles={tiles} />
      </section>

      <span id="kits" /><span id="presets" />

      {sg ? (
        <section className="block">
          <Link href="/signalgen" className="promo">
            <img src="/product/live-set.jpg" alt="" />
            <div>
              <span className="small" style={{ color: 'var(--amber)', fontWeight: 700 }}>The plugin behind everything here</span>
              <h2>Make your own. One click, a finished track in Ableton Live.</h2>
              <p className="muted">Pick genre, key and tempo. SignalGen writes drums, bass, music, vocals and FX as editable MIDI, mixed and mastered. ${sg ? priceOf(sg) : 249}, lifetime.</p>
              <span className="btn">See how it works</span>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="block" id="license">
        <header><h2>Three licenses, all in plain language</h2><p>You get a certificate with your name, a license number and the terms when you buy. The full text is on the <Link href="/license" style={{ textDecoration: 'underline' }}>license page</Link>.</p></header>
        <div className="three">
          <div><h3>Ghost productions</h3><p>Exclusive. Sold once, removed from the store the moment payment clears. Release under your name or label, royalty-free. Extended Mix + Radio Edit, WAV 24-bit, mastered.</p></div>
          <div><h3>Sample kits and presets</h3><p>Royalty-free and non-exclusive. Use them in any release. Synthesized in-house — no third-party samples, nothing to clear. Not for resale as packs.</p></div>
          <div><h3>SignalGen plugin</h3><p>Lifetime license on two computers, key issued the minute you pay. Everything you make with it is yours. 14-day refund if it does not run in your Live.</p></div>
        </div>
      </section>
    </main>
  );
}
