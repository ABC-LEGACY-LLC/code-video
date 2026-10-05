# Tong · kaptar — the film's sound, synthesized from the picture's own state (sound/scan.json, edit B).
# Every accent is fired from the thing that makes it, at the moment the drawing does it: a wingbeat
# from the bird's own wing phase, a touchdown from its touchdown time, the whistle from the curve the
# boy's body blows it with, the rag from the cloth simulation that draws it. Continuous sources are
# driven by the same state (the wind that streams the flag, the air the rag meets). Deterministic:
# one seed per source and per event.
#
# Grounding (see sound/SOURCES.md):
#  - rock pigeon take-off: a broadband clap at the end of each upstroke (dorsal wing-to-wing contact),
#    and a tonal buzz from the outermost primary, 700 +- 50 Hz with up to 20 harmonics, in the latter
#    two-thirds of each downstroke, peaking at 69 % of it, only near peak wingtip speed
#    (Niese & Tobalske 2016, J Exp Biol 219:2173);
#  - landing: braking on the last beats, faster and bigger (the film's own Berg & Biewener 2010 plan);
#  - aerodynamic (dipole) noise: sound power as the sixth power of speed (Curle 1955): amplitude U^3;
#  - dove coo: essentially a pure tone (the inflated oesophagus filters the harmonics; ring dove about
#    600 Hz, Fletcher et al. 2004 JASA 116:3750); the rock pigeon's is lower, mostly under 0.5 kHz,
#    a soft wavering "crruoo-u";
#  - house sparrow chirps: 3..7 kHz, peaks 4.2..6.4 kHz, 0.12 +- 0.03 s, two-note "M", communal
#    chirping before leaving the roost in the morning;
#  - whistled sound for distance: 1..4 kHz, higher the farther it must carry (Meyer; Silbo vowels
#    1..3.7 kHz);
#  - flags flap at fL/U = 0.2..0.6 (Virot et al. 2013): the film's flag, 0.43 m at 17 rad/s, is in
#    a 2..6 m/s breeze, the rag's own simulation blows at 4.8 m/s;
#  - air: ISO 9613-1 absorption.
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../'))
import sys, os, json, zlib
import numpy as np
import scipy.signal as sg
sys.path.insert(0, os.path.dirname(__file__))
import scanlib
from dsp import SR, filt, bpn, pink, air, pan_gains, sstep, Bus, limiter, write_wav, svf, crackle, crackle_tv

FPS = 24
T_END = scanlib.T_END
N = int(round(SR * T_END))
LAG = 0.5 / FPS          # a state reached at t is first drawn on the next frame: half a frame late on average
OUT = f'{ROOT}/sound/out'
os.makedirs(OUT + '/stems', exist_ok=True)

D = scanlib.load()
TB, SHOT, TW, S = D['tb'], D['shot'], D['tw'], D['src']
# the base lens of each shot: sound perspective follows the picture's scale (a thing 12 m off through
# shot 3's 7000 px lens is drawn as big as one 1.7 m off through shot 1's 1000 px one); a zoom within
# a shot is optics, not a move, and does not bring the world nearer
F_BASE = {'s1': 1000.0, 'whip': 1000.0, 's2': 1000.0, 's3': 7000.0, 's4': 720.0, 's5': 1000.0}
SLOW = {'s3': 1 / 0.2}    # B seconds per second of the world
SEGS = scanlib.SEGS


def seg_of(t):
    for name, a, b in SEGS:
        if a / FPS <= t < b / FPS:
            return name
    return 's5'


def seg_mask(name):
    a, b = scanlib.seg_bounds(name)
    return (TB >= a) & (TB < b)


def seg_end(name, t):
    """where a sound begun in this shot must end: at a cut into or out of the slow motion (a change of
    world) it stops with the picture; elsewhere it may ring on a quarter second past the cut"""
    a, b = scanlib.seg_bounds(name)
    nxt = {n: SEGS[i + 1][0] if i + 1 < len(SEGS) else None for i, (n, _, _) in enumerate(SEGS)}[name]
    if name == 's3' or nxt == 's3':
        return b
    return b + 0.25


def r_eff(r, shot):
    return max(0.6, r * 1000.0 / F_BASE[shot])


def pan_of(sx, cx=0.0, cz=1.0):
    if not np.isfinite(sx) or cz <= 0.05:
        return float(np.clip(np.sign(cx) * 1.0, -1, 1))
    return float(np.clip((sx - 640) / 640, -1.15, 1.15) / 1.15)


LOG = []   # the event log: every accent, its time, its source and where that source is in the picture


def log(layer, name, t, dur, shot, sid=None, st=None, t_vis=None, extra=None):
    e = {'layer': layer, 'name': name, 't': round(float(t), 4), 'dur': round(float(dur), 4), 'shot': shot, 'src': sid}
    if st is not None:
        e.update({'sx': None if not np.isfinite(st.get('sx', np.nan)) else round(float(st['sx']), 1),
                  'sy': None if not np.isfinite(st.get('sy', np.nan)) else round(float(st['sy']), 1),
                  'on': int(st.get('on', 0)), 'r': round(float(st.get('r', np.nan)), 2)})
    if t_vis is not None:
        e['t_vis'] = round(float(t_vis), 4)
    if extra:
        e.update(extra)
    LOG.append(e)


BUS = {k: Bus(N) for k in ['amb', 'sparrow', 'flag', 'coo', 'wings', 'land', 'air', 'rag', 'foley', 'breath', 'whistle', 'whip']}
# Sends to the rooftop's reverb, which is normalised to unit power gain over 200..5000 Hz (reverb_ir):
# a send of 0.1 puts the reverb 20 dB under the direct sound. The direct sound falls with distance and
# the reverb (a diffuse field) does not, so the send grows with the distance: x1 at 4 m, x2.5 at 10 m
# and beyond. (v1 had a tail 0.9 s long whose gain in band was +10.7 dB against sends set for unity:
# the whistle's reverb was 3.6 dB over its direct sound and its tone warbled, measured by a fresh eye)
SEND = {'amb': 0.0, 'sparrow': 0.2, 'flag': 0.08, 'coo': 0.12, 'wings': 0.1, 'land': 0.08, 'air': 0.06, 'rag': 0.06,
        'foley': 0.03, 'breath': 0.025, 'whistle': 0.08, 'whip': 0.0}


def rsend(layer, re):
    return SEND[layer] * float(np.clip(re / 4.0, 0.6, 2.5))


def state(sid, k):
    s = S[sid]
    return {key: (s[key][k] if isinstance(s[key], np.ndarray) and s[key].dtype != object else s[key][k]) for key in s if key not in ('kind', 'idx')}


S5_T0 = scanlib.seg_bounds('s5')[0]
WHITE = next(k for k, v in S.items() if v['kind'] == 'lander' and np.nanmax(v['b']) < 0)      # the one he threw
T_WHITE = S5_T0 + float(np.nanmax(S[WHITE]['td'])) + LAG


def clear_for_white(t, sid):
    """the white one's touchdown (the bird his eyes lock on to, just before his smile) is given room:
    the others 8 dB down for a moment round it (a mix's focus). In v1 its tap sat 7 dB under the rest."""
    if sid == WHITE:
        return 1.0
    return 1.0 - 0.6 * float(np.exp(-((t - T_WHITE) / 0.14) ** 2))


