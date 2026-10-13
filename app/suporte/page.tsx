import type { Metadata } from 'next';
import { getLang } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { currentEmail } from '@/lib/account';
import SupportForm from '@/components/SupportForm';

export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata { return { title: ui(getLang()).support.title }; }

// Customer support (13/10/2026, David): any problem a customer has goes from this form to the shop's inbox.
export default function Support({ searchParams }: { searchParams: { topic?: string; about?: string } }) {
  const lang = getLang(), T = ui(lang).support;
  const topic = Number.isInteger(Number(searchParams.topic)) ? Number(searchParams.topic) : undefined;
  return (
    <main className="wrap">
      <section className="signin support-page">
        <div>
          <span className="eyebrow">{T.eyebrow}</span>
          <h1>{T.h1}</h1>
          <p className="lede">{T.lede}</p>
          <div className="support-faq">
            <h2>{T.quick}</h2>
            {T.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
        <div className="panel"><SupportForm lang={lang} email={currentEmail() || undefined} topic={topic} about={(searchParams.about || '').slice(0, 80) || undefined} /></div>
      </section>
    </main>
  );
}
