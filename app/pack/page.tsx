import PackUpload from './PackUpload';
import { PACK_PRICE_USD } from '@/lib/pack';

export const metadata = { title: 'SIGNALGEN PACK' };

export default function PackPage() {
  return (
    <main className="wrap">
      <section className="hero-plain">
        <h1>Any song in.<br /><em>Ableton pack</em> out.</h1>
        <p>Drop a track — yours, a Suno render, a bounce. SIGNALGEN reverse-engineers it inside the SignalGen engine: a playable drum kit from the real hits, chops and loops, the MIDI of every part, synth instruments matched to the sounds, and the whole thing rebuilt as a mastered Ableton Live set. No samples of the original survive and nothing from third-party libraries goes in: every sound is re-synthesized or isolated from your own track, and drums use Ableton’s Core Library — so there is no watermark to remove and nothing to license.</p>
        <div className="price"><b>${PACK_PRICE_USD}</b><small>per pack · delivered in about an hour · link stays on this site</small></div>
      </section>
      <PackUpload price={PACK_PRICE_USD} />
      <section className="specs" style={{ marginTop: 40 }}>
        <div><b>Drums</b><span>Kick, clap, hats, percussion as one-shots + a Drum Rack (.adg)</span></div>
        <div><b>Chops &amp; loops</b><span>Vocal and music chops on the beat, 4-bar loops of every stem</span></div>
        <div><b>MIDI</b><span>Bass, chords, lead, keys — every part transcribed</span></div>
        <div><b>Instruments</b><span>Serum / Maestro presets matched to each sound (.adv, .maestro)</span></div>
        <div><b>Ableton set</b><span>Extended Mix, Radio Edit and Dub Mix .als, mixed and mastered with native devices</span></div>
        <div><b>Masters</b><span>WAV 44.1 kHz / 24-bit, true peak −1 dBTP</span></div>
      </section>
    </main>
  );
}
