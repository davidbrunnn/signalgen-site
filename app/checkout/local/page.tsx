import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readCatalog, priceOf, isSold, LOCAL, hrefOf, tierOf } from '@/lib/catalog';
import { softPrice, country } from '@/lib/region';
import LocalPay from './LocalPay';
import { getLang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout · SignalGen' };

// 10/10/2026: o checkout no idioma escolhido (antes só em inglês) e a licença certa para cada tipo de produto
// (antes dizia "exclusive" até para o plugin e os packs).
const TX = {
  pt: { note: 'Prévia local: este é um checkout de teste. Nenhum cartão é cobrado. No site no ar, este passo é o Stripe Checkout.', back: 'Cancelar e voltar',
        sold: 'Esta faixa acabou de ser vendida.', see: 'Ver o que está disponível', track: 'Extended Mix + Radio Edit, WAV 24-bit. Licença exclusiva.',
        email: 'E-mail para a licença e o recibo', accept: 'Aceito os', terms: { software: 'termos da licença do software', track: 'termos da licença exclusiva', other: 'termos da licença royalty-free' },
        pay: (p: string) => `Pagar ${p} (teste)`, paying: 'Pagando…', fail: 'O pagamento de teste não passou.' },
  es: { note: 'Vista local: este es un checkout de prueba. No se cobra ninguna tarjeta. En el sitio publicado, este paso es Stripe Checkout.', back: 'Cancelar y volver',
        sold: 'Este tema se acaba de vender.', see: 'Ver lo disponible', track: 'Extended Mix + Radio Edit, WAV 24-bit. Licencia exclusiva.',
        email: 'E-mail para la licencia y el recibo', accept: 'Acepto los', terms: { software: 'términos de licencia del software', track: 'términos de la licencia exclusiva', other: 'términos de la licencia royalty-free' },
        pay: (p: string) => `Pagar ${p} (prueba)`, paying: 'Pagando…', fail: 'El pago de prueba no pasó.' },
  en: { note: 'Local preview: this is a test checkout. No card is charged. Online, this step is Stripe Checkout.', back: 'Cancel and go back',
        sold: 'This record was just signed by someone else.', see: 'See what is available', track: 'Extended Mix + Radio Edit, WAV 24-bit. Exclusive license.',
        email: 'Email for the license and receipt', accept: 'I accept the', terms: { software: 'software license terms', track: 'exclusive license terms', other: 'royalty-free license terms' },
        pay: (p: string) => `Pay ${p} (test)`, paying: 'Paying…', fail: 'The test payment did not go through.' },
};

// Local test checkout: the same steps as Stripe Checkout, without charging. Only exists while the site runs locally with no Stripe key.
export default async function LocalCheckout({ searchParams }: { searchParams: { id?: string } }) {
  if (!LOCAL || process.env.STRIPE_SECRET_KEY) notFound();
  const t = (await readCatalog()).tracks.find((x) => x.id === searchParams.id);
  if (!t) notFound();
  const X = TX[getLang() as keyof typeof TX] || TX.pt;
  const terms = t.kind === 'software' ? X.terms.software : t.kind === 'track' ? X.terms.track : X.terms.other;
  const shown = t.kind === 'software' ? (await softPrice(t, country(), await tierOf(t))).display : `$${priceOf(t)}`;
  return (
    <main className="wrap narrow">
      <h1>Checkout</h1>
      <div className="note warn">{X.note}</div>
      <div className="sheet">
        {t.cover ? <img src={t.cover} alt="" /> : <span />}
        <div><div className="t">{t.title}</div><div className="m">{t.kind === 'track' ? `${t.artist}. ${X.track}` : t.subtitle}</div></div>
        <div className="p">{shown}</div>
      </div>
      {isSold(t) ? <p className="err">{X.sold} <Link href="/ghost">{X.see}</Link>.</p> : <LocalPay id={t.id} price={priceOf(t)} shown={shown}
        tx={{ email: X.email, accept: X.accept, terms, pay: X.pay(shown), paying: X.paying, fail: X.fail }} />}
      <Link href={hrefOf(t)} className="back">{X.back}</Link>
    </main>
  );
}
