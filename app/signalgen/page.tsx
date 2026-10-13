import Link from 'next/link';
import type { Metadata } from 'next';
import { readCatalog, priceOf, founderLeft, FOUNDER_SEATS, isSignalGen, forSale } from '@/lib/catalog';
import { sgPrice, country } from '@/lib/region';
import BuyButton from '@/components/BuyButton';
import { getLang, t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const L = t(getLang(searchParams));
  return { title: L.sg.metaTitle, description: L.sg.metaDesc };
}

// SIGNALGEN (10/10/2026): everything it does — UI 2 screens, the unlimited stem splitter (Demucs, set up by the installer).
// 13/10/2026 (David): no bundle — the only plugin that goes with the SignalGen is the Monet. "Em breve" until released. Founder price for the first 100 licenses, then
// lifetime — R$ 199 / R$ 299 in Brazil, US$ 49 / US$ 74 abroad, the Brazilian price in local currency in Latin America (lib/region).
export default async function SignalGenPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = getLang(searchParams), L = t(lang), S = L.sg;
  const cat = await readCatalog();
  const sg = cat.tracks.find(isSignalGen);
  const left = founderLeft(sg), cc = country();
  const [fp, lp] = await Promise.all([sgPrice('founder', cc), sgPrice('lifetime', cc)]);
  const now = left > 0 ? fp : lp;
  const on = forSale(sg);                                                   // 13/10/2026: o SignalGen fica "em breve" ate liberar
  const SOON = lang === 'en' ? 'Coming soon' : lang === 'es' ? 'Próximamente' : 'Em breve';
  const buy = on && sg ? <BuyButton id={sg.id} price={sg ? priceOf(sg) : 0} label={S.buy(now.display)} /> : <span className="btn soon" aria-disabled="true">{SOON}</span>;
  return (
    <main className="wrap">
      <section className="phero" aria-label="SignalGen">
        <div className="phero-copy">
          <span className="eyebrow">{S.eyebrow}</span>
          <h1>{S.h1}</h1>
          <p className="lede">{S.lede}</p>
          <div className="act">{buy}</div>
          {on && left > 0 ? <div className="founder-left"><span style={{ width: `${(left / FOUNDER_SEATS) * 100}%` }} />{S.founderLeft(left)}</div> : null}
          <ul className="trust">{S.trust.map(([b, s]) => <li key={b}><b>{b}</b>{s}</li>)}</ul>
        </div>
        <figure className="phero-shot">
          <img src="/product/ui2/sg_07_remix_pronto.jpg" alt="SignalGen · REMIX" />
          <img className="plug" src="/product/ui2/monet_01_synth.jpg" alt="Monet" />
        </figure>
      </section>

      <section className="block" id="does">
        <header><h2>{S.doesH}</h2><p>{S.doesP}</p></header>
        <div className="sg-does">
          {S.does.map(([tag, h, p, img]) => (
            <article key={tag}>
              <img src={img} alt="" loading="lazy" />
              <span className="eyebrow">{tag}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="block" id="plugins">
        <header><h2>{S.pluginsH}</h2><p>{S.pluginsP}</p></header>
        <div className="sg-plugins">
          {S.plugins.map(([name, h, p, img]) => (
            <article key={name}>
              <div className="shot"><img src={img} alt={name} loading="lazy" /></div>
              <div>
                <span className="eyebrow">{name}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="g-cta sg-monet">
          <p><b>{S.monetLine}</b></p>
          <Link href="/monet" className="btn quiet">{S.monetCta}</Link>
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s3)' }}>{S.trademark}</p>
      </section>

      <section className="block" id="pricing">
        <header><h2>{S.priceH}</h2><p>{S.priceP}</p></header>
        <div className="prices">
          <article data-on={left > 0 ? '1' : '0'}>
            <span className="eyebrow">{S.founder}</span>
            <div className="amount">{fp.display}</div>
            <p className="muted small">{S.founderSub}</p>
            {!on ? buy : left > 0 ? <><div className="founder-left"><span style={{ width: `${(left / FOUNDER_SEATS) * 100}%` }} />{S.founderLeft(left)}</div>{buy}</> : <div className="tag">{S.soldOut}</div>}
          </article>
          <article data-on={left > 0 ? '0' : '1'}>
            <span className="eyebrow">{S.lifetime}</span>
            <div className="amount">{lp.display}</div>
            <p className="muted small">{S.lifetimeSub}</p>
            {!on ? null : left > 0 ? <div className="tag">{S.after}</div> : buy}
          </article>
          <ul className="offer-list">{S.includes.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s3)' }}>{S.fine} <Link href="/license" style={{ textDecoration: 'underline' }}>{L.footer.license}</Link>.</p>
      </section>

      <section className="block" id="faq">
        <div className="split">
          <div>
            <h2 style={{ marginBottom: 'var(--s3)' }}>{S.faqH}</h2>
            {S.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
          <div className="g-cta">
            <p><b>{S.ghostLine}</b></p>
            <Link href="/ghost" className="btn quiet" style={{ width: '100%' }}>{S.ghostCta}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
