import Link from 'next/link';
import { readCatalog, founderLeft, FOUNDER_SEATS } from '@/lib/catalog';
import { getLang } from '@/lib/i18n';
import type { Track } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import { country, priceFor, sgPrice, refinerPrice, monetPrice } from '@/lib/region';
import Storefront, { type Tile } from './Storefront';

export const dynamic = 'force-dynamic';

// 13/10/2026 (David, plano de lançamento): one shop, one price ladder, three products in the window — the SignalGen founder license
// (Refiner + Monet + Tempo inside) on top, Refiner and the free Tempo as the doors, the packs as the organic floor. Prices in the
// visitor's currency (lib/region): BRL in Brazil, where Pix shows up by itself at checkout.
const TX = {
  pt: {
    eyebrow: 'SignalGen · licença de fundador', h1: 'Uma faixa inteira. Um clique.', lede: 'O gerador de música para Ableton Live 12: escolha gênero, tom e BPM e saia com um set completo — bateria, baixo, música, voz e FX em MIDI e áudio, já mixado. Com o Refiner, o Monet e o Tempo inclusos.',
    cta: 'Conhecer o SignalGen', ctaPrice: (p: string) => `Fundador · ${p} vitalício`, left: (n: number) => `${n} de ${FOUNDER_SEATS} licenças de fundador`, after: (p: string) => `depois ${p}`, packs: 'Ver os packs',
    ladderH: 'A escada', l0: 'Grátis', l0s: 'Tempo · BPM e tom em 10 s', l1s: 'Sample packs e presets Serum 2', l2s: 'Refiner · EQ de 24 bandas', l3s: 'SignalGen fundador · tudo incluso', l4: 'Sob encomenda', l4s: 'Ghost production · US$ 150',
    softEyebrow: 'Software', refH: 'Refiner', refP: 'O EQ que mostra onde cortar: 24 bandas, ressonâncias marcadas no espectro, modo sidechain e fase linear. Alternativa ao preço de um café para o EQ que você está pensando.', refCta: 'Conhecer o Refiner',
    tempoH: 'Tempo', tempoP: 'BPM, tom e acordes de qualquer coisa que estiver tocando, em 10 segundos. Grátis em troca do seu e-mail.', tempoCta: 'Baixar grátis',
    monetH: 'Monet', monetP: 'O sintetizador wavetable da SignalGen, com filtros analógicos e 200+ presets. Instalador oficial, sem crack, sem vírus.', monetCta: 'Conhecer o Monet',
    storeH: 'Sons que ninguém mais tem.', storeP: 'Sample packs e presets Serum 2 sintetizados em casa, para tech house e a música em volta. Tom e BPM no nome de cada arquivo, MIDI com cada loop, royalty-free.',
    ghostLine: 'Precisa de uma faixa pronta?', ghostSub: 'Ghost production sob encomenda: feita do zero para o seu nome, US$ 150.', ghostCta: 'Ghost production',
    stdH: 'Do jeito que produtor espera que um pack seja.', std: [['Demo de cada pack', 'Feita só com os sons do próprio pack — o que você ouve é o que leva.'], ['Tom e BPM no nome', '“Bass 04 · G#m · 128 BPM”. Ordene por tom no browser e pronto.'], ['MIDI com cada loop', 'Mude as notas, mantenha o som. Cada loop também vem como one shot do mesmo timbre.'], ['48 kHz / 24-bit WAV', 'Nivelado no pack inteiro, loops cortados no compasso exato.'], ['Edições Serum 2', 'Os presets exatos que tocam os loops, com previews e MIDI.'], ['100 % original', 'Sintetizado pela SignalGen. Sem samples de terceiros, sem presets de fábrica, nada para liberar.']],
    licH: 'Uma licença. Linguagem simples.', licP: 'O texto completo está na', licLink: 'página da licença', licP2: '; toda compra vem com certificado no seu nome.',
    lic: [['Use onde quiser', 'Lançamentos, remixes, sync, streams, trabalho para cliente. Sem royalties, sem crédito obrigatório.'], ['Continua seu', 'A única coisa que não pode: revender ou compartilhar os sons e presets em si, sozinhos ou dentro de outro pack.'], ['Baixe na hora', 'Pague com Pix, cartão ou carteira; os arquivos estão na página seguinte e os links valem 7 dias.']],
  },
  es: {
    eyebrow: 'SignalGen · licencia de fundador', h1: 'Un tema entero. Un clic.', lede: 'El generador de música para Ableton Live 12: elige género, tono y BPM y sal con un set completo — batería, bajo, música, voz y FX en MIDI y audio, ya mezclado. Con Refiner, Monet y Tempo incluidos.',
    cta: 'Conocer SignalGen', ctaPrice: (p: string) => `Fundador · ${p} de por vida`, left: (n: number) => `${n} de ${FOUNDER_SEATS} licencias de fundador`, after: (p: string) => `después ${p}`, packs: 'Ver los packs',
    ladderH: 'La escalera', l0: 'Gratis', l0s: 'Tempo · BPM y tono en 10 s', l1s: 'Sample packs y presets Serum 2', l2s: 'Refiner · EQ de 24 bandas', l3s: 'SignalGen fundador · todo incluido', l4: 'Por encargo', l4s: 'Ghost production · US$ 150',
    softEyebrow: 'Software', refH: 'Refiner', refP: 'El EQ que muestra dónde cortar: 24 bandas, resonancias marcadas en el espectro, modo sidechain y fase lineal.', refCta: 'Conocer Refiner',
    tempoH: 'Tempo', tempoP: 'BPM, tono y acordes de lo que esté sonando, en 10 segundos. Gratis a cambio de tu e-mail.', tempoCta: 'Descargar gratis',
    monetH: 'Monet', monetP: 'El sintetizador wavetable de SignalGen, con filtros analógicos y 200+ presets. Instalador oficial, sin crack, sin virus.', monetCta: 'Conocer Monet',
    storeH: 'Sonidos que nadie más tiene.', storeP: 'Sample packs y presets Serum 2 sintetizados en casa, para tech house y la música alrededor. Tono y BPM en cada nombre, MIDI con cada loop, royalty-free.',
    ghostLine: '¿Necesitas un tema listo?', ghostSub: 'Ghost production por encargo: hecho desde cero para tu nombre, US$ 150.', ghostCta: 'Ghost production',
    stdH: 'Como un productor espera que sea un pack.', std: [['Demo de cada pack', 'Hecha solo con los sonidos del pack — lo que oyes es lo que te llevas.'], ['Tono y BPM en el nombre', '“Bass 04 · G#m · 128 BPM”. Ordena por tono y listo.'], ['MIDI con cada loop', 'Cambia las notas, conserva el sonido. Cada loop viene también como one shot.'], ['48 kHz / 24-bit WAV', 'Nivelado en todo el pack, loops cortados al compás exacto.'], ['Ediciones Serum 2', 'Los presets exactos que tocan los loops, con previews y MIDI.'], ['100 % original', 'Sintetizado por SignalGen. Sin samples de terceros, nada que liberar.']],
    licH: 'Una licencia. Lenguaje simple.', licP: 'El texto completo está en la', licLink: 'página de la licencia', licP2: '; cada compra trae un certificado a tu nombre.',
    lic: [['Úsalo donde quieras', 'Lanzamientos, remixes, sync, streams, trabajo para clientes. Sin royalties, sin crédito obligatorio.'], ['Sigue siendo tuyo', 'Lo único que no puedes: revender o compartir los sonidos y presets en sí.'], ['Descarga al instante', 'Paga con tarjeta o wallet; los archivos están en la página siguiente y los enlaces valen 7 días.']],
  },
  en: {
    eyebrow: 'SignalGen · founder license', h1: 'A whole track. One click.', lede: 'The music generator for Ableton Live 12: pick a genre, a key and a tempo and leave with a full set — drums, bass, music, vocals and FX as MIDI and audio, already mixed. Refiner, Monet and Tempo included.',
    cta: 'Meet SignalGen', ctaPrice: (p: string) => `Founder · ${p} lifetime`, left: (n: number) => `${n} of ${FOUNDER_SEATS} founder licenses`, after: (p: string) => `then ${p}`, packs: 'Browse the packs',
    ladderH: 'The ladder', l0: 'Free', l0s: 'Tempo · BPM and key in 10 s', l1s: 'Sample packs and Serum 2 presets', l2s: 'Refiner · 24-band EQ', l3s: 'SignalGen founder · everything inside', l4: 'On demand', l4s: 'Ghost production · US$ 150',
    softEyebrow: 'Software', refH: 'Refiner', refP: 'The EQ that shows you where to cut: 24 bands, resonances marked on the spectrum, sidechain mode and linear phase.', refCta: 'Meet Refiner',
    tempoH: 'Tempo', tempoP: 'BPM, key and chords of whatever is playing, in 10 seconds. Free, for your e-mail.', tempoCta: 'Download free',
    monetH: 'Monet', monetP: 'The SignalGen wavetable synthesizer, with analog circuit filters and 200+ presets. Official installer, no cracks, no malware.', monetCta: 'Meet Monet',
    storeH: 'Sounds nobody else has.', storeP: 'Sample packs and Serum 2 presets synthesized in-house, for tech house and the music around it. Key and tempo in every file name, MIDI with every loop, royalty-free.',
    ghostLine: 'Need a finished track?', ghostSub: 'On-demand ghost production: made from scratch for your name, US$ 150.', ghostCta: 'Ghost production',
    stdH: 'Built the way producers expect a pack to be.', std: [['Demo track', 'Made only from the pack’s own sounds — what you hear is what you get.'], ['Key and tempo in the name', '“Bass 04 · G#m · 128 BPM”. Sort by key in your browser and it is all there.'], ['MIDI with every loop', 'Change the notes, keep the sound. Each loop also ships as a one shot of the same patch.'], ['48 kHz / 24-bit WAV', 'Levelled across the pack, loops cut to exact bars.'], ['Serum 2 editions', 'The exact patches that play the loops, with previews and MIDI.'], ['100 % original', 'Synthesized by SignalGen. No third-party samples, no factory presets, nothing to clear.']],
    licH: 'One license. Plain language.', licP: 'The full text is on the', licLink: 'license page', licP2: '; every purchase comes with a certificate in your name.',
    lic: [['Use it anywhere', 'Releases, remixes, sync, streams, client work. No royalties, no credit required.'], ['Keep it yours', 'The only thing you can’t do is resell or share the sounds or presets themselves.'], ['Download at once', 'Pay with card or wallet; the files are on the next page, and the links stay valid for 7 days.']],
  },
};

