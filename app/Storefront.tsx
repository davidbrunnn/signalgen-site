'use client';
// The storefront grid: one square tile per product — cover, play the demo, title, one line of facts, price. Type chips + genre chips.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlayButton, type PTrack } from '@/components/Player';

export type Tile = PTrack & {
  kind: string; subtitle: string; href: string; badge?: string; sold?: boolean; published: string;
  eyebrow?: string; extra?: string; wasPrice?: number;
};

const KINDS: [string, string][] = [['all', 'All packs'], ['kit', 'Sample packs'], ['preset', 'Serum 2 presets'], ['bundle', 'Bundles']];

export default function Storefront({ tiles }: { tiles: Tile[] }) {
  const [k, setK] = useState('all');
  const [g, setG] = useState('All');
  const inKind = (t: Tile, id: string) => (id === 'all' ? t.kind === 'kit' || t.id === 'complete-collection' : t.kind === id);
  const counts = useMemo(() => Object.fromEntries(KINDS.map(([id]) => [id, tiles.filter((t) => inKind(t, id)).length])), [tiles]);
  const genres = useMemo(() => ['All', ...Array.from(new Set(tiles.filter((t) => t.kind !== 'bundle').map((t) => t.genre || ''))).filter(Boolean).sort()], [tiles]);
  const shown = tiles.filter((t) => inKind(t, k) && (g === 'All' || t.genre === g || t.id === 'complete-collection'));
  const queue = shown.filter((t) => t.preview);
  return (
    <>
      <div className="filters">
        <div className="chips" role="group" aria-label="Product type">
          {KINDS.filter(([id]) => counts[id]).map(([id, label]) => (
            <button key={id} className="chip" aria-pressed={k === id} onClick={() => setK(id)}>{label} <span className="muted">{counts[id]}</span></button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Genre">
          {genres.map((x) => <button key={x} className="chip ghosty" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
        </div>
      </div>
      <div className="vitrine">
        {shown.map((t) => (
          <article key={t.id} className="tile">
            <Link href={t.href} className="vc" aria-label={`${t.title}: ${t.subtitle}`}>
              {t.cover ? <img src={t.cover} alt="" loading="lazy" /> : <div className="gen"><span>{t.eyebrow}</span><b>{t.title}</b></div>}
              {t.preview ? <span className="pb"><PlayButton t={t} queue={queue} /></span> : null}
            </Link>
            <div className="vm">
              <span className="e">{t.eyebrow}{t.badge ? <em>{t.badge}</em> : null}{t.extra ? <i>{t.extra}</i> : null}</span>
              <Link href={t.href} className="t">{t.title}</Link>
              <span className="s">{t.subtitle}</span>
              <div className="r">
                <span className="usd">{t.wasPrice ? <s>${t.wasPrice}</s> : null}${t.price}</span>
                <Link href={t.href} className="btn small quiet">Buy</Link>
              </div>
            </div>
          </article>
        ))}
        {!shown.length ? <div className="empty">Nothing in this genre yet — new volumes arrive every month.</div> : null}
      </div>
    </>
  );
}
