import Create from './Create';

export const metadata = { title: 'New songstarter · SignalGen' };

export default function CreatePage() {
  return (
    <main className="wrap">
      <section className="hero" style={{ paddingBottom: 34 }}>
        <h1>New <em>songstarter</em>.</h1>
        <p className="lead">The studio engine writes a whole Ableton Live set — drums, bass, chords, lead, arrangement and master — and sends it back as a zip. Opens in Live 11 or 12 on Windows or Mac with no third-party plugin.</p>
      </section>
      <Create />
    </main>
  );
}
