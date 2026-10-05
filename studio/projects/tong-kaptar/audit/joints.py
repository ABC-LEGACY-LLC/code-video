# Pass 4 joint strips: crops centred on joints from the probe positions (scene maths), x2.
import json, sys
from PIL import Image
from strip import label
D = sys.argv[1] if len(sys.argv) > 1 else 'scan0'
pr = json.load(open(f'{D}/probes.json'))
frames = [int(x) for x in (sys.argv[2] if len(sys.argv) > 2 else '0,16,18,20,22,24,30,48,72,95').split(',')]
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
sheet('LE', 45, 'joint_LE.png'); sheet('RE', 45, 'joint_RE.png'); sheet('LW', 40, 'joint_LW.png'); sheet('RW', 40, 'joint_RW.png')
sheet('LS', 50, 'joint_LS.png'); sheet('RS', 50, 'joint_RS.png')
