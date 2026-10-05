# Builds the sound player page from the current mix: the layers as MP3 (grouped as the page shows
# them), their level curves and accents, the film with the new master, and index.html from
# page.src.html. The previous version's layers stay in v2/ for the page's A/B.
#     python3 out/sound_page/build.py
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../'))
import os, sys, json, shutil, subprocess, tempfile
import numpy as np
sys.path.insert(0, f'{ROOT}/sound')
from dsp import read_wav, write_wav

HERE = os.path.dirname(os.path.abspath(__file__))
SND = f'{ROOT}/sound/out'
SR = 48000
HOP = 0.05
GROUPS = {'muhit': ['amb', 'sparrow', 'flag'], 'qanot': ['wings', 'air'], 'qonish': ['land'], 'ku': ['coo'], 'latta': ['rag'],
          'bola': ['whistle', 'breath', 'foley'], 'kamera': ['whip']}
LAYER_OF = {k: g for g, ks in GROUPS.items() for k in ks}


def envelope(x):
    m = np.sqrt(0.5 * (x[0] ** 2 + x[1] ** 2))
    h = int(HOP * SR)
    n = len(m) // h
    e = 20 * np.log10(np.sqrt(np.mean(m[:n * h].reshape(n, h) ** 2, axis=1)) + 1e-9)
    return [int(v) for v in np.maximum(np.round(e), -70)]


def ticks(events):
    """the accents the map marks: claps and the slow motion's beats of the thrown one, touchdowns and
    the startled hop, every chirp, flip, snap, coo, breath and the whistle (not every flock beat)"""
    out = {g: [] for g in GROUPS}
    for e in events:
        g = LAYER_OF.get(e['layer'])
        if g is None:
            continue
        if e['layer'] == 'wings' and not (e['name'] == 'clap+beat' or (e['shot'] == 's3' and e.get('src') == 'H')):
            continue
        if e['layer'] == 'land' and e['name'] not in ('touchdown', 'hop off', 'hop down'):
            continue
        out[g].append([round(e['t'], 3), round(e['dur'], 3), e['name']])
    for g in out:
        out[g].sort()
    return out


def main():
    events = json.load(open(f'{SND}/events.json'))['events']
    data = {'hop': HOP, 'env': {}, 'ticks': ticks(events)}
    tmp = tempfile.mkdtemp()
    for g, ks in GROUPS.items():
        x = sum(read_wav(f'{SND}/mixed/{k}.wav')[0] for k in ks)
        data['env'][g] = envelope(x)
        w = f'{tmp}/{g}.wav'
        write_wav(w, np.clip(x, -1, 1))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'libmp3lame', '-b:a', '160k', f'{HERE}/{g}.mp3'], check=True)
    json.dump(data, open(f'{HERE}/data.json', 'w'), separators=(',', ':'))
    # the film: its picture as it is, the new master under it. The picture is the one rendered from the
    # source (make_film.sh), else the one the v2 page was built on, else the page's current film.
    src = f'{HERE}/film.mp4'
    pic = next((p for p in (f'{SND}/picture.mp4', f'{SND}/v2/film_v2.mp4', src) if os.path.exists(p)), None)
    assert pic, 'no picture to put the sound under: run ./make_film.sh first'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', pic, '-i', f'{SND}/master.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', f'{tmp}/film.mp4'], check=True)
    shutil.move(f'{tmp}/film.mp4', src)
    # the page
    page = open(f'{HERE}/page.src.html').read()
    v2 = open(f'{HERE}/v2/data.json').read()
    page = page.replace('/*@DATA@*/null', json.dumps(data, separators=(',', ':'))).replace('/*@DATA_V2@*/null', v2.strip())
    cmp_ = json.load(open(f'{ROOT}/audit/sound/ear_compare.json'))
    page = page.replace('/*@EAR@*/null', json.dumps([{'w': r['window'], 'old': r['old'], 'new': r['new']} for r in cmp_['rows']], separators=(',', ':')))
    assert '/*@' not in page
    open(f'{HERE}/index.html', 'w').write(page)
    shutil.rmtree(tmp)
    print('built', {g: len(v) for g, v in data['ticks'].items()}, os.path.getsize(f'{HERE}/index.html'), 'bytes')


if __name__ == '__main__':
    main()
