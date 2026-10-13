import Link from 'next/link';
import type { Metadata } from 'next';
import { readCatalog, priceOf, soonLabel } from '@/lib/catalog';
import { refinerPrice, country, sgPrice } from '@/lib/region';
import BuyButton from '@/components/BuyButton';
import { getLang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// REFINER on its own (13/10/2026, David): the 24-band EQ of the SignalGen family, R$ 49,90 / US$ 12,90, free inside every SignalGen
// license. The pitch is what Refiner itself does — no competitor is named, no "identical to" (publicidade comparativa só com fatos).
const TX = {
  pt: {
    title: 'Refiner · EQ de 24 bandas · SignalGen', desc: 'O EQ que mostra onde cortar. 24 bandas por clique, ressonâncias marcadas no espectro, sidechain, fase linear. R$ 49,90 vitalício.',
    eyebrow: 'Refiner · AU + VST3 · macOS', h1a: 'O EQ que mostra', h1b: 'onde cortar.', lede: '24 bandas por um clique. O SMART marca a fundamental e as oitavas em neon e as ressonâncias erradas em vermelho — você clica em cima e corta. Sidechain e Level desenhados como curva, fase Zero, Natural ou Linear, Stereo, Mid-Side e Mono. Instalador oficial, licença vitalícia.',
    buy: (p: string) => `Comprar o Refiner · ${p}`, orSg: 'Ou leve tudo no SignalGen', free: 'Já está incluso em toda licença do SignalGen.',
    trust: [['24', 'bandas, por clique simples'], ['3', 'modos de fase'], ['0', 'crack: instalador oficial, chave sua']],
    whatH: 'O que ele faz', whatP: 'Cada recurso abaixo está no plugin instalado hoje — nenhum é promessa.',
    what: [['SMART', 'Ressonâncias no espectro', 'Fundamental e oitavas em neon pulsante; ressonâncias erradas em vermelho→azul indicando onde cortar. Um clique cria a banda no lugar.'],
      ['SIDECHAIN', 'EQ dinâmico por banda', 'Cada banda pode reagir ao próprio canal, a uma entrada externa ou à Mix inteira. Attack, release, range e threshold automático.'],
      ['LEVEL', 'A curva como alvo', 'Desenhe a curva que quer ouvir; o Refiner ajusta o ganho de cada banda para chegar lá, com stiffness, tempo e memória.'],
      ['PHASE', 'Zero · Natural · Linear', 'Zero latência para tracking, Natural para mix, Linear (FIR) para master, em Stereo, Mid-Side ou Mono.'],
      ['LOCK', 'Harmonic Lock', 'Prende uma banda ao harmônico da nota que está tocando: o corte acompanha a melodia.'],
      ['MATCH', 'EQ por referência', 'Solte uma referência: o Refiner propõe até 16 bandas para aproximar o espectro, com o quanto você quiser ir.'],
      ['A/B', 'Delta e A/B cego', 'Ouça só o que mudou, e compare sem saber qual é qual.'],
      ['FINISH', 'Tube · Glue · Density', 'No Init: acabamento sutil de válvula, cola de console e densidade, para o canal ganhar corpo só de inserir.']],
    shotsH: 'Na tela', priceH: 'Preço', priceNote: 'Licença vitalícia, offline, em até dois computadores seus. Pagamento por Pix, cartão ou carteira; a chave sai na página seguinte.',
    faqH: 'Perguntas', faq: [['Funciona em qual DAW?', 'Ableton Live 12 (AU e VST3) no macOS 11 ou mais novo, Apple Silicon ou Intel. Qualquer host AU/VST3 abre o plugin; o fluxo é testado no Live. Windows está a caminho.'],
      ['Preciso do SignalGen?', 'Não. O Refiner é um plugin independente. Se você comprar o SignalGen, ele já vem dentro.'],
      ['E se eu já tiver o SignalGen?', 'A sua chave do SignalGen abre o Refiner. Não compre de novo.'],
      ['Posso testar?', 'Sim: sem chave o Refiner roda inteiro em DEMO — o som só silencia 2,5 s a cada minuto. A chave tira isso. E, pela lei brasileira, você pode desistir em 7 dias.']],
    trademark: 'Ableton e Live são marcas da Ableton AG. A SignalGen não é afiliada à Ableton.',
  },
  es: {
    title: 'Refiner · EQ de 24 bandas · SignalGen', desc: 'El EQ que muestra dónde cortar. 24 bandas por clic, resonancias marcadas, sidechain, fase lineal.',
    eyebrow: 'Refiner · AU + VST3 · macOS', h1a: 'El EQ que muestra', h1b: 'dónde cortar.', lede: '24 bandas con un clic. SMART marca la fundamental y las octavas en neón y las resonancias erróneas en rojo — haces clic y cortas. Sidechain y Level dibujados como curva, fase Zero, Natural o Lineal, Stereo, Mid-Side y Mono. Instalador oficial, licencia de por vida.',
    buy: (p: string) => `Comprar Refiner · ${p}`, orSg: 'O llévate todo con SignalGen', free: 'Ya viene incluido en cada licencia de SignalGen.',
    trust: [['24', 'bandas, con un clic'], ['3', 'modos de fase'], ['0', 'cracks: instalador oficial, clave tuya']],
    whatH: 'Qué hace', whatP: 'Cada función de abajo está en el plugin instalado hoy — ninguna es promesa.',
    what: [['SMART', 'Resonancias en el espectro', 'Fundamental y octavas en neón; resonancias erróneas en rojo→azul indicando dónde cortar. Un clic crea la banda en el lugar.'],
      ['SIDECHAIN', 'EQ dinámico por banda', 'Cada banda reacciona a su canal, a una entrada externa o a toda la Mix.'],
      ['LEVEL', 'La curva como objetivo', 'Dibuja la curva que quieres oír; Refiner ajusta cada banda para llegar ahí.'],
      ['PHASE', 'Zero · Natural · Lineal', 'En Stereo, Mid-Side o Mono.'], ['LOCK', 'Harmonic Lock', 'Fija una banda al armónico de la nota que suena.'],
      ['MATCH', 'EQ por referencia', 'Suelta una referencia: hasta 16 bandas para acercar el espectro.'], ['A/B', 'Delta y A/B ciego', 'Oye solo lo que cambió y compara a ciegas.'],
      ['FINISH', 'Tube · Glue · Density', 'Acabado sutil de válvula, cola y densidad en el Init.']],
    shotsH: 'En pantalla', priceH: 'Precio', priceNote: 'Licencia de por vida, offline, en hasta dos computadoras tuyas. La clave sale en la página siguiente.',
    faqH: 'Preguntas', faq: [['¿En qué DAW funciona?', 'Ableton Live 12 (AU y VST3) en macOS 11+. Cualquier host AU/VST3 lo abre. Windows está en camino.'], ['¿Necesito SignalGen?', 'No. Refiner es independiente. Si compras SignalGen, ya viene dentro.'], ['¿Ya tengo SignalGen?', 'Tu clave de SignalGen abre Refiner. No lo compres de nuevo.'], ['¿Puedo probar?', 'Sí: sin clave Refiner corre completo en DEMO — el sonido solo se silencia 2,5 s por minuto. La clave lo quita. Y puedes desistir en 7 días.']],
    trademark: 'Ableton y Live son marcas de Ableton AG. SignalGen no está afiliada a Ableton.',
  },
  en: {
    title: 'Refiner · 24-band EQ · SignalGen', desc: 'The EQ that shows you where to cut. 24 bands by click, resonances marked on the spectrum, sidechain, linear phase.',
    eyebrow: 'Refiner · AU + VST3 · macOS', h1a: 'The EQ that shows you', h1b: 'where to cut.', lede: '24 bands, one click each. SMART marks the fundamental and its octaves in neon and the wrong resonances in red — click on one and cut. Sidechain and Level drawn as curves, Zero, Natural or Linear phase, Stereo, Mid-Side and Mono. Official installer, lifetime license.',
    buy: (p: string) => `Buy Refiner · ${p}`, orSg: 'Or take everything with SignalGen', free: 'Already included in every SignalGen license.',
    trust: [['24', 'bands, one click each'], ['3', 'phase modes'], ['0', 'cracks: official installer, your own key']],
    whatH: 'What it does', whatP: 'Every feature below is in the plugin installed today — none is a promise.',
    what: [['SMART', 'Resonances on the spectrum', 'Fundamental and octaves in pulsing neon; wrong resonances in red→blue showing where to cut. One click places the band.'],
      ['SIDECHAIN', 'Dynamic EQ per band', 'Each band reacts to its own channel, an external input or the whole Mix. Attack, release, range, auto threshold.'],
      ['LEVEL', 'The curve as a target', 'Draw the curve you want to hear; Refiner moves each band’s gain to get there, with stiffness, time and memory.'],
      ['PHASE', 'Zero · Natural · Linear', 'Zero latency for tracking, Natural for mixing, Linear (FIR) for mastering — Stereo, Mid-Side or Mono.'],
      ['LOCK', 'Harmonic Lock', 'Pins a band to a harmonic of the note playing: the cut follows the melody.'],
      ['MATCH', 'EQ toward a reference', 'Drop a reference: Refiner proposes up to 16 bands to approach its spectrum, as far as you want to go.'],
      ['A/B', 'Delta and blind A/B', 'Hear only what changed, and compare without knowing which is which.'],
      ['FINISH', 'Tube · Glue · Density', 'On Init: a subtle valve, console glue and density finish, so the channel gains body just by inserting it.']],
    shotsH: 'On screen', priceH: 'Price', priceNote: 'Lifetime license, offline, on up to two of your computers. The key is issued on the next page.',
    faqH: 'Questions', faq: [['Which DAW?', 'Ableton Live 12 (AU and VST3) on macOS 11+, Apple Silicon or Intel. Any AU/VST3 host opens it; the workflow is tested in Live. Windows is on the way.'], ['Do I need SignalGen?', 'No. Refiner stands alone. If you buy SignalGen, it is already inside.'], ['I already own SignalGen', 'Your SignalGen key opens Refiner. Don’t buy twice.'], ['Can I try it?', 'Yes: without a key Refiner runs in full as a DEMO — the sound only drops out for 2.5 s every minute. The key removes that. And you can walk away within 7 days.']],
    trademark: 'Ableton and Live are trademarks of Ableton AG. SignalGen is not affiliated with Ableton.',
  },
};
const SHOTS = ['refiner_01', 'refiner_02', 'refiner_03'];

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const X = TX[getLang(searchParams) as keyof typeof TX] || TX.pt;
  return { title: X.title, description: X.desc };
}

