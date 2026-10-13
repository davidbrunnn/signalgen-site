import Link from 'next/link';
import { cookies } from 'next/headers';
import { listGhosts, adminOk } from '@/lib/ghost';
import { t } from '@/lib/i18n';
import AdminKey from './AdminKey';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mesa do produtor · Ghost production', robots: { index: false } };

// The producer's desk (PT-BR): every order, newest activity first. Access: GHOST_ADMIN_TOKEN (or PUBLISH_TOKEN), kept in a cookie.
export default async function Desk({ searchParams }: { searchParams: { key?: string } }) {
  const key = searchParams.key || cookies().get('ghost_admin')?.value;
  if (!adminOk(key)) return <main className="wrap narrow"><h1>Mesa do produtor</h1><AdminKey /></main>;
  const all = await listGhosts();
  const S = t('pt').stages;
  return (
    <main className="wrap">
      {searchParams.key ? <AdminKey value={searchParams.key} silent /> : null}
      <section className="hero-plain" style={{ paddingBottom: 'var(--s3)' }}>
        <span className="eyebrow">Ghost production · mesa do produtor</span>
        <h1>{all.filter((o) => o.status === 'paid' && o.stage < 6).length} <em className="muted">em produção</em></h1>
      </section>
      <div className="desk">
        {all.length ? all.map((o) => {
          const last = o.messages[o.messages.length - 1];
          const waiting = last && last.from === 'client';
          return (
            <Link key={o.id} href={`/ghost/admin/${o.id}`} className="desk-row" data-paid={o.status === 'paid' ? '1' : '0'}>
              <b>{o.brief.artist}<small> {o.brief.genre}{o.brief.bpm ? ` · ${o.brief.bpm}` : ''}{o.brief.key ? ` · ${o.brief.key}` : ''}</small></b>
              <span>{o.status === 'paid' ? S[o.stage][0] : 'aguardando pagamento'}{o.test ? ' · teste' : ''}</span>
              <span className="muted">{o.brief.name} · {o.brief.email}</span>
              <span className={waiting ? 'flag' : 'muted'}>{waiting ? 'cliente escreveu' : new Date(o.updated).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </Link>
          );
        }) : <div className="empty">Nenhum pedido ainda.</div>}
      </div>
    </main>
  );
}
