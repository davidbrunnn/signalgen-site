import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PlayerProvider from '@/components/Player';

export const metadata: Metadata = {
  title: 'SignalGen Sounds — sample packs and Serum 2 presets',
  description: 'Tech house sample packs and Serum 2 preset packs synthesized in-house: key and tempo in every file name, MIDI with every loop, royalty-free. Ghost productions on request.',
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
              <Link href="/#store">Packs</Link>
              <Link href="/p/complete-collection" className="opt">Collection</Link>
              <Link href="/#license" className="opt">License</Link>
              <Link href="/ghost" className="btn small quiet">Ghost production</Link>
            </nav>
          </header>
          {children}
          <footer className="wrap site">
            <div><b>SignalGen Sounds</b> — sample packs and presets made by SignalGen. Payments by Stripe. © {new Date().getFullYear()}</div>
            <nav aria-label="Footer">
              <Link href="/#store">All packs</Link>
              <Link href="/p/complete-collection">Complete collection</Link>
              <Link href="/ghost">Ghost production</Link>
              <Link href="/license">License terms</Link>
            </nav>
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}
