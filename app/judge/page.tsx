import Judge from './Judge';

export const metadata = { title: 'Which drop wins?' };

export default function JudgePage() {
  return (
    <main className="wrap">
      <section className="hero-plain" style={{ paddingBottom: 28 }}>
        <h1>Which <em>drop</em> wins?</h1>
        <p>Two unreleased tracks, 30 seconds each, no names. Your pick trains the engine that makes the next ones. Press A or B on your keyboard.</p>
      </section>
      <Judge />
    </main>
  );
}
