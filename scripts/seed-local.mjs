// Local mode: builds local-data/catalog.json from the finished deliveries in ~/Desktop/SignalGen/Venda.
// GHOST PRODUCTION (10/10/2026, David: "apenas faixas mapeadas e aprovadas para venda, nota acima de 80%"): the tracks are no longer
// a hand-made list (scripts/local-tracks.txt is not read). A track enters only when BOTH:
//   approved  its last nota in music-gen/out/signalgen/v2_vereditos.jsonl (the 1-5 of the SignalGen Studio) / 5 >= GHOST_MIN
//             (0.8 = 4 of 5; GHOST_MIN=0.81 would keep only the 5s). Remixes and reamps of other people's records ("Remix",
//             "(Motor)" in the title) never go to the store.
//   mapped    a Venda folder with Entrega/entrega.json, the Extended Mix and the Radio Edit WAV on disk and the 30 s preview.
// For each one it reads Entrega/entrega.json + "<Title> · BEATPORT.txt", copies the cover
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
const GHOST_MIN = Number(process.env.GHOST_MIN || 0.8);
const notasFile = arg('--notas', path.join(path.dirname(venda), 'codigo', 'music-gen', 'out', 'signalgen', 'v2_vereditos.jsonl'));
const notas = new Map();                                            // the LAST nota of each title wins
try {
  for (const l of fs.readFileSync(notasFile, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { const x = JSON.parse(l); const n = (x.nome || '').trim(); if (n && typeof x.nota === 'number') notas.set(n.toLowerCase(), { nome: n, nota: x.nota }); } catch { /* skip */ }
  }
} catch { console.log(`no ${notasFile} — no track is approved`); }
const folderOf = (nome) => {                                       // "<Title>" (old) or "<Title> · BPM · key · genre" (the rule since v113), newest first
  if (!fs.existsSync(venda)) return null;
  const c = fs.readdirSync(venda).filter((d) => (d === nome || d.split(' · ')[0] === nome) && fs.statSync(path.join(venda, d)).isDirectory());
  c.sort((a, b) => fs.statSync(path.join(venda, b)).mtimeMs - fs.statSync(path.join(venda, a)).mtimeMs);
  return c[0] || null;
};
const scoreOf = new Map();
const names = [];
for (const { nome, nota } of notas.values()) {
  const score = nota / 5;
  if (score < GHOST_MIN - 1e-9) continue;
  if (/remix|\(motor\)/i.test(nome)) { console.log(`skip (not ours to sell): ${nome}`); continue; }
  const f = folderOf(nome);
  if (!f) { console.log(`skip (approved ${nota}/5, but no folder in Venda): ${nome}`); continue; }
  names.push(f); scoreOf.set(f, { score, nota });
}
// 10/10/2026: ghost production became ON DEMAND (/ghost: brief, US$ 150, stages + chat). The store sells no finished tracks any more:
// the approved list above only goes into the catalog with GHOST_CATALOG=1.
if (process.env.GHOST_CATALOG !== '1') names.length = 0;
console.log(process.env.GHOST_CATALOG === '1' ? `${names.length} approved tracks (nota >= ${(GHOST_MIN * 5).toFixed(1)} of 5) to map` : 'ghost production is on demand: no tracks in the catalog');
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
if (!fs.existsSync(venda)) { console.log(`no ${venda}`); }
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
  if (!wav(ext) || !wav(rad) || !prevFile) { console.log(`skip (approved, not mapped: ${!wav(ext) ? 'Extended Mix ' : ''}${!wav(rad) ? 'Radio Edit ' : ''}${!prevFile ? 'preview' : ''}): ${name}`); continue; }
  tracks.push({
    id, title, artist: e.artista || 'Davin', bpm, key, camelot: bp.camelot, genre: bp.genre || genreS || 'Tech House',
    duration: Math.round(ext?.duracao || 0), radioDuration: rad?.duracao ? Math.round(rad.duracao) : undefined,
    lufs: ext?.lufs, truePeak: ext?.true_peak, description: bp.description, tags: bp.tags,
    cover: cover ? `/local/${id}/cover.jpg` : undefined, preview: prevFile ? `/local/${id}/preview.m4a` : undefined,
    files: { extended: wav(ext), radio: wav(rad) },
    published: new Date((e.quando || '').replace(' ', 'T') || Date.now()).toISOString(),
    sold: sold[id] || 0, kind: 'track', score: scoreOf.get(name)?.score,
  });
  console.log(`ok  ${title}  (${bpm} BPM ${key}, ${bp.genre || genreS}) · nota ${scoreOf.get(name)?.nota}/5`);
}

