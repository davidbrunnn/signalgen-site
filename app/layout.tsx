import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SIGNAL STUDIO',
  description: 'Unreleased club tracks by Davin · mastered, radio edit included · US$ 59 per track.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="wrap top">
          <Link href="/" className="logo">SIGNAL <span>STUDIO</span></Link>
          <nav>
            <Link href="/#today">Today</Link>
            <Link href="/#all">Catalog</Link>
            <Link href="/#license">License</Link>
            <Link href="/pack">Pack</Link>
          </nav>
        </header>
        {children}
        <footer className="wrap">
          <div>SIGNAL STUDIO · Davin · {new Date().getFullYear()}</div>
          <div>WAV 44.1 kHz / 24 bit · Extended + Radio Edit · secure checkout by Stripe</div>
        </footer>
      </body>
    </html>
  );
}
