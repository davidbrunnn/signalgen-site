'use client';
// The storefront grid: every product as a square tile — cover, play, title, one line of facts, price. Filter chips on top.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlayButton, type PTrack } from '@/components/Player';

export type Tile = PTrack & { kind: string; subtitle: string; href: string; badge?: string; sold?: boolean; published: string };

const KINDS: [string, string][] = [['all', 'Everything'], ['track', 'Ghost productions'], ['kit', 'Sample kits'], ['preset', 'Presets'], ['software', 'Plugin']];

export default function Storefront({ tiles, initial = 'all' }: { tiles: Tile[]; initial?: string }) {
  const [k, setK] = useState(initial);
  const counts = useMemo(() => Object.fromEntries(KINDS.map(([id]) => [id, id === 'all' ? tiles.length : tiles.filter((t) => t.kind === id).length])), [tiles]);
  const shown = tiles.filter((t) => k === 'all' || t.kind === k);
  const queue = shown.filter((t) => t.preview && !t.sold);
  return (
    <>
      <div className="filters">
        <div className="chips" role="group" aria-label="Filter">
          {KINDS.filter(([id]) => counts[id]).map(([id, label]) => <button key={id} className="chip" aria-pressed={k === id} onClick={() => setK(id)}>{label} <span className="muted">{counts[id]}</span></button>)}
        </div>
        <span className="small muted">{shown.length} items</span>
      </div>
      <div className="vitrine">
        {shown.map((t) => (
          <article key={t.id} className={`tile${t.sold ? ' sold' : ''}${t.kind === 'software' ? ' soft' : ''}`}>
            <Link href={t.href} className="vc" aria-label={`${t.title}: ${t.subtitle}`}>
              {t.cover ? <img src={t.cover} alt="" loading="lazy" /> : <div className="gen"><span>{t.kind === 'preset' ? 'Preset pack' : 'Sample kit'}</span><b>{t.title}</b></div>}
              {t.badge ? <span className="badge">{t.badge}</span> : null}
              {t.sold ? <span className="badge dim">Signed</span> : null}
              {!t.sold && t.preview ? <span className="pb"><PlayButton t={t} queue={queue} /></span> : null}
            </Link>
            <div className="vm">
              <Link href={t.href} className="t">{t.title}</Link>
              <span className="s">{t.subtitle}</span>
              <div className="r">
                <span className="usd">{t.sold ? 'Sold' : `$${t.price}`}</span>
                <Link href={t.href} className="btn small quiet">{t.kind === 'software' ? 'See the plugin' : t.sold ? 'Details' : 'Buy'}</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