// ───── products: the SignalGen software, the sample kits and the preset packs
const sg = path.dirname(venda);                                   // ~/Desktop/SignalGen
const products = [];
const file = (p) => (fs.existsSync(p) ? 'file:' + p : undefined);
const mb = (p) => (fs.existsSync(p) ? Math.round(fs.statSync(p).size / 1048576) : undefined);

const pkgs = fs.existsSync(path.join(sg, 'Publicar')) ? fs.readdirSync(path.join(sg, 'Publicar')).filter((x) => /^SignalGen-[\d.]+-mac\.pkg$/.test(x)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : [];
const pkg = path.join(sg, 'Publicar', pkgs[pkgs.length - 1] || 'SignalGen-5.2.0-mac.pkg');                   // the newest installer
const pkgVer = (path.basename(pkg).match(/SignalGen-([\d.]+)-mac/) || [])[1] || '5';
// 13/10/2026: each plugin sold on its own ships its own installer (installer-mac/build-pkg.command with SG_SO=<plugin>): <Name>-<ver>-mac.pkg
const solo = (name) => {
  const d = path.join(sg, 'Publicar'); if (!fs.existsSync(d)) return null;
  const v = fs.readdirSync(d).filter((x) => new RegExp(`^${name}-[\\d.]+-mac\\.pkg$`).test(x)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return v.length ? path.join(d, v[v.length - 1]) : null;
};
const soloDl = (name, p) => (p ? { key: 'pkg', label: `${name} ${(path.basename(p).match(/-([\d.]+)-mac/) || [])[1] || ''} for macOS`.replace('  ', ' '), note: `Installer (.pkg) · ${name} only · AU + VST3 · Apple Silicon + Intel` }
  : { key: 'pkg', label: `${name} for macOS`, note: `SignalGen installer (.pkg) — keep "${name}" in the installer choices · AU + VST3` });
products.push({
  id: 'signalgen', kind: 'software', title: 'SignalGen', artist: 'SignalGen', bpm: 0, key: '', duration: 0,
  subtitle: 'Version 5 · AU + VST3 for Ableton Live 12 · macOS', genre: 'Tech House · Bass House · Minimal · UK Garage · Hip-Hop',
  price: Number(process.env.PRODUCT_PRICE_USD || 249), nonExclusive: true, licenseProduct: 'bundle',
  description: 'The generator behind every track on this site. Choose a genre, a key and a tempo and SignalGen writes a complete arrangement in Ableton Live — drums, bass, music, vocals and FX as editable MIDI and audio, gain-staged, mixed and mastered with native devices. Eight takes per click, parts you can rewrite bar by bar, and Reamp: drop any song in and get its DNA back as a new one.',
  features: ['Full track in one click: 150+ bars, intro to outro', 'Eight takes per click, pick by ear', 'Every part as MIDI: lead, chords, bass, arp, pad, drums', 'Rewrite only the bars you select, on the song’s chords', 'Reamp: any song in, its DNA out as a new track', 'Mixed and mastered with Live’s native devices', 'SignalGen Mix: the channel chain the engine mixes with', 'SignalGen Sounds: 200+ presets built from reference records', 'Measured against 17 chart tech house references', 'Lifetime license, offline, 2 computers'],
  screenshots: ['/product/ui2/sg_05_generate_pronto.jpg', '/product/ui2/sg_07_remix_pronto.jpg', '/product/ui2/sg_08_rebuild_pronto.jpg', '/product/ui2/sg_09_resynth_pronto.jpg'],
  cover: '/product/live-set.jpg', sizeMb: mb(pkg), files: { pkg: file(pkg) },
  downloads: [{ key: 'pkg', label: `SignalGen ${pkgVer} for macOS`, note: 'Installer (.pkg): SignalGen + Monet · AU + VST3' }],
  published: '2026-10-03T00:00:00.000Z', sold: sold['signalgen'] || 0,
});
// MONET on its own (10/10/2026): the SignalGen synthesizer, free inside every SignalGen license, sold separately at 30 % of Serum 2
// (lib/region MONET_PRICE). Same installer — the buyer keeps only "Monet" in the installer's choices; the key opens Monet only.
const MONET = {"id": "monet", "kind": "software", "title": "Monet", "artist": "SignalGen", "bpm": 0, "key": "", "duration": 0, "subtitle": "Wavetable synthesizer · AU + VST3 · macOS", "genre": "Synthesizer", "price": 74.7, "nonExclusive": true, "licenseProduct": "monet", "description": "The SignalGen synthesizer: 3 wavetable oscillators with 16-voice unison, 14 filters including five analog circuit models, 4 LFOs, 3 envelopes you draw, MSEGs, a 16-slot matrix, 7 effects and 200+ presets.", "features": ["3 wavetable oscillators, unison up to 16", "MODEL M and VINTAGE: analog oscillators and 5 circuit filters", "PAINT: draw a wave, it becomes a wavetable", "GRAIN and LEARN: drop any sample, it becomes a patch", "CHAOS, ROUND ROBIN, knob-to-knob modulation, 16 slots", "BASSLINE arpeggiator modes", "7 effects, guard limiter", "200+ presets", "Lifetime license, offline, 2 computers"], "screenshots": ["/product/ui2/monet_01_synth.jpg", "/product/ui2/monet_02_fx.jpg", "/product/ui2/monet_03_matrix.jpg", "/product/ui2/monet_04_presets.jpg"], "cover": "/product/ui2/monet_01_synth.jpg", "downloads": [{"key": "pkg", "label": "Monet for macOS", "note": "SignalGen installer (.pkg) — keep \"Monet\" in the installer choices · AU + VST3"}], "published": "2026-10-10T00:00:00.000Z"};
{ const p = solo('Monet') || pkg; MONET.sizeMb = mb(p); MONET.files = { pkg: file(p) }; MONET.downloads = [soloDl('Monet', solo('Monet'))]; }
MONET.sold = sold['monet'] || 0;
products.push(MONET);

// 13/10/2026 (David, plano de lançamento): REFINER sold on its own (R$ 49,90 / US$ 12,90, lib/region REFINER_PRICE) and TEMPO free in
// exchange for an e-mail (lib/region FREE → /api/free). Same installer; the key opens only the product bought. Both come free with SignalGen.
const REFINER = {
  id: 'refiner', kind: 'software', title: 'Refiner', artist: 'SignalGen', bpm: 0, key: '', duration: 0,
  subtitle: '24-band EQ · AU + VST3 · macOS', genre: 'Equalizer', price: Number(process.env.REFINER_PRICE_USD || 12.9), nonExclusive: true, licenseProduct: 'refiner',
  description: 'The EQ that shows you where to cut. 24 bands by single click, a 96 kHz-style spectrum, SMART analysis that marks the fundamental and its octaves in neon and the wrong resonances in red-to-blue, Sidechain (dynamic) and Level modes drawn as curves, Zero / Natural / Linear phase, Stereo / Mid-Side / Mono, Harmonic Lock, Delta and blind A/B.',
  features: ['24 bands, one click each, drag the node or the curve', 'SMART: fundamental, octaves and resonances marked on the spectrum', 'Sidechain mode: dynamic EQ with internal, external or Mix detector', 'Level mode: the curve as a target, with stiffness and memory', 'Transient / Sustain per band', 'Zero, Natural and Linear phase · Stereo, Mid-Side, Mono', 'Harmonic Lock, Delta, blind A/B', 'MATCH: EQ toward a reference, up to 16 bands', 'Lifetime license, offline, 2 computers'],
  screenshots: ['/product/ui2/refiner_01.png', '/product/ui2/refiner_02.png', '/product/ui2/refiner_03.png'], cover: '/product/ui2/refiner_01.png',
  downloads: [soloDl('Refiner', solo('Refiner'))],
  published: '2026-10-13T00:00:00.000Z', sizeMb: mb(solo('Refiner') || pkg), files: { pkg: file(solo('Refiner') || pkg) }, sold: sold['refiner'] || 0,
};
const TEMPO = {
  id: 'tempo', kind: 'software', title: 'Clocker', artist: 'SignalGen', bpm: 0, key: '', duration: 0,
  subtitle: 'BPM + key of anything · AU + VST3 · macOS', genre: 'Analyzer', price: 0, nonExclusive: true, licenseProduct: 'ear',
  description: 'Put it on any channel (or on the master, listening to the Mix sidechain), press LISTEN: 10 seconds later you have the BPM, the key and the chords of whatever is playing. Drop a file on it and it reads that instead. Free: leave your e-mail and the key is yours.',
  features: ['BPM in 10 s, tempo-of-the-set tie-break (4/3, 3/2, 2x)', 'Key and chords of what is playing', 'Listens to the channel or to the whole Mix', 'Drop a file to analyse it', 'Free, lifetime, offline'],
  screenshots: ['/product/ui2/tempo_01.png', '/product/ui2/tempo_02.png'], cover: '/product/ui2/tempo_01.png',
  downloads: [soloDl('Clocker', solo('Clocker') || solo('Tempo'))],
  published: '2026-10-13T00:00:00.000Z', sizeMb: mb(solo('Clocker') || solo('Tempo') || pkg), files: { pkg: file(solo('Clocker') || solo('Tempo') || pkg) }, sold: sold['tempo'] || 0,
};
products.push(REFINER, TEMPO);

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
// 13/10/2026 (David: "remova os sample packs, estao pessimos"): the old volumes leave the shop (OLD_PACKS=1 brings them back).
// The new series comes from scripts/packs2.json (music-gen/tools/kit_loja2.py): Low Glide, Signal Voices…
if (process.env.OLD_PACKS !== '1') vols = [];
let packs2 = [];
try { packs2 = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'packs2.json'), 'utf8')); } catch { console.log('no scripts/packs2.json (python3 music-gen/tools/kit_loja2.py)'); }
for (const x of packs2) {
  const files = {}; for (const [k, z] of Object.entries(x.zips || {})) { const f = file(rebase(z)); if (f) files[k] = f; }
  if (!files.zip) { console.log(`skip (zip missing): ${x.title}`); continue; }
  products.push({ ...x.product, files, sold: sold[x.product.id] || 0 });
  console.log(`pack  ${x.product.title}  ${Object.keys(files).join('+')}`);
}
for (const v of vols) {
  // 13/10/2026: Song Packs (vol. 17+, packs cut from single songs) stay out of the shop window unless SELL_SONGPACKS=1 — their names are internal
  if ((v.type === 'Song Pack' || (v.vol || 0) >= 17) && process.env.SELL_SONGPACKS !== '1') { console.log(`skip (song pack, not in the window): ${v.title}`); continue; }
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
  // 10/10/2026 (David): the store sells ONLY the .zip files saved in Kits/Venda (and Kits/SG Voz Exclusiva/Venda) — no combos, no collection
  const saved = (f) => !!f && !!f.zip && /\/Venda\//.test(rebase(f.zip)) && fs.existsSync(rebase(f.zip));
  const W = sku(w, wid, 'kit', { downloads: [{ key: 'zip', label: `${v.title} — sample pack`, note: `ZIP · ${w.specs}` }] });
  if (saved(w)) all.push(W); else console.log(`skip (not saved in Venda): ${v.title} sample pack`);
  if (sv && saved(sv)) {
    const S = sku(sv, sid, 'preset', { price: Math.min(sv.price, w.price), downloads: [{ key: 'zip', label: `${v.title} — Serum 2 presets`, note: 'ZIP · .SerumPreset + previews + MIDI' }] });
    all.push(S);
  }
  if (sv && process.env.SOUNDS_BUNDLES === '1') {                                   // the old combos (sample pack + Serum 2), off by default
    const S = sku(sv, sid, 'preset', { price: Math.min(sv.price, w.price), downloads: [{ key: 'zip', label: `${v.title} — Serum 2 presets`, note: 'ZIP · .SerumPreset + previews + MIDI' }] });
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
if (parts.length > 3 && process.env.SOUNDS_BUNDLES === '1') {                    // the complete collection: only with SOUNDS_BUNDLES=1
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

// ───── EXCLUSIVE VOCALS (13/10/2026, David): one folder per vocal (or pack of vocals) in ~/Desktop/SignalGen/Vocais.
//   <pasta>/vocal.json   {"title": "Camaleon Pack", "priceBrl": 1490, "credit": "studio", "subtitle": "…", "description": "…"}
//   <pasta>/*.wav        os originais · `python3 scripts/vocal_preview.py "<pasta>"` faz preview.m4a (30 s, tag a cada 3 s) e <Título>.zip
//   <pasta>/Capa.jpg|png (opcional)
// A vocal enters the catalog only with the zip, the tagged preview and a price. It sells ONCE: `sold` is kept from the catalog.
const vocaisDir = path.join(sg, 'Vocais');
if (fs.existsSync(vocaisDir)) for (const d of fs.readdirSync(vocaisDir).sort()) {
  const dir = path.join(vocaisDir, d);
  let v; try { v = JSON.parse(fs.readFileSync(path.join(dir, 'vocal.json'), 'utf8')); } catch { continue; }
  const title = v.title || d, id = v.id || slug(title);
  const zip = path.join(dir, `${title}.zip`), prev = path.join(dir, 'preview.m4a');
  if (!fs.existsSync(zip) || !fs.existsSync(prev) || !(v.priceBrl > 0)) { console.log(`skip vocal (precisa de zip, preview.m4a e priceBrl): ${title}`); continue; }
  const out = path.join(root, 'public', 'vocals', id); fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(prev, path.join(out, 'preview.m4a'));
  if (fs.existsSync(path.join(dir, 'preview.mp3'))) fs.copyFileSync(path.join(dir, 'preview.mp3'), path.join(out, 'preview.mp3'));
  const capa = fs.readdirSync(dir).find((x) => /^capa\.(jpe?g|png)$/i.test(x));
  if (capa) copyCover(path.join(dir, capa), path.join(out, 'cover.jpg'));
  const wavs = fs.readdirSync(dir).filter((x) => /\.(wav|aiff?|flac)$/i.test(x)).length;
  products.push({
    id, kind: 'vocal', title, artist: 'SignalGen', bpm: v.bpm || 0, key: v.key || '', genre: v.genre || 'Vocals', duration: 0,
    voices: v.voices || wavs || 1, credit: v.credit || '', subtitle: v.subtitle || '', description: v.description || '', priceBrl: v.priceBrl, price: v.priceBrl,
    cover: capa ? `/vocals/${id}/cover.jpg` : fs.existsSync(path.join(out, 'cover.svg')) ? `/vocals/${id}/cover.svg` : undefined,
    preview: `/vocals/${id}/preview.m4a`, sizeMb: mb(zip), files: { zip: file(zip) },
    downloads: [{ key: 'zip', label: `${title} — exclusive vocals`, note: 'ZIP · WAV' }],
    published: new Date(fs.statSync(zip).mtimeMs).toISOString(), sold: sold[id] || 0,
  });
  console.log(`vocal  ${title}  R$ ${v.priceBrl}`);
}

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'catalog.json'), JSON.stringify({ tracks: [...products, ...tracks], updated: new Date().toISOString() }, null, 1));
console.log(`\n${tracks.length} tracks + ${products.length} products (${vols.length} sound volumes) -> local-data/catalog.json`);
