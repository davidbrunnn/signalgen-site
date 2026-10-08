import type { Track } from '@/lib/catalog';
import { priceOf, isSold, hrefOf } from '@/lib/catalog';
import type { PTrack } from '@/components/Player';

export const toP = (t: Track): PTrack => ({
  id: t.id, title: t.title, artist: t.artist, cover: t.cover, preview: t.preview, bpm: t.bpm, key: t.key, genre: t.genre, price: priceOf(t), sold: isSold(t), href: hrefOf(t),
});
