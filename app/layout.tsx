import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PlayerProvider from '@/components/Player';

export const metadata: Metadata = {
  title: 'SignalGen — a finished club track in Ableton Live, one click',
  description: 'SignalGen writes whole tech house, bass house and minimal arrangements in Ableton Live: drums, bass, music, vocals, FX, mixed and mastered. Plus sample kits and presets from the same engine.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#08090b' };

/** The mark: a 13 × 8 golden rectangle split into its 8-square — the same figure as the home page hero. */
function Mark() {
  return (
    <svg viewBox="0 0 21 13" aria-hidden="true">
      <rect x="0.5" y="0.5" width="20" height="12" fill="none" stroke="currentColor" />
      <rect x="0.5" y="0.5" width="12" height="12" fill="#e8a23a" />
      <path d="M12.5 8h8M15.5 8v4.5" stroke="currentColor" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <header className="wrap top">
            <Link href="/" className="mark"><Mark /> SignalGen</Link>
            <nav aria-label="Main">
              <Link href="/#listen">Listen</Link>
              <Link href="/#how" className="opt">How it works</Link>
              <Link href="/#sounds">Sounds</Link>
              <Link href="/#pricing" className="btn small">Get SignalGen</Link>
            </nav>
          </header>
          {children}
          <footer className="wrap site">
            <div><b>SignalGen</b> — music generation for Ableton Live, by Davin. Payments by Stripe. © {new Date().getFullYear()}</div>
            <nav aria-label="Footer">
              <Link href="/#sounds">Kits and presets</Link>
              <Link href="/pack">Any song to Ableton pack</Link>
              <Link href="/judge">Help us choose</Link>
              <Link href="/license">License terms</Link>
              <a href="/SignalStudio_Whitepaper.pdf">Whitepaper</a>
            </nav>
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}