# ------------------------------------------------------------------ wings
def wing_grain(rng, Tb, U, ts=1.0, ps=1.0, clap=0.0, flut=0.0, f_fl=700.0, f_w=1050.0, near=0.0, detail=1.0):
    """One wingbeat from the top of the upstroke (t = 0), built as the wing moves:
    - the downstroke, the first 0.6 of the beat: the wing's speed rises and falls as a sine, the
      loudness as its 2.2nd power, and the air's band rises and falls with it (a whoosh is a moving
      band; v2's fixed narrow band read as a tone);
    - the vanes' ticks: feathers meeting the air, a dense crackle riding the loudest part (impulses
      rung through short resonances, Farnell's texture for rustle and fabric; v2's Gaussian band with
      a 14 Hz tremolo under it read, slowed down, as a tone with a motor in it);
    - near to (the lens bringing it within ~4 m): a low push under the stroke's peak;
    - the upstroke: the hand flicked up and back, a softer, higher rustle;
    - take-off: the clap where the wings meet above the back (papery: two feathered surfaces meet over
      a couple of milliseconds, not a hand clap's crack), and the outermost primary's buzz late in the
      downstroke (Niese & Tobalske 2016), a fluttering vane's tone, not a clean one.
    ts, ps: time and pitch scale in slow motion, the ticks slowed with the rest (their number / ts,
    their pitch x ps): kept at the real-time rate they were what was left of a motor under the slow
    beats, 2.2 SD over the passage's own noise, and slowed they are 0.3 SD under it and the tagger's
    'whoosh' doubles, 0.11 to 0.22 (measured by a fresh eye; an earlier note here claimed the
    opposite). detail (1 near, 0 far): far off only the whoosh's core is heard, a
    narrower band with few ticks; broad and crackling for 27 birds at once it measured as a hiss
    (flatness 0.22 against the bed's 0.12). Returns a grain whose cruise-beat peak is about 1."""
    n = int(1.05 * Tb * SR) + 64
    t = np.arange(n) / SR
    phi = t / Tb
    DN = 0.6
    v = np.where(phi < DN, np.sin(np.pi * np.clip(phi / DN, 0, 1)), 0.0)
    env = v ** 2.2
    fc = ps * f_w * (0.5 + 0.7 * v ** 1.5) * np.sqrt(max(U, 0.4))
    q1, q2, w2, cr = 2.4 - 1.3 * detail, 3.0 - 1.6 * detail, 0.12 + 0.38 * detail, 0.08 + 0.42 * detail
    a = svf('bp', rng.standard_normal(n), fc, q1) + w2 * svf('bp', rng.standard_normal(n), fc * 2.1, q2)
    a /= np.std(a[env > 0.3]) + 1e-12
    y = env * a
    y += cr * env ** 1.3 * crackle(rng, n, 4000 * max(U, 0.3) / ts, 3200 * ps, 0.9, 0.3)
    if ts > 1 and detail > 0:
        # (slowed, a stroke's own air is heard low: a body band at 260 Hz x pitch x sqrt(U), 0.2 of the
        # whoosh; without it shot 3 kept 7 % of its energy under 400 Hz, v2 32 %. At the normal speed
        # it read as 'music, fire alarm' in the take-off, so there it is left out, measured)
        bo = bpn(rng, n, 260 * ps * np.sqrt(max(U, 0.4)), 1.0)
        y += 0.2 * detail * env * bo
    if near > 0:
        th = filt('lp', rng.standard_normal(n), 140 * ps, 0.8)
        y += 0.35 * near * env ** 1.5 * th / (np.std(th) + 1e-12)
    uu = np.clip((phi - DN) / (1 - DN), 0, 1)
    up = np.where(phi > DN, np.sin(np.pi * uu) ** 2, 0.0)
    ua = svf('bp', rng.standard_normal(n), ps * f_w * (0.6 + 0.4 * up), 1.4)
    y += 0.25 * up * (0.6 * (0.3 + 0.7 * detail) * crackle(rng, n, 2500 / ts, 2600 * ps, 1.0, 0.25) + 0.5 * ua / (np.std(ua) + 1e-12))
    y *= 0.42
    if clap > 0:
        cn = min(n, int(0.09 * ts * SR))
        tc = t[:cn]
        e2 = (1 - np.exp(-tc / (0.002 * ts))) * np.exp(-tc / (0.018 * ts * rng.uniform(0.8, 1.25)))
        wn = rng.standard_normal(cn)
        c = e2 * (filt('bp', wn, 2400 * ps * rng.uniform(0.85, 1.15), 0.8) + 0.6 * filt('bp', wn, 700 * ps * rng.uniform(0.85, 1.15), 0.9))
        c += 0.5 * e2 * crackle(rng, cn, 9000, 3500, 0.8, 0.25) * np.std(c[:int(0.01 * SR)])
        y[:cn] += clap * 1.6 * c / (np.max(np.abs(c)) + 1e-12)
    if flut > 0:
        aa = np.clip((phi - 0.19) / 0.39, 0, 1)
        e3 = np.where((phi > 0.19) & (phi < 0.58), np.sin(np.pi * aa) ** 2, 0.0)
        wob = filt('lp', rng.standard_normal(n), 30.0 / ts, 0.7)
        f = f_fl * ps * (1 + 0.01 * wob / (np.std(wob) + 1e-12))
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = np.zeros(n)
        for h in range(1, 21):
            if h * f_fl * ps > 15000:
                break
            tone += h ** -1.25 * np.sin(h * ph + rng.uniform(0, 2 * np.pi))
        tone /= np.max(np.abs(tone)) + 1e-12
        vane = filt('lp', rng.standard_normal(n), 150.0 / ts, 0.7)
        tone *= 1 + 0.5 * vane / (np.std(vane) + 1e-12)
        # (6 dB under v2's: at 0.55 a 20-harmonic line on every take-off beat, read as 'fire alarm')
        y += flut * 0.27 * e3 * tone
    return y


def beats_of(sid, name):
    """the beats (phase through a whole number: the top of the upstroke) of one bird in one shot"""
    s = S[sid]
    m = seg_mask(name) & np.isfinite(s['ph'])
    idx = np.where(m)[0]
    out = []
    for k0, k1 in zip(idx[:-1], idx[1:]):
        if k1 != k0 + 1:
            continue
        a, b = s['ph'][k0], s['ph'][k1]
        if not (b > a):
            continue
        for nb in range(int(np.floor(a)) + 1, int(np.floor(b)) + 1):
            x = (nb - a) / (b - a)
            t = TB[k0] + x * (TB[k1] - TB[k0])
            tw = TW[k0] + x * (TW[k1] - TW[k0])
            rate_b = (b - a) / (TB[k1] - TB[k0])            # beats per film second
            rate_w = (b - a) / max(TW[k1] - TW[k0], 1e-9)   # beats per world second
            kk = k0 if x < 0.5 else k1
            out.append((t, tw, rate_b, rate_w, nb, kk))
    return out


