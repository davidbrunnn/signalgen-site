import Link from 'next/link';
import { readCatalog, forSale, isSignalGen, founderLeft } from '@/lib/catalog';
import { getLang } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { country, refinerPrice, monetPrice, ghostMoney, sgPrice } from '@/lib/region';
import { readCounters, offerFrom } from '@/lib/launch';
import BuyButton from '@/components/BuyButton';
import Offer from '@/components/Offer';

export const dynamic = 'force-dynamic';

// 14/10/2026 (David): the SignalGen — the track generator — is the flagship of the brand. The home is his: hero, the four modes,
// then the plugins sold on their own (Refiner, Monet, the free Clocker), and the ghost production line.
export default async function Home() {
  const lang = getLang(), U = ui(lang), X = U.home;
  const [cat, counters] = await Promise.all([readCatalog(), readCounters()]);
  const cc = country();
  const by = (id: string) => cat.tracks.find((t) => t.id === id);
  const sg = cat.tracks.find(isSignalGen), sgOn = forSale(sg), left = founderLeft(sg);
  const sgNow = await sgPrice(sgOn && left <= 0 ? 'lifetime' : 'founder', cc);
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
      <section className="hero-sg" id="signalgen">
        <div className="hero-sg-copy">
          <span className="eyebrow">{X.sgEyebrow}</span>
          <h1>{X.sgH1a} <em>{X.sgH1b}</em></h1>
          <p className="lede">{X.sgLede}</p>
          <div className="act">
            {sgOn && sg ? <BuyButton id={sg.id} price={sgNow.amount} label={`${U.buy} · ${sgNow.display}`} /> : <Link href="/signalgen" className="btn">{X.sgCta}</Link>}
            <Link href="#modes" className="btn quiet">{X.sgCta2}</Link>
          </div>
          <p className="hero-sg-price"><span className="o-badge">{X.sgPriceTag}</span><span>{X.sgPriceSub(sgNow.display)}</span>{!sgOn ? <span className="muted"> {X.sgSoon}</span> : null}</p>
        </div>
        <Link href="/signalgen" className="hero-sg-shot" aria-label="SignalGen">
          <img src="/product/ui2/sg_05_generate_pronto.jpg" alt="SignalGen · GENERATE" />
        </Link>
      </section>

      <ul className="facts4">{X.sgFacts.map(([b, s]) => <li key={b}><b>{b}</b><span>{s}</span></li>)}</ul>

      <section className="block" id="modes">
        <header><h2>{X.sgModesH}</h2><p>{X.sgModesP}</p></header>
        <div className="modes4">
          {X.sgModes.map(([tag, h, p, img], i) => (
            <Link href="/signalgen" key={tag} className="mode">
              <img src={img} alt={tag} loading="lazy" />
              <span className="eyebrow">0{i + 1} · {tag}</span>
              <h3>{h}</h3>
              <p className="muted">{p}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="block" id="plugins">
        <header><h2>{X.moreH}</h2><p>{X.moreP}</p></header>
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
          <Link href="/clocker" className="pmini">
            <div className="shot"><img src="/product/ui2/tempo_01.png" alt="Clocker" loading="lazy" /></div>
            <div><span className="eyebrow">{X.tempoTag}</span><h3>Clocker</h3><p className="muted">{X.tempoP}</p></div>
            <span className="pill free">{U.free}</span>
          </Link>
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
          <p><b>{X.ghostLine}</b> <span className="muted">{X.ghostSub(ghostMoney(cc).display)}</span></p>
          <Link href="/ghost" className="btn small quiet">{X.ghostCta}</Link>
        </div>
      </section>
    </main>
  );
}
