import { notFound } from 'next/navigation';
import { readCatalog, PRICE_USD, fmtDur } from '@/lib/catalog';
import { BuyButton, Preview } from '../../TrackCard';

export const dynamic = 'force-dynamic';

export default async function TrackPage({ params }: { params: { id: string } }) {
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === params.id);
  if (!t) notFound();
  return (
    <main className="wrap track">
      <div className="cover" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)' }}>
        {t.cover ? <img src={t.cover} alt="" /> : null}
      </div>
      <div>
        <div className="sub" style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: 14 }}>
          {t.pick ? `Pick ${t.pick} · ${t.day}` : t.genre}
        </div>
        <h1>{t.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Preview src={t.preview} big />
          <span style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase' }}>30 s preview · final drop</span>
        </div>
        <div className="specs">
          <div><b>Tempo</b><span>{t.bpm} BPM</span></div>
          <div><b>Key</b><span>{t.key}</span></div>
          <div><b>Genre</b><span>{t.genre}</span></div>
          <div><b>Extended</b><span>{fmtDur(t.duration)}</span></div>
          {t.radioDuration ? <div><b>Radio edit</b><span>{fmtDur(t.radioDuration)}</span></div> : null}
          {t.lufs ? <div><b>Master</b><span>{t.lufs} LUFS · {t.truePeak} dBTP</span></div> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-.03em' }}>${PRICE_USD}</span>
          <BuyButton id={t.id} price={PRICE_USD} label="Buy exclusive" />
        </div>
        <ul className="license" style={{ marginTop: 28 }}>
          <li>Extended Mix + Radio Edit · WAV 44.1 kHz / 24 bit · mastered with Ableton Live native devices.</li>
          <li>Exclusive license — the track is removed from the catalog once sold.</li>
        </ul>
      </div>
    </main>
  );
}
