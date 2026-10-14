import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PlayerProvider from '@/components/Player';
import LangSwitch from '@/components/LangSwitch';
import { getLang, HTML_LANG } from '@/lib/i18n';
import { ui } from '@/lib/i18n-ui';
import { currentEmail } from '@/lib/account';

export const metadata: Metadata = {
  title: 'SignalGen — a faixa inteira no Ableton Live, em um clique',
  description: 'O SignalGen gera a música completa no seu Ableton Live: bateria, baixo, lead, acordes e vocais em MIDI, mixada e masterizada. Remix de qualquer voz em qualquer beat, WAV em projeto do Live e timbres recriados no Monet. Mais o EQ Refiner, o Clocker grátis e vocais exclusivos.',
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
              <Link href="/#packs"><span className="xl">{U.nav.packs}</span><span className="xs">{U.nav.packsShort}</span></Link>
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
              <Link href="/#packs">{U.nav.packs}</Link>
              <Link href="/ghost">{U.nav.ghost}</Link>
              <Link href={signedIn ? '/conta' : '/entrar'}>{signedIn ? U.nav.account : U.nav.signIn}</Link>
              <Link href="/suporte">{U.nav.support}</Link>
              <Link href="/license">{U.footer.license}</Link>
            </nav>
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}