def wings_layer():
    rng0 = np.random.default_rng(1001)
    n_ev = 0
    for sid, s in S.items():
        if s['kind'] not in ('bird', 'lander'):
            continue
        f_fl = 700 + 25 * rng0.standard_normal()       # each bird's own primary
        f_w = rng0.uniform(780, 1450)                   # and its own whoosh
        flock = s['kind'] == 'bird' and sid != 'H'
        for name, _, _ in SEGS:
            soft = name == 's3' and sid != 'H'
            for (t, tw, rb, rw, nb, k) in beats_of(sid, name):
                st = state(sid, k)
                if soft and not st['on']:
                    continue                                  # (the long lens: only what is in its picture)
                mode = st.get('mode')
                a = float(st.get('a', 1.0))
                amp = float(st.get('amp', 0.82))
                if mode == 'brake':
                    amp = 0.85 if st.get('crowd', 0) else 1.08
                    a = 1.0
                if mode == 'down' or a < 0.05:
                    continue
                U = a * amp * rw / (0.82 * 6.0)             # wingtip speed, relative to a cruise beat
                if U < 0.15:
                    continue
                # (slow motion: five times slower, the air's band 0.7 of its pitch: deeper, not muffled;
                # v2 halved it and 89 % of the shot's energy fell under 1.2 kHz)
                ts, ps = (SLOW[name], 0.7) if name in SLOW else (1.0, 1.0)
                # (claps and the primary's buzz belong to power strokes: take-off (measured) and the
                # landing's braking; a flock bird beating a little harder in cruise does neither)
                power = mode in ('takeoff', 'brake')
                clap = float(np.clip((U - 1.15) / 0.3, 0, 1)) if power else 0.0
                # (the primary's tone is measured in take-off only; level flight's wingtips are below its
                # threshold, and landing is not reported: not in the braking, where v1 had it, a 716 Hz
                # line 17.6 dB over its neighbours through the loudest passage, measured by a fresh eye)
                flut = float(np.clip((U - 1.25) / 0.25, 0, 1)) if mode == 'takeoff' else 0.0
                if sid == 'H' and mode == 'takeoff':
                    clap = max(clap, float(np.clip((U - 1.05) / 0.3, 0, 1)))
                if mode == 'brake':
                    # (the claps are measured in take-off (Niese & Tobalske); braking, the stroke is
                    # tipped forward and the wings are not known to meet: a slap at most)
                    clap *= 0.35
                rng = np.random.default_rng(zlib.crc32(f'{sid}|{name}|{nb}'.encode()))
                Tb = 1.0 / rb
                re = r_eff(st['r'], name)
                fw_b, g_j = f_w, 1.0
                if flock:
                    # (beat to beat a flock bird is not a metronome: its wing's dipole turns with it as
                    # the flock banks, and the air between moves: +-15 % in colour, 3 dB in level. Every
                    # beat alike, 27 birds summed read as an engine, 'vehicle' 0.17, measured. Drawn from
                    # its own stream, before the grain: from the grain's, any change to the grain's
                    # texture moved these levels by up to 3 dB, found by a fresh eye)
                    rj = np.random.default_rng(zlib.crc32(f'{sid}|{name}|{nb}|jitter'.encode()))
                    fw_b = f_w * (1 + 0.15 * rj.uniform(-1, 1))
                    g_j = 10 ** (3.0 * rj.standard_normal() / 20)
                # (the low push under a stroke is a near thing; a power stroke's, taking off or braking,
                # carries to 8 m: without it v3's take-off had 2.5 % of its energy under 400 Hz, v2 17 %)
                near = float(np.clip((8.0 - re) / 6.0, 0, 1)) if power else float(np.clip((4.0 - re) / 3.0, 0, 1))
                near = 0.0 if soft else near
                detail = 0.0 if soft else float(np.clip((12.0 - re) / 8.0, 0, 1))
                g = wing_grain(rng, Tb, U, ts, ps, clap, flut, f_fl, fw_b, near, detail)
                if soft:
                    # (the three birds round him in shot 3, 1.5..3.7 m behind the focus and soft in the
                    # picture: soft in the ear too, dark and 20 dB down. v3a silenced them; they flap
                    # in the frame nearly as big as he is, and with the slowed ticks his beat still
                    # folds 20 dB deep over them, measured by a fresh eye)
                    g = filt('lp', g, 1800, 0.7)
                # (an effort model, not a law: U^3 as a dipole's amplitude goes, and a power stroke's
                # separated, flapping flow on top of it (claps and buzz are take-off's, measured); a
                # cruise beat, attached flow, has the smooth part only)
                gain = 0.32 * U ** 3 * (0.45 + 0.55 * float(np.clip((U - 0.9) / 0.5, 0, 1))) / re
                gain *= g_j
                if soft:
                    gain *= 0.1
                if s['kind'] == 'bird':
                    # (the far flock is texture, not the subject: pulled back 5 dB beyond 14 m, so the
                    # near events carry each shot; at full level it was the floor of shots 1 and 2, and
                    # shot 2's loudest moments stood 4.2 dB over its rest, measured)
                    gain *= 1.0 - 0.37 * float(sstep(8.0, 14.0, re))
                if name == 's5' and not st['on']:
                    gain *= 0.35                              # (out of the picture: heard, not attended to)
                layer = 'land' if s['kind'] == 'lander' else 'wings'
                tmax = seg_end(name, t)
                if s['kind'] == 'lander':
                    # (the picture holds its wings up from the touchdown and folds them: the last
                    # beat's grain must not ring on through its feet taking hold)
                    tmax = min(tmax, S5_T0 + float(st['td']) + LAG)
                    gain *= clear_for_white(t + LAG, sid)
                y = air(g, re)
                # (slow motion: the world's tail slowed with it, sent twice as hard: see render)
                send = rsend(layer, re) * (2.0 if name in SLOW else 1.0)
                BUS[layer].add(y, t + LAG, pan_of(st['sx'], st['cx'], st['cz']), gain, send, tmax=tmax)
                n_ev += 1
                if gain * (1.0 + 1.9 * clap) > 0.02:     # log the ones that can be heard as single beats
                    log(layer, 'clap+beat' if clap > 0 else 'beat', t + LAG, 1.1 * Tb, name, sid, st,
                        t_vis=np.ceil(t * FPS - 1e-6) / FPS, extra={'U': round(U, 2), 'gain': round(float(gain), 4)})
    return n_ev


# ------------------------------------------------------------------ the air past fast birds
def air_layer():
    """a bird going fast makes its own wind: dipole noise, amplitude as speed cubed (only above cruise)"""
    rng = np.random.default_rng(2002)
    t_ctl = TB
    for sid, s in S.items():
        if s['kind'] not in ('bird', 'lander'):
            continue
        v = sg.medfilt(np.nan_to_num(s['v'], nan=0.0), 9)
        r = np.nan_to_num(s['r'], nan=1e3)
        if v.max() < 11:
            continue
        env_c = np.zeros_like(v)
        for name, _, _ in SEGS:
            m = seg_mask(name)
            if name == 's3':
                continue
            env_c[m] = np.minimum(np.clip((v[m] - 10.5) / 5.0, 0, None) ** 1.5, 2.0) * 0.2 / np.maximum([r_eff(x, name) for x in r[m]], 0.6)
        if env_c.max() < 1e-4:
            continue
        tt = np.arange(N) / SR
        env = filt('lp', np.interp(tt, t_ctl + LAG, env_c), 20, 0.7) * level_curve({'s1': 1, 'whip': 1, 's2': 1, 's4': 1, 's5': 1}, 0.012)
        sx = np.interp(tt, t_ctl, np.nan_to_num(s['sx'], nan=640.0))
        x = bpn(rng, N, 420, 1.3) * 0.6 + bpn(rng, N, 900, 1.6) * 0.4
        y = x * env
        pan = np.clip((sx - 640) / 640, -1, 1)
        BUS['air'].x[0] += y * np.cos((pan + 1) * np.pi / 4)
        BUS['air'].x[1] += y * np.sin((pan + 1) * np.pi / 4)
        BUS['air'].send += y * SEND['air'] * 2.5


# ------------------------------------------------------------------ landing: touchdowns and folds
def tap(rng, surface, ts=1.0):
    """a foot coming down: the pad's soft thump (the bird's weight into a small cushion: a dull low
    pulse, 1.5 ms up, gone in 6..10 ms) and what the surface gives back: the coop's boards a short low
    knock (a board, not a wood block: low and damped, Q 1.8; v2 rang them at Q 4..5 and the tagger
    heard 'wood block, percussion'), the parapet's brick coping almost nothing"""
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    wn = rng.standard_normal(n)
    pad = (1 - np.exp(-t / 0.0015)) * np.exp(-t / rng.uniform(0.006, 0.01)) * filt('lp', wn, 900, 0.7)
    pad /= np.max(np.abs(pad)) + 1e-12
    if surface == 'coop':
        env = (1 - np.exp(-t / 0.0005)) * np.exp(-t / 0.006)
        k = env * filt('bp', wn, rng.uniform(450, 700), 1.8)
        y = 0.6 * pad + 0.7 * k / (np.max(np.abs(k)) + 1e-12)
    else:
        env = (1 - np.exp(-t / 0.0005)) * np.exp(-t / 0.003)
        k = env * filt('bp', wn, rng.uniform(1200, 1700), 1.0)
        y = 0.6 * pad + 0.4 * k / (np.max(np.abs(k)) + 1e-12)
    return y / (np.max(np.abs(y)) + 1e-12)


def touchdown(rng, surface):
    """two feet 6..18 ms apart, then the claws taking hold: a few scratches 10..50 ms in"""
    n = int(0.16 * SR)
    y = np.zeros(n)
    d = int(rng.uniform(0.006, 0.018) * SR)
    a = tap(rng, surface)
    b = tap(rng, surface) * rng.uniform(0.6, 0.9)
    y[:len(a)] += a
    y[d:d + len(b)] += b[:n - d]
    t = np.arange(n) / SR
    sc = crackle(rng, n, 2500, 4200, 1.0, 0.2) * np.exp(-((t - 0.03) / 0.015) ** 2)
    y += 0.22 * sc / (np.max(np.abs(sc)) + 1e-12)
    return y


