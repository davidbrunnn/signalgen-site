import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readCatalog } from '@/lib/catalog';
import { findVocal, vocalState } from '@/lib/vocals';
import { country, priceFor } from '@/lib/region';
import { getLang } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { Wave, type PTrack } from '@/components/Player';
import BuyButton from '@/components/BuyButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const t = findVocal((await readCatalog()).tracks, params.id);
  return t ? { title: `${t.title} · ${ui(getLang()).vocals.h} · SignalGen`, description: t.description || t.subtitle } : {};
}

// An exclusive vocal (13/10/2026): what it is, the 30 s tagged preview, and one buyer. Sold = the page says so and points at the rest.
export default async function VocalPage({ params }: { params: { id: string } }) {
  const lang = getLang(), U = ui(lang), V = U.vocals;
  const t = findVocal((await readCatalog()).tracks, params.id);
  if (!t) notFound();
  const state = vocalState(t);
  const money = await priceFor(t, country());
  const p: PTrack = { id: t.id, title: t.title, artist: 'SignalGen', cover: t.cover, preview: t.preview, href: `/v/${t.id}`, sub: V.preview, cta: V.exclusive };
  const what = `${V.count(t.voices || 1)}${t.credit === 'studio' ? `, ${V.by}` : t.credit ? `, ${t.credit}` : ''}`;
  return (
    <main className="wrap">
      <Link href="/#packs" className="back">{V.h}</Link>
      <div className="track pack vocal">
        <div><div className="art">{t.cover ? <img src={t.cover} alt={t.title} /> : null}<span className="badge">{V.one}</span></div></div>
        <div>
          <span className="eyebrow">{V.exclusive} · {V.one}</span>
          <h1>{t.title}</h1>
          <div className="by">{what}.</div>
          {state === 'sold' ? (
            <div className="buybox">
              <div className="price">{V.sold}</div>
              <p className="muted" style={{ margin: 'var(--s2) 0 var(--s3)' }}><b>{V.soldH}</b> {V.soldP}</p>
              <Link href="/#packs" className="btn quiet">{V.others}</Link>
            </div>
          ) : (
            <>
              {t.preview ? (<><Wave t={p} label="0:30" /><p className="small muted" style={{ marginTop: 'var(--s1)' }}><b>{V.preview}.</b> {V.previewP}</p></>) : null}
              {t.description ? <p className="desc">{t.description}</p> : null}
              <div className="buybox">
                {state === 'open' ? (
                  <>
                    <div className="price">{money.display}<small>{V.one} · {V.exclusive.toLowerCase()}</small></div>
                    <ul>{V.facts.map(([h, s]) => <li key={h}><b>{h}.</b> {s}</li>)}</ul>
                    <BuyButton id={t.id} price={money.amount} label={V.buy(money.display)} />
                  </>
                ) : (
                  <>
                    <div className="price">{V.soon}</div>
                    <p className="muted" style={{ margin: 'var(--s2) 0 var(--s3)' }}>{V.soonP}</p>
                    <ul>{V.facts.map(([h, s]) => <li key={h}><b>{h}.</b> {s}</li>)}</ul>
                    <Link href={`/suporte?topic=4&about=${encodeURIComponent(t.title)}`} className="btn quiet">{V.notify}</Link>
                  </>
                )}
                <p className="fine">{V.licenseLine} <Link href="/license" style={{ textDecoration: 'underline' }}>{U.footer.license}</Link>.</p>
              </div>
            </>
          )}
        </div>
      </div>
      <section className="block">
        <header><h2>{V.whatH}</h2><p>{V.p}</p></header>
        <div className="three">{V.what.map(([h, s]) => <div key={h}><h3>{h}</h3><p>{s}</p></div>)}</div>
      </section>
    </main>
  );
}
