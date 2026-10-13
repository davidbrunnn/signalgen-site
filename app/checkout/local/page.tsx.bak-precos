import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readCatalog, priceOf, isSold, LOCAL, hrefOf } from '@/lib/catalog';
import LocalPay from './LocalPay';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout · Signal Studio' };

// Local test checkout: the same steps as Stripe Checkout, without charging. Only exists while the site runs locally with no Stripe key.
export default async function LocalCheckout({ searchParams }: { searchParams: { id?: string } }) {
  if (!LOCAL || process.env.STRIPE_SECRET_KEY) notFound();
  const t = (await readCatalog()).tracks.find((x) => x.id === searchParams.id);
  if (!t) notFound();
  return (
    <main className="wrap narrow">
      <h1>Checkout</h1>
      <div className="note warn">Local preview: this is a test checkout. No card is charged. Online, this step is Stripe Checkout.</div>
      <div className="sheet">
        {t.cover ? <img src={t.cover} alt="" /> : <span />}
        <div><div className="t">{t.title}</div><div className="m">{t.kind === 'track' ? `${t.artist}. Extended Mix + Radio Edit, WAV 24-bit. Exclusive license.` : t.subtitle}</div></div>
        <div className="p">${priceOf(t)}</div>
      </div>
      {isSold(t) ? <p className="err">This record was just signed by someone else. <Link href="/ghost">See what is available</Link>.</p> : <LocalPay id={t.id} price={priceOf(t)} />}
      <Link href={hrefOf(t)} className="back">Cancel and go back</Link>
    </main>
  );
}
