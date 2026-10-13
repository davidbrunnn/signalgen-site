import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PlayerProvider from '@/components/Player';
import LangSwitch from '@/components/LangSwitch';
import { getLang, t, HTML_LANG } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'SignalGen — gerador musical para Ableton Live, o synth Monet, packs e ghost production',
  description: 'SignalGen: gera faixas completas, separa stems, remixa, reconstrói e recria timbres no Monet, dentro do Ableton Live. Mais sample packs e ghost production sob encomenda.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#0a0c10' };

/** The mark: the plugins' header — SIGNALGEN in bold caps with wide tracking and the ENGINE dot (UI 2, 10/10/2026). */
function Mark() {
  return <span className="dot-mark" aria-hidden="true" />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang(), L = t(lang);
  return (
    <html lang={HTML_LANG[lang]}>
      <body>
        <PlayerProvider>
          <header className="wrap top">
            <Link href="/" className="mark"><Mark /> SIGNALGEN</Link>
            <nav aria-label="Main" className="capsule">
              <Link href="/#store">{L.nav.packs}</Link>
              <Link href="/signalgen">{L.nav.signalgen}</Link>
              <Link href="/monet">{L.nav.monet}</Link>
              <Link href="/ghost">{L.nav.ghost}</Link>
            </nav>
            <LangSwitch lang={lang} />
          </header>
          {children}
          <footer className="wrap site">
            <div><b>SignalGen</b> — {L.footer.line} © {new Date().getFullYear()}</div>
            <nav aria-label="Footer">
              <Link href="/#store">{L.footer.all}</Link>
              <Link href="/signalgen">{L.nav.signalgen}</Link>
              <Link href="/monet">{L.nav.monet}</Link>
              <Link href="/ghost">{L.nav.ghost}</Link>
              <Link href="/license">{L.footer.license}</Link>
            </nav>
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}
