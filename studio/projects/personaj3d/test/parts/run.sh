#!/bin/bash
# PARTS MEASUREMENT -- full (pass 10): bash test/parts/run.sh TAG
#   renders: bare role/anime, + hair role (frames-part/*-TAG); dressed anime/role and clean (measure9.py --render)
#   then: 3D points, calibration, comparison, layers, sheet (out/parts-audit-10.png), measure9 (old measurements + camera test)
set -e
TAG=$1; cd "$(dirname "$0")/../.."
python3 test/measure9.py $TAG --render > test/parts/measure9_$TAG.log 2>&1
node render.mjs --style role --film sample22 --frames 0-21 --out frames-part/role-bare-$TAG --w 960 --h 540 --extra 'hide=hair,hairInner,hood,cloak' > /dev/null
node render.mjs --style anime --film sample22 --frames 0-21 --out frames-part/anime-bare-$TAG --w 960 --h 540 --extra 'hide=hair,hairInner,hood,cloak&snowN=1' > /dev/null
node render.mjs --style role --film sample22 --frames 0-21 --out frames-part/role-hair-$TAG --w 960 --h 540 --extra 'hide=hood,cloak' > /dev/null
node test/parts/points.mjs --frames 0-21 --out test/parts/ours_$TAG.json
python3 test/parts/calibrate.py $TAG > test/parts/calibrate_$TAG.txt 2>&1 || true
python3 test/parts/part_compare.py $TAG > test/parts/compare_$TAG.txt
python3 test/parts/layer.py $TAG > test/parts/layer_$TAG.txt
echo ready $TAG
