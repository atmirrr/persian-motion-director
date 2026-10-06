#!/usr/bin/env python3
"""Shur Pulse: an original 120 BPM track in Dastgah Shur (on D), written in code.

Why write the music in code? The edit can then lock to it exactly: beat n sits at
n * 0.5 s, bar n at n * 2 s, and every section boundary is known before the first
frame is animated ("music first, then the edit").

Outputs (in OUT_DIR):
  shur-pulse.wav   music, 48 kHz stereo
  whooshes.wav     transition sounds that peak on given bar downbeats
  beats.json       bpm, bar times and the section map
The Remotion project plays MP3 copies (smaller to ship):
  ffmpeg -i shur-pulse.wav -b:a 256k shur-pulse.mp3 && ffmpeg -i whooshes.wav -b:a 160k whooshes.mp3

usage: python3 compose_shur_pulse.py OUT_DIR [--whoosh-bars 9,11,13]
Needs only numpy.
"""
import json
import os
import sys
import wave

import numpy as np

SR = 48000
BPM = 120
BEAT = 60.0 / BPM            # 0.5 s
BAR = 4 * BEAT               # 2.0 s
STEP = BEAT / 4              # one 16th
BARS = 41                    # bar 40 = final hit, bar 41 = reverb tail
N = int(BARS * BAR * SR)
rng = np.random.default_rng(11)

# Sections, in bars (1-indexed, end exclusive). The video uses the same map.
SECTIONS = [
    ("intro", 1, 3),        # santur alone over broken letters
    ("build", 3, 5),        # filtered drums open up
    ("drop", 5, 9),         # full groove, title
    ("techniques", 9, 25),  # 8 techniques x 2 bars
    ("breakdown", 25, 29),  # no kick, the checklist intro
    ("drop2", 29, 37),      # cuts on every beat
    ("outro", 37, 40),      # end card builds
    ("hit", 40, 41),        # final hit on the downbeat of bar 40
]


def t_bar(bar):            # downbeat time of a 1-indexed bar
    return (bar - 1) * BAR


def at(bar, step=0):        # time of a 16th step inside a bar
    return t_bar(bar) + step * STEP


# ---------------------------------------------------------------- pitch
# Shur on D: D, E-koron (a quarter tone flat), F, G, A, Bb, C
SEMI = {"C": -2, "D": 0, "E": 2, "F": 3, "G": 5, "A": 7, "B": 9}


def hz(name):
    """'D4', 'Ep4' (p = koron, -50 cents), 'Bb3', 'F#3'."""
    letter, rest = name[0], name[1:]
    acc = 0.0
    if rest[0] == "b":
        acc, rest = -1.0, rest[1:]
    elif rest[0] == "p":
        acc, rest = -0.5, rest[1:]
    elif rest[0] == "#":
        acc, rest = 1.0, rest[1:]
    semis = SEMI[letter] + acc + (int(rest) - 4) * 12
    return 293.6648 * 2 ** (semis / 12.0)


# ---------------------------------------------------------------- dsp helpers
def fft_filter(x, lo=None, hi=None, slope=0.25):
    """Zero-phase band filter with soft (raised-cosine, in octaves) edges."""
    n = len(x)
    size = 1 << int(np.ceil(np.log2(max(2, n))))
    X = np.fft.rfft(x, size)
    f = np.fft.rfftfreq(size, 1 / SR)
    g = np.ones_like(f)
    with np.errstate(divide="ignore"):
        lf = np.log2(np.maximum(f, 1e-6))
    if hi:
        r = np.clip((lf - np.log2(hi)) / slope, 0, 1)
        g *= 0.5 * (1 + np.cos(np.pi * r))
    if lo:
        r = np.clip((np.log2(lo) - lf) / slope, 0, 1)
        g *= 0.5 * (1 + np.cos(np.pi * r))
    return np.fft.irfft(X * g, size)[:n]


def fft_convolve(x, h):
    n = len(x) + len(h) - 1
    size = 1 << int(np.ceil(np.log2(n)))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)[:len(x)]


