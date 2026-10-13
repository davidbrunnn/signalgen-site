import Link from 'next/link';
import type { Metadata } from 'next';
import { Wave } from '@/components/Player';
import { getLang, t } from '@/lib/i18n';
import { country, ghostMoney } from '@/lib/region';

export const dynamic = 'force-dynamic';

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const L = t(getLang(searchParams));
  return { title: L.ghost.metaTitle, description: L.ghost.metaDesc };
}

// GHOST PRODUCTION ON DEMAND (10/10/2026): no catalogue any more. One price, a brief, a payment, and a page where the buyer follows
// every stage and talks to the producer. The preview is a released record of Davin's: the standard of what the buyer gets.
export default function Ghost({ searchParams }: { searchParams: { lang?: string } }) {
  const L = t(getLang(searchParams)), G = L.ghost, price = ghostMoney(country()).display;
  // three released records of Davin's, 72 s each from the build into the drop, watermarked with a spoken "Signal Creative Art"
  // every 8 s (scripts/ghost_preview.py) so a preview can't be lifted and passed off as a finished track
  const refs = [
    { id: 'ghost-ref-pull-me-close', title: 'Pull Me Close (Extended Mix)', artist: 'Davin', preview: '/media/ghost/pull-me-close-extended.m4a?v=2' },
    { id: 'ghost-ref-vip', title: 'VIP · Hit the Bass (Extended Mix)', artist: 'Davin', preview: '/media/ghost/vip-extended.m4a?v=2' },
    { id: 'ghost-ref-leave-me-a-rave', title: 'Leave Me a Rave (Extended Mix)', artist: 'Davin', preview: '/media/ghost/leave-me-a-rave-extended.m4a?v=2' },
  ];
  return (
    <main className="wrap">
      <section className="g-hero">
        <div>
          <span className="eyebrow">{G.eyebrow}</span>
          <h1>{G.h1a} <em className="muted">{G.h1b}</em></h1>
          <p className="lede">{G.lede}</p>
          <div className="g-price"><b>{price}</b><small>{G.per}</small></div>
          <Link href="/ghost/pedido" className="btn">{G.cta}</Link>
        </div>
        <aside className="g-ref" aria-label={G.previewH}>
          <span className="eyebrow">{G.previewH}</span>
          <ol className="g-refs">
            {refs.map((r) => (
              <li key={r.id}>
                <div className="g-ref-title">{r.title}</div>
                <div className="muted small">{r.artist} · {G.previewBy}</div>
                <Wave t={r} label="1:12" />
              </li>
            ))}
          </ol>
          <p className="muted small">{G.previewP}</p>
          <p className="muted small g-mark">{G.previewMark}</p>
        </aside>
      </section>

      <section className="block">
        <header><h2>{G.getH}</h2><p>{G.per}</p></header>
        <div className="g-get">
          {G.get.map(([h, p]) => <div key={h}><b>{h}</b><p>{p}</p></div>)}
        </div>
      </section>

      <section className="block">
        <header><h2>{G.howH}</h2><p>{G.lede}</p></header>
        <ol className="g-steps">
          {G.how.map(([h, p], i) => <li key={h}><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>)}
        </ol>
      </section>

      <section className="block">
        <header><h2>{G.stagesH}</h2><p>{L.order.keep}</p></header>
        <ol className="g-stages demo">
          {L.stages.map(([h, p], i) => <li key={h} data-state={i < 3 ? 'done' : i === 3 ? 'now' : 'next'}><i /><div><b>{h}</b><span>{p}</span></div></li>)}
        </ol>
      </section>

      <section className="block">
        <div className="split">
          <div>
            <h2 style={{ marginBottom: 'var(--s3)' }}>{G.faqH}</h2>
            {G.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
          <div className="g-cta">
            <div className="g-price"><b>{price}</b><small>{G.per}</small></div>
            <Link href="/ghost/pedido" className="btn" style={{ width: '100%' }}>{G.cta}</Link>
            <p className="muted small">{L.form.note}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
