import type { Metadata } from 'next';
import { readCatalog, forSale } from '@/lib/catalog';
import { refinerPrice, country } from '@/lib/region';
import { offerOf } from '@/lib/launch';
import BuyButton from '@/components/BuyButton';
import Offer from '@/components/Offer';
import { getLang } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';

export const dynamic = 'force-dynamic';

// REFINER (13/10/2026, David): the 24-band EQ, R$ 49 for the first 10 buyers, R$ 99 after (lib/launch counts the real sales).
// A plugin on its own: no demo mode sold as a trial, no bundle. No competitor is named.
const TX = {
  pt: {
    title: 'Refiner · EQ de 24 bandas · SignalGen', desc: 'O EQ que mostra onde cortar. 24 bandas por clique, ressonâncias marcadas no espectro, sidechain, fase linear. Qualidade que compete com plugins extremamente caros.',
    eyebrow: 'Refiner · Windows + macOS · VST3 / AU', h1a: 'O EQ que mostra', h1b: 'onde cortar.', lede: '24 bandas por um clique. O SMART marca a fundamental e as oitavas em neon e as ressonâncias erradas em vermelho — você clica em cima e corta. Sidechain e Level desenhados como curva, fase Zero, Natural ou Linear, Stereo, Mid-Side e Mono.', claim: 'Qualidade que compete com plugins extremamente caros.',
    buy: (p: string) => `Comprar o Refiner · ${p}`, rowLaunch: 'Lançamento · 10 primeiros', rowAfter: 'Depois',
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
    shotsH: 'Na tela', priceH: 'Preço', priceNote: 'Licença vitalícia, com ativação online em até dois computadores seus. Pix ou cartão; a chave e o instalador saem na hora e ficam na sua conta.',
    faqH: 'Perguntas', faq: [['Funciona em qual DAW?', 'Windows 10/11 de 64 bits (VST3) e macOS 11 ou mais novo, Apple Silicon ou Intel (AU e VST3). Qualquer DAW que abra VST3 ou AU: Ableton Live, FL Studio, Logic, Bitwig, Reaper e outros.'],
      ['Preciso de mais alguma coisa?', 'Não. O Refiner é um plugin independente: instalou, ativou com a sua chave, está pronto.'],
      ['Como recebo?', 'Depois do pagamento você baixa o instalador aqui no site e recebe a chave na hora. Tudo fica guardado na sua conta para baixar de novo quando quiser.'],
      ['E se eu não gostar?', 'Pela lei brasileira, você pode desistir em até 7 dias: responda ao e-mail do recibo e devolvemos o valor.']],
    trademark: 'Ableton e Live são marcas da Ableton AG. A SignalGen não é afiliada à Ableton.',
  },
  es: {
    title: 'Refiner · EQ de 24 bandas · SignalGen', desc: 'El EQ que muestra dónde cortar. 24 bandas por clic, resonancias marcadas, sidechain, fase lineal.',
    eyebrow: 'Refiner · Windows + macOS · VST3 / AU', h1a: 'El EQ que muestra', h1b: 'dónde cortar.', lede: '24 bandas con un clic. SMART marca la fundamental y las octavas en neón y las resonancias erróneas en rojo — haces clic y cortas. Sidechain y Level dibujados como curva, fase Zero, Natural o Lineal, Stereo, Mid-Side y Mono.', claim: 'Calidad que compite con plugins extremadamente caros.',
    buy: (p: string) => `Comprar Refiner · ${p}`, rowLaunch: 'Lanzamiento · 10 primeros', rowAfter: 'Después',
    trust: [['24', 'bandas, con un clic'], ['3', 'modos de fase'], ['0', 'cracks: instalador oficial, clave tuya']],
    whatH: 'Qué hace', whatP: 'Cada función de abajo está en el plugin instalado hoy — ninguna es promesa.',
    what: [['SMART', 'Resonancias en el espectro', 'Fundamental y octavas en neón; resonancias erróneas en rojo→azul indicando dónde cortar. Un clic crea la banda en el lugar.'],
      ['SIDECHAIN', 'EQ dinámico por banda', 'Cada banda reacciona a su canal, a una entrada externa o a toda la Mix.'],
      ['LEVEL', 'La curva como objetivo', 'Dibuja la curva que quieres oír; Refiner ajusta cada banda para llegar ahí.'],
      ['PHASE', 'Zero · Natural · Lineal', 'En Stereo, Mid-Side o Mono.'], ['LOCK', 'Harmonic Lock', 'Fija una banda al armónico de la nota que suena.'],
      ['MATCH', 'EQ por referencia', 'Suelta una referencia: hasta 16 bandas para acercar el espectro.'], ['A/B', 'Delta y A/B ciego', 'Oye solo lo que cambió y compara a ciegas.'],
      ['FINISH', 'Tube · Glue · Density', 'Acabado sutil de válvula, cola y densidad en el Init.']],
    shotsH: 'En pantalla', priceH: 'Precio', priceNote: 'Licencia de por vida, con activación online en hasta dos computadoras tuyas. La clave y el instalador salen al instante y quedan en tu cuenta.',
    faqH: 'Preguntas', faq: [['¿En qué DAW funciona?', 'Windows 10/11 de 64 bits (VST3) y macOS 11 o más nuevo (AU y VST3). Cualquier DAW que abra VST3 o AU: Ableton Live, FL Studio, Logic, Bitwig, Reaper y otros.'], ['¿Necesito algo más?', 'No. Refiner es un plugin independiente: lo instalas, lo activas con tu clave y listo.'], ['¿Cómo lo recibo?', 'Después del pago descargas el instalador aquí en el sitio y recibes la clave al instante. Todo queda en tu cuenta para descargar de nuevo cuando quieras.'], ['¿Y si no me gusta?', 'Puedes desistir dentro de 7 días: responde al e-mail del recibo y devolvemos el importe.']],
    trademark: 'Ableton y Live son marcas de Ableton AG. SignalGen no está afiliada a Ableton.',
  },
  en: {
    title: 'Refiner · 24-band EQ · SignalGen', desc: 'The EQ that shows you where to cut. 24 bands by click, resonances marked on the spectrum, sidechain, linear phase.',
    eyebrow: 'Refiner · Windows + macOS · VST3 / AU', h1a: 'The EQ that shows you', h1b: 'where to cut.', lede: '24 bands, one click each. SMART marks the fundamental and its octaves in neon and the wrong resonances in red — click on one and cut. Sidechain and Level drawn as curves, Zero, Natural or Linear phase, Stereo, Mid-Side and Mono.', claim: 'Quality that competes with extremely expensive plugins.',
    buy: (p: string) => `Buy Refiner · ${p}`, rowLaunch: 'Launch · first 10', rowAfter: 'After',
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
    shotsH: 'On screen', priceH: 'Price', priceNote: 'Lifetime license, activated online on up to two of your computers. The key and the installer are issued instantly and stay in your account.',
    faqH: 'Questions', faq: [['Which DAW?', '64-bit Windows 10/11 (VST3) and macOS 11 or newer, Apple Silicon or Intel (AU and VST3). Any DAW that opens VST3 or AU: Ableton Live, FL Studio, Logic, Bitwig, Reaper and others.'], ['Do I need anything else?', 'No. Refiner stands alone: install it, activate it with your key, done.'], ['How do I get it?', 'After payment you download the installer right here and get your key instantly. Everything stays in your account to download again whenever you like.'], ['What if I don’t like it?', 'You can walk away within 7 days: reply to the receipt e-mail and we refund you.']],
    trademark: 'Ableton and Live are trademarks of Ableton AG. SignalGen is not affiliated with Ableton.',
  },
};
const SHOTS = ['refiner_01', 'refiner_02', 'refiner_03'];

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const X = TX[getLang(searchParams) as keyof typeof TX] || TX.pt;
  return { title: X.title, description: X.desc };
}

