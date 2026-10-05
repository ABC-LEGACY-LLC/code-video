"""HUMAN MARKS -- preparation (pass 11).
Alonur marks the head parts by hand on the SAMPLE frames; Claude checks its own detectors against these marks
and shows our model's difference (ours - sample) two ways: by its own detector and by the person's point.
Our frames are not marked (Alonur: a half-done model has no "right place"; there the hand's precision would get mixed
up with our 3D definition). Hand noise -- a repeat: the same sample drawing twice (R12 and R13, difference 0.32 in the
face box).

  python3 test/parts/human/prepare.py TAG OUT_FOLDER
    OUT_FOLDER/sample-mark-frames.png  -- the sample frames only (1280x360, 4x2 tiles).
    OUT_FOLDER/measure-by-eye.html  -- the page; the sample frames are INSIDE it (Alonur asked: uploading a file
                                           was hard). That is why the page is only ever a private artifact (db -> no
                                           public link) and never goes into the repo. --with-file: no frames, the user
                                           uploads them.
    OUT_FOLDER/info.json             -- the data that went into the page (the analysis reads it too).

Coordinates: 320x180 working size, PIXEL CENTRE = INTEGER (the same as the detector centroids).
The 3D points (window.framePartPoints) come in the edge convention -> to the pixel centre: -0.5.
PRIVATE: the sample frames and numbers taken from the sample do not go into the public repo (info.json neither)."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
P3D_DIR = os.path.normpath(os.path.join(_HERE, '../../..'))              # the personaj3d folder
SAMPLE_DIR = os.path.join(P3D_DIR, 'private', 'sample')           # the sample frames k01..k22 (private)
import base64, json, sys
sys.path.insert(0, (P3D_DIR + '/test/parts'))
import part_measure as QO
from pathlib import Path
from PIL import Image

ROOT = Path((P3D_DIR))
GOAL = Path((SAMPLE_DIR))
TAG = sys.argv[1] if len(sys.argv) > 1 else 'head10c'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else '.')
OUT.mkdir(parents=True, exist_ok=True)

Q = ROOT / 'test/parts'
QP = ROOT / 'private/test/parts'                         # the private side of test/parts
sample = json.load(open(QP / 'sample_part.json'))
ours = json.load(open(Q / f'ours_{TAG}.json'))            # 3D points, key = render index (0 = k01)
cmp = json.load(open(QP / f'compare_{TAG}.json'))          # detector on both sides + difference (ours - sample), key = k
cal = json.load(open(Q / f'calibrate_{TAG}.json'))          # detector - 3D point (on our render)

# display order: the main ones first (shots 2-3: chin, eye; the repeat), then the extra ones
ORDER = [('R', 12), ('R', 17), ('R', 20), ('R', 22), ('R', 13), ('R', 14), ('R', 3), ('R', 10)]
MAIN = 5
ATLAS = [3, 10, 12, 13, 14, 17, 20, 22]                 # tile order: 4 columns x 2 rows
TW, TH = 320, 180


def r2(v):
    return [round(float(v[0]), 2), round(float(v[1]), 2)]


def centre(v):                                           # 3D (edge) -> pixel centre
    return [round(v[0] - 0.5, 2), round(v[1] - 0.5, 2)]


def make_box(xs, ys, left=16, top=14, right=18, low=16):
    x0, y0, x1, y1 = int(min(xs)) - left, int(min(ys)) - top, int(max(xs)) + right, int(max(ys)) + low
    return [max(0, x0), max(0, y0), min(TW, x1), min(TH, y1)]


def cal_off(name):
    c = cal.get(name) or {}
    return (c.get('dx'), c.get('dy'))


STRUCTURE = {('mouth', 1): (-2.5, 0.0)}          # the same as in target.py: shot 1 mouth, the definition difference measured against the person


def sample_claude(k):
    """The places Claude's detector (FIXED in pass 11 with Alonur's marks, test/parts/part_measure.py) found on a sample
    frame. The calibration is NOT carried over (an offset taken from our render does not transfer to the sample -- it gave
    a 4 px error at the eye): the raw detector, only the definition difference measured against the person (shot 1 mouth)
    is corrected. Jaw -- from the chin towards the ear."""
    r, out = QO.measure(QO.L320(str(GOAL / f'k{k:02d}.png')), k), {}
    s = 1 if k <= 11 else 2 if k <= 13 else 3
    for name, dq in (('chin', 'chin_tip'), ('nose', 'nose_tip'), ('eye_near', 'eye_near'), ('eye_far', 'eye_far'),
                    ('mouth', 'mouth'), ('brow_near', 'brow_near'), ('brow_far', 'brow_far')):
        v = r.get(dq)
        if v is None: continue
        x, y = (v['x'], v['y']) if isinstance(v, dict) else v
        dx, dy = STRUCTURE.get((name, s), (0, 0))
        out[name] = r2([x + dx, y + dy])
    if r.get('jaw'): out['jaw'] = {str(x): int(y) for x, y in r['jaw'].items()}
    return out


def ours_place(k):
    """Where our model drew the part in this frame (under the same definition as Claude's values on the sample):
    eye/nose/mouth middle/brow middle -- the 3D point (moved to the pixel centre); chin and jaw -- the very same detector
    as on the sample, on our bare render. view -- whether the part faces the camera (if it is behind, it is hidden in ours)."""
    p, out, view = ours[str(k - 1)], {}, {}
    by = QO.measure(QO.role_L(str(ROOT / f'frames-part/role-bare-{TAG}/{k - 1:03d}.png')), k)   # the very same (fixed) detector
    out['chin'] = r2(by['chin_tip'])
    out['jaw'] = {str(x): int(y) for x, y in by.get('jaw', {}).items()}
    for name, n3 in (('eye_near', 'eye_near'), ('eye_far', 'eye_far'), ('nose', 'nose_tip'), ('mouth', 'mouth'),
                    ('brow_near', 'brow_near_mid'), ('brow_far', 'brow_far_mid')):
        out[name] = centre(p[n3]); view[name] = bool(p[n3][3])
    return out, view


frames = []
for i, (kind, k) in enumerate(ORDER):
    if kind == 'R':
        r = sample[str(k)]
        x0, y0, x1, y1 = r['face_box']
        box = make_box([x0, x1], [y0, y1])
        bj, view = ours_place(k)
        frames.append({'id': f'R{k:02d}', 'source': 'sample', 'k': k, 'tile': ATLAS.index(k), 'box': box,
                        'main': i < MAIN, 'claude': sample_claude(k), 'ours': bj, 'view_ours': view})

info = {'tag': TAG, 'size': [TW, TH], 'coord': 'pixel centre = whole number, 320x180',
           'atlas': {'w': 4 * TW, 'h': 2 * TH, 'column': 4, 'order': [f'R{k:02d}' for k in ATLAS]},
           'frames': frames, 'repeat': ['R12', 'R13']}

# atlas -- the sample frames only
atlas = Image.new('RGB', (4 * TW, 2 * TH))
for j, k in enumerate(ATLAS):
    atlas.paste(Image.open(GOAL / f'k{k:02d}.png').convert('RGB'), ((j % 4) * TW, (j // 4) * TH))
atlas.save(OUT / 'sample-mark-frames.png', optimize=True)

json.dump(info, open(OUT / 'info.json', 'w'), ensure_ascii=False)
pattern = (ROOT / 'private/test/parts/human/page.html').read_text()
page = pattern.replace('/*INFO*/null', json.dumps(info, ensure_ascii=False, separators=(',', ':')))
if '--with-file' not in sys.argv:
    uri = 'data:image/png;base64,' + base64.b64encode((OUT / 'sample-mark-frames.png').read_bytes()).decode()
    page = page.replace('/*ATLAS*/null', json.dumps(uri))
(OUT / 'measure-by-eye.html').write_text(page)
print('frames', len(frames), 'page KB', len(page) // 1024, 'atlas', atlas.size)
for f in frames: print(f['id'], f['box'], 'Claude:', sorted(f['claude']), 'ours:', sorted(f['ours']))
