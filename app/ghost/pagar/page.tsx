import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LOCAL } from '@/lib/catalog';
import { readGhost, tokenOk, GHOST_LABEL } from '@/lib/ghost';
import { getLang, t } from '@/lib/i18n';
import GhostLocalPay from './GhostLocalPay';

export const dynamic = 'force-dynamic';
export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata { return { title: t(getLang(searchParams)).pay.metaTitle }; }

// The local store's stand-in for Stripe Checkout (no key, no Blob): the same steps, nothing charged.
export default async function Pagar({ searchParams }: { searchParams: { id?: string; k?: string; lang?: string } }) {
  if (!LOCAL || process.env.STRIPE_SECRET_KEY) notFound();
  const o = await readGhost(searchParams.id || '');
  if (!tokenOk(o, searchParams.k)) notFound();
  const L = t(o.lang || getLang(searchParams));
  return (
    <main className="wrap narrow">
      <h1>{L.pay.h1}</h1>
      <div className="note warn">{L.pay.test}</div>
      <div className="sheet">
        <span className="g-sheet-mark" aria-hidden="true">G</span>
        <div><div className="t">{L.pay.item}</div><div className="m">{o.brief.artist} · {o.brief.genre}. {L.pay.itemSub}.</div></div>
        <div className="p">{GHOST_LABEL}</div>
      </div>
      <GhostLocalPay id={o.id} k={o.token} label={L.pay.btn} />
      <Link href="/ghost/pedido" className="back">{L.form.h1}</Link>
    </main>
  );
}
