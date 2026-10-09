// After Stripe Checkout: the license is shown here at once (and emailed by the webhook). Ed25519 is deterministic, so this page
// rebuilds the same key the email carries, straight from the paid session; no database needed.
import Stripe from 'stripe';
import { keyForOrder } from '@/lib/license';
import { KeyBox, Waiting } from './parts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Thank you · SignalGen', robots: { index: false } };

export default async function Thanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const id = String(searchParams.session_id || '');
  let s: Stripe.Checkout.Session | null = null;
  if (process.env.STRIPE_SECRET_KEY && /^cs_[A-Za-z0-9_]+$/.test(id)) {
    try { s = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(id); } catch { s = null; }
  }

  if (!s || s.metadata?.kind !== 'license') {
    return (
      <main className="wrap band thanks">
        <h1>We couldn’t find that order.</h1>
        <p className="body">If you paid, the license is on its way to your email. Nothing there in ten minutes? Reply to the Stripe receipt and we’ll sort it out.</p>
      </main>
    );
  }

  if (s.payment_status !== 'paid' && s.status === 'expired') {
    return (
      <main className="wrap band thanks">
        <h1>That payment expired.</h1>
        <p className="body">Nothing was charged. <a href="/#pricing">Start again</a> whenever you like.</p>
      </main>
    );
  }

  if (s.payment_status !== 'paid') {
    return (
      <main className="wrap band thanks">
        <Waiting />
        <h1>Waiting for your payment.</h1>
        <p className="body">Paid with Pix? It usually lands in a few seconds. This page updates by itself and shows your license key as soon as it does.</p>
      </main>
    );
  }

  const email = s.customer_details?.email || '';
  const lic = keyForOrder({ orderId: s.id, email, created: s.created, product: s.metadata?.product, edition: s.metadata?.edition });
  const dl = process.env.DOWNLOAD_URL_MAC;
  return (
    <main className="wrap band thanks">
      <h1>SignalGen is yours.</h1>
      <p className="body">Your license key is below. A copy goes to <b>{email}</b>; keep it, the key works with that email only.</p>
      <KeyBox value={lic.key} />
      <ol className="steps thanks-steps">
        <li><b>Install</b><p>{dl ? <a href={dl} className="btn btn-sm">Download for Mac (.pkg)</a> : 'Open the .pkg from the download link in your email.'}</p></li>
        <li><b>Rescan</b><p>In Ableton Live: Settings › Plug-Ins › Rescan. Put SignalGen on a MIDI track; Refiner and Ear go on any audio channel.</p></li>
        <li><b>Activate</b><p>Click ACTIVATE (top right), type {email} and paste the key. It works offline, and the same key opens all three.</p></li>
      </ol>
      <p className="body small">macOS may say it can’t verify the developer the first time: System Settings › Privacy & Security › Open Anyway, then open the .pkg again.</p>
    </main>
  );
}