def fold_rustle(rng, dur):
    """the wing folding in: feathers sliding over feathers, three or four little pushes of vane ticks
    (v2's were bands of hiss at 3.2 and 6 kHz)"""
    n = int((dur + 0.05) * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    k = rng.integers(3, 5)
    for j in range(k):
        c = (j + rng.uniform(0.2, 0.8)) / k * dur
        env += np.exp(-((t - c) / (dur / k * 0.35)) ** 2) * rng.uniform(0.6, 1.0)
    y = env * (crackle(rng, n, 5000, 2800, 0.8, 0.3) + 0.5 * bpn(rng, n, 1800, 1.5))
    return y / (np.max(np.abs(y)) + 1e-12)


def landing_layer():
    for sid, s in S.items():
        if s['kind'] != 'lander':
            continue
        m = seg_mask('s5')
        idx = np.where(m & np.isfinite(s['r']))[0]
        td = float(s['td'][idx[0]])
        surf = s['on_'][idx[0]]
        k = idx[np.argmin(np.abs(D['f'][idx] / FPS - td))]
        st = state(sid, k)
        t_b = scanlib.seg_bounds('s5')[0] + td
        rng = np.random.default_rng(3000 + int(sid[1:]))
        re = r_eff(st['r'], 's5')
        y = touchdown(rng, 'coop' if surf == 'coop' else 'cap')
        white = 3.0 if sid == WHITE else clear_for_white(t_b + LAG, sid)
        g = 0.35 / re * white * (1.0 if st['on'] else 0.5)
        BUS['land'].add(air(y, re), t_b + LAG, pan_of(st['sx'], st['cx'], st['cz']), g, rsend('land', re))
        log('land', 'touchdown', t_b + LAG, 0.16, 's5', sid, st, t_vis=np.ceil(t_b * FPS - 1e-6) / FPS, extra={'surface': surf})
        y = fold_rustle(rng, 0.13)
        g = 0.15 / re * (2.0 if sid == WHITE else white) * (1.0 if st['on'] else 0.5)
        BUS['land'].add(air(y, re), t_b + 0.02 + LAG, pan_of(st['sx'], st['cx'], st['cz']), g, rsend('land', re))
        log('land', 'fold', t_b + 0.02 + LAG, 0.18, 's5', sid, st, t_vis=np.ceil((t_b + 0.02) * FPS - 1e-6) / FPS)


# ------------------------------------------------------------------ the coop's birds
def coo(rng, f0, stretch=1.0, kind='perch'):
    """a rock pigeon's coo: 'perch', crruoo-u, a rolled onset rising into a long soft 'oo' (its
    first part rolled too) and a short falling 'u'; 'soft', one falling 'oo'. Low (mostly under
    0.5 kHz) and throaty: the second and third harmonics at -7 and -14 dB, the voice rough (its level
    wavering 15 % at up to 40 Hz) and breathy (noise round 1.5 f0, a quarter of the tone, riding it).
    (v2's was a clean sine with a vibrato: the tagger heard 'theremin, music, synthesizer' 0.42..0.30;
    this one it hears as an animal, 0.20..0.35, never 'pigeon': no synthesized coo reached that.)"""
    if kind == 'soft':
        n = int(rng.uniform(0.45, 0.6) * stretch * SR)
        t = np.arange(n) / SR
        u = t / t[-1]
        f = f0 * (1.03 - 0.2 * u ** 1.3) * (1 + 0.01 * np.sin(2 * np.pi * 5.8 * t))
        amp = filt('lp', np.sin(np.pi * np.clip(u * 1.05, 0, 1)) ** 1.2, 40, 0.7)
    else:
        L1, L2, gap, L3 = rng.uniform(0.14, 0.2) * stretch, rng.uniform(0.38, 0.52) * stretch, rng.uniform(0.03, 0.06), rng.uniform(0.16, 0.24) * stretch
        n = int((L1 + L2 + gap + L3 + 0.05) * SR)
        t = np.arange(n) / SR
        f = np.full(n, np.nan)
        amp = np.zeros(n)
        a1 = t < L1
        f[a1] = f0 * (0.82 + 0.13 * t[a1] / L1)
        amp[a1] = np.sin(np.pi * 0.5 * t[a1] / L1) ** 2 * (0.55 + 0.45 * np.sin(2 * np.pi * 34 * t[a1]) ** 2)
        a2 = (t >= L1) & (t < L1 + L2)
        u = (t[a2] - L1) / L2
        f[a2] = f0 * (0.95 + 0.09 * np.sin(np.pi * np.clip(u * 1.3, 0, 1)) - 0.04 * u) * (1 + 0.008 * np.sin(2 * np.pi * 6.3 * t[a2]))
        amp[a2] = (0.8 + 0.2 * np.sin(np.pi * u)) * (1 - sstep(0.8, 1.0, u)) * (1 - 0.5 * np.sin(2 * np.pi * 30 * t[a2]) ** 2 * np.exp(-u / 0.3))
        a3 = (t >= L1 + L2 + gap) & (t < L1 + L2 + gap + L3)
        u3 = (t[a3] - L1 - L2 - gap) / L3
        f[a3] = f0 * (0.9 - 0.16 * u3)
        amp[a3] = 0.6 * np.sin(np.pi * u3) ** 1.5
        f = np.where(np.isnan(f), f0 * 0.9, f)
        amp = filt('lp', amp, 60, 0.7)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = amp * (np.sin(ph) + 0.45 * np.sin(2 * ph + 0.4) + 0.2 * np.sin(3 * ph + 1.1))
    y += 0.02 * amp * bpn(rng, n, f0 * 2, 3)
    sh = filt('lp', rng.standard_normal(n), 40, 0.7)
    y = y * (1 + 0.15 * sh / (np.std(sh) + 1e-12))
    env = filt('lp', np.abs(y), 30, 0.7)
    y = y + 0.25 * env / (np.max(env) + 1e-9) * bpn(rng, n, f0 * 1.5, 1.5)
    return y / (np.max(np.abs(y)) + 1e-12)


def coo_layer():
    # (the first sound of the film is a coo from the coop as the picture comes up; none for two
    # seconds after the throw startles them; after the flock is home one more, after his breath.)
    # Nothing in the picture coos (no crop swells, no bow), so they come from the birds inside the
    # coop, through its boards: the coop is in the picture in shots 1, 2 and 4; at the end the push
    # has left it just out to the left, where we saw it, and it is heard from there, softer.
    # (shot 2's was two short phrases in a row, 'double': the tagger heard a tune, 'music, beatboxing')
    plan = [(0.06, 378, 's1', 0.8, 'perch'), (5.55, 400, 's2', 1.0, 'perch'), (10.95, 361, 's4', 0.8, 'soft'), (19.55, 387, 's5', 1.0, 'perch')]
    for j, (t0, f0, shot, stretch, kind) in enumerate(plan):
        rng = np.random.default_rng(4000 + j)
        y = filt('lp', coo(rng, f0, stretch, kind), 2200, 0.7)
        k = int(np.argmin(np.abs(TB - t0)))
        st = state('coop', k)
        re = r_eff(st['r'], shot)
        g = 0.028 / re * 3.5 * 1.7        # (+4.6 dB: the rough voice peaks higher for its loudness; as loud as v2's)
        BUS['coo'].add(air(y, re), t0, pan_of(st['sx'], st['cx'], st['cz']), g, rsend('coo', re))
        log('coo', 'coo (' + kind + ')', t0, len(y) / SR, shot, 'coop', st)


# ------------------------------------------------------------------ the flag (shots 1, 2 and the whip, 5)
def flag_layer():
    """The keeper's flag in the breeze. Its cloth is drawn rippling at 10 rad/s (and 5.6), harder as
    the wind blows, and its free end snaps at 17 rad/s as the wind rises (drawPoleFlag). So it is heard as
    - a flutter: cloth moving air (a soft band that brightens with the wind) and its fibres and folds
      ticking (fabric crackle, denser in a stronger wind), swelling twice a ripple and with the wind;
    - flips: where the drawn free edge is thrown hardest (see below), a soft 'fwap', 10 ms to open,
      gone in 50..80 ms, its band falling as it goes; a lull is only the flutter and a gust flaps.
    (v1 snapped every 185 ms, a metronome; v2 put one hard flap on each gust peak, 4 ms to open, and
    the tagger heard 'chop, arrow, whip'; alone those flaps read 'bang, gunshot', measured.) Out of the
    picture it is heard less; once shot 5's push has left it behind it fades within 0.8 s."""
    s = S['flag']
    tt = np.arange(N) / SR
    rng = np.random.default_rng(5005)
    ok = np.isfinite(s['r'])
    tw = np.interp(tt, TB, TW)
    wd = np.interp(tt, TB[ok], s['wd'][ok])
    on = np.interp(tt, TB, np.nan_to_num(s['on'], nan=0.0))
    sx = np.interp(tt, TB[ok], np.nan_to_num(s['sx'][ok], nan=-900.0))
    rr = np.interp(tt, TB[ok], s['r'][ok])
    here = level_curve({'s1': 1, 'whip': 1, 's2': 1, 's5': 1}, 0.012)
    # shot 5: gone after it leaves the frame
    m5 = seg_mask('s5') & ok
    k_off = np.where(m5 & (np.nan_to_num(s['on'], nan=0) > 0.5))[0]
    t_gone = TB[k_off[-1]] if len(k_off) else S5_T0
    here *= 1 - sstep(t_gone, t_gone + 0.8, tt) * (tt > S5_T0)
    look = 0.35 + 0.65 * on
    ripple = 0.6 + 0.25 * np.abs(np.sin(6.2 - 10 * tw)) ** 2 + 0.15 * np.abs(np.sin(2.6 - 5.6 * tw)) ** 2
    w15 = np.clip(wd, 0, 1.5)
    tex = crackle_tv(rng, N, 1500 + 3500 * w15, 2200, 0.7)
    body = svf('bp', rng.standard_normal(N), 450 * (0.8 + 0.4 * w15), 1.2)
    x = 0.5 * tex + 0.6 * body / (np.std(body) + 1e-12)
    re = rr * 1000 / 1000.0
    y = x * 0.0022 * wd ** 1.5 * ripple * look * here * 3.4 / np.maximum(re, 0.6)
    pan = np.clip((sx - 640) / 640, -1, 1)
    BUS['flag'].x[0] += y * np.cos((pan + 1) * np.pi / 4)
    BUS['flag'].x[1] += y * np.sin((pan + 1) * np.pi / 4)
    BUS['flag'].send += y * SEND['flag']
    # the flips: where the drawn free edge (drawPoleFlag's wave at u = 1, mid-height) is thrown hardest.
    # Its 10 rad/s ripple, 5.6 rad/s swell and the 17 rad/s snap at the free end that grows with the wind
    # (props.js) add up to an edge whose acceleration peaks unevenly, 1.5..3 times a second where the
    # wind is up; a flip on each peak over 1700 (the drawing's px/s^2), as strong as it is over that.
    # (v3a locked them to the ripple's crest alone and missed the drawn snap; its sample pairs across
    # the cut into shot 3, where the world's clock jumps, logged a flip that was never heard)
    tf = np.arange(0.0, T_END, 0.001)
    twf = np.interp(tf, TB, TW)
    wdf = np.interp(tf, TB[ok], s['wd'][ok])
    acc = np.abs(1.125 * (13 * (0.8 + 0.2 * wdf) * 100 * np.sin(6.2 - 10 * twf) + 6 * 31.36 * np.sin(2.6 - 5.6 * twf))
                 + 4.05 * wdf * 289 * np.sin(11 - 17 * twf))
    for name, _, _ in SEGS:
        if name in ('s3', 's4'):
            continue
        lo, hi = scanlib.seg_bounds(name)
        idx = np.where((tf >= lo) & (tf < hi))[0]
        pk, _ = sg.find_peaks(acc[idx], distance=60)
        for p in pk:
            i = idx[p]
            t = float(tf[i])
            k0 = int(np.argmin(np.abs(TB - t)))
            if not ok[k0]:
                continue
            rngf = np.random.default_rng(5200 + int(round(t * 1000)))     # (each flip its own stream)
            strength = float(np.clip((acc[i] - 1700) / 1000, 0, 1)) * rngf.uniform(0.6, 1.0)
            tau = rngf.uniform(0.05, 0.08)
            fj = rngf.uniform(0.85, 1.15)
            tj = rngf.uniform(-0.008, 0.008)                 # (a cloth is not a clock)
            g_here = float(np.interp(t, tt, here))
            t0, t_end = t + LAG + tj, seg_end(name, t)
            if strength < 0.08 or g_here < 0.05 or t0 > t_end - 0.01:
                continue
            n = int(0.3 * SR)
            u = np.arange(n) / SR
            env = sstep(0, 0.01, u) * np.exp(-np.clip(u - 0.01, 0, None) / tau)
            fcs = 450 + 450 * np.exp(-u / (0.6 * tau))       # its band falls with its level
            bd = svf('bp', rngf.standard_normal(n), fcs * fj, 1.0)
            bd /= np.max(np.abs(bd[:int(0.05 * SR)])) + 1e-12
            yy = env * (bd + 0.5 * crackle(rngf, n, 7000, 2600, 0.8, 0.3) * np.sqrt(env) / 3)
            yy /= np.max(np.abs(yy)) + 1e-12
            st = state('flag', k0)
            rE = r_eff(st['r'], name)
            gain = 0.02 * strength / rE * 3.4 * (1.0 if st['on'] else 0.35) * g_here
            BUS['flag'].add(air(yy, rE), t0, pan_of(st['sx'], st['cx'], st['cz']), gain, rsend('flag', rE), tmax=t_end)
            if gain > 0.004:
                log('flag', 'flip', t0, 0.15, name, 'flag', st, t_vis=np.ceil(t * FPS - 1e-6) / FPS, extra={'acc': round(float(acc[i]))})


# ------------------------------------------------------------------ the far town: a murmur, and sparrows in the courtyard trees
def ambience_layer():
    rng = np.random.default_rng(6006)
    tt = np.arange(N) / SR
    lvl = level_curve({'s1': 1, 'whip': 1, 's2': 1, 's3': 0.18, 's4': 1, 's5': 1})
    # distant traffic from the blocks on the skyline: low, slow (v2's, 3 dB down: alone and steady it
    # read 'eruption' 0.29..0.34, a rumble with nothing in it)
    L = pink(rng, N)
    R = 0.6 * L + 0.8 * pink(rng, N)
    b, a = sg.butter(2, [45 / (SR / 2), 330 / (SR / 2)], 'band')
    L, R = sg.lfilter(b, a, L), sg.lfilter(b, a, R)
    lfo = 1 + 0.25 * np.sin(2 * np.pi * 0.07 * tt + 1.3) + 0.15 * np.sin(2 * np.pi * 0.19 * tt)
    g = 0.004
    yl = 0.7 * L * lfo * lvl * g / np.std(L)
    yr = 0.7 * R * lfo * lvl * g / np.std(R)
    # the far roads' tyres, all together: a faint band round 900 Hz, 250 m of air on it, its density
    # drifting over tens of seconds, left and right apart (a car 200 m off takes 2d/v, about 30 s, to
    # swell and fade). (v3a had single cars 120..400 m off swell and fade in 4..8 s, every 2.5..6 s:
    # too fast for their distance, and the tagger heard surf, 'waves' 0.19, found by a fresh eye. Without
    # them it hears 'white noise' and 'wind': a synthesized wash carries no town; only a recording would.)
    rt = np.random.default_rng(6007)          # (its own stream: the sparrows below keep v2's)
    tl, tr = air(bpn(rt, N, 900, 0.8), 250), air(bpn(rt, N, 900, 0.8), 250)

    def drift():
        # (a control signal at 20 Hz smoothed under 0.1 Hz, then interpolated: a biquad at 0.08 Hz on
        # 48 kHz samples is numerically unstable)
        k = int(np.ceil(N / SR * 20)) + 1
        c = sg.filtfilt(*sg.butter(2, 0.08 / 10, 'low'), rt.standard_normal(k))
        c = (c - c.mean()) / (np.std(c) + 1e-12)
        return 10 ** (3.0 * np.interp(tt, np.arange(k) / 20, c) / 20)
    yl += 0.175 * tl / np.std(tl) * lvl * g * drift()
    yr += 0.175 * tr / np.std(tr) * lvl * g * drift()
    BUS['amb'].add_stereo(yl, yr)
    # sparrows: bursts of chirps from one bird at a time, here and there in the rows
    t = 0.6
    j = 0
    quiet = [(11.45, 12.7)]                     # clear of the whistle: silence is a level
    while t < T_END - 0.3:
        shot = seg_of(t)
        gap = rng.exponential(1.6)
        if shot in ('s3',) or any(a <= t <= b for a, b in quiet):
            t += gap
            continue
        rngc = np.random.default_rng(7000 + j)
        nchirp = rngc.integers(2, 6)
        rate = rngc.uniform(2.6, 4.2)
        dist = rngc.uniform(16, 38)
        pan = rngc.uniform(-0.9, 0.9)
        fhi = rngc.uniform(4.6, 6.2) * 1000
        for c in range(nchirp):
            tc = t + c / rate + rngc.uniform(-0.03, 0.03)
            if seg_of(tc) == 's3' or any(a <= tc <= b for a, b in quiet) or tc > T_END - 0.2:
                continue
            y = chirp(rngc, fhi)
            BUS['sparrow'].add(air(y, dist), tc, pan, 0.22 / dist * rngc.uniform(0.6, 1.0), rsend('sparrow', dist), tmax=seg_end(seg_of(tc), tc))
            log('sparrow', 'chirp', tc, len(y) / SR, seg_of(tc), 'trees', None, extra={'dist': round(dist, 1), 'pan': round(pan, 2)})
        t += nchirp / rate + gap
        j += 1


def chirp(rng, fhi):
    """a house sparrow's two-note 'chirrup' (an M): each note up and down, 0.12 s in all"""
    dur = float(np.clip(rng.normal(0.12, 0.025), 0.07, 0.18))
    n = int((dur + 0.01) * SR)
    t = np.arange(n) / SR
    n1, gp = 0.55 * dur, 0.07 * dur
    flo = rng.uniform(3200, 4000)
    f = np.full(n, flo)
    amp = np.zeros(n)
    a = t < n1
    u = t[a] / n1
    f[a] = flo + (fhi - flo) * np.sin(np.pi * np.clip(u * 1.1, 0, 1))
    amp[a] = np.sin(np.pi * u) ** 1.5
    b = (t >= n1 + gp) & (t < dur)
    u2 = (t[b] - n1 - gp) / (dur - n1 - gp)
    f2 = fhi * rng.uniform(0.88, 1.0)
    f[b] = flo * 1.05 + (f2 - flo) * np.sin(np.pi * np.clip(u2 * 1.15, 0, 1))
    amp[b] = 0.8 * np.sin(np.pi * u2) ** 1.5
    ph = 2 * np.pi * np.cumsum(f) / SR
    # (harmonics and a little noise, a sparrow's harsh 'tschilp'; pure FM sines read electronic)
    rough = 1 + 0.25 * np.sin(2 * np.pi * rng.uniform(90, 140) * t)
    y = amp * rough * (np.sin(ph) + 0.35 * np.sin(2 * ph + 0.7) + 0.12 * np.sin(3 * ph + 1.9))
    y += 0.1 * amp * bpn(rng, n, float(np.mean(f)), 2.5)
    return y / (np.max(np.abs(y)) + 1e-12)


def level_curve(per_shot, ramp=0.02):
    """a gain per shot, cut with the picture (a 20 ms ramp at each cut, no click)"""
    tt = np.arange(N) / SR
    g = np.zeros(N)
    for name, a, b in SEGS:
        t0, t1 = a / FPS, b / FPS
        w = sstep(t0 - ramp / 2, t0 + ramp / 2, tt) * (1 - sstep(t1 - ramp / 2, t1 + ramp / 2, tt)) if t1 < T_END else sstep(t0 - ramp / 2, t0 + ramp / 2, tt)
        g += w * per_shot.get(name, 0.0)
    return g


# ------------------------------------------------------------------ shot 4: the rag, the whistle, his breath
def rag_layer():
    rows = D['rag']['rows']
    f = np.array([r['f'] for r in rows])
    u = np.array([r['uRms'] for r in rows])
    ae = np.array([r['aEdge'] for r in rows])
    t_b = (228 + f) / FPS
    s4a, s4b = scanlib.seg_bounds('s4')
    tt = np.arange(N) / SR
    uu = np.interp(tt, t_b + LAG, u)
    pole = S['pole']
    sx = np.interp(tt, TB, np.nan_to_num(pole['sx'], nan=640.0))
    rr = np.interp(tt, TB, np.nan_to_num(pole['r'], nan=4.0))
    re = rr * 1000 / F_BASE['s4']
    rng = np.random.default_rng(8008)
    # the cloth in the air: dipole noise, amplitude as the air speed cubed and more; in and out with the
    # shot over 12 ms (switched on the cut, it clicked, measured on the spectrogram)
    # (steeper than the dipole's cube: the swing's rush over the wind's steady flutter; at U^3 the
    # rag streaming in the wind with the pole still was as loud as the circles, and hissed on off the
    # picture at the end of the shot, measured by a fresh eye)
    on = np.interp(tt, TB, np.nan_to_num(pole['on'], nan=0.0))
    amp = (uu / 6.0) ** 4.5 * 0.095 * 0.67 / np.maximum(re, 0.6) * level_curve({'s4': 1.0}, 0.012) * (0.35 + 0.65 * on)
    # its band moves with its speed, 250 Hz + 170 Hz per m/s (a whoosh is a moving band; v2's three
    # fixed bands, crossfaded, read 'music, musical instrument'), and its fibres tick (fabric crackle)
    fc = 250 + 170 * uu
    x = svf('bp', rng.standard_normal(N), fc, 2.0)
    x = x / (np.std(x) + 1e-12) + 0.4 * svf('bp', rng.standard_normal(N), 2 * fc, 2.4) / 0.3
    x /= np.std(x) + 1e-12
    x += 0.3 * np.clip(uu / 6, 0, 2) ** 1.5 * crackle_tv(rng, N, 1000 + 800 * uu, 2500, 0.8)
    # it flaps as a flag does, at fL/U about 0.4 (Virot et al. 2013): 0.8 U Hz for its 0.5 m, a
    # shallow swell, and not a clock (v2 pulsed it 75 % deep at a steady rate: the tagger heard a
    # rhythm, 'music' 0.17..0.30 as the depth rose, measured)
    jn = filt('lp', np.random.default_rng(8009).standard_normal(N), 2, 0.7)     # (its own stream)
    jit = 1 + 0.2 * jn / (np.std(jn) + 1e-12)
    phs = 2 * np.pi * np.cumsum(0.8 * uu * jit) / SR
    flap = 0.8 + 0.2 * np.abs(np.sin(phs)) ** 2
    y = x * amp * flap
    pan = np.clip((sx - 640) / 640, -1, 1)
    BUS['rag'].x[0] += y * np.cos((pan + 1) * np.pi / 4)
    BUS['rag'].x[1] += y * np.sin((pan + 1) * np.pi / 4)
    BUS['rag'].send += y * SEND['rag'] * 1.2
    # the snaps: where the free edge is thrown hardest (its acceleration's peaks above 70 m/s2): a
    # cloth's 'fwap', 2 ms to open, its band falling from 1.8 kHz as it dies in 20..30 ms, fibres in it
    pk, _ = sg.find_peaks(ae, height=70, distance=10)
    for j, p in enumerate(pk):
        tb = t_b[p] + LAG
        if not (s4a <= tb < s4b):
            continue
        rngs = np.random.default_rng(8100 + j)
        n = int(0.15 * SR)
        t = np.arange(n) / SR
        tau = rngs.uniform(0.02, 0.03)
        env = (1 - np.exp(-t / 0.002)) * np.exp(-t / tau)
        fcs = 600 + 1200 * np.exp(-t / (0.5 * tau))
        c = env * svf('bp', rngs.standard_normal(n), fcs * rngs.uniform(0.85, 1.15), 1.0)
        c += 0.4 * env * crackle(rngs, n, 8000, 2800, 0.8, 0.3) * np.std(c[:int(0.01 * SR)])
        c /= np.max(np.abs(c)) + 1e-12
        k = int(np.argmin(np.abs(TB - t_b[p])))
        st = state('pole', k)
        rE = r_eff(st['r'], 's4')
        g = 0.06 * 0.35 * (ae[p] / 150) ** 1.5 / rE * (1.0 if st['on'] else 0.35)
        BUS['rag'].add(air(c, rE), tb, pan_of(st['sx'], st['cx'], st['cz']), g, rsend('rag', rE))
        log('rag', 'snap', tb, 0.07, 's4', 'pole', st, t_vis=np.ceil(t_b[p] * FPS - 1e-6) / FPS, extra={'aEdge': round(float(ae[p]), 1)})


def whistle_layer():
    """the finger whistle: one long blast on the curve his body blows it with (blastHit), a scoop up
    to pitch at the onset, easing down as the breath eases, and dropping as it runs out; then the
    mahalla's walls give it back"""
    b = S['boy']
    m = seg_mask('s4')
    idx = np.where(m)[0]
    hit = b['hit'][idx]
    t_b = TB[idx]
    tt = np.arange(N) / SR
    h = np.interp(tt, t_b + LAG, hit, left=0, right=0)
    # onset: the tone speaks when the blow is a third of the way in, in 25 ms
    on_i = np.where(h > 0.3)[0]
    t_on = on_i[0] / SR
    t_off = on_i[-1] / SR
    A = np.clip(h, 0, 1)
    A = np.where(tt < t_on, 0.0, A)
    A *= sstep(t_on, t_on + 0.025, tt)
    rng = np.random.default_rng(9009)
    f0 = 2950.0
    u_on = tt - t_on
    scoop = 0.86 + 0.14 * sstep(0, 0.07, u_on)
    ease = 1 - 0.03 * np.clip((1 - np.clip(h, 0, 1)) / 0.25, 0, 1) * (tt < t_off - 0.08)
    drop = 1 - 0.1 * sstep(t_off - 0.1, t_off + 0.02, tt)
    jit = 1 + 0.004 * filt('lp', rng.standard_normal(N), 8, 0.7) / 0.03
    f = f0 * scoop * ease * drop * jit
    ph = 2 * np.pi * np.cumsum(f) / SR
    shimmer = 1 + 0.05 * filt('lp', rng.standard_normal(N), 12, 0.7) / 0.04
    tone = np.sin(ph) + 0.05 * np.sin(2 * ph + 0.3)
    # (the breath noise round the tone follows its pitch through the scoop and the drop: a narrow band
    # carried on the tone's own phase; fixed at 2950 Hz it sat apart from the tone in both)
    nb = filt('lp', rng.standard_normal(N), 160, 0.7)
    nb /= np.std(nb) + 1e-12
    breath = 0.1 * nb * np.sin(ph + 1.3) + 0.03 * bpn(rng, N, 6500, 0.8)
    y = A * shimmer * (tone + breath)
    sel = (tt > t_on - 0.1) & (tt < t_off + 0.3)
    k = int(np.argmin(np.abs(TB - t_on)))
    st = state('boy', k)
    re = r_eff(st['r'], 's4')
    g = 0.226 * 3.6 / re
    pan = pan_of(st['sx'], st['cx'], st['cz'])
    i0, i1 = np.where(sel)[0][[0, -1]]
    seg = y[i0:i1]
    BUS['whistle'].add(seg, i0 / SR, pan, g, rsend('whistle', re))
    # the walls of the rows 16 and 30 m off give it back, late, dulled, from across the mahalla
    for d, gg, p in [(16, 0.16, -0.55), (23, 0.1, 0.5), (30, 0.07, -0.25)]:
        dl = 2 * d / 343.0
        e = filt('lp', air(seg, 2 * d), 3800, 0.7)
        BUS['whistle'].add(e, i0 / SR + dl, p, g * gg, 0.0)      # (the reverb has no far walls: these are them)
    log('whistle', 'whistle', t_on, t_off - t_on, 's4', 'boy', st, t_vis=np.ceil((t_on - LAG) * FPS - 1e-6) / FPS,
        extra={'f0': f0})
    return t_on, t_off


def breath(rng, dur, kind):
    """breath through the vocal tract: aspiration noise shaped by a child's formants (about 20 %
    above an adult's). kind 'in' through the teeth and fingers (sharper), 'out' the open mouth"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    wn = rng.standard_normal(n)
    if kind == 'in':
        y = 0.55 * filt('bp', wn, 1100, 4) + 0.6 * filt('bp', wn, 2200, 5) + 0.4 * filt('bp', wn, 4300, 2.5)
        env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2
    else:
        y = 0.9 * filt('bp', wn, 950, 5) + 0.6 * filt('bp', wn, 1900, 6) + 0.35 * filt('bp', wn, 3300, 7) + 0.15 * filt('bp', wn, 5500, 2)
        y = y - 0.1 * filt('bp', wn, 5500, 2) * 1.0
        env = sstep(0, 0.18, t) * np.exp(-t / (0.35 * dur)) * (1 - sstep(0.8 * dur, dur, t))
    y = env * y
    return y / (np.max(np.abs(y)) + 1e-12)


def breath_layer(t_whistle_on):
    b = S['boy']
    # the breath drawn before the whistle: his shoulders rise on blastIn, which peaks 3 frames before
    # the blow; the air goes in over its rise
    m = seg_mask('s4')
    idx = np.where(m)[0]
    inh = b['inh'][idx]
    dinh = np.gradient(inh, TB[idx])
    rise = np.where(dinh > 0.5)[0]
    t0, t1 = TB[idx][rise[0]], TB[idx][rise[-1]]
    rng = np.random.default_rng(10010)
    y = breath(rng, t1 - t0 + 0.05, 'in')
    k = idx[rise[0]]
    st = state('boy', k)
    re = r_eff(st['r'], 's4')
    BUS['breath'].add(y, t0 + LAG, pan_of(st['sx'], st['cx'], st['cz']), 0.038 * 3.6 / re, rsend('breath', re))
    log('breath', 'in', t0 + LAG, t1 - t0, 's4', 'boy', st, t_vis=np.ceil(t0 * FPS - 1e-6) / FPS)
    # the contented breath out in shot 5, as his shoulders settle after 4.9 s (and the soft breath in
    # through the nose as they rise before it)
    m5 = seg_mask('s5')
    i5 = np.where(m5)[0]
    sig = b['sigh'][i5]
    dsig = np.gradient(sig, TB[i5])
    kpk = i5[np.argmax(sig)]
    t_pk = TB[kpk]
    st = state('boy', kpk)
    zoom = D['zoom'][kpk]
    re = r_eff(st['r'], 's5') / zoom ** 0.5      # he is in medium close-up by then: his breath is near
    rng = np.random.default_rng(10020)
    up = np.where(dsig > 0.4)[0]
    ti0 = TB[i5][up[0]]
    y = breath(rng, t_pk - ti0, 'in')
    y = filt('lp', y, 3000, 0.7)                 # through the nose, softer
    BUS['breath'].add(y / (np.max(np.abs(y)) + 1e-12), ti0 + LAG, pan_of(st['sx'], st['cx'], st['cz']), 0.03 / re * 2.6, rsend('breath', re))
    log('breath', 'in (nose)', ti0 + LAG, t_pk - ti0, 's5', 'boy', st, t_vis=np.ceil(ti0 * FPS - 1e-6) / FPS)
    dn = np.where(dsig < -0.4)[0]
    to1 = TB[i5][dn[-1]]
    y = breath(rng, to1 - t_pk + 0.25, 'out')
    BUS['breath'].add(y, t_pk + LAG, pan_of(st['sx'], st['cx'], st['cz']), 0.09 / re * 2.6, rsend('breath', re))
    log('breath', 'out (sigh)', t_pk + LAG, to1 - t_pk + 0.25, 's5', 'boy', st, t_vis=np.ceil(t_pk * FPS - 1e-6) / FPS)


# ------------------------------------------------------------------ his clothes
def foley_layer():
    """his shirt moving with his arms (shot 1's throw, shot 4's circles and hand to his mouth) and his
    turn in shot 5: cotton rustle as the limbs' speed to the power 1.5, above a threshold"""
    b = S['boy']
    tt = np.arange(N) / SR
    rng = np.random.default_rng(11011)
    # (the drawn hands' speed is a difference of drawn positions and jumps frame to frame at the
    # release, 5.8, 5.6, 6.8, 4.3, 2.6, 8.2, 2.4 m/s: cloth does not follow that. Median over 7
    # samples of the scan, then a zero-phase 6 Hz low-pass on the envelope; at 25 Hz causal the throw's
    # shirt read 'clapping, tick, scissors', smoothed it reads 'rustle' 0.38, measured)
    v = sg.medfilt(np.nan_to_num(np.maximum(b['vL'], b['vR']), nan=0.0), 7)
    tw = np.nan_to_num(np.abs(b.get('twistV', np.zeros_like(v))), nan=0.0)
    ctl = np.zeros_like(v)
    for name, _, _ in SEGS:
        mk = seg_mask(name)
        if name in ('s1', 's4'):
            ctl[mk] = np.clip(v[mk] - 0.6, 0, None) ** 1.5 * 0.0025
        if name == 's5':
            ctl[mk] = np.clip(tw[mk] - 0.15, 0, None) ** 1.5 * 0.006 + np.clip(v[mk] - 0.4, 0, None) ** 1.5 * 0.003
    re = np.array([r_eff(r, n) if np.isfinite(r) else 3.0 for r, n in zip(b['r'], SHOT)])
    zoom = D['zoom']
    ctl = ctl / np.maximum(re / np.sqrt(zoom), 0.6)
    env = np.interp(tt, TB + LAG, ctl)
    bb, aa = sg.butter(2, 6 / (SR / 2), 'low')
    env = np.maximum(sg.filtfilt(bb, aa, env), 0.0)
    grain = filt('lp', rng.standard_normal(N), 180, 0.7)
    grain = 1 + 0.9 * np.clip(grain / (np.std(grain) + 1e-12), -1.5, 3)
    x = (bpn(rng, N, 1300, 0.9) + 0.7 * bpn(rng, N, 3200, 1.1) + 0.3 * bpn(rng, N, 600, 1.0)) * grain
    y = x * env
    sx = np.interp(tt, TB, np.nan_to_num(b['sx'], nan=900.0))
    pan = np.clip((sx - 640) / 640, -1, 1)
    BUS['foley'].x[0] += y * np.cos((pan + 1) * np.pi / 4)
    BUS['foley'].x[1] += y * np.sin((pan + 1) * np.pi / 4)
    BUS['foley'].send += y * SEND['foley']
    # the startled hop of the middle bird on the coop (shot 1): off the boards, and down on them
    P1 = S['P1']
    mk = seg_mask('s1')
    hop = np.nan_to_num(P1['hop'], nan=0.0)
    hi = np.where(mk & (hop > 0.02))[0]
    if len(hi):
        for j, k in enumerate([hi[0], hi[-1]]):
            rngh = np.random.default_rng(12000 + j)
            y = touchdown(rngh, 'coop') * (0.6 if j == 0 else 1.0)
            st = state('P1', k)
            re1 = r_eff(st['r'], 's1')
            BUS['land'].add(air(y, re1), TB[k] + LAG, pan_of(st['sx'], st['cx'], st['cz']), 0.05 / re1, rsend('land', re1))
            log('land', 'hop ' + ('off' if j == 0 else 'down'), TB[k] + LAG, 0.16, 's1', 'P1', st, t_vis=np.ceil(TB[k] * FPS - 1e-6) / FPS)


# ------------------------------------------------------------------ the whip pan
def whip_layer():
    """the lens whipping from him to the flock: air past it, swelling and falling with the pan's
    speed (a convention of the cut, not a thing in the picture: kept low)"""
    a, b = scanlib.seg_bounds('whip')
    tt = np.arange(N) / SR
    x = np.clip((tt - a) / (b - a), 0, 1)
    v = 6 * x * (1 - x)                    # the pan's speed (smoothstep's slope)
    rng = np.random.default_rng(13013)
    wn = rng.standard_normal(N)
    y = (filt('bp', wn, 700, 1.0) * (1 - x) + filt('bp', wn, 1300, 1.1) * x) * v ** 2 * ((tt > a - 0.05) & (tt < b + 0.05))
    y *= 0.012 / (np.std(y[(tt > a) & (tt < b)]) + 1e-12)
    L, R = y * np.cos((0.4 - 0.8 * x + 1) * np.pi / 4), y * np.sin((0.4 - 0.8 * x + 1) * np.pi / 4)
    BUS['whip'].add_stereo(L, R)
    log('whip', 'whoosh', a, b - a, 'whip', None, None, t_vis=a)


# ------------------------------------------------------------------ the room: an open rooftop among the mahalla's walls
def reverb_ir(rng):
    """Outdoors: the near walls (a stair head, the neighbour's wall, the coop) give a few early
    reflections, and the courtyards a short diffuse tail, 0.4 s to fall 60 dB, its top falling first.
    (The far rows' echoes are the whistle's own, placed there.) Normalised to unit power gain over
    200..5000 Hz, so a send is the reverb's level under the direct sound."""
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for d, g, p in [(4.0, 0.5, -0.4), (7.5, 0.35, 0.5), (11.0, 0.25, -0.1)]:
        i = int(2 * d / 343.0 * SR)
        gl, gr = pan_gains(p)
        L[i] += g * gl
        R[i] += g * gr
    tail_env = np.exp(-6.9 * t / 0.4) * sstep(0.015, 0.045, t)
    L += filt('lp', rng.standard_normal(n), 5000, 0.7) * tail_env * 0.09
    R += filt('lp', rng.standard_normal(n), 5000, 0.7) * tail_env * 0.09
    b, a = sg.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], 'band')
    e = 0.5 * (np.sum(sg.lfilter(b, a, L) ** 2) + np.sum(sg.lfilter(b, a, R) ** 2))
    return L / np.sqrt(e), R / np.sqrt(e)


