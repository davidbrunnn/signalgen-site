import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { readGhost, adminOk, publicView, orderUrl } from '@/lib/ghost';
import { t } from '@/lib/i18n';
import Thread from '@/components/Thread';
import AdminKey from '../AdminKey';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedido · mesa do produtor', robots: { index: false } };

// One order, from the producer's side: move the stage (the buyer gets an e-mail), answer in the chat, paste delivery links.
export default async function DeskOrder({ params }: { params: { id: string } }) {
  if (!adminOk(cookies().get('ghost_admin')?.value)) return <main className="wrap narrow"><h1>Mesa do produtor</h1><AdminKey /></main>;
  const o = await readGhost(params.id); if (!o) notFound();
  const L = t('pt'), F = L.form;
  return (
    <main className="wrap">
      <Link href="/ghost/admin" className="back">Todos os pedidos</Link>
      <section className="hero-plain" style={{ paddingBottom: 'var(--s3)' }}>
        <span className="eyebrow">#{o.id.slice(1, 7).toUpperCase()} · {o.status === 'paid' ? `pago US$ ${o.amount}` : 'aguardando pagamento'}{o.test ? ' · teste' : ''} · idioma do cliente: {o.lang.toUpperCase()}</span>
        <h1>{o.brief.artist} <em className="muted">· {o.brief.genre}</em></h1>
        <p className="small muted">Página do cliente: <a href={orderUrl(o, '')} style={{ textDecoration: 'underline' }}>{`/ghost/o/${o.id}`}</a>. Cada mudança de etapa e cada mensagem sua vão por e-mail para ele, no idioma dele.</p>
      </section>
      <Thread initial={publicView(o)} role="producer" stages={L.stages}
        L={{ stageNow: 'Etapa (clique para mover)', chat: 'Conversa com o cliente', placeholder: 'Escreva para o cliente… (links de prévia ou de entrega viram links)', send: 'Enviar', sending: 'Enviando…', you: 'Você', producer: 'Produtor', system: 'SignalGen', brief: 'Briefing' }}
        briefLabels={{ artist: F.artist, genre: F.genre, bpm: F.bpm, key: F.key, refs: F.refs, idea: F.idea, name: F.name, email: F.email }} />
    </main>
  );
}
