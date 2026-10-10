import Status from './Status';

export const dynamic = 'force-dynamic';

export default function StarterJob({ params }: { params: { id: string } }) {
  return (
    <main className="wrap">
      <section className="hero" style={{ paddingBottom: 34 }}><h1>Your <em>songstarter</em>.</h1></section>
      <Status id={params.id} />
    </main>
  );
}
