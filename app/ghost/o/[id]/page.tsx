import Link from 'next/link';
import { siteUrl } from '@/lib/site';
import type { Metadata } from 'next';
import Stripe from 'stripe';
import { readGhost, tokenOk, markPaid, publicView, GHOST_PRICE_BRL } from '@/lib/ghost';
import { getLang, t } from '@/lib/i18n';
import Thread from '@/components/Thread';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata { return { title: t(getLang(searchParams)).order.metaTitle, robots: { index: false } }; }

const origin = () => { const h = headers(); return siteUrl() || `${h.get('x-forwarded-proto') || 'http'}://${h.get('host')}`; };

// The buyer's page: the stages the producer moves, and the chat. The link (with ?k=) is in the confirmation e-mail.
export default async function Order({ params, searchParams }: { params: { id: string }; searchParams: { k?: string; s?: string; lang?: string } }) {
  let o = await readGhost(params.id);
  const L = t(o?.lang || getLang(searchParams));
  if (!tokenOk(o, searchParams.k)) {
    return <main className="wrap narrow"><h1>{L.order.notFound}</h1><p className="muted">{L.order.notFoundP}</p><Link href="/ghost" className="btn quiet">{L.ghost.eyebrow}</Link></main>;
  }
  // back from Stripe before the webhook: confirm the session here (idempotent)
  if (o.status === 'pending' && searchParams.s && process.env.STRIPE_SECRET_KEY) {
    try {
      const s = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(searchParams.s);
      if (s.payment_status === 'paid' && s.metadata?.ghostId === o.id) o = (await markPaid(o.id, { session: s.id, amount: (s.amount_total || 0) / 100, test: !s.livemode, site: origin() })) || o;
    } catch { /* the webhook will do it */ }
  }
  const F = L.form;
  return (
    <main className="wrap">
      <section className="hero-plain" style={{ paddingBottom: 'var(--s3)' }}>
        <span className="eyebrow">{L.order.yours} · #{o.id.slice(1, 7).toUpperCase()}</span>
        <h1>{o.brief.artist} <em className="muted">· {o.brief.genre}</em></h1>
        {o.test ? <div className="note warn">{L.order.test}</div> : null}
      </section>
      {o.status !== 'paid' ? (
        <div className="note">
          <b>{L.order.waitingPay}</b><br />{L.order.waitingPayP}
          {!process.env.STRIPE_SECRET_KEY ? <div style={{ marginTop: 'var(--s2)' }}><Link className="btn small" href={`/ghost/pagar?id=${o.id}&k=${o.token}`}>{L.order.payNow}</Link></div> : null}
        </div>
      ) : (
        <Thread initial={publicView(o)} k={o.token} role="client" stages={L.stages}
          L={{ stageNow: L.order.stageNow, chat: L.order.chat, placeholder: L.order.placeholder, send: L.order.send, sending: L.order.sending, you: L.order.you, producer: L.order.producer, system: L.order.system, brief: L.order.brief }}
          briefLabels={{ artist: F.artist, genre: F.genre, bpm: F.bpm, key: F.key, refs: F.refs, idea: F.idea, name: F.name, email: F.email }} />
      )}
      <p className="muted small" style={{ marginTop: 'var(--s4)' }}>{L.order.keep} · {(o as any).currency === 'BRL' || !o.amount ? `R$ ${(o.amount || GHOST_PRICE_BRL).toLocaleString('pt-BR')}` : `US$ ${o.amount}`}</p>
    </main>
  );
}
