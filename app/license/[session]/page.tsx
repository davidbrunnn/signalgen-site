import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readCatalog, fmtDur } from '@/lib/catalog';
import { paidSession, licenseNo } from '@/lib/session';
import { TERMS } from '../terms';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'License certificate · Signal Studio' };

export default async function Certificate({ params }: { params: { session: string } }) {
  const p = await paidSession(params.session);
  if (!p || !p.paid || p.refunded) notFound();
  const t = (await readCatalog()).tracks.find((x) => x.id === p.trackId);
  if (!t) notFound();
  const date = new Date(p.when).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <main className="wrap narrow">
      <div className="act noprint" style={{ justifyContent: 'space-between' }}>
        <Link href={`/thanks?session_id=${p.session}`} className="back">Back to your downloads</Link>
        <PrintButton />
      </div>
      <article className="cert">
        <div className="no">Signal Studio — exclusive license certificate {p.test ? '(test)' : ''}</div>
        <h1 style={{ marginTop: 21 }}>{t.title}</h1>
        <dl>
          <dt>License number</dt><dd>{licenseNo(p.session)}</dd>
          <dt>Licensee</dt><dd>{p.email || '—'}</dd>
          <dt>Date</dt><dd>{date}</dd>
          <dt>Original artist</dt><dd>{t.artist}</dd>
          <dt>Recording</dt><dd>{t.title} — Extended Mix ({fmtDur(t.duration)}) and Radio Edit, {t.bpm} BPM, {t.key}, {t.genre}</dd>
          <dt>Fee paid</dt><dd>US$ {p.amount}</dd>
          <dt>Reference</dt><dd style={{ fontWeight: 400, fontSize: 13, wordBreak: 'break-all' }}>{p.session}</dd>
        </dl>
        <ol>{TERMS.map((x) => <li key={x}>{x}</li>)}</ol>
        <div className="sig"><span>Signal Studio, on behalf of {t.artist}</span><span>{date}</span></div>
      </article>
    </main>
  );
}
