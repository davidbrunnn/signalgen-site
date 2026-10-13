#!/usr/bin/env python3
"""vocal_preview.py — prévia protegida de um vocal exclusivo (ou de um pack de vocais) + o .zip de entrega.

  python3 vocal_preview.py <pasta do vocal> [--dur 30] [--cada 3] [--tag tag.wav] [--acima 4]

A pasta tem os WAV originais (os arquivos que o comprador recebe) e um vocal.json:
  {"title": "Camaleon Pack", "priceBrl": 1490, "credit": "studio", "description": "…", "subtitle": "…"}
Gera, na própria pasta:
  preview.m4a / preview.mp3   30 s: um trecho de cada vocal (a parte mais cheia de cada um), com a tag falada "SignalGen" a cada
                              3 s (primeira em 1,5 s). A tag entra 4 dB acima da voz naquele ponto e o vocal abaixa 9 dB sob ela:
                              não dá para tirar com corte nem com EQ, e nenhum trecho limpo passa de ~2 s.
  <Título>.zip                os WAV + LICENSE.txt (o que o site entrega depois da venda)
A tag: --tag, ou `say` do macOS ("SignalGen"), ou codigo/site/_tag/tag.wav.
"""
import sys, os, json, subprocess, glob, zipfile, tempfile
import numpy as np

SR = 44100

def arg(k, d=None):
    a = sys.argv
    return a[a.index(k) + 1] if k in a else d

def pcm(f):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, '<f4').reshape(-1, 2).copy()

def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))

def band(x):
    """RMS na banda da voz (300 Hz–4 kHz)."""
    m = x.mean(1); F = np.fft.rfft(m); f = np.fft.rfftfreq(len(m), 1 / SR); F[(f < 300) | (f > 4000)] = 0
    return float(np.sqrt(np.mean(np.fft.irfft(F, len(m)) ** 2)) + 1e-9)

def best_window(x, n):
    """o trecho de n amostras com mais energia (passo de 0,25 s)."""
    if len(x) <= n: return np.vstack([x, np.zeros((n - len(x), 2), np.float32)])
    step = SR // 4; m = (x ** 2).sum(1); c = np.concatenate([[0], np.cumsum(m)])
    starts = np.arange(0, len(x) - n, step); e = c[starts + n] - c[starts]
    s = int(starts[int(np.argmax(e))])
    return x[s:s + n].copy()

def fade(x, a=0.03, r=0.06):
    na, nr = int(a * SR), int(r * SR)
    x[:na] *= np.linspace(0, 1, na)[:, None]; x[-nr:] *= np.linspace(1, 0, nr)[:, None]
    return x

def tag_audio(path):
    if path and os.path.exists(path): return pcm(path)
    if sys.platform == 'darwin':
        t = tempfile.mktemp(suffix='.aiff')
        try:
            subprocess.check_call(['say', '-v', 'Samantha', '-r', '185', 'SignalGen', '-o', t]); return pcm(t)
        except Exception: pass
    here = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_tag', 'tag.wav')
    return pcm(here)

def trim(x, thr=0.02):
    m = np.abs(x).max(1); idx = np.where(m > thr * (m.max() + 1e-9))[0]
    return x if not len(idx) else x[max(0, idx[0] - 200): idx[-1] + 2000]

def main():
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    folder = os.path.abspath(sys.argv[1])
    dur = float(arg('--dur', 30)); cada = float(arg('--cada', 3)); acima = float(arg('--acima', 4))
    wavs = sorted(f for f in glob.glob(os.path.join(folder, '**', '*'), recursive=True)
                  if f.lower().endswith(('.wav', '.aif', '.aiff', '.flac')) and os.path.basename(f).lower() not in ('tag.wav',))
    if not wavs: raise SystemExit('nenhum WAV em ' + folder)
    info = {}
    jf = os.path.join(folder, 'vocal.json')
    if os.path.exists(jf): info = json.load(open(jf))
    title = info.get('title') or os.path.basename(folder)
    n = int(dur * SR); per = n // len(wavs)
    parts = []
    for f in wavs:
        x = pcm(f); w = best_window(x, per)
        g = 0.12 / max(rms(w), 1e-6); w = fade(w * min(g, 8.0))                   # cada vocal no mesmo nível
        parts.append(w)
    mix = np.vstack(parts)
    mix = np.vstack([mix, np.zeros((n - len(mix), 2), np.float32)]) if len(mix) < n else mix[:n]
    tag = trim(pcm_tag := tag_audio(arg('--tag')))
    if len(tag) > int(1.3 * SR): tag = fade(tag[:int(1.3 * SR)].copy(), 0.005, 0.08)
    out = mix.copy(); marks = []
    t = 1.5
    while t + len(tag) / SR < dur:
        s = int(t * SR); e = s + len(tag)
        seg = mix[s:e]
        want = max(band(seg), 0.02) * (10 ** (acima / 20))                         # a tag acima da voz daquele trecho
        tg = tag * (want / band(tag))
        duck = np.ones(len(tag), np.float32) * (10 ** (-9 / 20)); k = int(0.04 * SR)
        duck[:k] = np.linspace(1, duck[0], k); duck[-k:] = np.linspace(duck[0], 1, k)
        out[s:e] = seg * duck[:, None] + tg
        marks.append(round(t, 2)); t += cada
    peak = np.abs(out).max()
    out = np.tanh(out / max(peak, 1e-6) * 1.1) * 0.89                              # teto suave, sem clip
    out[:int(0.2 * SR)] *= np.linspace(0, 1, int(0.2 * SR))[:, None]; out[-int(1.0 * SR):] *= np.linspace(1, 0, int(1.0 * SR))[:, None]
    for ext, codec in (('m4a', ['-c:a', 'aac', '-b:a', '128k']), ('mp3', ['-c:a', 'libmp3lame', '-b:a', '128k'])):
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-'] + codec + [os.path.join(folder, 'preview.' + ext)], stdin=subprocess.PIPE)
        p.communicate(out.astype('<f4').tobytes())
    zp = os.path.join(folder, title + '.zip')
    lic = ('%s — SignalGen exclusive vocals\n\nExclusive, perpetual, worldwide license. These vocals were sold once and removed from the catalog:\n'
           'nobody else has them. Use them in any release under your name, royalty-free. Do not resell the files themselves.\n'
           'Full terms: https://signalgen-site.vercel.app/license\n') % title
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
        for f in wavs: z.write(f, os.path.join(title, os.path.relpath(f, folder)))
        z.writestr(os.path.join(title, 'LICENSE.txt'), lic)
    gap = max([b - a for a, b in zip(marks, marks[1:])] + [0]) - len(tag) / SR
    print(json.dumps({'title': title, 'vocals': len(wavs), 'preview_s': dur, 'tags': len(marks), 'first_tag_s': marks[0] if marks else None,
                      'longest_clean_s': round(gap, 2), 'zip': zp, 'zip_mb': round(os.path.getsize(zp) / 1048576, 1)}))

if __name__ == '__main__': main()