def slow_ir(rng, t60=1.6, lp=3500.0, pre=0.03):
    """Shot 3's room: the world slowed five times, its 0.4 s tail heard five times longer, kept to
    1.6 s. Diffuse only: the near walls' reflections, stretched five times, would come back as slap
    echoes 60..320 ms late. Darker (a slowed world is lower). Normalised as reverb_ir."""
    n = int((t60 * 1.2 + pre) * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * (t - pre) / t60) * sstep(pre, pre + 0.08, t)
    L = filt('lp', rng.standard_normal(n), lp, 0.7) * env
    R = filt('lp', rng.standard_normal(n), lp, 0.7) * env
    b, a = sg.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], 'band')
    e = 0.5 * (np.sum(sg.lfilter(b, a, L) ** 2) + np.sum(sg.lfilter(b, a, R) ** 2))
    return L / np.sqrt(e), R / np.sqrt(e)


# the reverb is run shot by shot where a cut changes the world (into and out of the slow motion):
# a tail stops with the picture there (v1's shot-3 tail was the loudest thing in shot 4's first 50 ms)
REV_PARTS = [0.0, 7.0, 9.75, T_END]


def render():
    wings_layer()
    air_layer()
    landing_layer()
    coo_layer()
    flag_layer()
    ambience_layer()
    rag_layer()
    t_on, t_off = whistle_layer()
    breath_layer(t_on)
    foley_layer()
    whip_layer()
    rng = np.random.default_rng(14014)
    irL, irR = reverb_ir(rng)
    sirL, sirR = slow_ir(np.random.default_rng(14015))
    stems = {}
    fade = int(0.015 * SR)
    for k, bus in BUS.items():
        wet = np.zeros((2, N))
        for a, b in zip(REV_PARTS[:-1], REV_PARTS[1:]):
            ia, ib = int(round(a * SR)), int(round(b * SR))
            part = np.zeros(N)
            part[ia:ib] = bus.send[ia:ib]
            if not part.any():
                continue
            irs = (sirL, sirR) if seg_of(0.5 * (a + b)) in SLOW else (irL, irR)
            for c, ir in enumerate(irs):
                w = sg.fftconvolve(part, ir)[:N]
                if ib < N:
                    w[ib - fade:ib] *= np.linspace(1, 0, fade)
                    w[ib:] = 0
                wet[c] += w
        stems[k] = bus.x + wet
    return stems


def fades(n):
    tt = np.arange(n) / SR
    # the picture fades in over 12 frames and out over the last 24 (assemble.py, smoothstep)
    return sstep(0, 12 / FPS, tt) * (1 - sstep(T_END - 24 / FPS, T_END, tt))


if __name__ == '__main__':
    stems = render()
    for k, x in stems.items():
        np.save(OUT + f'/stems/{k}.npy', x.astype(np.float32))
    json.dump({'events': LOG}, open(OUT + '/events.json', 'w'), indent=0)
    print('events logged', len(LOG))
    for k, x in stems.items():
        r = np.sqrt(np.mean(x ** 2))
        print(f'  {k:8s} rms {20 * np.log10(r + 1e-12):7.1f} dB  peak {20 * np.log10(np.max(np.abs(x)) + 1e-12):6.1f}')
