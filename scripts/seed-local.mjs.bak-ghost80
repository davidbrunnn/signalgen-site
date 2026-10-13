// Local mode: builds local-data/catalog.json from the finished deliveries in ~/Desktop/SignalGen/Venda.
// For each folder listed in scripts/local-tracks.txt it reads Entrega/entrega.json + "<Title> · BEATPORT.txt", copies the cover
// (resized with sips on macOS) and the 30 s preview into public/local/<id>/, and points the downloads at the WAVs on disk.
// Usage: node scripts/seed-local.mjs [--venda <dir>] [--list <file>]     (sold counts of tracks already seeded are kept)
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const venda = arg('--venda', path.join(os.homedir(), 'Desktop', 'SignalGen', 'Venda'));
const listFile = arg('--list', path.join(root, 'scripts', 'local-tracks.txt'));
const dataDir = path.join(root, 'local-data');
const pub = path.join(root, 'public', 'local');

const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/#/g, 's').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const names = fs.readFileSync(listFile, 'utf8').split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
const prev = (() => { try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog.json'), 'utf8')); } catch { return { tracks: [] }; } })();
const sold = Object.fromEntries(prev.tracks.map((t) => [t.id, t.sold || 0]));

function beatport(dir, title) {
  const f = path.join(dir, `${title} · BEATPORT.txt`);
  const o = {};
  if (!fs.existsSync(f)) return o;
  const s = fs.readFileSync(f, 'utf8');
  const g = s.match(/Genero Beatport \.+ (.+)/); if (g) o.genre = g[1].trim();
  const k = s.match(/Tom \.+ ([A-G][#b]?m?)\b.*?Camelot (\d+[AB])/); if (k) { o.key = k[1]; o.camelot = k[2]; }
  const d = s.match(/TEXTO DE LANCAMENTO \(EN\):\s*\n\s*(.+)/);
  if (d) o.description = d[1].trim().replace(/, Radio Edit and Dub Mix included\.$/, ' and Radio Edit included.');
  const tg = s.match(/TAGS: (.+)/); if (tg) o.tags = tg[1].split(',').map((x) => x.trim());
  return o;
}

function copyCover(src, dst) {
  try { if (process.platform === 'darwin') { execFileSync('sips', ['-Z', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '84', src, '--out', dst], { stdio: 'ignore' }); return; } } catch { /* fall through */ }
  fs.copyFileSync(src, dst);
}

const tracks = [];
if (!fs.existsSync(venda)) { console.log(`no ${venda} — keeping the tracks already seeded`); tracks.push(...prev.tracks.filter((t) => t.kind === 'track')); }
else for (const name of names) {
  const dir = path.join(venda, name);
  const ent = path.join(dir, 'Entrega');
  let e;
  try { e = JSON.parse(fs.readFileSync(path.join(ent, 'entrega.json'), 'utf8')); } catch { console.log(`skip (no Entrega/entrega.json): ${name}`); continue; }
  const [, bpmS, keyS, genreS] = name.split(' · ');
  const title = e.titulo;
  const ext = e.versoes?.['Extended Mix'], rad = e.versoes?.['Radio Edit'];
  const bp = beatport(dir, title.replace(/ \(.*\)$/, ''));
  const key = bp.key || keyS;
  const bpm = Math.round(e.bpm || parseFloat(bpmS));
  const id = slug(`${title}-${bpm}-${key}`);
  fs.mkdirSync(path.join(pub, id), { recursive: true });
  const cover = fs.readdirSync(dir).find((x) => /CAPA\.jpg$/i.test(x));
  if (cover) copyCover(path.join(dir, cover), path.join(pub, id, 'cover.jpg'));
  const prevFile = ext?.preview || fs.readdirSync(ent).find((x) => /preview\.m4a$/.test(x));
  if (prevFile) fs.copyFileSync(path.join(ent, prevFile), path.join(pub, id, 'preview.m4a'));
  const wav = (v) => (v?.arquivo && fs.existsSync(path.join(ent, v.arquivo)) ? 'file:' + path.join(ent, v.arquivo) : undefined);
  tracks.push({
    id, title, artist: e.artista || 'Davin', bpm, key, camelot: bp.camelot, genre: bp.genre || genreS || 'Tech House',
    duration: Math.round(ext?.duracao || 0), radioDuration: rad?.duracao ? Math.round(rad.duracao) : undefined,
    lufs: ext?.lufs, truePeak: ext?.true_peak, description: bp.description, tags: bp.tags,
    cover: cover ? `/local/${id}/cover.jpg` : undefined, preview: prevFile ? `/local/${id}/preview.m4a` : undefined,
    files: { extended: wav(ext), radio: wav(rad) },
    published: new Date((e.quando || '').replace(' ', 'T') || Date.now()).toISOString(),
    sold: sold[id] || 0, kind: 'track',
  });
  console.log(`ok  ${title}  (${bpm} BPM ${key}, ${bp.genre || genreS})`);
}

// ───── products: the SignalGen software, the sample kits and the preset packs
const sg = path.dirname(venda);                                   // ~/Desktop/SignalGen
const products = [];
const file = (p) => (fs.existsSync(p) ? 'file:' + p : undefined);
const mb = (p) => (fs.existsSync(p) ? Math.round(fs.statSync(p).size / 1048576) : undefined);

const pkg = path.join(sg, 'Publicar', 'SignalGen-5.1.0-mac.pkg');
products.push({
  id: 'signalgen', kind: 'software', title: 'SignalGen', artist: 'SignalGen', bpm: 0, key: '', duration: 0,
  subtitle: 'Version 5 · AU + VST3 for Ableton Live 12 · macOS', genre: 'Tech House · Bass House · Minimal · UK Garage · Hip-Hop',
  price: Number(process.env.PRODUCT_PRICE_USD || 249), nonExclusive: true, licenseProduct: 'bundle',
  description: 'The generator behind every track on this site. Choose a genre, a key and a tempo and SignalGen writes a complete arrangement in Ableton Live — drums, bass, music, vocals and FX as editable MIDI and audio, gain-staged, mixed and mastered with native devices. Eight takes per click, parts you can rewrite bar by bar, and Reamp: drop any song in and get its DNA back as a new one.',
  features: ['Full track in one click: 150+ bars, intro to outro', 'Eight takes per click, pick by ear', 'Every part as MIDI: lead, chords, bass, arp, pad, drums', 'Rewrite only the bars you select, on the song’s chords', 'Reamp: any song in, its DNA out as a new track', 'Mixed and mastered with Live’s native devices', 'SignalGen Mix: the channel chain the engine mixes with', 'SignalGen Sounds: 200+ presets built from reference records', 'Measured against 17 chart tech house references', 'Lifetime license, offline, 2 computers'],
  screenshots: ['/product/01_create.png', '/product/10_pick.png', '/product/05_midi.png', '/product/04_master.png'],
  cover: '/product/live-set.jpg', sizeMb: mb(pkg), files: { pkg: file(pkg) },
  downloads: [{ key: 'pkg', label: 'SignalGen 5.1.0 for macOS', note: 'Installer (.pkg), AU + VST3' }],
  published: '2026-10-03T00:00:00.000Z', sold: sold['signalgen'] || 0,
});

// Sample packs and Serum 2 preset packs, as prepared by tools/kit_loja.py on the Mac (scripts/kits.json): one volume = a sample pack,
// its Serum 2 edition when there is one, and the bundle of both (25 % off). Plus the complete collection.
let vols = [];
try { vols = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'kits.json'), 'utf8')).filter((v) => v.formats); } catch { console.log('no scripts/kits.json — run `python3 tools/kit_loja.py` on the Mac first'); }
const rebase = (z) => (z ? z.replace(/^.*?\/SignalGen\//, sg + '/') : z);        // the prep may run in another mount
const VOCAL = {
  'Basement Orders': 'Twenty-four original male vocal phrases for tech house and house — three voices, Knox, Orion and Barrett — dry, 48 kHz, first syllable on the one. Every phrase also comes cut to exact 2- and 4-bar loops at every tempo from 124 to 134 BPM: drag to the grid, no warping.',
  'Velvet Hours': 'Twenty-four original female vocal phrases for tech house and house — three voices, Vesper, Luna and Sloane — dry, 48 kHz, first syllable on the one. Every phrase also comes cut to exact 2- and 4-bar loops at every tempo from 124 to 134 BPM: drag to the grid, no warping.',
};
const mergeLoops = (inside) => {                                                  // "Loops / 124 BPM", "Loops / 125 BPM"… → one row
  const lp = inside.filter((r) => /^Loops \/ \d+ BPM$/.test(r.folder));
  if (lp.length < 3) return inside;
  const bpms = lp.map((r) => Number(r.folder.match(/\d+/)[0]));
  const n = lp.reduce((a, r) => a + r.count, 0);
  return [...inside.filter((r) => !lp.includes(r)), { folder: `Loops / ${Math.min(...bpms)}–${Math.max(...bpms)} BPM`, count: n, what: `${n} WAV loops, one folder per tempo` }];
};
const all = [];
const pad2 = (n) => String(n).padStart(2, '0');
for (const v of vols) {
  const w = v.formats.find((f) => f.format === 'wav'), sv = v.formats.find((f) => f.format === 'serum');
  const tempo = v.bpm ? `${v.bpm} BPM` : v.type === 'Vocal Kit' ? '124–134 BPM' : 'one shots';
  const genre = v.genre.replace(/ · .*$/, '');
  const base = { artist: 'SignalGen', key: '', duration: 0, nonExclusive: true, group: v.id, vol: v.vol, keys: v.keys, genre, bpm: v.bpm || 0 };
  const sku = (f, id, kind, extra) => ({
    ...base, id, kind, format: f.format, packType: f.type, title: v.title, price: f.price,
    subtitle: `Vol. ${pad2(v.vol)} · ${f.type} · ${genre} · ${tempo}`, contents: (f.contents || '').replace(', masterizado', ', mastered').replace('(+ previews e MIDI)', '+ previews and MIDI'), specs: f.specs,
    counts: { wav: f.wav, midi: f.midi, presets: f.presets }, inside: mergeLoops(f.inside || []), samples: f.samples || [],
    description: f.description || VOCAL[v.title] || '', cover: f.cover, preview: f.demo, sizeMb: f.sizeMb,
    files: { zip: file(rebase(f.zip)) }, published: new Date(2026, 9, 8, 0, v.vol).toISOString(), sold: sold[id] || 0, ...extra,
  });
  const wid = v.id, sid = `${v.id}-serum`;
  const W = sku(w, wid, 'kit', { downloads: [{ key: 'zip', label: `${v.title} — sample pack`, note: `ZIP · ${w.specs}` }] });
  all.push(W);
  if (sv) {
    const S = sku(sv, sid, 'preset', { price: Math.min(sv.price, w.price), downloads: [{ key: 'zip', label: `${v.title} — Serum 2 presets`, note: 'ZIP · .SerumPreset + previews + MIDI' }] });
    all.push(S);
    const was = W.price + S.price, price = Math.round(was * 0.75) - 1 + (Math.round(was * 0.75) - 1 > 0 ? 0 : 1);
    all.push({
      ...base, id: `${v.id}-bundle`, kind: 'bundle', format: 'bundle', packType: 'Sample pack + Serum 2 presets', title: v.title, price, wasPrice: was,
      subtitle: `Vol. ${pad2(v.vol)} · Bundle · ${genre} · ${tempo}`, contents: `${W.contents} + ${sv.presets} Serum 2 presets`, specs: `${w.specs} + Serum 2`,
      counts: { wav: w.wav, midi: w.midi, presets: sv.presets }, inside: [...W.inside, ...S.inside.map((r) => ({ ...r, folder: `Serum 2 / ${r.folder}` }))],
      samples: [...W.samples.slice(0, 8), ...S.samples.slice(0, 4)], includes: [wid, sid],
      description: `Both editions of ${v.title}: the sample pack and the exact Serum 2 patches that play its loops — hear the loop, load the preset, play your own notes.`,
      cover: W.cover, preview: W.preview, sizeMb: (W.sizeMb || 0) + (S.sizeMb || 0),
      files: { zip: W.files.zip, presets: S.files.zip },
      downloads: [W.downloads[0], { ...S.downloads[0], key: 'presets' }],
      published: W.published, sold: sold[`${v.id}-bundle`] || 0,
    });
  }
}
products.push(...all);
const parts = all.filter((x) => x.kind !== 'bundle');
if (parts.length > 3) {
  const was = parts.reduce((a, x) => a + x.price, 0);
  const files = {}, downloads = [];
  parts.forEach((x, i) => { const k = `z${pad2(i + 1)}`; files[k] = x.files.zip; downloads.push({ key: k, label: x.downloads[0].label, note: x.downloads[0].note }); });
  const dc = parts.find((x) => x.vol === 13 && x.kind === 'kit') || parts[0];
  products.push({
    id: 'complete-collection', kind: 'bundle', format: 'collection', packType: 'Complete collection', title: 'The Complete Collection', artist: 'SignalGen',
    bpm: 0, key: '', duration: 0, genre: 'Tech House · Bass House · Minimal · UK Garage', nonExclusive: true, group: 'complete-collection',
    price: Math.max(49, Math.round(was * 0.4 / 10) * 10 - 1), wasPrice: was,
    subtitle: `All ${vols.length} volumes · ${parts.filter((x) => x.kind === 'kit').length} sample packs + ${parts.filter((x) => x.kind === 'preset').length} Serum 2 preset packs`,
    contents: `${parts.reduce((a, x) => a + (x.counts.wav || 0), 0)} WAV · ${parts.reduce((a, x) => a + (x.counts.midi || 0), 0)} MIDI · ${parts.reduce((a, x) => a + (x.counts.presets || 0), 0)} Serum 2 presets`,
    specs: '48 kHz / 24-bit WAV + Serum 2', counts: { wav: parts.reduce((a, x) => a + (x.counts.wav || 0), 0), midi: parts.reduce((a, x) => a + (x.counts.midi || 0), 0), presets: parts.reduce((a, x) => a + (x.counts.presets || 0), 0) },
    inside: parts.map((x) => ({ folder: `Vol. ${pad2(x.vol)} ${x.title}${x.kind === 'preset' ? ' (Serum 2)' : ''}`, count: x.kind === 'preset' ? x.counts.presets : x.counts.wav, what: x.contents })),
    samples: vols.map((v) => all.find((x) => x.id === v.id)).filter(Boolean).map((x) => ({ name: `Vol. ${pad2(x.vol)} ${x.title} — demo`, tag: x.packType, src: x.preview })),
    includes: parts.map((x) => x.id),
    description: 'Every SignalGen sample pack and every Serum 2 preset pack, present and in one purchase — vocals, kicks, bass, stabs, leads, MIDI and a full tech house pack, all synthesized in-house. Volumes added later are not included.',
    cover: dc.cover, preview: dc.preview, sizeMb: parts.reduce((a, x) => a + (x.sizeMb || 0), 0), files, downloads,
    published: new Date(2026, 9, 8, 1).toISOString(), sold: sold['complete-collection'] || 0,
  });
}

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'catalog.json'), JSON.stringify({ tracks: [...products, ...tracks], updated: new Date().toISOString() }, null, 1));
console.log(`\n${tracks.length} tracks + ${products.length} products (${vols.length} sound volumes) -> local-data/catalog.json`);
