import { readCatalog } from '@/lib/catalog';
import { DEMOS, GENRES, PRICE } from '@/lib/site';
import Starter from './Starter';
import Player from './Player';
import Signup from './Signup';
import { salesOpen, PRICE_BRL, brl } from '@/lib/sales';

export const dynamic = 'force-dynamic';

// the tracks of a real set (Venda/Capricornus Dionysus/MIDI), grouped as they open in Live
const SET: { group: string; tracks: string[] }[] = [
  { group: 'Drums', tracks: ['Kick', 'Clap', 'Snare', 'Hat Closed', 'Hat Open', 'Shaker', 'Perc', 'Perc 2', 'Crash + Ride'] },
  { group: 'Bass', tracks: ['Sub', 'Bassline', 'Bass Mid', 'Reese', 'Donk'] },
  { group: 'Music', tracks: ['House Stab', 'Piano Dark', 'Strings', 'Pad', 'Arp', 'Lead', 'Torn Lead', 'Low Lead'] },
  { group: 'Vox', tracks: ['Vocal'] },
  { group: 'FX', tracks: ['Ear Candy', 'Risers', 'Resample'] },
];

const VS: [string, string, string][] = [
  ['Length', 'Eight bars', 'The whole song, intro to outro: 160 bars and more'],
  ['Sound', 'MIDI, bring your own', 'Serum 2 patches and your samples on every track'],
  ['Structure', 'A loop', 'Grooves, breaks, builds, two drops and a fill every four bars'],
  ['Mix', 'Not included', 'Gain-staged, EQ’d, sidechained, with returns for space'],
  ['Master', 'Not included', 'Extended Mix and Radio Edit, around −9 LUFS'],
];

const ENGINE: [string, string][] = [
  ['Something happens every four bars', 'Fills, stops, pitch dives on the bass, ear candy on the grid. A starter never loops itself to sleep.'],
  ['Tension, then release', 'Each song is shaped like a journey: build, drop, breathe, build higher. Nothing ends abruptly.'],
  ['A bassline with a voice', 'Legato, glide and pitch play, sidechained to the kick, with a torn lead rising out of it as the hook.'],
  ['Harmony you can hear', 'The chords move, and every part is written on them, in the key you chose.'],
  ['Mixed the way an engineer would', 'Every channel gain-staged, low end in mono, EQ and sidechain set, delay and reverb on returns.'],
  ['Synthesis and your samples', 'About 60 % synthesis and 40 % from your own library: Splice, Loopcloud or any folder you point it at.'],
];

const FAQ: [string, string][] = [
  ['What do I need?', 'A Mac, Ableton Live 12 and Serum 2. Drums and effects come from your own sample library: Splice, Loopcloud or any folder.'],
  ['Is it a loop generator?', 'No. It writes a complete song with a structure, then gives you every part as its own track and MIDI file, so you can keep it whole or take it apart.'],
  ['Who owns what I make with it?', 'You do. Use it in your releases, commercially, with no royalties to SignalGen.'],
  ['Does my music go to the cloud?', 'No. The engine runs on your Mac. Nothing you make or drop in is uploaded.'],
  ['Can I drop in a track to start from?', 'Yes. SignalGen reads its tempo, key, form and sound and writes a new, original set from that DNA.'],
  ['Is there a Windows version?', 'Not yet. SignalGen is macOS only for now; Windows is planned.'],
];

