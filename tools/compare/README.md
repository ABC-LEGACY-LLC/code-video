# compare — a frame-by-frame comparison kit against a sample

Compares the frames drawn with code (ours) with a sample clip (the sample) **with the same code,
in every frame**, and gives the differences as numbers, the largest first. The method, why it is
done exactly this way, and which errors were found where — in [`METHOD.md`](METHOD.md).

> The sample is a measurement source, not a work. **Technique** is measured from it (timing,
> placement, motion, tone); its character and drawing are not reproduced. Shapes are drawn from
> our own models and *fitted* to the measurement, not traced from the sample.

## Install

The pinned environment uses Python 3.12, `numpy`, `scipy`, and `Pillow`.
Installation downloads packages; comparisons run offline. From the repository root:

```bash
make setup-compare
source .venv/compare/bin/activate
cd tools/compare
python3 -m compare calibrate      # the first job: is every measurement proven
```

`calibrate` tests every measurement on a synthetic image whose answer is known in advance: the
good case and a deliberately broken case. A measurement that cannot tell them apart is
`UNPROVEN` — its numbers are not trusted and the command ends with 1. Today 13/13 `PROVEN`.

## Config (the project JSON)

There is no path, size or frame count in the code — everything is in the project file. Relative
paths are relative to the folder the config is in. A full example: [`example-config.json`](example-config.json).

| key | meaning |
|---|---|
| `sample`, `ours` | the frame path pattern (`k%02d.png`), `*_first` — the number that holds frame 1 |
| `before` | optional: the previous state (for before/after sheets) — the delivered file itself, not a re-render from the old sources ([METHOD 11](METHOD.md)) |
| `size` | BOTH sides are brought to this size (LANCZOS, then L) |
| `frames`, `groups` | the frame count; groups of frames by shot `{"shot-1":[1,11]}` |
| `anchor` | a reference point measured on the SAMPLE in every frame (a rigid landmark) |
| `probes` | named measurements (below) |
| `silhouettes` | the row-by-row profile of the figure mask |
| `transform` | optional: every frame's centre/roll/scale, for unwarping into the subject's space |

Write a `"note"` in every probe and silhouette: why the probe is in this place, what was there
before. When a probe is fixed, the reason stays here (see METHOD.md, «A probe error»).

### Probe kinds (`probe.py`)

| kind | what it measures | primary value |
|---|---|---|
| `component` | a connected dark/light area (from a seed, or from the darkest/brightest point in the box) | centre `x y`, `w h n` |
| `edge` | the first crossing along a line (subpixel) | distance `t` |
| `area` | the median L in the box (and the colour) | `v` |
| `count` | the number of pixels in an L range in the box | `n` (the difference — in percent) |
| `tip` | the extreme point of the part of the dark mask connected to the seed point | `x y` |

`"relative": true` — the geometry is computed from the anchor and applied to both sides in
EXACTLY that place: even when the head moves, the probe measures the same point of the face, and
the difference shows a shape error. `"box"` may be a dict — each frame its own box.
`"frames": "6-11"`, `"tol"` — the flag threshold (px; in `count`, %).

## Commands

```bash
python3 -m compare <command> PROJECT.json [...]
```

| command | what it gives |
|---|---|
| `calibrate` | the broken-case test of every measurement |
| `probe --frames shot-1 [--json F]` | every probe's difference in every frame (ours − sample), the `*` flag, at the end the list of the **largest differences** |
| `sheet --frames 1-11 --box=x0,y0,x1,y1 [--zoom 4] [--rows sample,before,ours,overlay] [--anchored] [--stretch 0,70]` | a frame-by-frame viewing sheet; `overlay`: magenta = light only in the sample, green = light only in ours, grey = a match |
| `grid --frame 5 --box=... [--zoom 8]` | a gridded zoom, with pixel coordinates |
| `table --frame 5 --box=x0,x1,y0,y1 [--side ours]` | a table of L values (reading by number) |
| `silhouette --name body_right` or `--box=... --seed x,y [--condition "<20"] [--edge right] [--out F] [--row 5]` | the figure edge in every row: IoU, area %, in which rows and by how much it differs |
| `motion --frames 1-11 --box=...` | pair-by-pair block shift: motion (median) and boil (scatter) |
| `rhythm --frames shot-1` | cuts, trend, every pair's difference and the pairs MAE |
| `diffmap --pairs 1-2,6-7 --out F` | difference maps between images, with the left/right energy share |
| `occlusion --frames shot-1` | the figure map from where particles (snow) are hidden, and its IoU |
| `unwarp --frame 1 [--out F] [--table ...]` | a sheet/table unwarped into the subject's space |
| `gif --out F` | a side-by-side GIF |

Give a value that starts with a minus with `=`: `--box=-40,-34,52,66`.

## One pass (the order)

1. `calibrate` — all `PROVEN`.
2. `probe` — **all** the frames, the flagged table; start from the largest differences.
3. For every large difference `sheet`/`grid`/`table` — what the number touched, by eye.
   If the probe touched something else — that is not a drawing error but a **probe error**: fix
   the probe, write the reason in its `note`.
4. The fix goes into the model's own parameters (a key, a table), with a measured number.
5. Measure again: that probe + its neighbours + `silhouette`/`motion`/`rhythm`.
6. `sheet --rows sample,before,ours` — before/after (`before` — the delivered file; if it is a GIF,
   send `ours` through exactly the same GIF path too).
7. Write the findings into the project card: what was measured, the before/after number.

## Files

```
compare/
  project.py     config                  probe.py      probes and the difference table
  image.py       loading, one size       sheet.py      viewing sheets
  motion.py      motion/boil             diff.py       rhythm, difference maps
  occlusion.py   particle -> figure      unwarp.py     subject space
  silhouette.py  silhouette profile      calibrate.py  broken-case tests
```
