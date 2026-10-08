'use client';
import Link from 'next/link';
import { PlayButton, type PTrack } from '@/components/Player';

type Item = PTrack & { subtitle?: string; contents?: string; kind?: string };

export default function SoundsGrid({ items }: { items: Item[] }) {
  const queue = items.filter((i) => i.preview);
  return (
    <div className="sounds">
      {items.map((s) => (
        <article key={s.id} className="sound">
          <Link href={`/p/${s.id}`} className="sc">
            {s.cover ? <img src={s.cover} alt="" loading="lazy" /> : <div className="gen"><span>{s.kind === 'preset' ? 'Presets' : 'Kit'}</span><b>{s.title}</b></div>}
            <span className="pb"><PlayButton t={s} queue={queue} /></span>
          </Link>
          <div className="sm">
            <Link href={`/p/${s.id}`} className="t">{s.title}</Link>
            <span className="muted small">{s.subtitle}</span>
            <div className="r"><span className="usd">${s.price}</span><Link href={`/p/${s.id}`} className="btn small quiet">Details</Link></div>
          </div>
        </article>
      ))}
    </div>
  );
}
