#!/bin/bash
# mkgif2.sh out.gif dir1 [dir2 ...] : frames f000.png.. of each dir in order -> 640x360 24 fps GIF
# (ordered dither: stable from frame to frame, so the sun's glow has no contour rings and the file is
# a third the size of the error-diffused one, measured on shots 1-3: 6.0 MB against 20.7)
out=$1; shift
tmp=$(mktemp -d)
k=0
for d in "$@"; do for f in $(ls $d/f*.png | sort); do ln -s $(readlink -f $f) $tmp/$(printf "%04d" $k).png; k=$((k+1)); done; done
ffmpeg -loglevel error -y -framerate 24 -i $tmp/%04d.png -vf "scale=640:360:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 $out
rm -rf $tmp
echo "$out: $k frames"
