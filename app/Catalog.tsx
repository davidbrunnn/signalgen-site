'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlayButton, type PTrack } from '@/components/Player';

type Row = PTrack & { camelot?: string; duration: string; published: string; bpm: number };

export default function Catalog({ rows }: { rows: Row[] }) {
  const genres = useMemo(() => ['All', ...Array.from(new Set(rows.map((r) => r.genre || ''))).filter(Boolean).sort()], [rows]);
  const [g, setG] = useState('All');
  const [sort, setSort] = useState<'new' | 'bpm'>('new');
  const shown = rows
    .filter((r) => g === 'All' || r.genre === g)
    .sort((a, b) => (sort === 'bpm' ? a.bpm - b.bpm : b.published.localeCompare(a.published)));
  const queue = shown.filter((r) => !r.sold);
  return (
    <>
      <div className="filters">
        <div className="chips" role="group" aria-label="Filter by genre">
          {genres.map((x) => <button key={x} className="chip" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
        </div>
        <button className="sort" onClick={() => setSort(sort === 'new' ? 'bpm' : 'new')}>Sorted by {sort === 'new' ? 'newest' : 'tempo'} — change</button>
      </div>
      <div className="rows" role="table" aria-label="Tracks">
        <div className="row thead" role="row">
          <span /><span /><span className="cell">Title</span><span className="cell c-bpm">Tempo</span><span className="cell c-key">Key</span>
          <span className="cell c-genre">Genre</span><span className="cell c-len">Length</span><span className="cell">Exclusive license</span>
        </div>
        {shown.map((r) => (
          <div key={r.id} className={r.sold ? 'row sold' : 'row'} role="row">
            <Link href={`/t/${r.id}`} className="thumb" aria-hidden="true" tabIndex={-1}>{r.cover ? <img src={r.cover} alt="" loading="lazy" /> : null}</Link>
            {r.sold ? <span /> : <PlayButton t={r} queue={queue} />}
            <Link href={`/t/${r.id}`} className="title">{r.title}<small>{r.artist}</small></Link>
            <span className="cell c-bpm"><b>{r.bpm}</b> BPM</span>
            <span className="cell c-key"><b>{r.key}</b>{r.camelot ? ` ${r.camelot}` : ''}</span>
            <span className="cell c-genre">{r.genre}</span>
            <span className="cell c-len">{r.duration}</span>
            <span className="buy">
              {r.sold ? <span className="cell">Signed</span> : <><span className="usd">${r.price}</span><Link href={`/t/${r.id}`} className="btn small">Get it</Link></>}
            </span>
          </div>
        ))}
        {!shown.length ? <div className="empty">No tracks in this genre right now. New ones arrive every day.</div> : null}
      </div>
    </>
  );
}
