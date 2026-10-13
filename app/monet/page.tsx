import Link from 'next/link';
import type { Metadata } from 'next';
import { readCatalog, priceOf } from '@/lib/catalog';
import { monetPrice, country, fmt, SERUM2_USD, sgPrice } from '@/lib/region';
import BuyButton from '@/components/BuyButton';
import { getLang, t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const L = t(getLang(searchParams));
  return { title: L.monet.metaTitle, description: L.monet.metaDesc };
}

const SHOTS = ['monet_01_synth', 'monet_07_synth_paint', 'monet_02_fx', 'monet_03_matrix', 'monet_04_presets', 'monet_05_synth_bass'];

// MONET (10/10/2026, David): the SignalGen synthesizer on its own — free inside every SignalGen license, sold separately at 30 % of
// Serum 2 (US$ 249 → US$ 74.70; R$ 379 in Brazil; the Brazilian price in local currency in Latin America). Official installer: the
// pitch against cracked synths is safety, not a feature list war — the comparison stays to price and to what Monet itself has.
export default async function MonetPage({ searchParams }: { searchParams: { lang?: string } }) {
  const L = t(getLang(searchParams)), M = L.monet;
  const cat = await readCatalog();
  const mo = cat.tracks.find((x) => x.id === 'monet');
  const cc = country();
  const [mp, sgp] = await Promise.all([monetPrice(cc), sgPrice('founder', cc)]);
  const buy = mo ? <BuyButton id={mo.id} price={priceOf(mo)} label={M.buy(mp.display)} /> : null;
  const serum = fmt(SERUM2_USD, 'USD');
  return (
    <main className="wrap">
      <section className="phero" aria-label="Monet">
        <div className="phero-copy">
          <span className="eyebrow">{M.eyebrow}</span>
          <h1>{M.h1a} <em className="muted">{M.h1b}</em></h1>
          <p className="lede">{M.lede}</p>
          <div className="act">
            {buy}
            <Link href="/signalgen" className="btn quiet">{M.orSg} · {sgp.display}</Link>
          </div>
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
        <div className="monet-price">
          {M.priceRows(serum, mp.display).map(([k, v], i) => (
            <div key={k} data-row={i}><span>{k}</span><b>{v}</b></div>
          ))}
          <div className="act">{buy}</div>
        </div>
      </section>

      <section className="block" id="faq">
        <div className="split">
          <div>
            <h2 style={{ marginBottom: 'var(--s3)' }}>{M.faqH}</h2>
            {M.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
          <div className="g-cta">
            <p><b>{M.orSg}</b></p>
            <Link href="/signalgen" className="btn" style={{ width: '100%' }}>SignalGen · {sgp.display}</Link>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s4)' }}>{M.trademark}</p>
      </section>
    </main>
  );
}
