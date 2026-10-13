import Link from 'next/link';
import { readCatalog, forSale } from '@/lib/catalog';
import { getLang } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { country, refinerPrice, monetPrice } from '@/lib/region';
import { readCounters, offerFrom } from '@/lib/launch';
import { GHOST_LABEL } from '@/lib/ghost';
import BuyButton from '@/components/BuyButton';
import Offer from '@/components/Offer';

export const dynamic = 'force-dynamic';

// 13/10/2026 (David): "Plugins avançados. Preço justo." The window: Refiner and Monet at their launch price (first 10 buyers, the
// real counter), the free Tempo, the SignalGen as "em breve" (only the Monet goes with it) and the sample packs as "em breve".
export default async function Home() {
  const lang = getLang(), U = ui(lang), X = U.home;
  const [cat, counters] = await Promise.all([readCatalog(), readCounters()]);
  const cc = country();
  const by = (id: string) => cat.tracks.find((t) => t.id === id);
  const items = await Promise.all((['refiner', 'monet'] as const).map(async (id) => {
    const offer = offerFrom(id, counters), price = id === 'refiner' ? refinerPrice : monetPrice;
    const [now, after] = await Promise.all([price(cc, offer?.tier || 'lifetime'), price(cc, 'lifetime')]);
    return { id, offer, now, after, t: by(id) };
  }));
  const copy = {
    refiner: { name: 'Refiner', tag: X.refTag, p: X.refP, img: '/product/ui2/refiner_01.png', href: '/refiner' },
    monet: { name: 'Monet', tag: X.monetTag, p: X.monetP, img: '/product/ui2/monet_01_synth.jpg', href: '/monet' },
  };
  return (
    <main className="wrap">
      <section className="hero3">
        <div className="hero3-copy">
          <span className="eyebrow">{X.eyebrow}</span>
          <h1>{X.h1a} <em>{X.h1b}</em></h1>
          <p className="lede">{X.lede}</p>
          <div className="act">
            <Link href="#plugins" className="btn">{X.toPlugins}</Link>
            <Link href="/tempo" className="btn quiet">{X.toTempo}</Link>
          </div>
        </div>
        <div className="hero3-art" aria-hidden="true">
          <img className="a" src="/product/ui2/monet_01_synth.jpg" alt="" />
          <img className="b" src="/product/ui2/refiner_01.png" alt="" />
        </div>
      </section>

      <ul className="facts4">{X.facts.map(([b, s]) => <li key={b}><b>{b}</b><span>{s}</span></li>)}</ul>

      <section className="block" id="plugins">
        <header><h2>{X.plugH}</h2><p>{X.plugP}</p></header>
        <div className="pgrid">
          {items.map(({ id, offer, now, after, t }) => {
            const c = copy[id], on = forSale(t);
            return (
              <article key={id} className="pcard">
                <Link href={c.href} className="shot" aria-label={c.name}><img src={c.img} alt={c.name} loading="lazy" /></Link>
                <div className="pbody">
                  <span className="eyebrow">{c.tag}</span>
                  <h3><Link href={c.href}>{c.name}</Link></h3>
                  <p className="muted">{c.p}</p>
                  {on && t ? (
                    <Offer price={now.display} after={after.display} offer={offer} T={U.offer} compact>
                      <BuyButton id={t.id} price={now.amount} label={`${U.buy} · ${now.display}`} />
                      <Link href={c.href} className="btn quiet">{U.details}</Link>
                    </Offer>
                  ) : <div className="o-act"><span className="pill soon">{U.soon}</span><Link href={c.href} className="btn quiet">{U.details}</Link></div>}
                </div>
              </article>
            );
          })}
        </div>
        <div className="pgrid minis">
          <Link href="/tempo" className="pmini">
            <div className="shot"><img src="/product/ui2/tempo_01.png" alt="Tempo" loading="lazy" /></div>
            <div><span className="eyebrow">{X.tempoTag}</span><h3>Tempo</h3><p className="muted">{X.tempoP}</p></div>
            <span className="pill free">{U.free}</span>
          </Link>
          <Link href="/signalgen" className="pmini soon">
            <div className="shot"><img src="/product/ui2/sg_05_generate_pronto.jpg" alt="SignalGen" loading="lazy" /></div>
            <div><span className="eyebrow">{X.sgTag}</span><h3>SignalGen</h3><p className="muted">{X.sgP}</p></div>
            <span className="pill soon">{U.soon}</span>
          </Link>
        </div>
      </section>

      <section className="block" id="packs">
        <div className="soonband">
          <div><h2>{X.packH}</h2><p className="muted">{X.packP}</p></div>
          <span className="pill soon big">{U.soon}</span>
        </div>
      </section>

      <section className="block" id="how">
        <header><h2>{X.howH}</h2><p>{X.howP}</p></header>
        <ol className="how3">{X.how.map(([h, p], i) => <li key={h}><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>)}</ol>
      </section>

      <section className="block" id="license">
        <header><h2>{X.licH}</h2><p>{X.licP} <Link href="/license" style={{ textDecoration: 'underline' }}>{X.licLink}</Link>.</p></header>
        <div className="three">{X.lic.map(([h, p]) => <div key={h}><h3>{h}</h3><p>{p}</p></div>)}</div>
      </section>

      <section className="block">
        <div className="ghostline">
          <p><b>{X.ghostLine}</b> <span className="muted">{X.ghostSub(GHOST_LABEL)}</span></p>
          <Link href="/ghost" className="btn small quiet">{X.ghostCta}</Link>
        </div>
      </section>
    </main>
  );
}
