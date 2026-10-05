#!/bin/bash
# QISMLAR O'LCHOVI -- to'liq (10-o'tish): bash test/qism/yugur.sh TEG
#   renderlar: yalang'och rol/anime, + soch rol (kadrlar-qism/*-TEG); kiyingan anime/rol va toza (olch9.py --render)
#   keyin: 3D nuqtalar, kalibr, taqqos, qatlamlar, varaq (chiqish/qismlar-audit-10.png), olch9 (eski o'lchovlar + kamera sinovi)
set -e
TEG=$1; cd /home/claude/work/personaj3d
python3 test/olch9.py $TEG --render > test/qism/olch9_$TEG.log 2>&1
node render.mjs --style rol --film misol22 --kadrlar 0-21 --chiq kadrlar-qism/rol-yalang-$TEG --w 960 --h 540 --qoshimcha 'gizla=soch,sochIch,kapyushon,plash' > /dev/null
node render.mjs --style anime --film misol22 --kadrlar 0-21 --chiq kadrlar-qism/anime-yalang-$TEG --w 960 --h 540 --qoshimcha 'gizla=soch,sochIch,kapyushon,plash&qorN=1' > /dev/null
node render.mjs --style rol --film misol22 --kadrlar 0-21 --chiq kadrlar-qism/rol-soch-$TEG --w 960 --h 540 --qoshimcha 'gizla=kapyushon,plash' > /dev/null
node test/qism/nuqtalar.mjs --kadrlar 0-21 --chiq test/qism/biz_$TEG.json
python3 test/qism/kalibr.py $TEG > test/qism/kalibr_$TEG.txt 2>&1 || true
python3 test/qism/taqqos.py $TEG > test/qism/taqqos_$TEG.txt
python3 test/qism/qatlam.py $TEG > test/qism/qatlam_$TEG.txt
echo tayyor $TEG
