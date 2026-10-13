// One exclusive vocal in the grid: cover, the 30 s tagged preview, what it is, and its state (on sale once / coming soon).
import Link from 'next/link';
import { PlayButton, type PTrack } from '@/components/Player';
import type { Track } from '@/lib/catalog';
import type { UIText } from '@/lib/i18n-ui';
import type { VocalState } from '@/lib/vocals';

export default function VocalTile({ t, state, price, V, soon, queue, big = false }: {
  t: Track; state: VocalState; price: string; V: UIText['vocals']; soon: string; queue: PTrack[]; big?: boolean;
}) {
  const p: PTrack = { id: t.id, title: t.title, artist: 'SignalGen', cover: t.cover, preview: t.preview, href: `/v/${t.id}`, sub: V.preview, cta: V.exclusive };
  const what = `${V.count(t.voices || 1)}${t.credit === 'studio' ? `, ${V.by}` : t.credit ? `, ${t.credit}` : ''}`;
  return (
    <article className={big ? 'vtile big' : 'vtile'}>
      <Link href={`/v/${t.id}`} className="vc" aria-label={t.title}>
        {t.cover ? <img src={t.cover} alt="" loading="lazy" /> : <div className="gen"><b>{t.title}</b></div>}
        <span className="badge">{V.one}</span>
        {t.preview ? <span className="pb"><PlayButton t={p} queue={queue} /></span> : null}
      </Link>
      <div className="vm">
        <span className="eyebrow">{V.exclusive}</span>
        <h3><Link href={`/v/${t.id}`}>{t.title}</Link></h3>
        <p className="muted">{what}.</p>
        <div className="r">
          {state === 'open' ? <b className="usd">{price}</b> : <span className="pill soon">{soon}</span>}
          <Link href={`/v/${t.id}`} className="btn small quiet">{V.see}</Link>
        </div>
      </div>
    </article>
  );
}
