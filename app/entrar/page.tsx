import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getLang } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { currentEmail } from '@/lib/account';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata { return { title: ui(getLang()).login.title, robots: { index: false } }; }

// The sign-in page (13/10/2026). No password: the buyer's e-mail gets a link, or the e-mail + a license key opens the account.
export default function SignIn({ searchParams }: { searchParams: { e?: string } }) {
  if (currentEmail()) redirect('/conta');
  const lang = getLang(), T = ui(lang).login;
  return (
    <main className="wrap">
      <section className="signin">
        <div>
          <span className="eyebrow">SignalGen</span>
          <h1>{T.h1}</h1>
          <p className="lede">{T.lede}</p>
        </div>
        <div className="panel">
          <LoginForm lang={lang} initialError={searchParams.e} />
          <p className="muted small">{T.noBuy} <Link href="/#plugins" style={{ textDecoration: 'underline' }}>{T.toPlugins}</Link></p>
        </div>
      </section>
    </main>
  );
}
