#!/bin/bash
# usage: audit/trackvar.sh '<js overrides>' outName   (shot 2 track overlay at frames 0,24,48,72,95)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; SP="${TMPDIR:-/tmp}/kaptar"; mkdir -p "$SP"
mkdir -p $SP/tv
{ echo "$1"; echo "FLOCK_TRACK = null;"; cat $ROOT/audit/ov_track.js; } > $SP/tv/$2.js
cd $ROOT && SHOT=s2 node audit/overlay.mjs 0,24,48,72,95 $SP/tv/$2 full $SP/tv/$2.js >/dev/null && python3 - "$SP/tv/$2" <<'PY'
import sys
from PIL import Image
S=sys.argv[1]
ims=[Image.open(f'{S}/f{f:03d}.png').convert('RGB').resize((640,360)) for f in [0,24,48,72,95]]
sh=Image.new('RGB',(640*3+8, 360*2+4),(20,20,20))
for k,im in enumerate(ims): sh.paste(im,((k%3)*644,(k//3)*364))
sh.save(f'{S}_sheet.png'); print(f'{S}_sheet.png')
PY
