import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readCatalog, priceOf, downloadsOf } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton } from '@/components/Player';
import BuyButton from '@/components/BuyButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const t = (await readCatalog()).tracks.find((x) => x.id === params.id);
  return t ? { title: `${t.title} · SignalGen`, description: t.description || t.subtitle } : {};
}

// Product page for the software, the kits and the preset packs (tracks keep /t/[id]).
export default async function ProductPage({ params }: { params: { id: string } }) {
  const t = (await readCatalog()).tracks.find((x) => x.id === params.id);
  if (!t || t.kind === 'track' || t.kind === 'pack') notFound();
  const price = priceOf(t), soft = t.kind === 'software';
  const dls = downloadsOf(t);
  return (
    <main className="wrap">
      <Link href={soft ? '/' : '/#sounds'} className="back">{soft ? 'Back' : 'All sounds'}</Link>
      <div className="track">
        <div>
          {t.cover ? <div className="art" style={{ position: 'static' }}><img src={t.cover} alt={`${t.title} cover`} /></div> : null}
          {t.screenshots?.length ? <div className="shots">{t.screenshots.map((s) => <img key={s} src={s} alt="" loading="lazy" />)}</div> : null}
        </div>
        <div>
          <h1>{t.title}</h1>
          <div className="by">{t.subtitle}</div>
          {t.preview ? <div className="act"><PlayButton t={toP(t)} big /><span className="small muted">Preview</span></div> : null}
          {t.description ? <p className="desc">{t.description}</p> : null}
          {t.features?.length ? <ul className="terms" style={{ marginTop: 21 }}>{t.features.map((f) => <li key={f} style={{ gridTemplateColumns: '1fr' }}><span>{f}</span></li>)}</ul> : null}
          <div className="specs">
            {t.contents ? <div><b>Contents</b><span>{t.contents}</span></div> : null}
            {t.genre ? <div><b>{soft ? 'Genres' : 'Genre'}</b><span>{t.genre}</span></div> : null}
            {t.sizeMb ? <div><b>Download</b><span>{t.sizeMb} MB</span></div> : null}
            <div><b>Format</b><span>{dls.map((d) => d.note || d.label).join(', ') || '—'}</span></div>
          </div>
          <div className="buybox">
            <div className="price">${price}<small>{soft ? 'lifetime license' : 'royalty-free license'}</small></div>
            <ul>
              {soft ? <><li>SignalGen, SignalGen Mix and SignalGen Sounds (AU + VST3, macOS)</li><li>License key issued right after payment</li><li>Use on 2 of your computers, offline</li><li>Free updates to version 5</li></>
                : <><li>Instant download after payment</li><li>Use in your own releases, no royalties</li><li>WAV 24-bit, organized folders, README</li></>}
            </ul>
            <BuyButton id={t.id} price={price} label={soft ? `Get SignalGen, $${price}` : `Buy, $${price}`} />
            <p className="fine">Secure checkout by Stripe. By buying you accept the <Link href="/license" style={{ textDecoration: 'underline' }}>license terms</Link>.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
