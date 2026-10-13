import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PlayerProvider from '@/components/Player';
import LangSwitch from '@/components/LangSwitch';
import { getLang, HTML_LANG } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { currentEmail } from '@/lib/account';

export const metadata: Metadata = {
  title: 'SignalGen — plugins avançados, preço justo: Refiner, Monet e Clocker',
  description: 'Plugins avançados, preço justo. O EQ Refiner, o sintetizador Monet e o Clocker grátis (BPM e tom), para macOS em AU e VST3. Instalador oficial, licença vitalícia, download na hora.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#0a0c10' };

/** The mark: the plugins' header — SIGNALGEN in bold caps with wide tracking and the ENGINE dot (UI 2, 10/10/2026). */
function Mark() {
  return <span className="dot-mark" aria-hidden="true" />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang(), U = ui(lang);
  const signedIn = !!currentEmail();
  return (
    <html lang={HTML_LANG[lang]}>
      <body>
        <PlayerProvider>
          <header className="wrap top">
            <Link href="/" className="mark"><Mark /> SIGNALGEN</Link>
            <nav aria-label="Main" className="capsule">
              <Link href="/#plugins">{U.nav.plugins}</Link>
              <Link href="/#packs">{U.nav.packs}</Link>
              <Link href="/signalgen">{U.nav.signalgen}</Link>
              <Link href="/ghost">Ghost<span className="xl"> production</span></Link>
            </nav>
            <div className="top-end">
              <LangSwitch lang={lang} />
              <Link href={signedIn ? '/conta' : '/entrar'} className={signedIn ? 'acct-link on' : 'acct-link'}>{signedIn ? <><span className="wide">{U.nav.account}</span><span className="tight">{U.nav.accountShort}</span></> : U.nav.signIn}</Link>
            </div>
          </header>
          {children}
          <footer className="wrap site">
            <div><b>SignalGen</b> — {U.footer.line} © {new Date().getFullYear()}</div>
            <nav aria-label="Footer">
              <Link href="/refiner">Refiner</Link>
              <Link href="/monet">Monet</Link>
              <Link href="/clocker">Clocker</Link>
              <Link href="/signalgen">SignalGen</Link>
              <Link href="/ghost">{U.nav.ghost}</Link>
              <Link href={signedIn ? '/conta' : '/entrar'}>{signedIn ? U.nav.account : U.nav.signIn}</Link>
              <Link href="/license">{U.footer.license}</Link>
            </nav>
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}
