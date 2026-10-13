import type { Metadata } from 'next';
import { readCatalog, forSale } from '@/lib/catalog';
import { monetPrice, country } from '@/lib/region';
import { offerOf } from '@/lib/launch';
import BuyButton from '@/components/BuyButton';
import Offer from '@/components/Offer';
import { getLang, t } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';

export const dynamic = 'force-dynamic';

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const L = t(getLang(searchParams));
  return { title: L.monet.metaTitle, description: L.monet.metaDesc };
}

const SHOTS = ['monet_01_synth', 'monet_07_synth_paint', 'monet_02_fx', 'monet_03_matrix', 'monet_04_presets', 'monet_05_synth_bass'];

// MONET (13/10/2026, David): the SignalGen synthesizer on its own — R$ 99 for the first 10 buyers, the regular price after
// (lib/launch counts the real sales). No competitor is named and no price is compared to anyone's.
export default async function MonetPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = getLang(searchParams), L = t(lang), M = L.monet, U = ui(lang);
  const cat = await readCatalog();
  const mo = cat.tracks.find((x) => x.id === 'monet');
  const cc = country();
  const offer = await offerOf('monet');
  const [now, after] = await Promise.all([monetPrice(cc, offer?.tier || 'lifetime'), monetPrice(cc, 'lifetime')]);
  const on = forSale(mo), launch = !!offer && offer.left > 0;
  const buy = on && mo ? <BuyButton id={mo.id} price={now.amount} label={M.buy(now.display)} /> : <span className="btn soon" aria-disabled="true">{U.soon}</span>;
  return (
    <main className="wrap">
      <section className="phero" aria-label="Monet">
        <div className="phero-copy">
          <span className="eyebrow">{M.eyebrow}</span>
          <h1>{M.h1a} <em className="muted">{M.h1b}</em></h1>
          <p className="lede">{M.lede}</p>
          <Offer price={now.display} after={after.display} offer={on ? offer : null} T={U.offer}>{buy}</Offer>
          <ul className="trust">{M.safe.map(([b, s]) => <li key={b}><b>{b}</b>{s}</li>)}</ul>
        </div>
        <figure className="phero-shot monet-shot">
          <img src="/product/ui2/monet_01_synth.jpg" alt="Monet · SYNTH" />
        </figure>
      </section>

      <section className="block" id="inside">
        <header><h2>{M.whatH}</h2><p>{M.whatP}</p></header>
        <div className="g-get monet-what">
          {M.what.map(([tag, h, p]) => <div key={tag}><span className="eyebrow">{tag}</span><b>{h}</b><p>{p}</p></div>)}
        </div>
      </section>

      <section className="block" id="screens">
        <header><h2>{M.shotsH}</h2><p /></header>
        <div className="monet-shots">
          {SHOTS.map((s) => <img key={s} src={`/product/ui2/${s}.jpg`} alt="Monet" loading="lazy" />)}
        </div>
      </section>

      <section className="block" id="price">
        <header><h2>{M.priceH}</h2><p>{M.priceNote}</p></header>
        <div className="monet-price launch">
          {launch
            ? M.priceRows(now.display, after.display).map(([k, v], i) => <div key={k} data-row={i === 0 ? 'now' : 'after'}><span>{k}{i === 0 ? ` · ${U.offer.left(offer!.left)}` : ''}</span><b>{v}</b></div>)
            : <div data-row="now"><span>Monet</span><b>{after.display}</b></div>}
          <div className="act">{buy}</div>
        </div>
      </section>

      <section className="block" id="faq">
        <div className="faq1">
          <h2 style={{ marginBottom: 'var(--s3)' }}>{M.faqH}</h2>
          {M.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s4)' }}>{M.trademark}</p>
      </section>
    </main>
  );
}
