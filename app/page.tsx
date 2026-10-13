import Link from 'next/link';
import { readCatalog, forSale, soonLabel } from '@/lib/catalog';
import { getLang } from '@/lib/i18n';
import type { Track } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import { country, priceFor, refinerPrice, monetPrice } from '@/lib/region';
import { GHOST_LABEL } from '@/lib/ghost';

export const dynamic = 'force-dynamic';

// 13/10/2026 (David): "a homepage tem que ser o marketplace de vocais e plugins". Only what is for sale is in the window (lib/catalog
// FOR_SALE): the plugins (Refiner, Monet, the free Tempo; the SignalGen as "coming soon") and the packs (Low Glide, Signal Voices).
// Screenshots keep their natural proportion — nothing cropped.
const TX = {
  pt: {
    eyebrow: 'SignalGen · marketplace', h1a: 'Plugins e vocais', h1b: 'para quem produz.',
    lede: 'EQ, synth e leitura de BPM e tom para Ableton Live, e packs de vocais e de Serum 2 feitos em casa. Instalador oficial, licença vitalícia, download na hora.',
    toPlugins: 'Ver plugins', toPacks: 'Ver packs',
    plugH: 'Plugins', plugP: 'AU + VST3 para macOS (Apple Silicon e Intel). Sem chave, cada um roda em demo para você testar antes.',
    free: 'Grátis', see: 'Ver', soonP: 'O gerador de faixas inteiras para o Live. Refiner, Monet e Tempo inclusos.',
    refP: 'O EQ que mostra onde cortar: 24 bandas, ressonâncias marcadas no espectro, sidechain e fase linear.',
    monetP: 'O sintetizador wavetable da SignalGen: 3 osciladores, filtros analógicos, matriz de modulação e 200+ presets.',
    tempoP: 'BPM, tom e acordes de qualquer coisa tocando, em 10 segundos. Grátis em troca do seu e-mail.',
    packH: 'Packs', packP: 'Vocais e sons de Serum 2 originais, para tech house e a música em volta. Royalty-free, tom e BPM no nome de cada arquivo.',
    buy: 'Comprar', demo: 'Demo',
    licH: 'Uma licença. Linguagem simples.', licP: 'O texto completo está na', licLink: 'página da licença', licP2: '.',
    lic: [['Use onde quiser', 'Lançamentos, remixes, sync, streams, trabalho para cliente. Sem royalties, sem crédito obrigatório.'], ['Continua seu', 'A única coisa que não pode: revender ou compartilhar os sons, presets ou instaladores em si.'], ['Na hora', 'Pague com Pix ou cartão; a chave e os downloads aparecem na página seguinte e no recibo por e-mail.']],
    ghostLine: 'Precisa de uma faixa pronta?', ghostSub: `Ghost production sob encomenda, feita do zero para o seu nome: ${GHOST_LABEL}.`, ghostCta: 'Ghost production',
  },
  es: {
    eyebrow: 'SignalGen · marketplace', h1a: 'Plugins y voces', h1b: 'para quien produce.',
    lede: 'EQ, synth y lectura de BPM y tono para Ableton Live, y packs de voces y de Serum 2 hechos en casa. Instalador oficial, licencia de por vida, descarga al instante.',
    toPlugins: 'Ver plugins', toPacks: 'Ver packs',
    plugH: 'Plugins', plugP: 'AU + VST3 para macOS (Apple Silicon e Intel). Sin clave, cada uno corre en demo para que lo pruebes antes.',
    free: 'Gratis', see: 'Ver', soonP: 'El generador de temas completos para Live. Refiner, Monet y Tempo incluidos.',
    refP: 'El EQ que muestra dónde cortar: 24 bandas, resonancias marcadas en el espectro, sidechain y fase lineal.',
    monetP: 'El sintetizador wavetable de SignalGen: 3 osciladores, filtros analógicos, matriz de modulación y 200+ presets.',
    tempoP: 'BPM, tono y acordes de lo que esté sonando, en 10 segundos. Gratis a cambio de tu e-mail.',
    packH: 'Packs', packP: 'Voces y sonidos de Serum 2 originales, para tech house y la música alrededor. Royalty-free, tono y BPM en cada nombre.',
    buy: 'Comprar', demo: 'Demo',
    licH: 'Una licencia. Lenguaje simple.', licP: 'El texto completo está en la', licLink: 'página de la licencia', licP2: '.',
    lic: [['Úsalo donde quieras', 'Lanzamientos, remixes, sync, streams, trabajo para clientes. Sin royalties, sin crédito obligatorio.'], ['Sigue siendo tuyo', 'Lo único que no puedes: revender o compartir los sonidos, presets o instaladores en sí.'], ['Al instante', 'Paga con tarjeta; la clave y las descargas aparecen en la página siguiente y en el recibo por e-mail.']],
    ghostLine: '¿Necesitas un tema listo?', ghostSub: `Ghost production por encargo, hecho desde cero para tu nombre: ${GHOST_LABEL}.`, ghostCta: 'Ghost production',
  },
  en: {
    eyebrow: 'SignalGen · marketplace', h1a: 'Plugins and vocals', h1b: 'for people who make music.',
    lede: 'An EQ, a synth and a BPM and key reader for Ableton Live, plus vocal and Serum 2 packs made in-house. Official installers, lifetime licenses, instant download.',
    toPlugins: 'See plugins', toPacks: 'See packs',
    plugH: 'Plugins', plugP: 'AU + VST3 for macOS (Apple Silicon and Intel). Without a key, each one runs as a demo so you can try it first.',
    free: 'Free', see: 'See', soonP: 'The whole-track generator for Live. Refiner, Monet and Tempo inside.',
    refP: 'The EQ that shows you where to cut: 24 bands, resonances marked on the spectrum, sidechain and linear phase.',
    monetP: 'The SignalGen wavetable synth: 3 oscillators, analog circuit filters, a modulation matrix and 200+ presets.',
    tempoP: 'BPM, key and chords of whatever is playing, in 10 seconds. Free, for your e-mail.',
    packH: 'Packs', packP: 'Original vocals and Serum 2 sounds for tech house and the music around it. Royalty-free, key and tempo in every file name.',
    buy: 'Buy', demo: 'Demo',
    licH: 'One license. Plain language.', licP: 'The full text is on the', licLink: 'license page', licP2: '.',
    lic: [['Use it anywhere', 'Releases, remixes, sync, streams, client work. No royalties, no credit required.'], ['Keep it yours', 'The only thing you can’t do is resell or share the sounds, presets or installers themselves.'], ['Instant', 'Pay by card; the key and the downloads are on the next page and on the e-mailed receipt.']],
    ghostLine: 'Need a finished track?', ghostSub: `On-demand ghost production, made from scratch for your name: ${GHOST_LABEL}.`, ghostCta: 'Ghost production',
  },
};