def sweep_filter(x, lo_hz, hi_hz, mode="lp", chunk=0.04):
    """Time-varying filter: cutoff moves (log) from lo_hz to hi_hz across x."""
    n = len(x)
    hop = int(chunk * SR / 2)
    win = np.hanning(hop * 2)
    out = np.zeros(n + hop * 2)
    starts = range(0, n, hop)
    total = max(1, len(starts) - 1)
    for i, s in enumerate(starts):
        seg = np.zeros(hop * 2)
        piece = x[s:s + hop * 2]
        seg[:len(piece)] = piece
        c = lo_hz * (hi_hz / lo_hz) ** (i / total)
        y = fft_filter(seg * win, hi=c) if mode == "lp" else fft_filter(seg * win, lo=max(40, c * 0.6), hi=c * 1.6)
        out[s:s + hop * 2] += y
    return out[:n] / 1.0


def place(buf, x, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def expenv(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


# ---------------------------------------------------------------- instruments
def kick(vel=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + (155 - 45) * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26) * np.minimum(1, t / 0.0012)
    click = fft_filter(rng.standard_normal(n) * np.exp(-t / 0.0025), lo=1500) * 0.35
    x = (body + click) * vel
    return np.tanh(1.6 * x) / np.tanh(1.6)


def hat(open_=False, vel=1.0):
    n = int((0.42 if open_ else 0.08) * SR)
    x = fft_filter(rng.standard_normal(n), lo=7000, hi=15000)
    return x * expenv(n, 0.14 if open_ else 0.017) * 0.55 * vel


def clap(vel=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for k, d in enumerate((0.0, 0.010, 0.021)):
        i = int(d * SR)
        env[i:] += np.exp(-t[: n - i] / (0.007 if k < 2 else 0.11)) * (0.65 if k < 2 else 1.0)
    return fft_filter(rng.standard_normal(n), lo=900, hi=3200) * env * 0.5 * vel


def tombak(kind="tom", vel=1.0):
    """Goblet-drum flavour: 'tom' is the deep centre stroke, 'bak' the bright edge stroke."""
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    if kind == "tom":
        f = 95 + 80 * np.exp(-t / 0.02)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
        x += fft_filter(rng.standard_normal(n), lo=150, hi=900) * np.exp(-t / 0.01) * 0.25
    else:
        x = fft_filter(rng.standard_normal(n), lo=1400, hi=4200) * np.exp(-t / 0.018)
        x += np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.03) * 0.4
    return x * 0.6 * vel


def ks_string(freq, dur, bright=0.7, damp=0.9992):
    """Karplus-Strong string, vectorised one period at a time."""
    P = max(2, int(round(SR / freq)))
    n = int(dur * SR)
    y = np.zeros(n + P + 2)
    exc = rng.uniform(-1, 1, P + 1)
    k = max(1, int(round((1 - bright) * 7)))
    if k > 1:
        exc = np.convolve(exc, np.ones(k) / k, mode="same")
    y[: P + 1] = exc
    s = P + 1
    while s < len(y):
        e = min(len(y), s + P)
        y[s:e] = damp * 0.5 * (y[s - P:e - P] + y[s - P - 1:e - P - 1])
        s = e
    return y[:n]


def santur(note, dur=1.6, vel=1.0, hammer=0):
    """Hammered course of strings: two slightly detuned strings plus the hammer knock."""
    f = hz(note)
    a = ks_string(f, dur, bright=0.85 if hammer % 2 == 0 else 0.75, damp=0.9990)
    nn = len(a)
    b = np.interp(np.arange(nn) * 1.0014, np.arange(nn), a, right=0.0)   # ~+2.4 cents
    knock = fft_filter(rng.standard_normal(int(0.012 * SR)), lo=2500) * np.linspace(1, 0, int(0.012 * SR)) * 0.25
    x = (a + b) * 0.5
    x[: len(knock)] += knock
    x *= np.minimum(1, np.arange(nn) / (0.002 * SR)) * vel
    return x


def tar(note, dur=1.2, vel=1.0):
    f = hz(note)
    x = ks_string(f, dur, bright=0.95, damp=0.9985)
    nasal = fft_filter(x, lo=700, hi=2600)
    return np.tanh(2.2 * (0.6 * x + 0.9 * nasal)) * 0.5 * vel


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    f = freq * 2 ** (detune / 1200)
    x = np.zeros(n)
    for k in range(1, int(9000 // f) + 1):
        x += np.sin(2 * np.pi * k * f * t + rng.uniform(0, 6.28)) / k
    return x * 0.5


def pad_chord(notes, dur, cutoff=1400):
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    for nt in notes:
        L += saw(hz(nt), n, -7)
        R += saw(hz(nt), n, +7)
    att = np.minimum(1, np.arange(n) / (0.35 * SR))
    rel = np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    env = att * rel
    return fft_filter(L, hi=cutoff) * env, fft_filter(R, hi=cutoff) * env


def bass_note(note, dur=0.22, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.16)
    return np.tanh(1.3 * x * env) * vel


def riser(dur, peak_at_end=True):
    n = int(dur * SR)
    x = sweep_filter(rng.standard_normal(n), 300, 9000, mode="bp")
    t = np.arange(n) / n
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (t * 3)) / SR) * 0.15
    env = (t ** 2.2) if peak_at_end else (1 - t) ** 2
    return (x * 0.6 + tone) * env


def impact(vel=1.0):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.7)
    crash = fft_filter(rng.standard_normal(n), lo=3000) * np.exp(-t / 0.5) * 0.35
    return (boom + crash) * vel


def whoosh(dur=0.9, peak=0.62):
    """Noise swell that peaks at `peak` (fraction of dur), band rising then falling."""
    n = int(dur * SR)
    t = np.arange(n) / n
    env = np.where(t < peak, (t / peak) ** 2.5, ((1 - t) / (1 - peak)) ** 1.6)
    x = sweep_filter(rng.standard_normal(n), 500, 6000, mode="bp")
    return x * env * 0.7


# ---------------------------------------------------------------- score
MOTIF_A = [  # (16th step, note, length in 16ths, tremolo)
    (0, "G4", 4, True), (4, "F4", 2, False), (6, "Ep4", 2, False), (8, "F4", 1, False),
    (9, "G4", 1, False), (10, "F4", 2, False), (12, "Ep4", 2, False), (14, "D4", 2, False),
    (16, "D4", 8, True), (28, "A3", 2, False), (30, "C4", 2, False),
]
MOTIF_B = [
    (0, "D5", 1, False), (1, "C5", 1, False), (2, "Bb4", 1, False), (3, "A4", 1, False),
    (4, "G4", 1, False), (5, "F4", 1, False), (6, "Ep4", 1, False), (7, "D4", 1, False),
    (8, "F4", 8, True), (16, "Ep4", 2, False), (18, "D4", 6, True),
    (26, "F4", 1, False), (27, "G4", 1, False), (28, "A4", 4, False),
]


def up_octave(m):
    return [(s, n[:-1] + str(int(n[-1]) + 1), l, tr) for (s, n, l, tr) in m]


def play_motif(buf, motif, bar, vel=1.0):
    for step, note, length, trem in motif:
        t0 = at(bar, step)
        if trem:   # santur "riz": repeated strokes, alternating hammers, softening
            for k in range(length * 2):        # 32nd-note strokes
                v = vel * (1.0 if k == 0 else max(0.35, 0.72 - 0.035 * k))
                place(buf, santur(note, 0.9, v, hammer=k), t0 + k * STEP / 2)
        else:
            place(buf, santur(note, 1.8, vel, hammer=step), t0)


PROG = [["D3", "F3", "A3"], ["D3", "F3", "A3", "G3"], ["C3", "G3", "Bb3"], ["Bb2", "D3", "F3"]]
BASS = ["D2", "D2", "C2", "Bb1"]


def compose():
    st = {k: np.zeros(N) for k in ("kick", "hat", "clap", "tom", "santur", "tar", "bass", "fx")}
    padL = np.zeros(N)
    padR = np.zeros(N)
    kicks = []

    def sec(bar):
        for name, a, b in SECTIONS:
            if a <= bar < b:
                return name
        return "tail"

    for bar in range(1, 41):
        s = sec(bar)
        drums = s in ("build", "drop", "techniques", "drop2", "outro")
        full = s in ("drop", "techniques", "drop2", "outro")
        # kick: four on the floor
        if drums and not (s == "outro" and bar == 39):
            for b in range(4):
                place(st["kick"], kick(0.95 if b == 0 else 0.85), at(bar, b * 4))
                kicks.append(at(bar, b * 4))
        # hats on the off-beats, ghost 16ths in the second drop, open hat closing each pair of bars
        if drums or s == "breakdown":
            for b in range(4):
                place(st["hat"], hat(vel=0.8 if s != "breakdown" else 0.5), at(bar, b * 4 + 2))
                if s == "drop2":
                    for g in (1, 3):
                        place(st["hat"], hat(vel=0.3), at(bar, b * 4 + g))
            if bar % 2 == 0 and full:
                place(st["hat"], hat(open_=True, vel=0.5), at(bar, 14))
        # clap on 2 and 4
        if full and bar < 39:
            for b in (1, 3):
                place(st["clap"], clap(0.9), at(bar, b * 4))
        # tombak accents: the Persian lilt between kicks
        if full and bar % 2 == 1:
            place(st["tom"], tombak("bak", 0.7), at(bar, 7))
            place(st["tom"], tombak("tom", 0.9), at(bar, 11))
            place(st["tom"], tombak("bak", 0.5), at(bar, 15))
        # bass on the off-beats
        if (drums and bar >= 4) and s != "breakdown":
            root = BASS[(bar - 1) % 4]
            for b in range(4):
                note = root if not ((bar - 1) % 4 == 3 and b >= 2) else "C2"
                place(st["bass"], bass_note(note, vel=0.9), at(bar, b * 4 + 2))
        # pads: one chord per bar
        if s in ("intro", "build", "techniques", "breakdown", "drop", "drop2", "outro"):
            chord = PROG[(bar - 1) % 4]
            cut = 900 if s in ("intro", "build") else (1800 if s == "breakdown" else 1300)
            l, r = pad_chord(chord, BAR + 0.4, cutoff=cut)
            g = 0.16 if s != "breakdown" else 0.24
            place(padL, l, t_bar(bar), g)
            place(padR, r, t_bar(bar), g)

    # santur: the voice of the piece
    play_motif(st["santur"], MOTIF_A, 1, 0.9)
    play_motif(st["santur"], MOTIF_B, 3, 0.85)
    for bar in range(5, 25, 2):
        m = MOTIF_A if (bar // 2) % 2 == 0 else MOTIF_B
        play_motif(st["santur"], up_octave(m) if bar >= 17 else m, bar, 0.8)
    # breakdown: long tremolos, the koron second in the spotlight
    for bar, note in ((25, "D4"), (26, "Ep4"), (27, "F4"), (28, "Ep4")):
        play_motif(st["santur"], [(0, note, 16, True)], bar, 0.6)
    for bar in range(29, 37, 2):
        play_motif(st["santur"], up_octave(MOTIF_B) if bar % 4 == 1 else MOTIF_A, bar, 0.8)
    play_motif(st["santur"], MOTIF_A, 37, 0.75)
    # tar answers every four bars in the technique run
    for bar in range(10, 25, 4):
        for step, note in ((8, "Ep3"), (10, "D3"), (12, "F3"), (14, "D3")):
            place(st["tar"], tar(note, 0.9, 0.8), at(bar, step))

    # risers into the drops and the final hit
    place(st["fx"], riser(BAR), t_bar(4), 0.5)
    place(st["fx"], riser(BAR), t_bar(28), 0.55)
    place(st["fx"], riser(BAR), t_bar(39), 0.5)
    place(st["fx"], impact(0.9), t_bar(5), 0.45)
    place(st["fx"], impact(0.9), t_bar(29), 0.45)
    place(st["fx"], impact(1.0), t_bar(40), 0.7)
    for b in range(4):  # a little clap roll in bar 39
        for k in range(4):
            place(st["clap"], clap(0.25 + 0.15 * b), at(39, b * 4 + k))
    # final hit: kick, a ringing D chord on santur
    place(st["kick"], kick(1.0), t_bar(40))
    for note in ("D4", "A4", "D5"):
        place(st["santur"], santur(note, 3.5, 0.8), t_bar(40))

    # filtered intro drums opening up (build section)
    a, b = int(t_bar(3) * SR), int(t_bar(5) * SR)
    for k in ("kick", "hat", "bass"):
        st[k][a:b] = sweep_filter(st[k][a:b], 250, 12000)

    # sidechain: pads and bass duck under each kick
    duck = np.ones(N)
    dn = int(0.32 * SR)
    shape = 1 - 0.7 * np.exp(-np.arange(dn) / SR / 0.09)
    for kt in kicks:
        i = int(kt * SR)
        j = min(N, i + dn)
        duck[i:j] = np.minimum(duck[i:j], shape[: j - i])
    padL *= duck
    padR *= duck
    st["bass"] *= duck ** 0.6

    # reverb send
    ir_n = int(2.2 * SR)
    t = np.arange(ir_n) / SR
    irL = fft_filter(rng.standard_normal(ir_n) * np.exp(-t / 0.33), hi=6000)
    irR = fft_filter(rng.standard_normal(ir_n) * np.exp(-t / 0.33), hi=6000)
    irL /= np.sqrt(np.sum(irL ** 2))
    irR /= np.sqrt(np.sum(irR ** 2))
    send = st["santur"] * 0.55 + st["tar"] * 0.35 + st["clap"] * 0.35 + st["tom"] * 0.2 + st["fx"] * 0.3 + (padL + padR) * 0.15
    revL = fft_convolve(send, irL)
    revR = fft_convolve(send, irR)

    pan = {"kick": 0, "hat": 0.25, "clap": 0, "tom": -0.3, "santur": 0.05, "tar": -0.2, "bass": 0, "fx": 0}
    gain = {"kick": 0.85, "hat": 0.28, "clap": 0.32, "tom": 0.38, "santur": 0.5, "tar": 0.32, "bass": 0.42, "fx": 0.45}
    L = np.zeros(N)
    R = np.zeros(N)
    for k, x in st.items():
        p = pan[k]
        L += x * gain[k] * np.sqrt(0.5 * (1 - p))
        R += x * gain[k] * np.sqrt(0.5 * (1 + p))
    L += padL + revL * 0.32
    R += padR + revR * 0.32
    L = fft_filter(L, lo=28)
    R = fft_filter(R, lo=28)
    mix = np.stack([L, R], axis=1)
    mix = np.tanh(1.15 * mix / np.max(np.abs(mix)) * 1.4) / np.tanh(1.4)
    mix *= 0.89 / np.max(np.abs(mix))
    fade = int(1.2 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    return mix


def write_wav(path, stereo):
    data = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def whoosh_track(bars):
    out = np.zeros(N)
    for bar in bars:
        x = whoosh(0.9, 0.62)
        place(out, x, t_bar(bar) - 0.9 * 0.62)
    out = np.tanh(out)
    out *= 0.6 / max(1e-9, np.max(np.abs(out)))
    return np.stack([out * 0.95, out], axis=1)


if __name__ == "__main__":
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out_dir, exist_ok=True)
    wb = [9 + 2 * i for i in range(0, 8)] + [25, 29, 37]
    if "--whoosh-bars" in sys.argv:
        wb = [int(v) for v in sys.argv[sys.argv.index("--whoosh-bars") + 1].split(",")]
    write_wav(os.path.join(out_dir, "shur-pulse.wav"), compose())
    write_wav(os.path.join(out_dir, "whooshes.wav"), whoosh_track(wb))
    meta = {
        "bpm": BPM, "beat_s": BEAT, "bar_s": BAR, "bars": BARS, "duration_s": BARS * BAR,
        "sections": [{"name": n, "from_bar": a, "to_bar": b, "start_s": t_bar(a), "end_s": t_bar(b)} for n, a, b in SECTIONS],
        "whoosh_bars": wb,
        "scale": "Shur on D: D, E-koron, F, G, A, Bb, C",
    }
    json.dump(meta, open(os.path.join(out_dir, "beats.json"), "w"), indent=1)
    print("wrote", out_dir)
