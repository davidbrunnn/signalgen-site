import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="wrap narrow">
      <h1>This page is not here.</h1>
      <p className="muted">The link may be old. Every pack is in the store; ghost productions leave the catalog once they are sold.</p>
      <Link href="/#store" className="btn">Back to the packs</Link>
    </main>
  );
}
