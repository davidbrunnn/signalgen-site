import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { readCatalog, priceOf, isSound } from '@/lib/catalog';
import type { Track } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { PlayButton, Wave, type PTrack } from '@/components/Player';
import BuyButton from '@/components/BuyButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const t = (await readCatalog()).tracks.find((x) => x.id === params.id);
  return t ? { title: `${t.title}${t.kind === 'preset' ? ' (Serum 2 presets)' : t.kind === 'bundle' && t.format === 'bundle' ? ' (Bundle)' : ''} · SignalGen Sounds`, description: t.description || t.subtitle } : {};
}

const FMT: Record<string, string> = { wav: 'Sample pack', serum: 'Serum 2 presets', bundle: 'Bundle' };
const pad = (n?: number) => String(n || 0).padStart(2, '0');

// A pack page in the shape every sample store uses: cover + demo, formats, what is inside, every sound to audition, specs, license.
export default async function ProductPage({ params }: { params: { id: string } }) {
  const all = (await readCatalog()).tracks;
  const t = all.find((x) => x.id === params.id);
  if (!t) notFound();
  if (t.kind === 'software') redirect('/signalgen');
  if (t.kind === 'track') redirect(`/t/${t.id}`);
  if (!isSound(t)) notFound();
  const price = priceOf(t);
  const sibs = all.filter((x) => x.group && x.group === t.group && t.format !== 'collection').sort((a, b) => ['wav', 'serum', 'bundle'].indexOf(a.format || '') - ['wav', 'serum', 'bundle'].indexOf(b.format || ''));
  const bundle = sibs.find((x) => x.kind === 'bundle');
  const p = { ...toP(t), sub: `Demo · ${t.packType}`, cta: 'Get the pack' };
  const samples: PTrack[] = (t.samples || []).map((s, i) => ({ id: `${t.id}~${i}`, title: s.name, artist: 'SignalGen', cover: t.cover, preview: s.src, price, href: `/p/${t.id}`, sub: `${t.title} · ${s.tag}`, cta: 'Get the pack' }));
  const c = t.counts || {};
  const files = [c.presets ? `${c.presets} presets` : '', c.wav ? `${c.wav} ${c.presets ? 'audio previews' : 'WAV'}` : '', c.midi ? `${c.midi} MIDI` : ''].filter(Boolean).join(' · ');
  const more = all.filter((x) => x.kind === 'kit' && x.group !== t.group).sort((a, b) => (b.vol || 0) - (a.vol || 0)).slice(0, 4);
  const coll = all.find((x) => x.id === 'complete-collection');
  const isColl = t.format === 'collection';
  const includes = (t.includes || []).map((id) => all.find((x) => x.id === id)).filter(Boolean) as Track[];
  return (
    <main className="wrap">
      <Link href="/#store" className="back">All packs</Link>
      <div className="track pack">
        <div>
          <div className="art">{t.cover ? <img src={t.cover} alt={`${t.title} cover`} /> : null}</div>
        </div>
        <div>
          <span className="eyebrow">{isColl ? 'SignalGen Sounds' : `Vol. ${pad(t.vol)} · ${t.packType}`}</span>
          <h1>{t.title}</h1>
          <div className="by">{t.subtitle}</div>

          {sibs.length > 1 ? (
            <nav className="formats" aria-label="Formats">
              {sibs.map((x) => (
                <Link key={x.id} href={`/p/${x.id}`} aria-current={x.id === t.id ? 'page' : undefined}>
                  <span>{FMT[x.format || 'wav']}</span><b>${priceOf(x)}</b>{x.wasPrice ? <small>save ${x.wasPrice - priceOf(x)}</small> : null}
                </Link>
              ))}
            </nav>
          ) : null}

          {t.preview ? <Wave t={p} label="Demo" /> : null}
          <p className="small muted" style={{ marginTop: 'var(--s1)' }}>{isColl ? 'Demo of the newest volume.' : t.kind === 'preset' ? 'Demo: the presets one by one, each playing the loop it was made for.' : 'Demo made only from the sounds in this pack.'}</p>
          {t.description ? <p className="desc">{t.description}</p> : null}

          <div className="specs">
            <div><b>Contents</b><span>{t.contents}</span></div>
            <div><b>Files</b><span>{files || '—'}</span></div>
            {t.bpm ? <div><b>Tempo</b><span>{t.bpm} BPM</span></div> : null}
            {t.keys?.length ? <div><b>Keys</b><span>{t.keys.join(', ')}</span></div> : null}
            <div><b>Format</b><span>{t.specs}</span></div>
            {t.sizeMb ? <div><b>Download</b><span>{t.sizeMb >= 1024 ? `${(t.sizeMb / 1024).toFixed(1)} GB` : `${t.sizeMb} MB`} ZIP</span></div> : null}
          </div>

          <div className="buybox">
            <div className="price">{t.wasPrice ? <s>${t.wasPrice}</s> : null}${price}<small>royalty-free license</small></div>
            <ul>
              <li>Instant download after payment</li>
              <li>Use in your releases — no royalties, no credit</li>
              {t.kind === 'preset' || t.kind === 'bundle' ? <li>Serum 2 presets need Xfer Serum 2 (2.1.5+)</li> : <li>Works in any DAW</li>}
              <li>License certificate in your name</li>
            </ul>
            <BuyButton id={t.id} price={price} label={`Buy ${t.kind === 'bundle' ? 'the bundle' : t.kind === 'preset' ? 'the presets' : 'the pack'}, $${price}`} />
            {bundle && t.kind !== 'bundle' ? <p className="fine"><Link href={`/p/${bundle.id}`} style={{ textDecoration: 'underline' }}>Get both editions for ${priceOf(bundle)}</Link> — the samples and the Serum 2 patches that play them.</p> : null}
            <p className="fine">Secure checkout by Stripe. By buying you accept the <Link href="/license" style={{ textDecoration: 'underline' }}>license terms</Link>.</p>
          </div>
        </div>
      </div>

      {samples.length ? (
        <section className="block">
          <header><h2>{isColl ? 'Hear every volume' : 'Hear the sounds'}</h2><p>{isColl ? 'The demo of each pack, back to back.' : `${samples.length} of the ${t.kind === 'preset' ? 'presets' : 'sounds'} in this ${t.kind === 'bundle' ? 'bundle' : 'pack'}, untouched.`}</p></header>
          <ol className="auditions">
            {samples.map((s, i) => (
              <li key={s.id}>
                <PlayButton t={s} queue={[s]} />
                <span className="n">{pad(i + 1)}</span>
                <b>{s.title}</b>
                <span className="muted small">{(t.samples || [])[i]?.tag}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {includes.length ? (
        <section className="block">
          <header><h2>What you get</h2><p>{includes.length} downloads. Bought separately: ${t.wasPrice}.</p></header>
          <ul className="inc">
            {includes.map((x) => (
              <li key={x.id}>
                <Link href={`/p/${x.id}`}>{x.cover ? <img src={x.cover} alt="" loading="lazy" /> : <span />}</Link>
                <div><b>{x.title}{x.kind === 'preset' ? ' — Serum 2' : ''}</b><span className="muted small">{x.contents}</span></div>
                <span className="usd">${priceOf(x)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : t.inside?.length ? (
        <section className="block">
          <header><h2>What’s inside</h2><p>Folder by folder, as it unzips. Key and tempo are in every file name; the pack also includes a README, the license and the demo.</p></header>
          <ul className="inside-list">
            {t.inside.map((r) => <li key={r.folder}><b>{r.folder.replace(/ \/ /g, ' / ')}</b><span>{r.what}</span></li>)}
          </ul>
        </section>
      ) : null}

      <section className="block">
        <header><h2>Good to know</h2><p /></header>
        <div className="three">
          <div><h3>Made from scratch</h3><p>Every sound was synthesized by SignalGen’s engine and its own patches — no third-party samples, no factory presets. Nothing to clear.</p></div>
          <div><h3>{t.kind === 'preset' ? 'Installing' : 'Ready for the grid'}</h3><p>{t.kind === 'preset' ? 'In Serum 2, open the preset menu → Show Serum Presets Folder and copy the Presets folder into User. Rescan and they appear, named and tagged.' : 'Loops are cut to exact bars at the tempo in the name; one shots are tuned and named by note (Ableton: C3 = middle C).'}</p></div>
          <div><h3>License</h3><p>Royalty-free and non-exclusive: use it in any release. Don’t resell or share the sounds themselves. <Link href="/license" style={{ textDecoration: 'underline' }}>Full terms</Link>.</p></div>
        </div>
      </section>

      {!isColl && coll ? (
        <section className="block">
          <Link href={`/p/${coll.id}`} className="band">
            <div><span className="eyebrow">The Complete Collection</span><h2>This pack and every other one, ${priceOf(coll)}.</h2><p className="muted">{coll.subtitle}.</p></div>
            <div className="bp"><s>${coll.wasPrice}</s><b>${priceOf(coll)}</b><span className="btn quiet">See the collection</span></div>
          </Link>
        </section>
      ) : null}

      {more.length ? (
        <section className="block">
          <header><h2>More packs</h2><p /></header>
          <div className="vitrine">
            {more.map((x) => (
              <article key={x.id} className="tile">
                <Link href={`/p/${x.id}`} className="vc">{x.cover ? <img src={x.cover} alt="" loading="lazy" /> : null}<span className="pb"><PlayButton t={{ ...toP(x), sub: `Demo · ${x.packType}`, cta: 'Get the pack' }} /></span></Link>
                <div className="vm"><span className="e">Vol. {pad(x.vol)}</span><Link href={`/p/${x.id}`} className="t">{x.title}</Link><span className="s">{x.packType}{x.bpm ? ` · ${x.bpm} BPM` : ''}</span><div className="r"><span className="usd">${priceOf(x)}</span><Link href={`/p/${x.id}`} className="btn small quiet">Buy</Link></div></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