export default async function Home() {
  const cat = await readCatalog();
  const cc = country();
  const X = TX[getLang() as keyof typeof TX] || TX.pt;
  const sg = cat.tracks.find((t) => t.id === 'signalgen');
  const sounds = cat.tracks.filter((t) => t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle');
  const byGroup = (g?: string) => sounds.filter((t) => t.group === g);
  const kits = sounds.filter((t) => t.kind === 'kit').sort((a, b) => (b.vol || 0) - (a.vol || 0));
  const featured = kits.find((t) => t.packType === 'Full Pack') || kits[0];
  const [fp, lp, rp, mp] = await Promise.all([sgPrice('founder', cc), sgPrice('lifetime', cc), refinerPrice(cc), monetPrice(cc)]);
  const left = founderLeft(sg);
  const sgNow = left > 0 ? fp : lp;
  const packPrice = sounds.length ? (await priceFor(sounds[0], cc)).display : '';

  const tiles: Tile[] = await Promise.all([...kits, ...sounds.filter((t) => t.kind === 'preset').sort((a, b) => (b.vol || 0) - (a.vol || 0))].map(async (t: Track): Promise<Tile> => {
    const serum = byGroup(t.group).find((x) => x.kind === 'preset');
    return {
      ...toP(t), kind: t.kind || 'kit', published: t.published, href: `/p/${t.id}`, genre: t.genre, priceDisplay: (await priceFor(t, cc)).display,
      sub: `Vol. ${String(t.vol || '').padStart(2, '0')} · ${t.packType}`, cta: 'Get the pack',
      subtitle: [t.packType, t.bpm ? `${t.bpm} BPM` : '', t.genre].filter(Boolean).join(' · '),
      eyebrow: `Vol. ${String(t.vol).padStart(2, '0')}`, badge: t === featured ? 'New' : undefined,
      extra: t.kind === 'kit' && serum ? '+ Serum 2' : undefined,
    };
  }));
  const nWav = kits.reduce((a, t) => a + (t.counts?.wav || 0), 0);
  const nPre = sounds.filter((t) => t.kind === 'preset').reduce((a, t) => a + (t.counts?.presets || 0), 0);

  return (
    <main className="wrap">
      <section className="shero">
        <div className="sh-copy">
          <span className="eyebrow">{X.eyebrow}</span>
          <h1>{X.h1}</h1>
          <p className="lede">{X.lede}</p>
          <div className="act">
            <Link href="/signalgen" className="btn">{X.ctaPrice(sgNow.display)}</Link>
            <Link href="#store" className="btn quiet">{X.packs}</Link>
          </div>
          {sg && left > 0 ? <div className="founder-left"><span style={{ width: `${(left / FOUNDER_SEATS) * 100}%` }} />{X.left(left)} · {X.after(lp.display)}</div> : null}
        </div>
        <Link href="/signalgen" className="feature" aria-label="SignalGen">
          <div className="fc"><img src="/product/ui2/sg_05_generate_pronto.jpg" alt="" /></div>
          <div className="fm">
            <div><span className="eyebrow">{X.softEyebrow}</span><b>SignalGen</b><span className="muted small">Refiner · Monet · Tempo</span></div>
            <div className="fp"><b>{sgNow.display}</b></div>
          </div>
        </Link>
      </section>

      <section className="block" id="ladder">
        <div className="ladder" aria-label={X.ladderH}>
          <div><b>{X.l0}</b><span>{X.l0s}</span></div>
          <div><b>{packPrice}</b><span>{X.l1s}</span></div>
          <div><b>{rp.display}</b><span>{X.l2s}</span></div>
          <div><b>{sgNow.display}</b><span>{X.l3s}</span></div>
          <div><b>{X.l4}</b><span>{X.l4s}</span></div>
        </div>
      </section>

      <section className="block" id="software">
        <div className="soft-three">
          <Link href="/refiner" className="soft">
            <img src="/product/ui2/refiner_01.png" alt="Refiner" loading="lazy" />
            <div><span className="eyebrow">{X.softEyebrow}</span><h3>{X.refH}</h3><span className="pr">{rp.display}</span><p className="muted">{X.refP}</p><span className="btn small">{X.refCta}</span></div>
          </Link>
          <Link href="/tempo" className="soft">
            <img src="/product/ui2/tempo_01.png" alt="Tempo" loading="lazy" />
            <div><span className="eyebrow">{X.softEyebrow}</span><h3>{X.tempoH}</h3><span className="pr">{X.l0}</span><p className="muted">{X.tempoP}</p><span className="btn small">{X.tempoCta}</span></div>
          </Link>
          <Link href="/monet" className="soft">
            <img src="/product/ui2/monet_01_synth.jpg" alt="Monet" loading="lazy" />
            <div><span className="eyebrow">{X.softEyebrow}</span><h3>{X.monetH}</h3><span className="pr">{mp.display}</span><p className="muted">{X.monetP}</p><span className="btn small quiet">{X.monetCta}</span></div>
          </Link>
        </div>
      </section>

      <section className="block" id="store" style={{ paddingTop: 'var(--s5)' }}>
        <header><h2>{X.storeH}</h2><p>{X.storeP}</p></header>
        <ul className="facts" style={{ marginBottom: 'var(--s4)' }}>
          <li><b>{kits.length}</b>sample packs</li>
          <li><b>{nWav}</b>sounds</li>
          <li><b>{nPre}</b>Serum 2 presets</li>
          {featured ? <li><PlayButton t={{ ...toP(featured), sub: `Demo · ${featured.packType}`, cta: 'Get the pack' }} /></li> : null}
        </ul>
        <Storefront tiles={tiles} />
      </section>

      <section className="block" id="standard">
        <header><h2>{X.stdH}</h2></header>
        <ul className="std">{X.std.map(([b, s]) => <li key={b}><b>{b}</b><span>{s}</span></li>)}</ul>
      </section>

      <section className="block" id="license">
        <header><h2>{X.licH}</h2><p>{X.licP} <Link href="/license" style={{ textDecoration: 'underline' }}>{X.licLink}</Link>{X.licP2}</p></header>
        <div className="three">{X.lic.map(([h, p]) => <div key={h}><h3>{h}</h3><p>{p}</p></div>)}</div>
      </section>

      <section className="block">
        <div className="ghostline">
          <p><b>{X.ghostLine}</b> <span className="muted">{X.ghostSub}</span></p>
          <Link href="/ghost" className="btn small quiet">{X.ghostCta}</Link>
        </div>
      </section>
    </main>
  );
}
