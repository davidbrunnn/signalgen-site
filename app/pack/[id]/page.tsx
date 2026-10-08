import PackStatus from './PackStatus';

export const dynamic = 'force-dynamic';

export default function PackJobPage({ params }: { params: { id: string } }) {
  return (
    <main className="wrap">
      <section className="hero-plain" style={{ paddingBottom: 24 }}>
        <h1>Your <em>pack</em>.</h1>
        <p>Keep this page: it is your download. The engine separates the stems, reverse-engineers every part and rebuilds the set — about an hour.</p>
      </section>
      <PackStatus id={params.id} />
    </main>
  );
}
