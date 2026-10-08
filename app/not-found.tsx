import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="wrap narrow">
      <h1>This page is not here.</h1>
      <p className="muted">If you were looking for a track, it may have been signed — exclusive records leave the catalog once they are sold.</p>
      <Link href="/#catalog" className="btn">See available tracks</Link>
    </main>
  );
}
