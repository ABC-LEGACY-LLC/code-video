#!/bin/bash
# ragsheet.sh overrideJS outPng frames : render s4 frames with an override and crop the rag
OV="$1"; OUT="$2"; FR="$3"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; D="${TMPDIR:-/tmp}/kaptar/rs_tmp"
rm -rf $D; mkdir -p $D; echo "$OV; RAG_SIM = null;" > $D/ov.js
cd $ROOT/audit/s4v3 && node rs4.mjs $FR $D $D/ov.js > /dev/null
C=$(cd $ROOT && node -e "
const { createRequire } = require('node:module'); const r = createRequire('$ROOT/'); const { chromium } = r('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto('file://$ROOT/scene.html'); await p.evaluate(() => window.setShot('s4'));
await p.addScriptTag({ path: '$ROOT/audit/s4v3/ragflock.js' }); await p.addScriptTag({ path: '$D/ov.js' });
const c = await p.evaluate((fr) => fr.map((i) => window.ragFlock(i).rag), '$FR'.split(',').map(Number)); console.log(JSON.stringify(c)); await b.close(); })();")
python3 - "$C" "$FR" "$OUT" "$D" <<'PY'
import sys, json
from PIL import Image, ImageDraw
C = json.loads(sys.argv[1]); fr = [int(x) for x in sys.argv[2].split(',')]; out = sys.argv[3]; D = sys.argv[4]; S = 150; sc = 1.1
W = int(S * sc); cols = 12
sheet = Image.new('RGB', (cols * (W + 4), ((len(fr) + cols - 1) // cols) * (W + 18)), (20, 20, 20)); d = ImageDraw.Draw(sheet)
for k, (i, (cx, cy)) in enumerate(zip(fr, C)):
    im = Image.open(f'{D}/f{i:03d}.png').convert('RGB').crop((cx - S // 2, cy - S // 2, cx + S // 2, cy + S // 2)).resize((W, W), Image.LANCZOS)
    r, c = divmod(k, cols); sheet.paste(im, (c * (W + 4), r * (W + 18) + 16)); d.text((c * (W + 4) + 3, r * (W + 18) + 2), f'f{i}', fill=(255, 255, 0))
sheet.save(out); print(out, sheet.size)
PY
