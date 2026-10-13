import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getLang, t as dict } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { currentEmail, ordersOf } from '@/lib/account';
import { readCatalog, downloadsOf, forSale, hrefOf, type Track, type Order } from '@/lib/catalog';
import { sign } from '@/lib/sign';
import { listGhosts } from '@/lib/ghost';
import { country, refinerPrice, monetPrice } from '@/lib/region';
import { readCounters, offerFrom } from '@/lib/launch';
import CopyKey from '@/components/CopyKey';
import LogoutButton from '@/components/LogoutButton';
import Seats from '@/components/Seats';
import { serialOf, readSeats, SEATS } from '@/lib/license';

export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata { return { title: ui(getLang()).account.title, robots: { index: false } }; }

const LOCALE = { pt: 'pt-BR', es: 'es', en: 'en-GB' } as const;

// The buyer's account (13/10/2026): every purchase of the signed-in e-mail with its license key and a fresh download link —
// the installer comes straight from here, as many times as needed. Ghost productions of the same e-mail are listed too.
export default async function Account() {
  const email = currentEmail();
  if (!email) redirect('/entrar');
  const lang = getLang(), U = ui(lang), A = U.account, L = dict(lang);
  const [orders, cat, ghosts, counters] = await Promise.all([ordersOf(email), readCatalog(), listGhosts().catch(() => []), readCounters()]);
  const day = (iso: string) => { try { return new Date(iso).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
  const rows = orders.map((o) => ({ o, t: cat.tracks.find((x) => x.id === o.trackId) })).filter((r): r is { o: Order; t: Track } => !!r.t);
  const owned = new Set(rows.map((r) => r.t.id));
  // the computers each key is active on (online activation, two per key)
  const seats = Object.fromEntries(await Promise.all(rows.filter((r) => r.t.kind === 'software' && r.o.key).map(async (r) => {
    const serial = serialOf(r.o.key);
    return [r.o.session, serial === null ? [] : ((await readSeats(serial).catch(() => null))?.devices || [])] as const;
  })));
  const mine = ghosts.filter((g) => g.status === 'paid' && g.brief.email === email);
  const cc = country();
  const more = (await Promise.all((['refiner', 'monet', 'tempo'] as const).filter((id) => !owned.has(id)).map(async (id) => {
    const t = cat.tracks.find((x) => x.id === id);
    if (!t || !forSale(t)) return null;
    const tier = offerFrom(id, counters)?.tier || 'lifetime';
    const price = id === 'tempo' ? U.free : (await (id === 'refiner' ? refinerPrice : monetPrice)(cc, tier)).display;
    return { t, price };
  }))).filter(Boolean) as { t: Track; price: string }[];

  return (
    <main className="wrap">
      <section className="acct-head">
        <div>
          <span className="eyebrow">{A.eyebrow}</span>
          <h1>{A.h1}</h1>
          <p className="muted">{A.signedAs(email)}</p>
        </div>
        <LogoutButton label={A.out} />
      </section>

      {rows.length ? (
        <div className="acct-list">
          {rows.map(({ o, t }) => {
            const soft = t.kind === 'software';
            const dls = downloadsOf(t).map((d) => ({ ...d, token: sign(t.id, d.key, 1) }));
            const shot = t.cover || t.screenshots?.[0];
            return (
              <article key={o.session} className="acct-item">
                <Link href={hrefOf(t)} className="shot">{shot ? <img src={shot} alt={t.title} loading="lazy" /> : null}</Link>
                <div className="body">
                  <header>
                    <div><h2>{t.title}</h2><p className="muted small">{t.subtitle} · {(o.amount || 0) > 0 ? A.bought(day(o.when)) : A.got(day(o.when))}</p></div>
                  </header>
                  {soft ? (
                    <div className="keybox">
                      <span className="eyebrow">{A.key}</span>
                      {o.key ? <CopyKey value={o.key} copy={A.copy} copied={A.copied} /> : <p className="muted small">{A.issuing}</p>}
                    </div>
                  ) : null}
                  <div className="acct-dl">
                    {dls.map((d) => (
                      <a key={d.key} className="btn" href={`/api/download?t=${d.token}`}>{A.download} · {d.label}</a>
                    ))}
                    <Link className="btn quiet" href={`/license/${o.session}`}>{A.cert}</Link>
                  </div>
                  {soft && o.key ? <Seats session={o.session} seats={seats[o.session] || []} max={SEATS} T={A.seats} /> : null}
                  {soft ? (
                    <details className="acct-how"><summary>{A.how}</summary><ol className="steps-mini">{A.steps.map((s) => <li key={s}>{s}</li>)}</ol></details>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="acct-empty">
          <h2>{A.emptyH}</h2>
          <p className="muted">{A.emptyP}</p>
        </section>
      )}

      {mine.length ? (
        <section className="block">
          <header><h2>{A.ghostH}</h2><p /></header>
          <div className="acct-ghosts">
            {mine.map((g) => (
              <Link key={g.id} href={`/ghost/o/${g.id}?k=${g.token}`} className="acct-ghost">
                <div><b>{g.brief.artist} · {g.brief.genre}</b><span className="muted small">{A.stage} {g.stage + 1}/{L.stages.length} · {L.stages[g.stage]?.[0]}</span></div>
                <span className="btn small quiet">{A.ghostOpen}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {more.length ? (
        <section className="block">
          <header><h2>{A.moreH}</h2><p /></header>
          <div className="acct-more">
            {more.map(({ t, price }) => (
              <Link key={t.id} href={hrefOf(t)} className="pmini">
                <div className="shot">{t.cover ? <img src={t.cover} alt={t.title} loading="lazy" /> : null}</div>
                <div><h3>{t.title}</h3><p className="muted">{t.subtitle}</p></div>
                <span className="pill">{price}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="muted small" style={{ marginTop: 'var(--s5)' }}><Link href="/suporte" style={{ textDecoration: 'underline' }}>{U.nav.support}</Link> · {A.help}</p>
    </main>
  );
}
