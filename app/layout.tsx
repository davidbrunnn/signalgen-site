import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Mark from './Mark';

export const metadata: Metadata = {
  title: 'SignalGen · The advanced songstarter for Ableton Live',
  description: 'Pick a genre, a key, a tempo and a mood. SignalGen writes the whole track and opens it in Ableton Live: arrangement, sounds, mix and master.',
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'SignalGen', description: 'The songstarter that finishes the song.', images: ['/screens/start.webp'] },
};
export const viewport: Viewport = { themeColor: '#03060b' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="top">
          <div className="wrap top-in">
            <Link href="/" className="logo" aria-label="SignalGen home"><Mark /> SignalGen</Link>
            <nav aria-label="Main">
              <a href="/#how">How it works</a>
              <a href="/#listen">Listen</a>
              <a href="/#pricing">Pricing</a>
              <a href="/#faq">FAQ</a>
            </nav>
            <a href="/#access" className="btn btn-sm">Early access</a>
          </div>
        </header>
        <div id="main">{children}</div>
        <footer className="wrap foot">
          <span><Mark /> SignalGen © {new Date().getFullYear()}</span>
          <span>For Ableton Live 12 on macOS. AU and VST3.</span>
        </footer>
      </body>
    </html>
  );
}
