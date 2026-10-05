# Pass 4 joint strips for the rebuild: crops centred on each joint from the probes (scene maths), x2.
import json, sys
from PIL import Image
from strip import label
D = sys.argv[1]
pr = json.load(open(f'{D}/probes.json'))
frames = [0, 12, 16, 19, 21, 22, 24, 28, 32, 36, 40, 44, 50, 70, 95]
def sheet(key, half, name, scale=2):
    tiles = []
    for i in frames:
        p = pr[i][key]; x, y = p['x'], p['y']
        im = Image.open(f'{D}/full/f{i:03d}.png').convert('RGB').crop((int(x - half), int(y - half), int(x + half), int(y + half)))
        tiles.append(label(im.resize((int(2 * half * scale),) * 2, Image.LANCZOS), f'f{i:02d} {key}'))
    w = tiles[0].size[0]; cols = 5; rows = (len(tiles) + cols - 1) // cols
    out = Image.new('RGB', (cols * (w + 4), rows * (w + 4)), (40, 40, 40))
    for k, t in enumerate(tiles): out.paste(t, ((k % cols) * (w + 4), (k // cols) * (w + 4)))
    out.save(f'{D}/{name}'); print(name, out.size)
sheet('LE', 45, 'j_LE.png'); sheet('RE', 45, 'j_RE.png'); sheet('LW', 45, 'j_LW.png'); sheet('RW', 45, 'j_RW.png')
sheet('LS', 50, 'j_LS.png'); sheet('RS', 50, 'j_RS.png'); sheet('neck', 55, 'j_neck.png')
