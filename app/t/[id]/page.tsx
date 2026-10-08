import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readCatalog, fmtDur, isSold, priceOf } from '@/lib/catalog';
import { toP } from '@/lib/view';
import { Wave } from '@/components/Player';
import BuyButton from '@/components/BuyButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const t = (await readCatalog()).tracks.find((x) => x.id === params.id);
  return t ? { title: `${t.title} — ${t.artist} · Signal Studio`, description: t.description || `${t.genre}, ${t.bpm} BPM, ${t.key}. Exclusive license.` } : {};
}

export default async function TrackPage({ params }: { params: { id: string } }) {
  const cat = await readCatalog();
  const t = cat.tracks.find((x) => x.id === params.id);
  if (!t) notFound();
  const sold = isSold(t), price = priceOf(t), pack = t.kind === 'pack';
  return (
    <main className="wrap">
      <Link href="/#catalog" className="back">Back to the catalog</Link>
      <div className="track">
        <div className="art">{t.cover ? <img src={t.cover} alt={`${t.title} cover art`} /> : null}</div>
        <div>
          <h1>{t.title}</h1>
          <div className="by">{t.artist} — {t.genre}</div>
          {sold ? null : <Wave t={toP(t)} />}
          {t.description ? <p className="desc">{t.description}</p> : null}
          <div className="specs">
            <div><b>Tempo</b><span>{t.bpm} BPM</span></div>
            <div><b>Key</b><span>{t.key}{t.camelot ? ` (${t.camelot})` : ''}</span></div>
            <div><b>Extended Mix</b><span>{fmtDur(t.duration)}</span></div>
            <div><b>Radio Edit</b><span>{t.radioDuration ? fmtDur(t.radioDuration) : 'Included'}</span></div>
            {t.lufs ? <div><b>Loudness</b><span>{t.lufs} LUFS integrated</span></div> : null}
            {t.truePeak ? <div><b>True peak</b><span>{t.truePeak} dBTP</span></div> : null}
          </div>
          <div className="buybox">
            {sold ? (
              <>
                <div className="price">Signed</div>
                <p className="muted small">This record has its owner. Exclusive licenses are sold once — have a listen to what is still available.</p>
                <Link href="/#catalog" className="btn quiet">See available tracks</Link>
              </>
            ) : (
              <>
                <div className="price">${price}<small>{pack ? 'non-exclusive pack' : 'exclusive license, both versions'}</small></div>
                <ul>
                  {pack ? <li>Loops of every bus and the MIDI of the day’s picks</li> : <>
                    <li>Extended Mix and Radio Edit, WAV 44.1 kHz / 24-bit</li>
                    <li>Mastered for streaming and club systems</li>
                    <li>Removed from the catalog the moment you buy it</li>
                    <li>License certificate issued in your name</li>
                  </>}
                </ul>
                <BuyButton id={t.id} price={price} label={pack ? `Buy the pack, $${price}` : `Buy exclusive license, $${price}`} />
                <p className="fine">Secure checkout by Stripe. By buying you accept the <Link href="/license" style={{ textDecoration: 'underline' }}>license terms</Link>.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