export default async function RefinerPage({ searchParams }: { searchParams: { lang?: string } }) {
  const X = TX[getLang(searchParams) as keyof typeof TX] || TX.pt;
  const cat = await readCatalog();
  const it = cat.tracks.find((x) => x.id === 'refiner');
  const cc = country();
  const [rp, sgp] = await Promise.all([refinerPrice(cc), sgPrice('founder', cc)]);
  const SOON = soonLabel(getLang(searchParams));                       // 13/10/2026: o SignalGen esta em breve
  const buy = it ? <BuyButton id={it.id} price={priceOf(it)} label={X.buy(rp.display)} /> : null;
  return (
    <main className="wrap">
      <section className="phero" aria-label="Refiner">
        <div className="phero-copy">
          <span className="eyebrow">{X.eyebrow}</span>
          <h1>{X.h1a} <em className="muted">{X.h1b}</em></h1>
          <p className="lede">{X.lede}</p>
          <div className="act">{buy}<Link href="/signalgen" className="btn quiet">{X.orSg} · {SOON}</Link></div>
          <ul className="trust">{X.trust.map(([b, s]) => <li key={b + s}><b>{b}</b>{s}</li>)}</ul>
        </div>
        <figure className="phero-shot monet-shot"><img src="/product/ui2/refiner_01.png" alt="Refiner" /></figure>
      </section>
      <section className="block" id="inside">
        <header><h2>{X.whatH}</h2><p>{X.whatP}</p></header>
        <div className="g-get monet-what">{X.what.map(([tag, h, p]) => <div key={tag}><span className="eyebrow">{tag}</span><b>{h}</b><p>{p}</p></div>)}</div>
      </section>
      <section className="block" id="screens">
        <header><h2>{X.shotsH}</h2><p /></header>
        <div className="monet-shots">{SHOTS.map((s) => <img key={s} src={`/product/ui2/${s}.png`} alt="Refiner" loading="lazy" />)}</div>
      </section>
      <section className="block" id="price">
        <header><h2>{X.priceH}</h2><p>{X.priceNote}</p></header>
        <div className="monet-price">
          <div data-row={0}><span>Refiner</span><b>{rp.display}</b></div>
          <div data-row={1}><span>SignalGen (Refiner + Monet + Tempo)</span><b>{SOON}</b></div>
          <div className="act">{buy}</div>
          <p className="muted small">{X.free}</p>
        </div>
      </section>
      <section className="block" id="faq">
        <div className="split">
          <div><h2 style={{ marginBottom: 'var(--s3)' }}>{X.faqH}</h2>{X.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
          <div className="g-cta"><p><b>{X.orSg}</b></p><Link href="/signalgen" className="btn" style={{ width: '100%' }}>SignalGen · {SOON}</Link></div>
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s4)' }}>{X.trademark}</p>
      </section>
    </main>
  );
}
