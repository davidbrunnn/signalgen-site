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
for (const name of names) {
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
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'catalog.json'), JSON.stringify({ tracks, updated: new Date().toISOString() }, null, 1));
console.log(`\n${tracks.length} tracks -> local-data/catalog.json`);
