// SignalGen site · every fact shown on the page lives here, so changing a price or a demo is one edit.

export const PRICE = {
  monthly: Number(process.env.NEXT_PUBLIC_PRICE_MONTHLY || 19),
  lifetime: Number(process.env.NEXT_PUBLIC_PRICE_LIFETIME || 249),
};

export const GENRES = ['House', 'Tech House', 'Bass House', 'UK Garage', 'Minimal', 'Hip-Hop', 'Boombap', 'R&B Soul'] as const;
export type Genre = (typeof GENRES)[number];

export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const MOODS = ['Night', 'Hypnotic', 'Euphoric', 'Dark', 'Groovy'] as const;

/** Real renders: the 30 s previews the engine delivered with these sets (Venda/<title>/Entrega), untouched. */
export type Demo = { slug: string; title: string; genre: Genre; bpm: number; key: string; length: string; radio: string; lufs: number };
export const DEMOS: Demo[] = [
  { slug: 'capricornus-dionysus', title: 'Capricornus Dionysus', genre: 'Bass House', bpm: 128, key: 'F minor', length: '5:19', radio: '4:49', lufs: -9.2 },
  { slug: 'scorpius-kali', title: 'Scorpius Kali', genre: 'Tech House', bpm: 128, key: 'G minor', length: '4:34', radio: '3:34', lufs: -10.0 },
  { slug: 'pegasus-baldur', title: 'Pegasus Baldur', genre: 'Minimal', bpm: 128, key: 'F minor', length: '5:04', radio: '4:34', lufs: -8.6 },
  { slug: 'monoceros-morrigan', title: 'Monoceros Morrigan', genre: 'Bass House', bpm: 128, key: 'F minor', length: '4:34', radio: '3:34', lufs: -9.4 },
];

/** The closest real render for a genre picked in the hero (falls back to the Tech House one). */
export function demoFor(g: string): Demo {
  const near: Record<string, string> = { House: 'Tech House', 'UK Garage': 'Bass House', 'Hip-Hop': 'Minimal', Boombap: 'Minimal', 'R&B Soul': 'Minimal' };
  return DEMOS.find((d) => d.genre === g) || DEMOS.find((d) => d.genre === near[g]) || DEMOS[1];
}

export function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