export default async function Home() {
  const lang = getLang();
  const X = TX[lang as keyof typeof TX] || TX.pt;
  const SOON = soonLabel(lang);
  const cat = await readCatalog();
  const cc = country();
  const by = (id: string) => cat.tracks.find((t) => t.id === id);
  const [rp, mp] = await Promise.all([refinerPrice(cc), monetPrice(cc)]);
  const plugins = [
    { id: 'refiner', name: 'Refiner', tag: 'EQ · 24 bands', img: '/product/ui2/refiner_01.png', href: '/refiner', p: X.refP, price: forSale(by('refiner')) ? rp.display : SOON },
    { id: 'monet', name: 'Monet', tag: 'Synth · wavetable', img: '/product/ui2/monet_01_synth.jpg', href: '/monet', p: X.monetP, price: forSale(by('monet')) ? mp.display : SOON },
    { id: 'tempo', name: 'Tempo', tag: 'BPM · key · chords', img: '/product/ui2/tempo_01.png', href: '/tempo', p: X.tempoP, price: X.free },
    { id: 'signalgen', name: 'SignalGen', tag: 'Track generator', img: '/product/ui2/sg_05_generate_pronto.jpg', href: '/signalgen', p: X.soonP, price: SOON, soon: true },
  ];
  const packs = cat.tracks.filter((t: Track) => (t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle') && forSale(t))
    .sort((a, b) => (a.vol || 0) - (b.vol || 0));
  const packTiles = await Promise.all(packs.map(async (t) => ({ t, price: (await priceFor(t, cc)).display })));
  const queue = packs.filter((t) => t.preview).map((t) => ({ ...toP(t), sub: t.packType || 'Pack', cta: X.buy }));

  return (
    <main className="wrap">
      <section className="mhero">
        <span className="eyebrow">{X.eyebrow}</span>
        <h1>{X.h1a} <em className="muted">{X.h1b}</em></h1>
        <p className="lede">{X.lede}</p>
        <div className="act">
          <Link href="#plugins" className="btn">{X.toPlugins}</Link>
          <Link href="#packs" className="btn quiet">{X.toPacks}</Link>
        </div>
      </section>

      <section className="block" id="plugins">
        <header><h2>{X.plugH}</h2><p>{X.plugP}</p></header>
        <div className="market">
          {plugins.map((x) => (
            <Link key={x.id} href={x.href} className={`mcard${x.soon ? ' soon' : ''}`}>
              <div className="shot"><img src={x.img} alt={x.name} loading="lazy" /></div>
              <div className="mm">
                <span className="eyebrow">{x.tag}</span>
                <div className="mt"><b>{x.name}</b><span className={x.soon ? 'pr soon' : 'pr'}>{x.price}</span></div>
                <p className="muted">{x.p}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="block" id="packs">
        <header><h2>{X.packH}</h2><p>{X.packP}</p></header>
        <div className="vitrine packs2">
          {packTiles.map(({ t, price }) => {
            const pt = { ...toP(t), sub: t.packType || 'Pack', cta: X.buy };
            return (
              <article key={t.id} className="tile">
                <Link href={`/p/${t.id}`} className="vc" aria-label={t.title}>
                  {t.cover ? <img src={t.cover} alt="" loading="lazy" /> : <div className="gen"><b>{t.title}</b></div>}
                  {t.preview ? <span className="pb"><PlayButton t={pt} queue={queue} /></span> : null}
                </Link>
                <div className="vm">
                  <span className="e">{t.packType}</span>
                  <Link href={`/p/${t.id}`} className="t">{t.title}</Link>
                  <span className="s">{t.contents || t.subtitle}</span>
                  <div className="r"><span className="usd">{price}</span><Link href={`/p/${t.id}`} className="btn small quiet">{X.buy}</Link></div>
                </div>
              </article>
            );
          })}
        </div>
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