export default async function Home() {
  const cat = await readCatalog();
  const fresh = cat.tracks.filter((t) => t.preview && t.kind !== 'pack').sort((a, b) => (b.published > a.published ? 1 : -1)).slice(0, 6);
  const months = Math.round(PRICE.lifetime / PRICE.monthly);
  const open = salesOpen();
  const cta = open ? { href: '#pricing', label: 'Get SignalGen' } : { href: '#access', label: 'Join early access' };

  return (
    <main>
      <section className="wrap hero">
        <h1>The songstarter that finishes the song.</h1>
        <p className="lead">Choose a genre, a key, a tempo and a mood. SignalGen writes the whole track, then opens it in Ableton Live arranged, mixed and mastered, with every note still yours to change.</p>
        <div className="ctas">
          <a href={cta.href} className="btn">{cta.label}</a>
          <a href="#listen" className="btn btn-quiet">Listen to what it makes</a>
        </div>
        <Starter />
      </section>

      <section className="wrap band split" id="why">
        <div>
          <h2>Eight bars was never the hard part.</h2>
          <p className="body">Most songstarters hand you a loop and leave you alone with the empty arrangement, the place where ideas go to die. SignalGen starts where they stop.</p>
        </div>
        <table className="vs">
          <thead><tr><th scope="col"><span className="sr">Aspect</span></th><th scope="col">A typical songstarter</th><th scope="col">SignalGen</th></tr></thead>
          <tbody>{VS.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="wrap band split" id="set">
        <div>
          <h2>Open it and everything is already there.</h2>
          <p className="body">A starter arrives as a full Live set named with its title, tempo, key and genre. Groups are folded, automation waits in closed lanes, and each instrument has its own MIDI file.</p>
          <p className="body">Keep it as it is, swap one sound, or rewrite the hook. Three versions come with it: Extended Mix, Radio Edit and Dub Mix.</p>
        </div>
        <div className="set glass" role="img" aria-label="Track list of a SignalGen set: drums, bass, music, vox and FX groups with 26 tracks">
          {SET.map((g) => (
            <div key={g.group} className={`grp grp-${g.group.toLowerCase()}`}>
              <div className="grp-name">{g.group}</div>
              <ul>{g.tracks.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap band" id="plugin">
        <h2>One window. Four choices.</h2>
        <div className="shots">
          <figure>
            <img src="/screens/start.webp" alt="SignalGen plugin, Start page: genre, key, BPM and mood menus, the New Starter button, the song as sections on a timeline and its parts listed below" width={1800} height={1280} loading="lazy" />
            <figcaption>Start. Four menus and one button. The song appears as sections on a timeline, with every part listed below it.</figcaption>
          </figure>
          <figure>
            <img src="/screens/parts.webp" alt="SignalGen plugin, Parts page: all parts of the song drawn as MIDI across intro, groove, breakdown, two drops and outro" width={1800} height={1280} loading="lazy" />
            <figcaption>Parts. Ask for another bass, lead or chords, always on the song’s chords, and hear it in the song before you keep it.</figcaption>
          </figure>
        </div>
      </section>

      <section className="wrap band" id="how">
        <h2>From nothing to a finished track.</h2>
        <ol className="steps">
          <li><b>Choose</b><p>Genre, key, tempo and mood. Or leave them on auto and let it surprise you.</p></li>
          <li><b>Generate</b><p>The engine writes the structure, the harmony and every part, picks sounds from Serum 2 and your library, and mixes as it goes.</p></li>
          <li><b>Open in Live</b><p>The set opens ready to play. Change anything: it is all MIDI, devices and automation, not a printed loop.</p></li>
          <li><b>Release</b><p>Export the mastered Extended Mix and Radio Edit, or take the parts into a track of your own.</p></li>
        </ol>
      </section>

      <section className="wrap band split" id="engine">
        <div>
          <h2>Taught by the records that fill the floor.</h2>
          <p className="body">SignalGen doesn’t guess what a genre sounds like. It measures chart-level reference tracks stem by stem and holds every starter to them.</p>
        </div>
        <dl className="engine">{ENGINE.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
      </section>

      <section className="wrap band reverse" id="reverse">
        <h2>Drop in a track. Get a new one with its DNA.</h2>
        <p className="body">Give SignalGen a reference: a WAV, an MP3, a sketch. It reads the tempo, the key, the form and the sound, then writes an original set from that DNA through the same engine. A start that already feels like the music you love, without copying it.</p>
      </section>

      <section className="wrap band" id="listen">
        <div className="split-head">
          <h2>Straight out of the engine.</h2>
          <p className="body">Four starters as SignalGen delivered them: 30 seconds of each mastered Extended Mix.</p>
        </div>
        <div className="demos">
          {DEMOS.map((d) => (
            <article key={d.slug} className="demo">
              <img src={`/demos/${d.slug}.jpg`} alt={`Cover of ${d.title}`} width={720} height={720} loading="lazy" />
              <h3>{d.title}</h3>
              <p className="meta">{d.genre}, {d.key}, {d.bpm} BPM. {d.length} extended, {d.radio} radio edit.</p>
              <Player src={`/demos/${d.slug}.m4a`} label={d.title} />
            </article>
          ))}
        </div>
        {fresh.length ? (
          <div className="fresh">
            <h3>New from the engine this week</h3>
            <ul>{fresh.map((t) => (
              <li key={t.id}>
                <Player src={t.preview!} label={t.title} />
                <span><b>{t.title}</b> {t.genre}, {t.key}, {t.bpm} BPM</span>
              </li>
            ))}</ul>
          </div>
        ) : null}
        <ul className="genres" aria-label="Genres">{GENRES.map((g) => <li key={g}>{g}</li>)}</ul>
      </section>

      <section className="wrap band" id="pricing">
        {open ? (
          <>
            <h2>Pay once. Keep it.</h2>
            <div className="plans plans-one">
              <div className="plan glass plan-main">
                <h3>Lifetime license</h3>
                <p className="price"><b>{brl(PRICE_BRL)}</b> once</p>
                <p>SignalGen, plus Refiner (the EQ that shows resonances) and Ear (tempo, key and chords of your mix). AU and VST3 for Ableton Live 12 on macOS. One key opens all three, on two of your computers, every update included.</p>
                <form action="/api/checkout" method="post" className="buy">
                  <button type="submit" className="btn">Buy SignalGen</button>
                </form>
                <p className="fine">Pix or card, through Stripe. Your key appears right after payment and arrives by email.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2>Founder access opens soon.</h2>
            <div className="plans">
              <div className="plan glass">
                <h3>Monthly</h3>
                <p className="price"><b>${PRICE.monthly}</b> a month</p>
                <p>Every starter you want, every update. Cancel any time.</p>
              </div>
              <div className="plan glass plan-main">
                <h3>Lifetime</h3>
                <p className="price"><b>${PRICE.lifetime}</b> once</p>
                <p>Pay once, keep it for good, updates included. About {months} months of the monthly plan.</p>
              </div>
            </div>
            <div className="access" id="access">
              <p className="body">Prices at launch. People on the list get in first, before the doors open to everyone.</p>
              <Signup />
            </div>
          </>
        )}
      </section>

      <section className="wrap band split" id="faq">
        <h2>Questions.</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="wrap end">
        <h2>Your next session won’t start empty.</h2>
        <a href={cta.href} className="btn">{cta.label}</a>
      </section>
    </main>
  );
}
