import Link from 'next/link';
import { readCatalog, fmtDur, isSold, priceOf } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import BuyButton from '@/components/BuyButton';
import Catalog from './Catalog';
import SoundsGrid from './SoundsGrid';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cat = await readCatalog();
  const sg = cat.tracks.find((t) => t.kind === 'software');
  const tracks = cat.tracks.filter((t) => t.kind === 'track' && !isSold(t)).sort((a, b) => (b.published > a.published ? 1 : -1));
  const sounds = cat.tracks.filter((t) => t.kind === 'kit' || t.kind === 'preset').sort((a, b) => (a.subtitle || '').localeCompare(b.subtitle || ''));
  const queue = tracks.map(toP);
  const first = tracks[0];
  const price = sg ? priceOf(sg) : 249;

  return (
    <main className="wrap">
      {/* ─── Hero: the result first (a real generated set in Ableton Live), the promise beside it, sound one click away */}
      <section className="phero" aria-label="SignalGen">
        <div className="phero-copy">
          <h1>A finished club track in Ableton Live. One click.</h1>
          <p className="lede">Pick a genre, a key and a tempo. SignalGen writes the whole arrangement — drums, bass, music, vocals, FX — <b>mixed and mastered</b>, as a Live set you can edit note by note.</p>
          <div className="act">
            {sg ? <BuyButton id={sg.id} price={price} label={`Get SignalGen, $${price}`} /> : null}
            {first ? <><PlayButton t={toP(first)} queue={queue} big /><span className="small muted">Hear a track it made</span></> : null}
          </div>
          <ul className="trust">
            <li><b>AU · VST3</b> for Ableton Live 12, macOS</li>
            <li><b>Lifetime</b> license, 2 computers</li>
            <li><b>Key in 1 min</b> after payment</li>
          </ul>
        </div>
        <figure className="phero-shot">
          <img src="/product/live-set.jpg" alt="A SignalGen set open in Ableton Live: intro, groove, build, drop, break and second drop, with drums, bass, music, vocals and FX groups" />
          <img className="plug" src="/product/01_create.png" alt="The SignalGen plugin: genre, key, scale, BPM and the New Track button" />
          <figcaption>Left: the plugin. Right: what came out of it, 129 BPM in D minor, 184 bars.</figcaption>
        </figure>
      </section>

      {/* ─── Proof before explanation: let the ear decide */}
      <section className="block" id="listen">
        <header><h2>Ten tracks it made this week. Press play.</h2><p>Nothing here was touched by hand after generation. Every one was measured against 17 chart tech house releases before it reached this page.</p></header>
        <div className="numbers">
          <div><b>-9.3</b><span>LUFS average, club loudness</span></div>
          <div><b>-1.1</b><span>dBTP true peak, every master</span></div>
          <div><b>150+</b><span>bars arranged per track</span></div>
          <div><b>2</b><span>versions: Extended Mix and Radio Edit</span></div>
        </div>
        {tracks.length ? <Catalog rows={tracks.map((t) => ({ ...toP(t), bpm: t.bpm, camelot: t.camelot, duration: fmtDur(t.duration), published: t.published }))} demo /> : null}
      </section>

      {/* ─── Mechanism, as a real sequence of screens */}
      <section className="block" id="how">
        <header><h2>How a track happens</h2><p>Four menus, one button. Then eight variations to pick from, every part as MIDI, and the set opens in Live.</p></header>
        <ol className="flow">
          <li><img src="/product/01_create.png" alt="" /><div><div className="n">1</div><h3>Choose</h3><p>Genre, key, scale, BPM — or type it: “dark tech house 127 in C minor”. Press New Track.</p></div></li>
          <li><img src="/product/10_pick.png" alt="" /><div><div className="n">2</div><h3>Pick a take</h3><p>Eight takes per click. Draw the energy curve over the song map and the arrangement follows it.</p></div></li>
          <li><img src="/product/05_midi.png" alt="" /><div><div className="n">3</div><h3>Shape the parts</h3><p>Lead, chords, bass, arp, pad — rewrite only the bars you select, always on the song’s chords.</p></div></li>
          <li><img src="/product/live-set.jpg" alt="" /><div><div className="n">4</div><h3>Open in Live</h3><p>Groups, clips, automation, sends. Gain-staged, mixed and mastered with native devices. Yours to finish.</p></div></li>
        </ol>
      </section>

      {/* ─── What's in the box */}
      <section className="block" id="inside">
        <header><h2>What you install</h2><p>One installer, three plugins. Everything the ten tracks above were made with.</p></header>
        <div className="inside">
          <article>
            <img src="/product/04_master.png" alt="" />
            <h3>SignalGen</h3>
            <p>The generator. Full track, parts as MIDI, drums, bass, presets, and Reamp — drop any song in and get its DNA back as a new one.</p>
          </article>
          <article>
            <img src="/product/09_bass.png" alt="" />
            <h3>SignalGen Mix</h3>
            <p>First plugin on every channel: stage, EQ, clear, duck, grid, color, limit. The chain the engine mixes with, in your hands.</p>
          </article>
          <article>
            <img src="/product/maestro.png" alt="" />
            <h3>SignalGen Sounds</h3>
            <p>The synth and timbre engine behind the parts, with 200+ presets built from the reference records — vintage circuits included.</p>
          </article>
        </div>
      </section>

      {/* ─── Sounds: kits and presets, each with a preview */}
      {sounds.length ? (
        <section className="block" id="sounds">
          <header><h2>Sounds from the same engine</h2><p>Sample kits and preset packs, synthesized in-house. Royalty-free, no third-party samples, ready for your own releases.</p></header>
          <SoundsGrid items={sounds.map((t) => ({ ...toP(t), subtitle: t.subtitle, contents: t.contents, kind: t.kind }))} />
        </section>
      ) : null}

      {/* ─── Offer */}
      {sg ? (
        <section className="block" id="pricing">
          <div className="offer">
            <div>
              <h2>SignalGen</h2>
              <p className="muted">{sg.subtitle}</p>
              <ul className="offer-list">
                {(sg.features || []).map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
            <aside>
              <div className="price">${price}<small>once. No subscription.</small></div>
              <BuyButton id={sg.id} price={price} label={`Get SignalGen, $${price}`} />
              <p className="fine">Secure checkout by Stripe. Your license key appears right after payment and arrives by email. Mac today; Windows is in the works.</p>
              <p className="fine">14-day refund if it does not run in your Live. <Link href="/license" style={{ textDecoration: 'underline' }}>License terms</Link>.</p>
            </aside>
          </div>
        </section>
      ) : null}

      {/* ─── Objections */}
      <section className="block" id="faq">
        <header><h2>Questions producers ask</h2><p>Short answers. The longer version is in the <a href="/SignalStudio_Whitepaper.pdf" style={{ textDecoration: 'underline' }}>whitepaper</a>.</p></header>
        <div className="split">
          <div>
            <details open><summary>Is it a loop pack or a generator?</summary><p>A generator. Every click writes a new arrangement, new MIDI and new sounds for that track. Nothing repeats between two clicks.</p></details>
            <details><summary>Will it sound like everyone else’s?</summary><p>It is measured against commercial references, not trained to copy them. Tempo, key, scale, mood and the energy curve are yours; the engine fills in the craft.</p></details>
            <details><summary>Can I release what it makes?</summary><p>Yes. Everything is synthesized or from royalty-free licensed material, and your license covers commercial release of anything you make with it.</p></details>
          </div>
          <div>
            <details><summary>What do I need?</summary><p>Ableton Live 12 on macOS 11 or newer (Apple Silicon or Intel). The plugins are AU and VST3. Windows is being built.</p></details>
            <details><summary>How does the license work?</summary><p>After payment you get an SGN1 key tied to your email. Click Activate inside the plugin, paste it, done. Works offline, on up to two of your computers.</p></details>
            <details><summary>What about the tracks on this page?</summary><p>They are demos: proof of what the engine does, generated and mastered without manual edits. They are not for sale.</p></details>
          </div>
        </div>
      </section>
    </main>
  );
}
