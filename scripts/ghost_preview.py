#!/usr/bin/env python3
"""ghost_preview.py — previa protegida de uma faixa (Ghost Production / packs).

  python3 ghost_preview.py <master.wav> <saida.m4a> --tag tag.wav [--dur 72] [--cada 8] [--inicio auto|seg] [--acima 3]

- escolhe a janela: ~24 s de build antes do maior drop + o drop (energia por 8 compassos), salvo --inicio
- marca d'agua: a tag falada a cada --cada s (primeira em 3 s), nivelada na banda da voz para ficar --acima dB sobre a musica
  daquele trecho, com a musica abaixando 5 dB sob a voz — nao da para tirar com EQ ou corte
- fade in 1,5 s / fade out 3 s, -11 LUFS (ganho estatico medido + limiter), AAC 160k 44,1 kHz (+ .mp3 ao lado para Safari antigo)
"""
import sys, subprocess, json, os, wave, numpy as np

def arg(k, d=None):
    a = sys.argv
    return a[a.index(k) + 1] if k in a else d

def dur(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode().strip())

def janela(f, d):
    sr = 4000
    x = np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-']), np.int16).astype(np.float32) / 32768
    h = sr // 2                                   # 0,5 s
    e = np.array([np.sqrt(np.mean(x[i:i + h] ** 2) + 1e-12) for i in range(0, len(x) - h, h)])
    db = 20 * np.log10(e)
    W = 30                                        # 15 s de cada lado
    best, bt = -1e9, None
    top = np.percentile(db, 90)
    for i in range(W, len(db) - W):
        antes, depois = db[i - W:i].mean(), db[i:i + W].mean()
        s = (depois - antes) - 0.5 * max(0, top - depois)
        if s > best: best, bt = s, i
    drop = bt * 0.5
    ini = max(0.0, drop - 24.0)
    total = len(x) / sr
    if ini + d > total: ini = max(0.0, total - d)
    return ini, drop

SR = 44100


def pcm(f, ss=None, d=None, af=None):
    a = ['ffmpeg', '-v', 'error'] + (['-ss', '%.3f' % ss] if ss is not None else []) + (['-t', '%.3f' % d] if d else []) + ['-i', f]
    a += (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.check_output(a), '<f4').reshape(-1, 2).copy()


def banda(x):
    """RMS na banda da voz (300 Hz–4 kHz), pelo espectro."""
    m = x.mean(1); F = np.fft.rfft(m); f = np.fft.rfftfreq(len(m), 1 / SR); F[(f < 300) | (f > 4000)] = 0
    return float(np.sqrt(np.mean(np.fft.irfft(F, len(m)) ** 2)) + 1e-9)


def main():
    src, out = sys.argv[1], sys.argv[2]
    tag = arg('--tag'); d = float(arg('--dur', 72)); cada = float(arg('--cada', 8)); acima = float(arg('--acima', 3))
    ini = arg('--inicio', 'auto')
    if ini == 'auto': ini, drop = janela(src, d)
    else: ini, drop = float(ini), None
    m = pcm(src, ini, d); n = len(m)
    fi, fo = int(1.5 * SR), int(3 * SR)
    m[:fi] *= np.linspace(0, 1, fi)[:, None]; m[-fo:] *= np.linspace(1, 0, fo)[:, None]
    t = pcm(tag, af='highpass=f=180,lowpass=f=9000,acompressor=threshold=-20dB:ratio=3:attack=5:release=80')
    t = t[: int(2.5 * SR)]; L = len(t)
    voz = np.zeros_like(m); env = np.zeros(n, np.float32); k = 0
    lisa = np.convolve(np.abs(t).mean(1), np.ones(int(0.03 * SR)) / int(0.03 * SR), 'same'); lisa /= lisa.max() + 1e-9
    for p0 in np.arange(3.0, d - 2.0, cada):
        p = int(p0 * SR); q = min(n, p + L)
        if q - p < L // 2: break
        alvo = banda(m[p:q]) * 10 ** (acima / 20)                                 # a voz fica `acima` dB sobre a música naquele trecho
        g = alvo / banda(t[: q - p])
        voz[p:q] += t[: q - p] * g; env[p:q] = np.maximum(env[p:q], lisa[: q - p]); k += 1
    duck = 1 - (1 - 10 ** (-5 / 20)) * np.clip(env * 1.5, 0, 1)                  # a música abaixa 5 dB sob a voz
    y = m * duck[:, None] + voz
    import tempfile; tmp = tempfile.mktemp(suffix='.wav')
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y / (np.abs(y).max() + 1e-9) * 0.7, -1, 1) * 32767).astype('<i2').tobytes())
    r = subprocess.run(['ffmpeg', '-nostats', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    import re
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); g = -11 - I
    chain = 'volume=%.2fdB,alimiter=limit=0.70:attack=1:release=50:level=false' % g
    base = os.path.splitext(out)[0]
    subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', chain, '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out])
    subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', chain, '-c:a', 'libmp3lame', '-b:a', '160k', base + '.mp3'])
    os.remove(tmp)
    print(json.dumps(dict(src=os.path.basename(src), out=out, inicio=round(ini, 2), drop=drop and round(drop, 2), dur=d, tags=k)))


if __name__ == '__main__':
    main()
