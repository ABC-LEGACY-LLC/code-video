#!/bin/bash
# Re-renders the film's picture (edit B: 504 frames, 21.0 s at 24 fps) from the current source and
# encodes it to sound/out/picture.mp4, the picture out/sound_page/build.py puts the sound under.
# Measured here: 18 minutes, 14.5 of them the slow motion (shot 3: 66 frames, ~13 s each).
# Only the frames edit B uses are rendered (audit/film/filmB_frames.json gives the ranges).
set -e
cd "$(dirname "$0")"
SHOT=s1 node render.mjs "$(seq -s, 0 95)"   frames/s1
SHOT=s2 node render.mjs "$(seq -s, 0 71)"   frames/s2
SHOT=s3 node render.mjs "$(seq -s, 30 95)"  frames/s3
SHOT=s4 node render.mjs "$(seq -s, 6 95)"   frames/s4
SHOT=s5 node render.mjs "$(seq -s, 0 179)"  frames/s5
python3 audit/assemble.py frames/B audit/film/filmB_frames.json
mkdir -p sound/out
# (the encode settings of the review copies were not recorded; these are a visually lossless default)
ffmpeg -y -loglevel error -framerate 24 -i frames/B/f%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart sound/out/picture.mp4
echo "sound/out/picture.mp4: $(ls frames/B | wc -l) frames"
