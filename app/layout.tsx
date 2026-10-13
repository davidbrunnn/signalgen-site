import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PlayerProvider from '@/components/Player';
import LangSwitch from '@/components/LangSwitch';
import { getLang, t, HTML_LANG } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'SignalGen — plugins e vocais para produtores: Refiner, Monet, Tempo e packs',
  description: 'Marketplace SignalGen: o EQ Refiner, o synth Monet, o Tempo grátis (BPM e tom) e packs de vocais e Serum 2. Instalador oficial, licença vitalícia, download na hora.',
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
              <Link href="/#plugins">Plugins</Link>
              <Link href="/#packs">{L.nav.packs}</Link>
              <Link href="/signalgen">{L.nav.signalgen}</Link>
              <Link href="/ghost">Ghost<span className="xl"> production</span></Link>
            </nav>
            <LangSwitch lang={lang} />
          </header>
          {children}
          <footer className="wrap site">
            <div><b>SignalGen</b> — {L.footer.line} © {new Date().getFullYear()}</div>
            <nav aria-label="Footer">
              <Link href="/#plugins">Plugins</Link>
              <Link href="/#packs">{L.nav.packs}</Link>
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
