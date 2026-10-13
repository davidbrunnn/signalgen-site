// EXCLUSIVE VOCALS (13/10/2026, David): "só pode uma venda de cada vocal, ninguém mais terá".
// An item of kind 'vocal' is one vocal or a pack of vocals sold ONCE: the sale marks it sold (lib/catalog recordSale — a second
// payment arriving at the same moment is refunded by the webhook) and it leaves the grid.
// Items come from the catalog (the Mac publishes them from ~/Desktop/SignalGen/Vocais, scripts/seed-local.mjs). ANNOUNCED holds
// the ones shown before their files and price exist: they appear as "em breve" and cannot be bought.
import type { Track } from '@/lib/catalog';
import { forSale, isSold } from '@/lib/catalog';

export const ANNOUNCED: Track[] = [
  {
    id: 'camaleon-pack', kind: 'vocal', title: 'Camaleon Pack', artist: 'SignalGen', bpm: 0, key: '', genre: 'Vocals', duration: 0,
    voices: 6, credit: 'studio', cover: '/vocals/camaleon-pack/cover.svg', files: {}, published: '2026-10-13T00:00:00.000Z',
  },
];

export type VocalState = 'open' | 'soon' | 'sold';
export const vocalState = (t: Track): VocalState => (isSold(t) ? 'sold' : forSale(t) ? 'open' : 'soon');

/** Every vocal to show: the catalog's, plus the announced ones the catalog does not have yet. Sold ones leave the list. */
export function vocalsOf(tracks: Track[]): Track[] {
  const mine = tracks.filter((t) => t.kind === 'vocal');
  const ids = new Set(mine.map((t) => t.id));
  return [...mine, ...ANNOUNCED.filter((t) => !ids.has(t.id))].filter((t) => vocalState(t) !== 'sold')
    .sort((a, b) => Number(vocalState(b) === 'open') - Number(vocalState(a) === 'open') || (b.published > a.published ? 1 : -1));
}
export function findVocal(tracks: Track[], id: string): Track | undefined {
  return tracks.find((t) => t.kind === 'vocal' && t.id === id) || ANNOUNCED.find((t) => t.id === id);
}
