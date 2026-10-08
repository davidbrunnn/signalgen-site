import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readCatalog, fmtDur } from '@/lib/catalog';
import { paidSession, licenseNo } from '@/lib/session';
import { TERMS, KIT_TERMS, SOFTWARE_TERMS } from '../terms';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'License certificate · Signal Studio' };

export default async function Certificate({ params }: { params: { session: string } }) {
  const p = await paidSession(params.session);
  if (!p || !p.paid || p.refunded) notFound();
  const t = (await readCatalog()).tracks.find((x) => x.id === p.trackId);
  if (!t) notFound();
  const date = new Date(p.when).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const soft = t.kind === 'software', kit = t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle' || t.kind === 'pack';
  const terms = soft ? SOFTWARE_TERMS : kit ? KIT_TERMS : TERMS;
  const kindLabel = soft ? 'software license' : kit ? 'royalty-free license' : 'exclusive license';
  return (
    <main className="wrap narrow">
      <div className="act noprint" style={{ justifyContent: 'space-between' }}>
        <Link href={`/thanks?session_id=${p.session}`} className="back">Back to your downloads</Link>
        <PrintButton />
      </div>
      <article className="cert">
        <div className="no">SignalGen — {kindLabel} certificate {p.test ? '(test)' : ''}</div>
        <h1 style={{ marginTop: 21 }}>{t.title}</h1>
        <dl>
          <dt>License number</dt><dd>{licenseNo(p.session)}</dd>
          <dt>Licensee</dt><dd>{p.email || '—'}</dd>
          <dt>Date</dt><dd>{date}</dd>
          {soft ? <><dt>Product</dt><dd>{t.title} — {t.subtitle}</dd><dt>License key</dt><dd style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, wordBreak: 'break-all' }}>{p.key || '—'}</dd></>
            : kit ? <><dt>Product</dt><dd>{t.title} — {t.subtitle || t.contents}</dd></>
            : <><dt>Original artist</dt><dd>{t.artist}</dd><dt>Recording</dt><dd>{t.title} — Extended Mix ({fmtDur(t.duration)}) and Radio Edit, {t.bpm} BPM, {t.key}, {t.genre}</dd></>}
          <dt>Fee paid</dt><dd>US$ {p.amount}</dd>
          <dt>Reference</dt><dd style={{ fontWeight: 400, fontSize: 13, wordBreak: 'break-all' }}>{p.session}</dd>
        </dl>
        <ol>{terms.map((x) => <li key={x}>{x}</li>)}</ol>
        <div className="sig"><span>SignalGen{soft || kit ? '' : `, on behalf of ${t.artist}`}</span><span>{date}</span></div>
      </article>
    </main>
  );
}