export default async function RefinerPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = getLang(searchParams);
  const X = TX[lang as keyof typeof TX] || TX.pt, U = ui(lang);
  const cat = await readCatalog();
  const it = cat.tracks.find((x) => x.id === 'refiner');
  const cc = country();
  const offer = await offerOf('refiner');
  const [now, after] = await Promise.all([refinerPrice(cc, offer?.tier || 'lifetime'), refinerPrice(cc, 'lifetime')]);
  const on = forSale(it);
  const buy = on && it ? <BuyButton id={it.id} price={now.amount} label={X.buy(now.display)} /> : <span className="btn soon" aria-disabled="true">{U.soon}</span>;
  const launch = !!offer && offer.left > 0;
  return (
    <main className="wrap">
      <section className="phero" aria-label="Refiner">
        <div className="phero-copy">
          <span className="eyebrow">{X.eyebrow}</span>
          <h1>{X.h1a} <em className="muted">{X.h1b}</em></h1>
          <p className="lede"><b>{X.claim}</b> {X.lede}</p>
          <Offer price={now.display} after={after.display} offer={on ? offer : null} T={U.offer}>{buy}</Offer>
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
        <div className="monet-price launch">
          {launch ? <div data-row="now"><span>{X.rowLaunch} · {U.offer.left(offer!.left)}</span><b>{now.display}</b></div> : null}
          <div data-row={launch ? 'after' : 'now'}><span>{launch ? X.rowAfter : 'Refiner'}</span><b>{after.display}</b></div>
          <div className="act">{buy}</div>
        </div>
      </section>
      <section className="block" id="faq">
        <div className="faq1"><h2 style={{ marginBottom: 'var(--s3)' }}>{X.faqH}</h2>{X.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
        <p className="muted small" style={{ marginTop: 'var(--s4)' }}>{X.trademark}</p>
      </section>
    </main>
  );
}
