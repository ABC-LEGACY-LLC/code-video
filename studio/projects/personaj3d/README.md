# personaj3d

A style test: the very same idea, "a hooded character, snow at night", but instead of drawing frame by frame,
**a 3D scene + a swappable style layer** (three.js). The goal is working speed for a long film (≈30 minutes):
the physics (camera, occlusion, the visor falling over the hair, snow in depth) comes out of the scene by itself,
while the look is swapped with a single file.

## Style — how it is built (counted from the source)

- `src/` has 9 source files, 2 098 lines, 149 204 bytes, 57 functions (`catalog/tools/count.mjs` `count()`; after pass 10).
  Note: that tool reads the renderer as `canvas2d` — it recognises only a `webgl2` string or a 2D
  context; here WebGL2 is opened by three.js `WebGLRenderer`, and the 2D context is only for the
  face drawing texture. Before the project enters the repo with its card, a three.js rule must be
  added to the tool.
- The character is built from scratch in code: head — a body of revolution (a section at every height: the front half a superellipse,
  the back an ellipse; the front profile fitted to the sample's points, pass 4; the lower-face and jaw sections fitted to all frames
  together, passes 9-10); face (eyes, brows, mouth) — a texture drawn on a canvas, a planar projection in head space (the near eye --
  a map on the surface, independent of the view, pass 9); hair — 47 strands (pass 6: 28 fan -- rise from the crown and bend
  forward-down, 7 short forehead, 3 near side, 3 far side, 6 back; since pass 9 a single rest shape), each a tube with an
  elliptic section, spring-bone physics (the rest state bends toward weight and wind, collision with the head sphere), shading
  with a "mass normal" (the hair is lit as one volume); hood — a parametric shell,
  the face opening depends on height, the top blends linearly with the head and the bottom with the body; its placement comes from
  the head POSE (pass 9: Gaussian weights between 3 key poses, with a lag -- not from the shot);
  cloak — a folded shell.
- Scene: a world sky gradient; 44 244 snow particles -- a world volume surrounding all cameras (pass 9), both in front of the
  figure and behind it; the density falls exponentially with height above the ground (a blowing-snow layer, a particle is either
  there or not); 3 cameras (`front`, `below`, `side`), a 5 s motion table.
- Film = a list of shots (`src/film.js`): each shot -- a frame count, a camera (orbit: az, el, distance, fov +
  a lens shift `screen` -- composition separate from the view angle), held frames, `pose(i)`.
  A 30-minute film is written in the same form.
- Style layer: `src/style/<name>.js` — role → material, outline, sky, snow, composite, timing
  (`stride`). The scene, character and motion code do not know the style.

| style | what | timing | render (960×540, no GPU) |
|---|---|---|---|
| `anime` | 2-tone cel, rim, inverted-hull outline, glow + bottom light + grain; the palette chosen by the sample's tones (at frame 40, 320×180 L median: hood 32 — sample 19, lining 43 — sample 43..48, face 68 — sample 59, sky 19 — sample 2..6, lit hair 109 — sample ~100: the glow, snow and bottom light lift the dark to 10..13) | held on 2s | 0.55 s/frame |
| `ink` | paper, black ink, 45° dot screen, a white light line on the black cloth, paper fibre | on 2s | 0.37 s/frame |
| `watercolour` | smooth 3 tones, cool shadows, Kuwahara (r 3), pigment edge, paper grain | every frame | 1.19 s/frame |

## Usage

```
npm install
node render.mjs --style anime --camera front --frames 0-59 --out frames/anime
node render.mjs --style anime --camera below --frames 60-119 --out frames/anime
python3 test/delivery3d.py        # GIF (opens fast); MP4 not needed
```

Page: `index.html?style=anime&camera=front` (`&live=1` — runs live in the browser, `&hide=hood`
— hides a role for checking). `window.frame(n)` — draws frame n exactly (the physics runs in sequence
from 0).

## In this repository

The work came from the old workspace (code-video v2) on 2026-10-05: first moved unchanged into
`studio/projects/personaj3d/`, then translated from Uzbek into English without changing what it computes (the proof is
at the end of this section). Folder and file names, identifiers, object and JSON keys, CLI flags, URL parameters,
comments, printed text and this record are English; the names of the works stay. The old names map one to one onto
the new ones, so a note from the earlier passes can always be followed:

- folders: `chiqish/` -> `out/`, `test/qism/` -> `test/parts/`, `test/qism/inson/` -> `test/parts/human/`,
  `test/audit_misol/` -> `test/audit_sample/`, `test/taqqos/` -> `test/compare/`; renders `kadrlar*/` -> `frames*/`
  (not in git: `node render.mjs` makes them again). `test/log11/`, `test/log12/` keep their names: they hold the run
  logs and the source snapshots of passes 11-13 (records; the `.log` files keep their content, the `.js` snapshots
  are translated like the sources). `out/` holds only the model-only mock-ups (`mockup-*.png`; their labels were drawn
  in Uzbek at the time and are images); the before/now GIFs and audit sheets the passes below name show sample frames
  and are not in git.
- a few files: `test/fit_kap_tuz.mjs` -> `test/fit_hood_structure.mjs`, `test/kamera_sinov9.mjs` ->
  `test/camera_test9.mjs`, `test/sirt_proyeksiya.mjs` -> `test/surface_projection.mjs`, `test/qism/tuz_olch.py` ->
  `test/parts/structure_measure.py`, `test/qism/inson/qism_nishon.py` -> `test/parts/human/part_target.py`,
  `test/qism/taqqos.py` -> `test/parts/part_compare.py`, `src/sahna.js` -> `src/stage.js`,
  `src/style/{rol,siyoh,akvarel,umumiy}.js` -> `src/style/{role,ink,watercolour,common}.js`, `taqqos3d.json` ->
  `compare3d.json`. Every other name follows the same words (kap -> hood, soch -> hair, bosh -> head, yuz -> face,
  poza -> pose, kadr -> frame, misol -> sample, biz -> ours, olch -> measure, varaq -> sheet, tuz -> structure, ...).
- flags: `--kadrlar` -> `--frames`, `--chiq` -> `--out`, `--kamera` -> `--camera`, `--qoshimcha` -> `--extra`,
  `--baho` -> `--score`, `--moslash` -> `--fit`, `--boshla` -> `--start`, `--sirt` -> `--surface`,
  `--shotlar` -> `--shots`, `--kalibr` -> `--calibrate`, `--varaq` -> `--sheet`; the weights `--wbF --wbT --wiF --wsF
  --wsY` keep their names.
- the page: styles `rol`, `siyoh`, `akvarel` -> `role`, `ink`, `watercolour`; cameras `old`, `pastdan`, `yon` ->
  `front`, `below`, `side`; films `misol22`, `kamYol`, `orbita` -> `sample22`, `camPath`, `orbit`; URL parameters
  `kamera`, `gizla`, `jonli`, `vaqt`, `yamoq`, `suniy` -> `camera`, `hide`, `live`, `time`, `patch`, `synthetic`;
  hooks `window.tayyor`, `window.kadr(n)`, `window.tasvir()` -> `window.ready`, `window.frame(n)`, `window.image()`.
- the model's parameters: `KIYIM.kap` -> `CLOTHES.hood` (`yTepa` -> `yTop`, `kengX` -> `wideX`, `soyabon` -> `visor`,
  `qanot` -> `wing`, ...), `BOSH` -> `HEAD`, `YUZ` -> `FACE`, `SOCH` -> `HAIR`; the committed fit results
  (`test/*_fit*.json`) carry the same English keys, their numbers unchanged.

### Running

`npm install` (three, playwright-core). The page tools launch Chromium through `chrome.mjs`: `$PERSONAJ_CHROME` if
set, else the newest installed Playwright `chromium-<revision>` under `$PLAYWRIGHT_BROWSERS_PATH`,
`~/.cache/ms-playwright` or `/opt/pw-browsers`, else Playwright's own choice. Renders are compared pixel for pixel only
from one and the same binary. The Python tools (numpy, scipy, Pillow) find everything relative to their own file:
the comparison package is this repository's `tools/compare/` (the former `taqqos`, with its English API), the 2D
work's tools are imported from `../personaj/test/`, and the private files are read under `private/`. A few old tools
also need opencv (`test/audit_sample/snow_zoom.py`, `test/parts/section.py`).

```
npm install
node render.mjs --style anime --film sample22 --frames 0-21 --out frames-sample/anime
node render.mjs --style role --film sample22 --frames 0-21 --out frames-sample/role-320 --w 320 --h 180 --extra x=1
node test/camera_test9.mjs --calibrate          # 3D consistency: everything PROVEN, 0.00 px
node test/fit_hood_structure.mjs --surface private/test/parts/surface_projection_02.json,private/test/parts/surface_projection_055.json \
     --wbF 2 --wbT 2 --wiF 2 --wsF 3 --wsY 10 --score '{"a": {}}'     # F 21.347 on this machine (state hood_structure_fit_N)
```

### Private files

Everything taken from someone else's sample clip stays outside git, in `private/` (`.gitignore`:
`studio/projects/*/private/`). The owner's laptop keeps these files under their old names and layout (the SAM 2 project
in `Documents\Code-Video\Projects\personaj3d-sam2\`); `python3 test/migrate_private.py OLD_FOLDER [NEW_FOLDER]` writes
the layout below from the old one: folders and files renamed, and in every JSON file the keys and the name-like values
the code reads translated exactly as the code was (numbers, masks, `.npy`/`.npz` and images copied byte for byte; notes
stay as they were). The tools expect:

| under `private/` | what | old name |
|---|---|---|
| `sample/k01.png` .. `k22.png` | the sample frames (shots 1-11, 12-13, 14-22), and a few working sheets and old helper scripts beside them | `maqsad/` |
| `test/parts/human/marks_alonur_1.json` | the human marks | `test/qism/inson/belgilar_alonur_1.json` |
| `test/parts/human/part_target_12.json` | class targets per frame (bits 1 head, 2 interior, 4 figure, 8 lit skin, 16 SAM hair, 32 SAM face); `_old`, `_no_sam2`, `_y4` earlier states | `qism_nishon_12*.json` |
| `test/parts/human/sam2_masks_{A,B}.npz`, `..._y4.npz`, `sam2_log*.txt` | SAM 2 masks, run 5 (used) and run 4 | same names |
| `test/parts/human/target_{head10c,pose11,pose11b,pose11c,fit_11}.json`, `brim_12.json`, `brim_head_12.json`, `info_{1,2}.json`, `analysis_alonur_1.json`, `face_view_11.json` | targets from the marks and the analyses of them | `nishon_*`, `qirra_*`, `malumot_*`, `tahlil_alonur_1`, `yuz_kor_11` |
| `test/parts/human/page.html` | the marking page template (see below) | `sahifa.html` |
| `test/parts/surface_projection{,_02,_055,_09}.json` | head-shell maps (shell points per frame) | `test/qism/sirt_proyeksiya*.json` |
| `test/parts/sample_part.json`, `test/parts/compare_{head10,head10b,head10c,world9b,pose11,pose11b,pose11c}.{json,txt}` | sample landmark coordinates and the part comparisons | `misol_qism.json`, `taqqos_*` |
| `test/sample_figure{,8}.json`, `test/sample_head7.json`, `test/sample_mask6.json` | figure blocks and masks of the sample | `test/misol_*.json` |
| `test/audit3d*.json`, `test/audit3d*_figure.npy` | audit outputs with sample measurements | `test/audit3d*`, `*_figura.npy` |
| `test/audit_sample/gaze.json`, `hair_measure.json`, `stage_measure_frames-clean-*.json` | audit outputs | `qarash.json`, `soch_olch.json`, `sahna_olch_kadrlar-toza-*.json` |
| `sam2/` | the laptop's SAM 2 project (frames, prompts, marks, `run.bat`, `output/`), names unchanged | `personaj3d-sam2/` |

The class targets are rebuilt from the marks and the masks with `python3 test/parts/human/part_target.py` and then
`python3 test/parts/human/sam2_hair.py` (the result is byte-identical to the delivered `part_target_12.json`).
`test/parts/human/prepare.py` builds the marking page from `page.html`; that template was delivered with the private
files and is not in git, so it was not translated: it still reads the old Uzbek keys, and a page built from it now
needs its keys renamed first.

### How the translation was proven

The same commands were run on 2026-10-05 in the original layout (with its absolute paths pointed at a copy) and in this
one, on the same machine and the same Chromium (1234, SwiftShader), every output kept:
`test/fit_hood_structure.mjs` (three runs: the weights above, a changed hood with light and AO, shot 3 alone),
`test/camera_test9.mjs --calibrate`, `test/surface_projection.mjs`, `render.mjs` (anime and role at 960x540 and
320x180 for all 22 frames of `sample22`, ink, watercolour and the default film's below camera), the 2D film of
`../personaj` (`film.mjs`, `view3.mjs`), `test/audit3d.py`, `test/snow_measure.py`, `test/parts/structure_measure.py`,
`../personaj/test/tone_class.py --calibrate`, and the class targets rebuilt by `test/parts/human/part_target.py` +
`sam2_hair.py` from the migrated private files. Every number of every printed line is equal, every render is
pixel-identical, every JSON and `.npy` output equal value for value. The 2D film's capture is not deterministic from run
to run (Chromium rasterizes its SVG filters one of two ways per frame); each captured frame equals one of the original
layout's own captures, and the generated `film.html` is the same drawing (same markup and numbers, names renamed one to
one). `test/audit3d.py` was given the original layout's 2D frames on both sides, so that its own computation is what is
compared. The code that no run reaches was checked statically: the names were renamed by one table, token by token
(identifiers, keys, flags, URL parameters, CSS and GLSL names), and after the prose was translated every code token of
every file was compared with that rename -- only comments and the human text inside strings differ; every JS file parses
and every relative import names an export; every Python file compiles with no new pyflakes finding.

## sample22 -- the sample's timing and staging (measured)

`node render.mjs --film sample22 --style anime --frames 0-21 --out frames-sample/anime`, then
`python3 test/delivery3d.py` -> `out/before-now-3d.gif` (SAMPLE | BEFORE 2D pass 12 | NOW 3D).
Both sides with the same code, 320×180 LANCZOS, L:

| measurement (tool) | sample | 3D |
|---|---|---|
| lit mass centre, shot 1 (`test/compos.py`) | (0.32, 0.22), 3.0 % | (0.33, 0.21), 3.3 % |
| shot 2 | (0.45, 0.31), 4.3 % | (0.46, 0.31), 4.2 % |
| shot 3 | (0.58, 0.54), 1.7 % | (0.58, 0.58), 3.2 % |
| cut pair difference 11→12 / 13→14 | 18.9 / 18.3 | 17.9 / 18.7 |
| pair difference within a shot (median) | 9.3 | 10.6 |
| snow: particle count, right 55 % (`test/snow_measure.py`) | 750 | 788 |
| snow: 4 height bands (from the top) | 96 / 171 / 224 / 258 | 91 / 152 / 249 / 296 |
| snow: area median / peak L | 2.0 px / 94 | 2.0 px / 106 |
| snow motion, right part (compare `motion`) | (+1.0, −1.0) px/frame | (+1.0, −1.0) |
| background L, 4 bands | 6 / 17 / 34 / 51 | 13 / 19 / 38 / 51 |

Fixed in this pass (from the measurements): the shot 1 camera had turned the face toward the camera (in the sample it is 3/4,
looking right) -- an orbit camera and the sign of the turn; the hood opening covered the face in the side view --
the opening's brim moved behind the ear (106°), the inside in shadow beyond the lining strip at the edge (0.18 units); the snow
was 5 times too sparse and near particles became large blurry discs -- density, size limits; the sign of the snow
motion had been written wrong (in the sample the snow drifts UP).

## Audit 1 (sample22, 3D vs sample vs 2D pass 12) -- `test/audit3d.py`, `out/audit-3d.png`

Tools: compare `calibrate` -- all PROVEN; `tone_class.py --calibrate` PROVEN. Determinism: one frame rendered
twice -- 0 of 518 400 pixels differ; a direct `frame(14)` vs 0..21 in sequence -- 0.
In 3D there are exact role masks (`?style=role`, `frames-sample/role`) -- which part every pixel belongs to is known.

| measurement | sample | 2D (before) | 3D (now) |
|---|---|---|---|
| figure mass IoU, shot 1 / shot 3 (occlusion map; 3D -- exact mask) | -- | 0.94 / 0.92 | 0.53 / 0.42 |
| figure area, shot 3 (share of the frame) | 0.58 | 0.61 | 0.33 |
| tone class mass IoU: outer / lining / inner / face / hair | -- | .76 / .29 / .31 / .48 / .49 | .46 / .03 / .01 / .20 / .22 |
| hood outer L (role mask, median) | 19 | -- | 40 (26..49) |
| hood inner L | 7..9 | -- | 44 (the back rim light falls inside) |
| lining strip L | 43..48 | -- | 35 |
| face L / hair L / sky top L | 59 / 100 / 2..6 | -- | 65 / 105 / 13 |
| figure column, frame 12 x=230, L from top to bottom | 19..21 flat | -- | 23 -> 50 (the bottom light falls on the figure too) |
| held 1..6: change inside the figure | hair only | hair only | the whole figure (new grain every frame) |
| 6->7 pair (end of the hold), inside the figure | 4.18 | 2.68 | 1.06 |
| shot 1 lit mass y, 1 -> 11 | 0.23 -> 0.21 (rises) | -- | 0.20 -> 0.20 |
| shot 3 pair change, first / last | 3.6 / 0.7 | 3.6 / 1.1 | 8.1 / 1.7 (the hood turns with the head) |
| shot 3 lit mass area | 3.0 -> 1.1 % (the head goes into shadow) | -- | 3.2..3.7 % |
| snow: shot 3 top / bottom quarter | 77 / 246 | -- | 61 / 365 |
| snow: particles over the figure (relative to the sky) | 7..9 % | -- | 14..22 % |
| largest particle area (at 320) | 60 | -- | 98 |
| hair tips, in held pairs (960 px) | always in the wind | -- | 18.9 -> 3.0 (settling down from the rest state, not wind) |

What fresh eyes (an agent that had not seen the code, only the images) found, and what was checked: in the side view the head is a "box" --
a flat rectangle = the inner hair cap (role mask: `hairInner`, not the lining); in profile there is no nose/lip/chin;
the white of the far eye is a "sickle" on the edge of the cheek (the face texture is a planar projection -- confirmed in a render without hair);
in shot 1 the hood does not cover the top of the head (sky between the head and the hood); no neck/collar in any frame;
the dark areas are "sandpaper" (grain); the hair strands are an "icy helmet"; the face outline breaks where it slopes.
Rejected: "the hair does not move at all" -- it moves (the table above), but this is not wind, it is
settling; "fill light from below" -- there is none, two lights (a front-right-top key, a back-left rim).

## Pass 2 (work from audit 1) -- `out/before-now-3d-2.gif` (SAMPLE | BEFORE 3D delivered | NOW)

What was done (each with a measurement):
- **Style (anime):** the bottom light moved from the post pass to the sky (it does not fall on the figure); the grain removed; rim on the hair only;
  the lining strip always lit; the palette tuned with the role masks.
- **Hood:** follows 35 % of the head's rotation and 80 % of its translation (the head tilts inside it, sinks with it);
  the opening starts at the head's crown (covers the top); a shadow map -- the hood casts shadow on the head and the hair.
- **Clothes mass:** the hood/cloak/torso parameters fitted to the sample's figure mass (`test/fit_clothes.mjs`,
  Nelder-Mead, role masks, shots 1 and 3 together; anatomical bounds -- attempt 1 had pushed the torso 2.8 units back).
- **Head:** V jaw, chin, face plane, nose, lips; shading normals from the large shape (a clean cel boundary).
- **Cameras:** fitted to the face points (`test/fit_camera.mjs`: shot 1 near eye -- the anchor probe, chin; shots 2-3
  near eye, scale from the eye-chin distance); shot 3 pose -- the head sinks back and down (the sample's eye track).
- **Key light** low (~20 deg): the face and hair inside the hood are lit (from above, the hood would block it).
- **Physics:** the hair in 1/120 s internal substeps (the same for the film's 60 ms and for 24 fps), pre-rolled at the start of each shot;
  gusty wind (the hair moves in a held frame).
- **Snow:** 27 000 particles, depth down to -28, no particles within 3 units of the camera, layer thickness 7; drift 1.13 units/s.
- **Motion:** the shot 1 pose share from the sample's pair differences (at 6->7 the drawing changes).

| measurement | sample | 3D pass 1 | 3D pass 2 |
|---|---|---|---|
| figure mass IoU shot 1 / 3 (exact mask) | -- | 0.53 / 0.42 | **0.89 / 0.84** (2D: 0.94 / 0.92) |
| hood outer / inner / lining L | 19 / 7..9 / 43..48 | 40 / 44 / 35 | **19 / 8 / 46** |
| face / hair / sky top L | 59 / 100 / 2..6 | 65 / 105 / 13 | **58 / 100 / 2** |
| figure L, frame 12, 4 bands from top to bottom | 19..21 | 23 -> 50 (x=230 column) | **18 / 19 / 19 / 19** (role mask) |
| snow count / bands | 750 / 96-171-224-258 | 788 / 91-152-249-296 | **745 / 108-163-216-258** |
| background bands | 6 / 17 / 34 / 51 | 13 / 19 / 38 / 51 | 2 / 14 / 40 / 52 |
| snow drift | (+1.0, -1.0) | (+1.0, -1.0) | (+1.0, -1.0) |
| held 1..6, left 40 % energy | 0.061..0.104 | 0.19..0.25 (grain + sky) | **0.040..0.104** |
| 6->7 difference inside the figure | 4.18 | 1.06 | **4.09** |
| near eye, 320 px: shot 1 / shot 2 / shot 3 frames 14 / 22 | (97.6, 46.3) / (138, 77) / (172, 83) / (158, 113) | (142, 61) / (197, 88) / (202, 113) / (209, 169) | (106, 46) / (138, 77) / (172, 83) / (158, 113) |

Render: 0.71 s/frame at 960x540 (22 frames ~16 s).

## Pass 4: face (mouth, eyes, brows, details) -- `out/before-now-3d-face.gif`, `out/face-sheet-4.png`

The hood was postponed (the user). Only technique was measured -- place, size, tone, timing; the drawing is ours.
- **Head v3** (`src/personaj.js` `headShape`): the v2 sphere deformation could not bring the lower face forward. Triangulation
  from two views (`test/triangle.mjs`, no render): in the sample the nose, mouth and chin are 0.1..0.4 units
  in front of the eyes; in 3/4 the front outline is vertical (x 130), the underside of the jaw horizontal (y 108.5). The new head -- a body of revolution, the front profile
  with 13 parameters (`test/fit_face3.mjs`, Nelder-Mead, in node -- 0.00 px against the page projection): shot 1 points and
  silhouette edges RMS 0.46 px. The underside of the jaw rises toward the back (a horizontal line in the view from below).
- **Eyes:** the previous ones were ~2 times too big, with a white sclera (a dark core of 4x10 px). Now the dark mass is 12x11 px, n 69
  (sample 10x11, n 69..75): the sclera is barely visible, the eyelid thick, the top of the iris black, 2 faint highlights; a pool of tears
  at the inner-lower rim. A closed eye -- a thick straight line (13x3 vs sample 11x3). The offset between the drawing's centre and the dark mass's
  centre (-1.75, -2.4 px) was measured and taken into account.
- **Mouth / lip shadow:** a dark line (8x2 px) instead of a small red mark, with a lip shadow under it.
- **Nose ridge** a bright line (in the sample an arc from under the far eye to the tip of the nose: in the shot 1 camera this is the nose ridge).
- **Face rim:** the front outline, the underside of the jaw -- a thin bright line (geometric normal, dFdx); the black outline was removed from the face
  (in the sample the face has no dark outline).
- **Tears:** A (1-6, straight down from under the eye, slides down), B (5-11, along the cheek), C (7-9, a ring on the jaw), a falling
  drop (10-11) -- the sample's L>70 components carried into head/world space (`test/tear_measure.mjs`).
- **Shot 1 pose** fitted to the face points in every frame (`test/fit_pose1b.mjs`); in 7-11 the sample draws the lower face further forward --
  `profile` weight (0.2..0.3). **Shot 2** camera fitted to the profile points (d 11.0; RMS 2.0 px, profile weight 1).

| probe (shot 1, mean abs difference, px) | pass 2 | pass 4 |
|---|---|---|
| chin front (y+52) | 18.41 | **1.28** |
| jaw underside x+8 / x+20 / x+28 | 7.34 / 14.26 / 14.54 | **1.60 / 0.85 / 0.98** |
| front outline y+20 / y+30 | 6.09 / 12.53 | **1.32 / 1.42** |
| mouth x / y | 3.54 / 0.94 | **1.58** / 1.09 |
| lip shadow x / y | 2.65 / 0.59 | **0.41** / 0.70 |
| far eye x / y | 2.17 / 3.77 | **1.16 / 2.16** |
| tear (cheek) x / y | 7.71 / 7.25 (missing in 6-7) | **0.64 / 1.02** (present in all) |
| tear (jaw) x / y | 3.73 / 3.60 (missing in 11) | **0.73 / 0.85** |
| near eye (anchor), 1-11 | 3.2 (x) | **<= 1.3** |

Regression check (`private/test/audit3d_face4.json`): the tones did not change (face 58, hair 99, hood 19 / 46 / 8); figure
IoU 0.888 -> 0.902 (shot 1), 0.839 -> 0.850 (shot 3). What got worse: the 6->7 figure difference 4.09 -> 1.61 (sample 4.18) -- the face
points barely move at 6->7, while the big turn in pass 2 pushed the eye by 9.5 px; the sample's energy comes from the hair and
tear changes (hair -- still to be agreed). At the cut the lit mass 11->12: 0.64 -> 0.38 (sample 1.05) -- the shot 2
camera, fitted to the face, makes the figure smaller; in the sample the shot 2 hair is big (hair).

## Pass 5: staging -- where the sample looks, where the camera is -- `out/before-now-3d-stage.gif`, `out/stage-audit-5.png`

Reason (the user): "ours looks sideways, the sample looks down" -- the face details had been fitted without understanding the staging
(head direction, camera). The order now: first, for each shot, WHAT THE SAMPLE DOES, WHERE IT LOOKS, WHERE THE CAMERA IS (recovered in 3D), then
the details. A single view gives only the RELATIVE orientation between the head and the camera: camera height <-> head tilt and
sideways lean, azimuth <-> turn are interchangeable. The absolute value was chosen by the principle "the head is not turned/leaning", the events
between the cuts and other cues (background, the hang of the hair, the drop). All fitting without a render (node, `test/projection.mjs`;
0.0 px against the page -- `test/page_check.mjs`), the result re-measured on the render with THE SAME CODE (`test/audit_sample/stage_measure.py`).

| shot | what the sample does | where it looks | camera | evidence |
|---|---|---|---|---|
| 1 (1-11) | cries in the snow; 1-6 one drawing (only hair, tears); 10-11 the eyes close, the head turns to profile | forward-right, head ~17 deg up, eyes open | front-right (az 55), slightly below (el -8), 7 | 5 points + outline + jaw, RMS 0.6 px (`test/stage_fit.mjs`) |
| 2 (12-13) | the calmest pair, eyes closed | forward, head LEVEL (~5 deg up); the closed-eye line tilted 17 deg down toward the front | on the right side (az 84), el -5, 12.9 | front outline 21 rows + under the chin, RMS 1.33 px (`test/stage2_fit.mjs`) |
| 3 (14-22) | bows the head into the hood; 14 an in-between drawing, 15-18 the eye drops 5.5 px, then holds in place | DOWN: head tilted ~39 deg, eyes half open, looking down | front-right (az 55), BELOW (el -30), 7.1 | eye + chin 7 rows + jaw underside, RMS 0.88 px (`test/stage3_fit.mjs`, `test/stage3_motion.mjs`) |

Errors found and the fix:
- **Shot 2:** the pose had been fitted to the profile face POINTS (eye, nose, mouth, chin) and with a lower-face
  shift tied to the profile weight (0.4) -- 4 points RMS 2.0 px, but the whole front outline RMS 9.9 px (max 19.5): the face was tilted ~20 deg UP.
  A 2D curve fit: with the shift the outline falls into place only when the head is TILTED 15 deg, without the shift when the head is level (RMS 1.35).
  The sample's difference in profile is not in the lower face but in the EYE: the eye is 17.5 px (0.6 units) behind our 3/4 position and 5 px
  higher (an anime profile eye, on the side of the head). Now: no shift; the near-eye drawing moves along the surface with a MAP
  (`eyeMap`, `EYE_PROFILE` -- measured with an inverse projection; at w=0 it is the planar projection itself, 0.0014 units).
  On the render: the outline over 21 rows is -2..+1 px (RMS 1.1; before -10..0), the eye -0.9/-0.1 px.
- **Shot 3:** the camera was on the side (az 80, el -5), the head 9..17 deg -- vertical in profile, "looks sideways"; on the render the eye and chin
  were not where the sample has them (no dark line in the eye box -- L 38; the chin rows behind the cloak). The model points said "2.5 px"
  -- they do not know about occlusion: the staging MUST be checked on the render. Now: the eye track in 15-22 within +-1-2 px, the chin edge +-1-3 px.
- **Shot 1 7-11:** the shift is now separate (`pose.shift`): 0.15 in 7-9, 0.3 in 10-11 -- in these drawings the sample draws the front outline
  further forward than the eye (the edge comes before the eye); refit with `test/fit_pose1c.mjs` (points RMS 2.0-2.5 px,
  outline <= 4.8 px). The 1-11 face probes did not change (+-1-2 px, `test/probe_stage5.json`).
- **Profile weight** is now in HEAD space (`profileWeight`): with the head tilted, the world horizontal angle is 60 deg, what the head sees is 49.
- **Background:** the sample's background is a 2D layer (snow density gradient 11.7->35.4 / 12.5->37.6 / 10.4->34.0, the particle motion the same
  in all three shots). In shot 3, with the camera looking from 30 deg below, our world gradient gave a black sky -- now the gradient
  and the snow density follow `uBgUp` (they tilt by as much as the camera looks up beyond shot 1; unchanged in shot 1).

Rhythm (`compare rhythm`, plain render): cuts at 12 and 14 (the sample too); shot 3 pairs 0.335 -> 0.178 (sample 0.348 -> 0.286).

## Pass 6: hair -- mass and coverage -- `out/before-now-3d-hair.gif`, `out/hair-audit-6.png`

Reason (the pass 5 audit): the "looks sideways" impression in shot 1 came not from the staging but from the HAIR -- bare skin behind the near eye
28-33 px (sample 1-9), the forehead bare (15-23.5 px of skin above the eye, sample 1-4.5), the hair a thin cap stuck to the head.
The drawing -- the sample's is for technique only: the hair drawing and the strand shape are ours, fitted to the sample's MASS.

Tools (the same code on both sides, 320x180 LANCZOS, a composition mask L>=90 with top-hat):
- `test/audit_sample/hair_coverage.py` (new) -- what the sample's lit hair lands ON in ours (exact, from the role render: skin,
  hair, inner cap, hood, background) and the other way round; shot 1 regions (near side / forehead / far side). Calibrated:
  the sample against itself -- 100 %, shifted by 5 px -- 56 %; the role classes exact on a synthetic mask.
- `test/audit_sample/hair_measure.py` -- M1 lit mass, M2 skin behind the eye, M3 forehead skin, M4 hair above the profile eye.
- `test/size.mjs`, `test/hair_rest.mjs` -- carrying the sample's on-screen measurements into head space (the shot camera,
  node projection); `?strands=group` -- the strand groups in colour (which strand is where).

Measured in the sample (in head space): in shot 2 (profile, head level) the broad lit mass is ~1 unit above the crown (single
tips up to 1.5), at forehead height ~1 unit IN FRONT of the forehead, at brow height 0.4 in front, at the eye row the front of the face
is open; the near-side mass behind the eye down to below the chin. In the sample the snow drifts right-up -- the wind is from behind: the hair is combed
forward-up. In shot 3 (head tilted 39 deg) the lit mass is IN FRONT of the face (y ~0, z ~1.3). One 3D shape explains all three shots.

What was done (`src/personaj.js` HAIR, `strandsDesign`, physics; `src/main.js`; `src/style/anime.js`, `common.js`):
- A new hair design: a fan (the tips along the shot 2 boundary), short forehead (in 3/4 down to the eye, in profile above
  the brow), near side (in 3/4 from behind the eye to BEHIND the jaw; in profile on the side of the head -- the anime way, like the eye map
  in pass 5), far side (combed forward).
- Physics: the rest shape bends toward weight (swing) and wind (shK) (`tiltedRest`) -- when the head tilts, the hair hangs in the world.
- Shading: a mass normal (`aHairN`, radial from a point above the head centre + the strand normal) -- a strand no longer shows as a "half
  lit, half shadow" fingernail, the hair is one lit mass.
- The view weight of the near strands from the camera angle (`hairProfile(profileWeight(70))`, separate from the eye map):
  shot 1 1-11 -- the 3/4 position (in the sample in 9-11 the hair is also behind the cheek), shot 2 -- the profile position.
- The lower-face shift (shot 1 7-11) also shifts the near strands -- otherwise the cheek would cut them (19-21 px behind the eye).
- Hood (minimal, for the hair): the opening from the crown (openV0 -0.05), the crown dome pushed back (pushZ 0.45) -- the hair peak
  broke through the hood in shot 2; in shot 3 the dome slides forward (`hoodSlide` 0.65, constant within the shot).
  Figure IoU 0.902 / 0.868 -> 0.901 / 0.863. A full hood fit (`test/fit_hood6.mjs`) was tried and
  NOT ACCEPTED: the objective function gave away figure IoU to reveal the hair (in shot 1 the inner face of the far side).

| measurement (clean render, same code) | sample | pass 5 | pass 6 |
|---|---|---|---|
| shot 1: the sample's lit hair lands on ours | 100 % | 1 % | 49 % |
| shot 1: skin behind the near eye (frames 1-9) | 1.3-9.3 px | 28-33 | 6.3-9.3 |
| shot 1: forehead skin (above the eye) | 1-4.5 px | 15-23.5 | 2.5-5.5 |
| shot 1: lit mass | 3.01 % (104, 40) | 1.51 % (58, 35) | 5.48 % (84, 28) |
| shot 2: overlap / hair above the profile eye | 100 % / 0 | 0 % / 0.44 | 28 % / 0.00 |
| shot 2: lit mass / the sample's hair under the hood in ours | 4.29 % | 0.15 % / 49 % | 1.88 % / 14 % |
| shot 3: overlap / lit mass | 100 % / 1.74 % | 0 % / 3.13 % | 43 % / 9.60 % |
| held 1-6: left 40 % difference energy (hair movement) | 0.061-0.104 | 0.051-0.112 | 0.064-0.130 |

Regression (head geometry untouched): the mouth, lip shadow and jaw underside probes are the same; chin front, far edge, tear
0.1-0.25 px difference (near the hair); near-eye anchor 3.49/1.90 -> 1.22/0.75 px; hair edge probes 13-22 -> 2-12 px. Far-eye probe 0.97 -> 2.25 px -- A PROBE CONFUSION:
strands now pass over the far eye and move in the wind (in the sample a strand passes too; seen on the sheet), the face is in place.
Shot 2 front outline RMS 1.07 -> 1.50 px -- only in rows 70-74 (the hair on the forehead falls on the outline), 76-110 the same;
shot 3 outline RMS 2.68/1.77/2.00 -> 2.35/1.46/1.53, eye +-1 px. Rhythm (from the GIF path): the cut detector now also marks 10 and 15
-- our held frames change less than the sample's (median 0.229 vs 0.337, already there before), while the head-motion
pairs grew with the big hair: 9->10 0.340 -> 0.386 (sample 0.394), 14->15 0.338 -> 0.382 (sample 0.348).

## Pass 7: hood -- the visible head in every shot -- `out/before-now-3d-hood.gif`, `out/hood-audit-7.png`

Reason (audit 7, `out/audit-7-frames.png`; the user: "jumping from frame to frame, getting big and small"): the earlier
probes measured only POSITION (eye centre, contour row) -- size and the jump between frames had not been measured.
The visible head (face + hair, `hood_measure.py`) in the sample over the three shots is 6 300-7 400 / 6 600 / 4 100-5 700 px,
ours 11 800-12 900 / 4 000 / 13 500-14 100:
in shot 1 the back of the head, the cap shell and the neck are exposed (in the sample they are under the hood), in shot 2
the hood covers the head (in the sample the hair mass is in front of the hood), in shot 3 the head is outside the hood (in
the sample it tilts into it). Over 9->10->11 the head leans 10 deg sideways and turns 8 deg -- with the exposed back of
the head, cap shell and neck the whole silhouette shifted (left 40 % difference energy 0.490 / 0.427, sample 0.201 / 0.189).

Tools (the same code on both sides, 320x180):
- `test/audit_sample/head_mask.py` -- the sample's visible head: median 5, L >= 40 (face 58-60, shadowed hair 45+, lining
  band 43-48; the hood 19-21 and the sky 4-18 fall outside), r=3 opening, the component connected to the face seed, 4-step
  geodesic reconstruction, holes filled; in shot 3 an allowed box for the dense snow under the chin (checked on a sheet) ->
  `private/test/sample_head7.json`. A mask taken from the sample: only in the workspace, it does NOT go into the public repo
  (like `sample_figure.json`, `sample_mask6.json`).
- `test/audit_sample/hood_measure.py` -- head IoU and area (ours EXACT from the role render: skin, neck, hair, cap shell,
  lining), in shots 1 and 3 the figure (occlusion map blocks, soft IoU).
- `test/audit_sample/jump.py` -- difference energy of neighbouring frames (`compare.diff`, left 40 %). Calibration: against
  itself 0; a 20x20 block on the left -> left 0.050 / right 0.023; on the right -> left 0.014 (it leaks through the
  normalisation, the same on both sides).
- `test/fit_hood7.mjs` -- fitting per shot (`--par` -- the chosen parameters); `test/hood_v.mjs` and
  `window.hoodVPoint` -- the hood's (u, v) at a screen point (to choose where the band ends).

Done (`src/main.js`, `src/personaj.js` hoodGeo, `src/film.js`):
- The hood PER SHOT: `shot.hood` (on top of CLOTHES.hood) -- at a cut the surface is rebuilt, within a shot it does not
  change, it follows the head at a KF/KT share (in the sample the head moves inside the hood); check: `?hoodShot={"1":{...}}`.
- New parameters (all per shot): shift of the upper part (wholeZ, wholeY), crown (pushZ, pushY), the upper part's turn
  about the vertical axis (yaw) and its forward tilt about the head centre (eg -- in shot 3 the head is at 39 deg, the hood
  frame at the KF share only 14 deg: the top of the head came out through the opening), the two edges of the opening
  separately (openA, openB -- at head height, returning to 1 under the chin), the lining band width at each edge
  (bandA/B), under the chin (bandAlt/Blt) and where it ends (bandV).
- Bug: `buildClothes` left the contour's child mesh on the old (disposed) geometry -- in shot 1 a large dark "curtain"
  to the right of the neck (the "far side inner face" in the `?clothes=` tests of pass 6 was the same thing).
- Fitting: the sample's visible head <-> role render IoU; with the CONDITION that the figure does not drop below the
  delivered level. In the first run the figure had weight 0.5 -- in shot 3 head IoU 0.24 -> 0.56 cost figure 0.857 -> 0.784
  (the hood top pushed forward and the top-left corner became sky): not accepted. A parameter stuck at its bound showed a
  lack of freedom, but each new parameter was added for a concrete error seen on a sheet: the far edge came out as a line
  from the face profile (two edges); in the sample, right of the face, a ~14 px L 43-45 band (lining -- ours a 3 px band +
  dark inside); the band continued under the jaw, where the sample has L 7-10 (the band ends at the jaw, v ~0.6).
- The sample was measured BEFORE removing the line: in the pixels where our far-edge band falls, the sample has L median 43
  (rows 40-95) -- that is the sample's own lining; it needed widening, not removal.

| measurement (same code) | sample | pass 6 | pass 7 |
|---|---|---|---|
| visible head IoU, shot 1 / 2 / 3 | 1 | 0.41 / 0.49 / 0.23 | 0.81 / 0.62 / 0.69 |
| ours / sample area, shot 1 / 2 / 3 | 1 | 1.75 / 0.61 / 3.03 | 1.05 / 0.65 / 1.09 |
| figure (silhouette, soft IoU), shot 1 / 3 | 1 | 0.900 / 0.864 | 0.928 / 0.884 |
| jump 9->10 / 10->11 (left 40 %, from the GIF path) | 0.201 / 0.189 | 0.490 / 0.427 | 0.307 / 0.267 |
| cut 11->12 / 13->14 | 0.571 / 0.320 | 0.893 / 0.512 | 0.658 / 0.308 |
| held 12->13 | 0.025 | 0.116 | 0.128 |
| held shot 3 15->22 | 0.059-0.083 | 0.037-0.067 | 0.009-0.039 |
| lining band probe (right of the face, shot 1) | 0 | -86 % | 11.6 % (mean diff.) |
| the sample's bright hair falls on ours, shot 1 / 2 / 3 | 100 % | 49 / 28 / 43 % | 48 / 28 / 4 % |

Regression (face probes, clean render): eyes, mouth, lip shadow, face tone, tear -- exactly the same; near eye anchor
1.22/0.75 -> 0.39/0.17 px, chin front 1.46 -> 1.15, far edge 1.33/1.81 -> 0.99/1.44, hair left edge (y -6) 11.9 -> 4.5 px;
under-jaw x20/x28 0.66/0.92 -> 1.15/1.33 px (in the variant where the band continued under the jaw it was 14.5 px in one
frame -- the probe condition "<45" touched the band's L 45). Hand tip probe: before "not found", now it connects to the
hood/cloak dark -- we have no hand (nor did we before), a probe confusion.

Left OPEN (honestly):
- Shot 3 bright hair: the hood now covers the head and its SHADOW falls on the hair -- overlap 43 % -> 4 %, bright mass
  9.6 % -> 0.4 % (sample 1.7 %); the render without shadow 39 %. In the sample the front strands hang down from under the
  visor into the light ("curtain"), our fan points up and to the right inside the hood. Visible head mean tone 78.0 -> 60.9
  (sample 64.7). In the hair pass.
- Held frames: 12->13 0.128 (sample 0.025) -- now the side strands behind the face are visible and move; the shot 3 held
  pairs are now VERY still (the hair got covered; in the sample the strands and the visor edge move).
- The 9->11 jump is still 1.5 times the sample's: the rest is the face (lower face shift 0.15 -> 0.30) and the hair (the
  near strands swap) -- the 10 deg lean in frame 10.
- Shot 2 IoU 0.62 is limited by the face/neck length (in the sample the face colour goes down to y ~132, ours to 112; the
  front contour in rows 88-112 is the same) and by the hair volume on top; shot 2 has no figure map (2 frames) -- the
  silhouette was checked by eye.
- In the shot 3 hood, a fold from the upper part's turn (yaw 0.48) -- in the cel shading a separate dark spot left of the
  face (absent at yaw 0, but then the head is exposed; widening the transition range did not remove it). The sample too has
  a dark wedge beside the face, but it is JOINED to the face -- the shadow shape was not measured. In shot 1 right of the
  chin (x 128-150, y 95-125) ours has a hood panel, the sample has sky (the figure 0.928 includes that too).

## Pass 8: camera scale and the snow layer -- no "zoom" -- `out/before-now-3d-camera.gif`, `out/camera-audit-8.png`

The user: "after 10 there is a shift like a camera zoom that makes it bigger and smaller -- if you don't fix it, it will
affect all your work". The probes measured the face relative to the NEAR EYE anchor -- none of them saw the change of scale
of the surroundings. New tools (the same code on both sides, calibrated):
- `test/audit_sample/scale.py` -- an affine fit (ECC) of the left 45 % (hood, head, hair) between neighbouring frames
  -> scale. Calibration: itself 1.0000, 1.02 zoom -> 1.0203, 0.98 -> 0.9799. In shot 3 the left part is a uniform hood --
  unstable.
- `test/audit_sample/snow_zoom.py` -- snow: density (particles / 10k px, in a background box right of the character), size
  (p90/p99), shift and divergence (3x3 cells, affine; calibration 1.02 -> +0.038), continuity at a cut (phase correlation r).
- `test/audit_sample/hood_measure.py` -- now also the shot 2 figure (`private/test/sample_figure8.json`: k12-13 occlusion
  map).

Found -- three separate causes:
1. **Shot 1 9 -> 10 -> 11:** figure region scale 0.924 / 0.970 (sample 0.995 / 0.985) -- the frame shrinks. When the head
   turned, the hood followed it at a 0.35 share and its edge kept covering the back of the head (visible head 7093 -> 6658 ->
   6094 px; sample 7400 -> 6813 -> 7031). Now the hood follows the rotation WITHIN the shot at a separate share
   (`hood.kfInner`; relative to the pose at the start of the shot -- KF): in shot 1 0.2 (scan 0..1: best head IoU,
   0.802 -> 0.809), in shot 3 it stayed 0.35 (the best in the scan). Result: 1.007 / 0.999, visible head 7253 -> 7151 ->
   6862 px.
2. **The shot 2 camera was 20 % too far.** In pass 5 the distance was fitted to the lower face contour (nose..chin, 21
   rows) -- the whole head and hood came out small: figure area 0.407 (sample 0.509; in the sample the figure GROWS over
   shots 1 -> 2 -> 3: 0.431 -> 0.509 -> 0.578, ours shrank in shot 2), visible head 4 300 px (sample 6 620). The camera was
   refitted to the figure and head silhouette (`test/fit_camera8.mjs`; angles and pose fixed): d 12.88 -> 10.32, screen
   [0.422, 0.474]; shots 1 and 3 did not change in this fit (d 7.03 -> 7.034, 7.10 -> 7.17 -- left as they were). The
   shot 2 hood was refitted in the new camera (now with the shot 2 figure map).
3. **The snow was redrawn in each shot's camera.** In the sample the snow is ONE 2D layer: it continues through a cut
   (11->12 r 0.71, 13->14 r 0.69), its density in the three shots 271 / 273 / 272. Ours 195 / 294 / 193 (in shot 2 the
   camera is outside the snow box -- the particles get smaller and denser: "moved away"), at the cut r 0.12 / 0.03. Now the
   snow is computed in the shot 1 camera space and carried to each shot by a similarity (`main.js` `snowLayer`: fov and
   screen shift are compensated, depth is stretched by d_shot/d_1 -- a particle staying in front of/behind the head is
   preserved, size and the near fade are divided by the same).

| measurement (from the GIF path / role render, same code) | sample | pass 7 | pass 8 |
|---|---|---|---|
| figure region scale 9->10 / 10->11 | 0.995 / 0.985 | 0.924 / 0.970 | 1.007 / 0.999 |
| visible head 9 / 10 / 11 / 12 (px) | 7400 / 6813 / 7031 / 6608 | 7093 / 6658 / 6094 / 4286 | 7253 / 7151 / 6862 / 6670 |
| figure area shot 1 / 2 / 3 | 0.431 / 0.509 / 0.578 | 0.441 / 0.407 / 0.646 | 0.442 / 0.531 / 0.646 |
| shot 2: head IoU / ours:sample / figure IoU | 1 | 0.616 / 0.65 / 0.734 | 0.787 / 1.01 / 0.893 |
| snow density shot 1 / 2 / 3 (/10k px) | 271 / 273 / 272 | 195 / 294 / 193 | 195 / 186 / 168 |
| snow continuous at a cut (r) 11->12 / 13->14 | 0.71 / 0.69 | 0.12 / 0.03 | 0.88 / 0.83 |
| jump 9->10 / 10->11 / 12->13 (left 40 %) | 0.201 / 0.189 / 0.025 | 0.307 / 0.267 / 0.128 | 0.291 / 0.257 / 0.043 |

Shot 3 snow density 168 -- it is the same layer: our shot 1 snow is also sparser at the right edge (160 at x >= 245; the
sample 271 everywhere). Regression (face probes, clean render): all of shot 1 the same (+-0.2 px), lining band probe
11.6 -> 9.9 %; in shot 2 the near eye anchor +1.3 -> +1.6 px.

OPEN (honestly):
- **The shot 2 face is now ~1.25 times larger than the sample's** (front contour in rows 96-112 10-16 px to the right): in
  the sample the profile face is drawn small relative to its head and hood (in shot 1 both the face and the figure match in
  one camera). The camera was set to the large mass -- in the face pass the profile face is fitted within this scale.
- In shot 3 the scale between neighbouring frames is 0.965..1.088 -- the motion of the hair fan (seen on a sheet), not the
  camera.
- The look of the snow differs from the sample: density 195 vs 271, particle p90 4.0 vs 7.3 px, speed 1.5 vs 2.6 px/frame,
  it thins out on the right side (the sample is uniform).

## Pass 9: one 3D world -- only the camera belongs to a shot -- `out/before-now-3d-world.gif`, `out/camera-test-9-now.{png,gif}`

The user: "you are doing it in 3D ... you have to make a fully 3D model so that when the camera comes to that example
position it is 1:1 ... if you treat it as 2D, when the camera moves there is a big chance it ends up in the wrong place".
Over eight passes six values tied to a shot, a view angle or a frame had piled up: the eye card (profile weight), the lower
face shift, the hair rest-shape blend (`hairProfile`), the per-shot hood and follow share (`hood`, `kfInner`), the snow
layer stuck to the camera, the background "top". Each one improved a number in its own shot; none of them is visible
within a single shot.

1. **Tool -- the camera test** (`test/camera_test9.mjs`, skill `media-3d-consistency-audit`): pose and time are held, only
   the camera moves -- between the sample cameras (49 steps) and around the head (37 steps). Not the picture but the world
   is read: each part's points in the scene graph are compared in the current camera with the points of frame 0 (px).
   Calibration: with the patches frozen every part is 0.0000 px; an artificial +0.1 unit shift -- the independent camera
   model itself (0.000 %).
2. **The patches were removed one by one**, replaced by 3D:
   - face: eye card and shift -> one head (lower face section fitted to the targets of all frames together,
     `test/fit_head9.mjs`, RMS 2.25 -> 1.77 px), each frame's pose refitted, the tear points re-transferred;
   - hair: `hairProfile` -> one rest shape (near strand, short forehead strands);
   - hood: per-shot `hood`/`kfInner` -> one hood (its size fitted to the three shots together, `test/fit_hood9.mjs`) and a
     POSE-dependent rig (`CLOTHES.hoodPose`: 3 key poses, Gaussian weights by the lagged head pose, hood-frame lag 0.1 s,
     placement lag 0.4 s; `test/fit_hoodPose9.mjs`, together with the shot 2 camera: d 10.32 -> 10.80). One rigid hood
     covered the face in shot 2 (visible head IoU 0.13), with the rig 0.69. Pose path test (camera held, pose shot 1 -> 2
     -> 3): the largest shift in a step is hood 25 px, hair 5.3, head 3.0 -- no jump. The 10 -> 11 scale jump (1.075) is
     1.008 with the placement lag;
   - snow and sky: camera layer and background top -> a world snow volume surrounding all the cameras and a world sky
     gradient, fitted to the three shots together (`test/fit_background9.mjs`).

| measurement (same code) | sample | pass 8 | pass 9 |
|---|---|---|---|
| camera test, path: hood / eye / hair / head surface / snow (px, largest) | 0 | 114 / 33 / 73 / 6.7 / 158 | 0.00 all |
| jump in one step when the key switches: hood / eye | 0 | 159 / 36 | 0 / 0 |
| orbit: hair / eye / snow; background top (shot 3) | 0; 0 deg | 98 / 44 / 452; 22 deg | 0 / 0 / 0; 0 deg |
| visible head IoU, shot 1 / 2 / 3 | 1 | 0.81 / 0.79 / 0.69 | 0.81 / 0.69 / 0.68 |
| figure IoU, shot 1 / 2 / 3 | 1 | 0.93 / 0.89 / 0.88 | 0.92 / 0.91 / 0.89 |
| shot 2 front contour, mean abs | 0 | 9.8 px | 2.1 px |
| scale 9->10 / 10->11 | 0.995 / 0.985 | 1.007 / 0.999 | 1.005 / 1.008 |
| snow density shot 1 / 2 / 3 (/10k px) | 271 / 273 / 272 | 195 / 186 / 168 | 267 / 371 / 210 |
| snow continuity r: at the cut / within a shot | 0.71, 0.69 / 0.51..0.78 | 0.88, 0.83 / 0.56..0.93 | 0.11, 0.09 / 0.57..0.76 |

Residuals (measured, not hidden): the shot 2 profile eye is 15..17 px ahead of the sample's (the sample draws the eye
further back in profile); in the sample the snow is one screen layer -- it continues through the cut, with the world snow
the cut is a new view (consistent within a shot); the shot 3 sky is darker in the world gradient (background
profile |diff| 25 L; the sample uses one plate in all three shots); snow density in shots 2 and 3 is 371 / 210 -- the
cause is open. A TEMPORARY regression: shot 2 visible head 0.79 -> 0.69; in shot 2 our hair covered 23..27 % of the sample's face
skin -- once the camera was refitted together with the hood the face fell on the sample's face, and the near strand in the
single 3/4 rest shape covered the cheek (`test/audit_sample/face_hair.py`; the bright-mass IoU does not sense this).
Correction: pass 8's "in shot 2 the camera is outside the snow box -- the particles get smaller and denser" was tested and
NOT CONFIRMED (with the box surrounding every camera the density did not change).

## Pass 10: parts separately -- eye, brow, nose, mouth, chin ("daha"), jaw, hair, hood -- `out/parts-audit-10.png`, `out/parts-audit-10-head.png`, `out/hair-strand-10.png`, `out/before-now-3d-10.gif`

The user: "you can't tell which one is the hair, which one is the nose, the eye, the brow, the mouth, the chin -- it worries
me that you measure the head down to the mouth and leave the chin out ... in our own model take the hair and the hood off
and measure them one by one, then put them back on and measure". Check: among the standing measurements shot 1 had probes
for the eye, the mouth, the under-jaw (3 columns in front of the chin) and the chin front; shots 2 and 3 only the front
contour and the eye; the brow and the nose tip nowhere; in the pass 9 head fit the chin and the jaw were almost absent (one
row of the chin's front edge in shot 1, 3 points under the jaw in shot 2 -- at the weight of 2 frames, 2 columns in shot
3). The part of the jaw toward the ear was not measured anywhere.

Tools (`test/parts/`, the same code on both sides, 320x180):
- `personaj.js partPoints()` + `points.mjs` -- named part points on our model (eyes, brows, nose, mouth, lip shadow, chin
  tip and underside, jaw angle, skull) from 3D; the node projector matches the page to 0.005 px (the closed-eye state in the
  role style was read from the material uniform and came out wrong -- 3.8 px; it was made to be read from the pose).
- `part_measure.py` -- contour (per row), under-jaw (per column, below the lip shadow), chin tip (the end of the jaw trace
  in the shot direction), nose tip, dark blobs (eye, brow, mouth, lip shadow; with a shape condition). `calibrate.py` --
  the same code on our render against the 3D points (the eye blob centre is a constant -1.6, -3.7 px from the exact point
  -- the same on both sides); `check_sheet.py` -- what was found in each of the 22 frames was reviewed (the brow is visible
  only in k03, k05, k10; in shot 3 the mouth is not used -- out of several small marks on the lower face the rule picked a
  different one in every frame). `compare.py`, `layer.py` (bare -> + hair -> + hood: what we have over the sample's visible
  face), `part_sheet.py`; all of them with `run.sh TAG`.

Found (pass 9): in shot 1 the eye, mouth, lip and chin tip are in place (1-2 px); the UNDER-JAW toward the ear is up to
17 px low (in the sample the jaw rises toward the ear, ours is flat and long -- the jaw bottom reaches the middle of the
head); in shot 2 the chin is 6 px low, in shot 3 10 px low; the brow 7 px outside, 3 px below; the hair covers
16 / 18 / 10 % of where the sample shows skin.

Fixed -- the head, without hair and hood (`test/fit_head10.mjs`: lower face and jaw sections -- with a new `jawBack1`
parameter -- and the shot 1 pose; model traces -- the silhouette of full-azimuth surface points, 0.7-1.3 px against a
render scan). At equal weights the chin in shot 1 went 5-6 px up (in shot 2 the sample draws the profile face ~20 %
smaller relative to its head; in shot 3 eye -> chin is 45 px in the sample, 61 in ours -- this is sensitive to the pose),
so the target is shot 1, with a "do not get worse" penalty for shots 2 and 3; the poses with a (x / 0.04 rad)^2 penalty
(without the penalty the turn of shots 2 and 3 reached 17 deg -- the pose was absorbing the difference in shape). Shifting
the shot 2 and 3 poses too was tried and reverted: in shot 3 the eye went 1 -> 6 px, and the hood rig with the shot 2 key
brought back the scale jump in shot 1 at 10 -> 11 (1.057). A separate addition for each frame of the shot 1 pose brought
back the 9 -> 10 jump (1.029) -- one addition for the whole shot. The tear was re-transferred.

| part: ours - sample (x, y px) | shot 1 (3/4) | shot 2 (profile) | shot 3 |
|---|---|---|---|
| chin tip ("daha") | -2.2, -1.4 -> -1.1, -1.0 | -2.0, +6.3 -> 0.0, +6.2 | -10.7, +9.7 -> -9.5, +10.4 |
| under-jaw, mean abs (min..max) | 3.9 (-5..+17) -> 1.3 (-7..+7) | 5.1 -> 5.8 | 5.4 -> 6.4 |
| near eye / mouth | +1.1, -0.8 -> +1.6, -0.3 / -2.0, -0.1 -> -1.5, 0.0 | +15.5 (2D, residual) / -- | -1.6, -4.2 -> -1.5, -4.3 / -- |
| near brow / nose tip | -6.9, +3.2 -> -6.4, +3.8 / -- | -- / +2.0, +2.0 | -- |
| shot 1 all-parts RMS | 4.03 -> 2.58 px | 3.27 (pose fixed: 4.78 -> 4.89) | 8.08 (8.49 -> 9.04) |

Other measurements (`test/measure9.py`): camera test 0.00 px in every part; scale 9->10 / 10->11 1.005 / 1.008 -> 1.009 /
1.015; shot 2 front contour 2.10 -> 2.24; shot 3 chin contour 1.58 -> 1.57, the eye unchanged; lining band probe
12.5 -> 8.2 %. Probes that got worse (the cause was looked at): under-jaw x8 1.48 -> 3.97 px -- with the camera below, the
jaw bottom shows as a thin band, and the probe stops at the dark boundary above it (silhouette trace 1.3 px); chin front
y52 2.03 -> 3.32 -- the chin is 3 px forward at row 99 (chinZ 0.974 -> 1.032).

Hair test (NOT ACCEPTED, `out/hair-strand-10.png`): the near strand was fitted along its section (`side()`, from the cheek
to behind the jaw) and by coverage (`test/fit_hair9b.mjs`): coverage shot 1/2/3 ~14 / 18 / 13 % -> 2 / 3 / 0.2 %, shot 2
hair IoU 0.29 -> 0.46, but in shot 1 (11 frames) the strand disappeared from the cheek edge (IoU 0.26 -> 0.19). Overlay
mask: in frames 1-9 the pass 9 strand falls right on the sample's; in 10-11, when the head turns, the strand moves onto
the face, while the sample's stays at the face edge (inertia?); in shot 2 the sample's strand is behind the cheek. One
strand does not give both views (in 3/4 the sample's strand is 20-25 px left of the eye, in profile in front of the ear --
in 3D a difference of more than 30 px). The strand was left as in pass 9.

## Pass 11 (start): human marks -- checking the sample side with an independent eye -- `test/parts/human/`

The detectors were calibrated on our render against the exact 3D answer, but on the sample they had only been checked
against my own sheets (the same eye). Alonur marked the parts by hand in 8 sample frames (R03 R10 R12 R13 R14 R17 R20 R22):
the "Measurement by eye" artifact (`page.html` + `prepare.py`; db `mark`), analysis `analysis.py` (synthetic calibration:
it finds a planted 8 px chin error and nothing else; it reads a 3.0 px jaw shift exactly). The marks
`marks_alonur_1.json` -- TAKEN FROM THE SAMPLE, PRIVATE (they do not go into the repo; neither do the sheets). Marking our
frames was dropped (Alonur: in an unfinished model there is no "right place", and hand precision gets mixed up with our 3D
definition); hand noise -- a repeat: R12 = R13 (the same drawing), 0.45-1.3 px on the points (sigma ~0.45).

Detector errors (checked on a sheet, `sheet.py`):
- **Shot 2 chin -- 24 px:** the detector took the face edge at the height of the mouth line (158,111); the real chin
  (149,134), the mouth at y~114. "In shot 2 our chin is 6 px low" was WRONG: ours is ~16 px ABOVE. The earlier shot 2 fit
  was pulled toward this target.
- **R10 nose -- 13 px:** the detector took the contour point under the nose (140,73.5); the nose tip (138.6,61.8) -- a
  bright point.
- **The eye calibration does not carry over to the sample:** on a closed eye the human point is within 0.5 px of the raw
  centroid; the +3.8 px correction (centroid -> 3D centre) taken from our render gives a 4 px error on the sample.
- Mouth (R03) and brow: the detector sees only the black/open part; the human continues the line under the hair
  (approximately).
- Shot 3 chin and shot 1/3 jaw: they match (0.2-3 px; R20 4.7 px -- a difference of definition along the flat lower edge;
  R22's jaw is under the hair).

The detector was fixed (`test/parts/part_measure.py`, the cause is in the docstring; the old copy is `part_measure_10.py`),
standing test `test_detector.py`: "found, but far from the human" 8 -> 0 (R03/R10 mouth -- a known difference of
definition, +2.5 px, corrected in `target.py`); correct 20 -> 30; not found 20 (shot 2 far eye/brow, shot 3
nose/mouth/eyes -- the human marks are the target). Shot 2 chin 24 -> 1.1-1.5 px, jaw 21 -> 0.3-1.7, mouth found
(0.8-1.4); R10 nose 11.8 -> 2.3; chin definition (shot 1 (0.65,0.76), shot 3 downward) R10 4.0 -> 2.6, R20 4.7 -> 1.7. The
calibration on our render did not change (eye, mouth, lip the same).
New measurement rule (`target.py` -> `target_TAG.json`): each side by ITS OWN truth -- sample: the human mark, otherwise
the fixed detector; ours: the 3D point (eye, nose, mouth, brow), chin/jaw -- the bare silhouette. "The same code on both
sides" does not cancel the shift when the drawings differ: in the mouth the sample's black part is on the right, ours on
the left -- the difference is 5 px the opposite way.
head10c, ours - sample (px): shot 1 eye (+2.3,+2.9), far eye (-0.9,+2.1), nose 0.9, mouth (+3.9,-0.3), chin (0,-1.5),
jaw |y| 1.3; shot 2 eye (+16.7,+3.8), mouth (+11.5,-8.5), chin (+9.2,-16.3), jaw -20.1 (ours is above), nose 3.6;
shot 3 near eye 1.5, far eye (-5.2,+7.5), nose (-6.4,+9.9), mouth (-5.3,+7.0), chin (-8.8,+10.5) 9 frames, jaw +12.8.

Our model - sample (by the human point, `diff_sheet.py`): shot 1 good (parts 2.6-4.6 px; eye->chin 0.93-0.95). Shot 2:
the near eye +16.7 px ahead, mouth (+11.5,-8.5), chin (+9.2,-16.3), nose 3.6 -- eye->chin in the sample 57, ours 36 px
(0.63). Shot 3: the near eye matches (1.6 px), far eye / nose / mouth / chin 9-14 px low and to the left -- eye->chin in the
sample 46-48, ours 62 px (1.27-1.35), the angle 19 degrees instead of 9-11. Both are mostly POSE (tilt): in shot 2 the
head is back (chin up), in shot 3 the face is foreshortened too little.

## Pass 11 (item 2): shots 2 and 3 -- pose, camera and hood key to the human marks -- `out/before-now-3d-11.gif`

BEFORE = the delivered pass 10 GIF (`frames-delivered10/`, the NOW panel taken from the GIF), NOW = `pose11c`.
The path: (1) the face in node (`test/face11.mjs`, `test/fit_pose11.mjs`: 3D part points + the bare silhouette trace, no
render; equal to the render: points 0.00 px, chin <= 0.5, jaw <= 0.27); (2) TOGETHER in the render (`test/fit_pose11b.mjs`,
async Nelder-Mead): pose + camera (d, screen, az, el) + this shot's hood key, target face RMS/3 + head IoU + figure, in
shot 2 a guard on shot 1 10-11; (3) check -- layers, old probes, sheets; (4) the errors found were fixed (below); (5)
frame 14 separately.

**Found in the check and fixed:**
- **Right number, wrong reason (shot 3):** the first fit (`pose11`) held the head IoU (0.656 -> 0.657), but the hood
  covered 28 % of the sample's visible face (before, 5 %). Cause: in the head IoU the lining counts as "head" (in shot 1
  the lining is visible in the sample), while in shot 3 the sample has no lining -- a large bright hair mass right of the
  face. The fit filled the missing hair with lining: lining over the sample's head 18 % -> 30 %, hair + skin 73 % -> 54 %.
  The face points do not see this (a 3D point does not know it is covered). New measurements (`src/main.js` hoodScore9,
  the mask `test/parts/human/face_view.py` -- PRIVATE): hoodF -- hood/cloak over the sample's bright skin, skinQ -- our
  skin on the sample's lining/dark area, iou2 -- head IoU without the lining.
  The shot 3 key again (the key only, pose/camera fixed: `--keyOnly --iou2 --facevis 6 --snow1`): hoodF 0.276 -> 0.139,
  skinQ 0.148 -> 0.114, iou2 0.452 -> 0.470, figure 0.893 -> 0.887. A one-dimensional scan (`test/scan_hood11.mjs`): only
  openA (the near edge) uncovers the face; the remaining hoodF is the collar under the chin (global shut/rShoulder): if it
  is opened, our skin comes out on the sample's lining band (L 40-45).
- **Scoring order (a tool bug):** the shot 1 and 2 poses have no sink/backward, while `P.pose` does Object.assign -- in the
  fit, when it restarted from frame 0 after shot 3, the shot 1 head stayed at shot 3's value (-0.02, ~1 px; hoodF
  0.030 -> 0.019). Now every frame's pose is complete (a missing field = 0). The sequential render (render.mjs) does not
  change.
- **Frame 14 (motion range):** the whole-table shift fits 15-22, at 14 the face RMS is 6.9 px (mouth, chin ~7 px, jaw -8):
  only the tilt 0.41 -> 0.53 -- RMS 3.2 px (mouth 1.5, chin 2.3, jaw -2.0; nose 2.8 -> 5.3).

**Result (delivered 10 -> now).** Distance to the human marks, px (`diff_sheet.py`): R12 (shot 2) near eye 16.6 -> 3.5,
mouth 14.2 -> 2.3, chin 19.0 -> 0.9, far eye 2.8 -> 1.7, nose 4.0 -> 4.7; eye -> chin in the sample 57, ours 36 -> 60 px.
R17/R20/R22 (shot 3): far eye 8.8-11.3 -> 3.4-4.7, mouth 9.3-13.5 -> 1.4-4.0, chin 13.6-16.3 -> 2.8-5.0, nose 14.6-15.6 ->
8.7-9.3, near eye 1.4-1.8 -> 1.0-2.4; eye -> chin 46-48 / 62 -> 48. R14 far eye 7.0 -> 4.5, chin 3.8 -> 2.3, mouth 0.5 -> 1.5.
Shot 1 unchanged. The target table (`target.py`, ours - sample): shot 2 chin (+9.2,-16.3) -> (+0.7,-0.6), jaw -20.1 -> +0.6;
shot 3 chin (-8.8,+10.5) -> (-2.6,-0.6), jaw +12.8 -> +1.1, mouth (-5.3,+7.0) -> (-0.7,+0.6), nose (-6.4,+9.9) -> (-5.1,+6.2).
Camera: shot 2 d 10.80 -> 7.39 (close to shot 1's 7.03), the head turned 33 deg toward the camera and tilted 14 deg; shot 3
d 7.10 -> 8.14.
Mass and layers (the same tool inside the page, delivered -> now):

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| head IoU (with lining) | 0.797 -> 0.809 | 0.661 -> 0.750 | 0.656 -> 0.471 (the lining no longer fills in for the hair) |
| head IoU without lining (skin + hair) | 0.702 -> 0.711 | 0.652 -> 0.750 | 0.551 -> 0.458 |
| figure | 0.924 -> 0.922 | 0.914 -> 0.922 | 0.885 -> 0.885 |
| hoodF (hood on the sample's skin) | 0.029 -> 0.030 | 0.239 -> 0.004 | 0.052 -> 0.139 |
| skinQ (skin in the sample's dark) | 0.279 -> 0.201 | 0.097 -> 0.112 | 0.354 -> 0.110 |

Class IoU (Python, 320): shot 2 hair 0.416 -> 0.501, skin 0.382 -> 0.583; shot 3 hair 0.180 -> 0.214, skin 0.553 -> 0.457.
Layer (ours over the sample's face, with the hood): shot 2 skin 50 -> 81 %, hood 24 -> 1 %; shot 3 skin 82 -> 54 %, hair
11 -> 16 %, hood 6 -> 15 %, our skin outside the sample's face 46 -> 18 %. Shot 1 9->10->11 scale [1.009, 1.015] ->
[0.999, 1.011]; camera test (camPath 49 + orbit 37 frames) 0 in every part.

Shot 3, honestly: the face parts are now on the sample's points, but the visible face is smaller than the sample's and the
skin IoU dropped (0.553 -> 0.457). When delivered, the face was 9-14 px low and to the left and larger -- it covered 82 % of
the sample's face, but 46 % of it was outside. Now 15 % of the sample's face is the hood collar (under the chin, on the
left), 16 % hair strands (the near eye is under a strand in 8 of 9 frames -- before, in 6), ~15 % outside our face (the
front contour on the nose side ~5 px inside: nose (-5,+6), far eye -4). The hair mass right of the face is large in the
sample, small in ours -- before, the lining filled it in.

Old probes (`measure9.py`) checked: shot 2 front contour 2.24 -> 5.19 px -- rows 70-80 now measure the hair strand in
front of the forehead (ours x 168-169, the sample's face contour 155-158), rows 82-110 -4..+3 (mean 2.1). The shot 3 "eye"
probe [-13,-5] -- the darkest window in the box is, in ours, the hood/hair shadow in the corner (the eye is under a strand),
while the eye point is at 1.7 px. Shot 1 band probe k09/k10 +3/+2 % -> +16/+27 % (threshold 25): the shot 2 key also
touches shot 1 (its weight in the Gaussian mix ~1/3) -- the guard only looked at the 10-11 head IoU and figure. Shot 1
hair probes improved (hair_left y-6 7.1 -> 3.2).

## Pass 12: structure -- first a correct 3D model (hood, hair, head), then the camera -- `out/before-now-3d-12.gif`, `out/mockup-wide-12.png`, `out/three-shot-12.png`

Alonur: "understand the structure of the hood, the hair and the head yourself and fix it ... your job is not to fix the head, it is
to mask them and make them look like your own numbers ... first you have to get the 3D models right, then the camera". BEFORE = delivered
pass 11 (`frames-sample/anime-pose11c`), NOW = `frames-sample/anime-structure12`. The old model's mock-up is in a separate copy
(`../personaj3d_old`, the source of pass 11).

**What was wrong with the previous model (in the mock-up -- one pose, the camera orbits):** the hood was a narrow, tall pointed
cap stuck to the face, with a separate key for each shot's pose (`hoodPose` -- the opening, crown and lining different in every shot: a patch fitted to 3 shots);
the hair had no back -- from behind and from the side the head was a dark "helmet" (a lid), and the strands on top poked through the hood;
the bright "lining band" along the brim was actually the sample's HAIR (it moves in the held frames: pairwise IoU 0.28-0.80, cloth
0.98-0.99). The fit had "explained" the sample's dark interior by COVERING our hair with the hood.

**Structure from the sample (in head space, from the three shots together -- `test/parts/hood_map.py`):** which part of the sample a grid
0.2 outside the head surface falls on in each frame (PRIVATE target). The hood covers the back and the top of the head; the brim frames the face
(~-60 deg at mid-head, ~-85..-110 at the jaw); between the brim and the bright side strands it is dark (L 6-14) -- in one place in head space
across the 9 frames (az -60..-70, y -0.3..+0.4). The hood is big and loose (thick cloth does not cling to the head), dark inside.

**Built (one world, nothing depends on the camera):**
- **Full hair:** a back and above-the-ear layer (two rows, down to the nape) -- the head is hair on every side (`HAIR.back`).
- **Hood -- one cloth (`hoodGeo`):** rings, with radius and centre given through knots (dome, head, neck, shoulder), a sack hanging
  at the back, a visor at the front-top and a muzzle above the brim; the brim of the opening is given by HEAD AZIMUTH (fi1..fi4 -- a quantity
  read from the sample's map). The pose keys were removed; it follows the head per axis (kfE tilt 0.80, kfB turn
  0.79, kt 0.88) -- with temporal inertia (tau).
- **Hair inside the hood (physics):** a hair chain does not go out past the cloth's inner surface (allowing for the strand's thickness), what comes
  out through the opening is free -- in the mock-up no hair pokes through at the top.
- **The hood is dark inside -- lighting:** hood+cloak depth maps from 16 world directions, sky visibility V at every point
  (AO); V < 0.505 -- the inner tone (hair), 0.22 for skin (the face stays visible, the neck dark); the hood's shadow from the key
  light is the inner tone too. The inner cloth is fully dark (no lining band). Key light az 41.7, el 29.7.
- Fit (`test/fit_hood_structure.mjs`, 3 shots together, in the page): only the hood's physical dimensions + one light and the AO
  threshold; objective -- class IoU on the head-shell map (head / inner / outer) + figure, penalty -- the cloth must not enter the hair layer.
- **Camera last (`test/fit_camera_structure.mjs`):** the camera/pose of shots 2 and 3 were re-checked with the human marks (face RMS) + whole-frame classes + figure
  -- the local optimum is at the current camera (shot 3: < 0.5 deg in 300 evaluations, F 4.907 -> 4.873; shot 2
  +/-8 deg, +0.5 d -- worse). The cameras were not changed (face RMS shot 2 2.50, shot 3 4.03 px).

**Result (delivered 11 -> now; the same tool, `test/parts/structure_measure.py`, 9 frames):**

| head shell 0.2 | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| agreement (4 classes) | 0.838 -> 0.800 | 0.880 -> 0.869 | 0.743 -> 0.729 |
| head (face+hair) IoU | 0.780 -> 0.778 | 0.875 -> 0.782 | 0.537 -> 0.685 |
| inner (dark) IoU | 0.091 -> 0.102 | 0.000 -> 0.298 | 0.000 -> 0.076 |
| hood outer IoU | 0.766 -> 0.728 | 0.826 -> 0.812 | 0.761 -> 0.820 |
| figure (soft) | 0.922 -> 0.898 | 0.922 -> 0.918 | 0.884 -> 0.810 |

Hair-volume shell (0.55): head 0.665 -> 0.661 / 0.794 -> 0.682 / 0.366 -> 0.439; outer 0.749 -> 0.797 / 0.817 -> 0.779 /
0.804 -> 0.848. Camera test (`test/camera_test9.mjs`, calibration PROVEN): every part 0.00 px over camPath (49 frames) and orbit (37 frames).

Honestly: some of the numbers dropped -- that is the price of consistency. Shot 2 head IoU 0.875 -> 0.782 and shot 3 figure 0.884 -> 0.810:
the old hood had been fitted to these numbers with its own key for EACH SHOT (a patch); one cloth cannot satisfy all three shots at once.
Gains: the shot 3 head (0.537 -> 0.685), a dark interior for the first time (shot 2 0 -> 0.298), in shot 1 no hood on the far side of
the face (as in the sample), in the mock-up the hood is one round cloth from every side, the hair does not poke through.

## Pass 13 (item 1): the hair on top and the hood opening -- together -- `out/before-now-3d-13-top.gif`, `out/mockup-13-top.png`

BEFORE = delivered pass 12 (`frames-sample/anime-structure12`), NOW = `frames-sample/anime-structure13` (role: `role-structure13`).

**What is in the sample (measured, `test/parts/hair_top.py` -- the topmost row of the visible head (face+hair) in each column):**
in shot 2 the sample's hair rises above the head up to the top of the frame (y 4-5 at x 138-158, in head space y ~1.35-1.45, z 0.5-0.8 --
above the forehead, in front of the brim); ours ended 25-32 rows lower in these columns (IoU 0.55 in the top 60 rows). In all three shots
the sample's CROWN is under the hood: the boundary of the visible head on the hood side is in front of the top of the head (in shot 2, in head space
z ~0.2-0.5).

**Done (one world; only physical dimensions, no shot key):** the top of the hood opening and the hair fan were fitted TOGETHER
(`test/fit_hood_structure.mjs`: the 0.2 and 0.55 shells + the whole-frame head class + the frame top in shots 1 and 2, 3 shots together ->
`test/hood_structure_fit_G.json`, `test/structure_write.py` writes it into the source):

| | 12 | 13 |
|---|---|---|
| opening top (openV0; y in the hood's frame) | 0.157 (~1.16) | 0.053 (~1.53) |
| dome tip yTop / dome radius Rg | 1.85 / 1.12 | 1.76 / 1.41 |
| muzzle above the brim / visor | 0.20 / 0.12 | 0.51 / 0.14 |
| opening half-angle fi1 (at v1) | 34.3 deg (0.28) | 40.5 deg (0.27) |
| following the tilt kfE | 0.80 | 0.83 |
| fan length L / rise HK | 0.43 / 1.18 | 0.80 / 1.11 |
| fan swing swing0 / swing1 | 0.19 / 0.94 | 0.23 / 0.97 |

The top of the opening rose above the head, the hair fan is longer -- the forehead rows come out of the opening in front of the brim and rise;
the crown hair is under the dome (the collision presses it down). In the mock-up (`out/mockup-13-top.png`) the hair does not poke through the cloth.

**Checked and REJECTED (the measurement did not support it):**
- "Back rows flat" (the tip and the rise of the fan's back rows at a fraction `1 - flatten (1 - k)`): the fit chose flatten = 0.015
  (~0) -- the crown hair is already under the dome through the collision; the code was removed.
- Stiff hair (swing1 0.18): the first fit (F) had run under a different light -- the default of `fit_hood_structure.mjs` is
  el 20.5, AO 0.45, the source has el 29.7, AO 0.505 (the numbers had been fitted to a different light). Re-scored under the source light,
  the stiffness gave nothing (swing1 0.94 is better); G was fitted under the source light. The script was fixed: light/AO are set only
  when given as a parameter, otherwise the source value in the page is used.

**Result (12 -> 13; the same tools):**

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| whole-frame head IoU | 0.664 -> 0.657 | 0.655 -> 0.742 | 0.495 -> 0.481 |
| frame top (60 rows) head IoU | 0.593 -> 0.584 | 0.549 -> 0.772 | -- |
| shell 0.2: head / outer / figure | 0.778 -> 0.751 / 0.728 -> 0.717 / 0.898 -> 0.901 | 0.782 -> 0.826 / 0.812 -> 0.821 / 0.918 -> 0.928 | 0.685 -> 0.652 / 0.820 -> 0.821 / 0.810 -> 0.842 |
| shell 0.55: head / inner / outer | 0.661 -> 0.653 / 0.070 -> 0.072 / 0.797 -> 0.789 | 0.682 -> 0.796 / 0.075 -> 0.115 / 0.779 -> 0.789 | 0.439 -> 0.437 / 0.048 -> 0.049 / 0.848 -> 0.866 |

Hair top (IoU of the top 60 rows, per frame): k12 0.546 -> 0.770, k13 0.551 -> 0.770, k03 0.653 -> 0.639, k10 0.543 -> 0.542.
Camera test (`test/camera_test9.mjs`, calibration PROVEN): every part 0.00 px over camPath (49 frames) and orbit (37 frames).

Honestly: shot 2 clearly improved; shots 1 and 3 dropped a little. **Shot 1:** the near-upper side of the opening (fi1) -- shot 1 wants it
narrow, shots 2 and 3 wide (in G fi1 40.5 -> 34.3: whole-frame head shot 1 0.657 -> 0.680, shot 2 0.741 -> 0.705, shot 3
0.480 -> 0.444): one hood does not satisfy both -- a residual, to be revisited with item 2 (the side brim, the dark triangle). **Shot 3:** the forehead strands now come out in front of the visor
(in the sample there is a bright visor band in that place) -- with item 3 (the visor). The wind does not set the direction of this strand (in a test of the fan
without wind 0.6 % of the pixels of the shot 3 frame changed, 480x270, difference > 20).

## Pass 13 (item 2): the dark interior and the hood's width -- `out/before-now-3d-13-inner.gif`

BEFORE = item 1 (`anime-structure13`), NOW = `anime-structure13b`.

**Measurement (whole frame, inner -- the hood interior / dark class, 320x180 px; its place relative to the head class):**

| frame | sample: left / right / below | item 1 (ours): left / right / below | item 2 (ours) |
|---|---|---|---|
| k03 | 514 / 7 / 472 | 1222 / 1862 / 1178 | 1352 / 1206 / 1224 |
| k10 | 729 / 0 / 296 | 500 / 1707 / 1417 | 617 / 1061 / 1217 |
| k12 | 691 / 3 / 0 | 487 / 269 / 36 | 507 / 229 / 16 |
| k16 | 664 / 0 / 486 | 2153 / 119 / 155 | 1852 / 162 / 109 |
| k20 | 374 / 0 / 459 | 2570 / 264 / 86 | 2312 / 300 / 66 |

In the sample the dark is only the triangle at the near temple and the collar under the chin; on the right (the far side in shot 1, in front of the face in shots 2 and 3)
it is almost zero. Ours has three sources (in the item 1 model, separated in a render with AO and shadow switched off, k03 / k12 / k20): the hood's inner cloth 3235 /
432 / 823 px, the AO + shadow dark 1343 / 587 / 2646 px -- in shot 1 the cloth (the far-side brim outside the face contour and, under
the chin, the lower part of the opening), in shot 3 the AO dark of the hair under the visor.

**Done:** the lower part of the opening and the neck ring, together with the hood hanging on the torso (new, physical: the hood hangs on the torso
through the collar, the torso is turned 23 deg relative to the head -- the top part takes the `kgB` fraction of that turn) were fitted together
(`test/fit_hood_structure.mjs --wiF 2` -- the whole-frame inner IoU is in the objective too -> `test/hood_structure_fit_H.json`): fi4 47 -> 27 deg (the opening
narrower under the chin), fi2 62 -> 64, fi3 56 -> 53, v4 0.76 -> 0.75, Rn 1.25 -> 1.27, zn -0.12 -> -0.07, kgB 0.04 (~1 deg).

**Result (item 1 -> item 2):**

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| whole-frame inner IoU | 0.092 -> 0.131 | 0.205 -> 0.241 | 0.082 -> 0.088 |
| whole-frame head IoU | 0.657 -> 0.671 | 0.741 -> 0.724 | 0.480 -> 0.481 |
| shell 0.2: head / inner / outer / figure | 0.751 -> 0.757 / 0.098 -> 0.100 / 0.717 -> 0.727 / 0.901 -> 0.914 | 0.826 -> 0.805 / 0.282 -> 0.300 / 0.821 -> 0.812 / 0.928 -> 0.943 | 0.652 -> 0.659 / 0.070 -> 0.079 / 0.821 -> 0.843 / 0.842 -> 0.845 |
| shell 0.55: head / inner / outer | 0.653 -> 0.665 / 0.072 -> 0.094 / 0.789 -> 0.831 | 0.796 -> 0.777 / 0.115 -> 0.197 / 0.789 -> 0.786 | 0.437 -> 0.442 / 0.049 -> 0.059 / 0.866 -> 0.856 |

Camera test: every part 0.0000 px over camPath (49 frames) and orbit (37 frames). In the mock-up the hair does not poke through.

**Checked and REJECTED (the objective got worse, in the item 1 model):** narrowing the hood (wideX 1.0; R0 1.4), pulling the brim to the face
(wing -0.3 / -0.6 -- a "drawstring"), widening the opening (fi2 75 / 85) or narrowing it (fi2 50), thickening the side hair mass
(faceside off 0.2, en 0.7), the AO threshold 0.35-0.55 (below 0.505 the shot 2 triangle disappears: there the triangle comes from
hair in the AO dark), kgB 0.15 / 0.5 (shot 1 improves -- at 0.5 whole-frame head 0.657 -> 0.697, top 0.584 -> 0.682 --
but shots 2 and 3 drop sharply: 0.741 -> 0.583, 0.480 -> 0.305).

**Residual and its cause:** in shot 1 the far-side brim (a dark band to the right of the face contour) -- in the sample the hood is not visible
on the far side at all; with one cloth only turning the hood ~11 deg toward the far side gives that, and that breaks shots 2 and 3. The shot 1
camera/pose has not yet been re-checked against the new model (in pass 12 only shots 2 and 3) -- in item 5. The dark in shot 3 -- item 3
(the visor and the light under it).

## Pass 13 (item 3): shot 3 -- the visor and the hair under it -- `out/before-now-3d-13-visor.gif`

BEFORE = item 2 (`anime-structure13b`), NOW = `anime-structure13d`.

**A hiding trick found (it raised the number, not the model):** in pass 12 the hood's shadow from the key light (`SHADOW_BLACK`)
was drawn on hair/skin in the inner tone (the darkest) -- on the grounds that "the triangle between the brim and the hair comes from this shadow". Measurement: in shots 1 and
2 this rule does not change A SINGLE pixel of the class map (the triangle comes from AO), it works only in shot 3 -- and there, of our
3192 dark pixels in k20, 1089 are SKY in the sample and 1040 are the outside of the hood: the visor shadow had "hidden" our hair standing
in the open by painting it in the inner tone (shot 3 head IoU 0.488 -> 0.562). In the sample the hair under the visor is BRIGHT. The rule was switched off
(`?shadowBlack=1` -- for checking only): the hood's shadow is now an ordinary material shadow.

**Where the hair is (in world space, `window.hairWorld`):** in shot 3 the fan strands hang (the tip 0.64 below the root, the tip segment
-72 deg) -- but their roots are on the crown, and the shot 3 camera, looking from below, sees the crown through the opening; in the sample the crown is under the visor.

**Tried (rejected -- worse over the three shots together, or at noise level):**
- The best static hood for shot 3 ALONE (a check, not the model, `--shots 3`): whole-frame head 0.422 -> 0.469 --
  the hood's shape is not the main limit here.
- The hood follows more when tilted (kfEo 1.0-1.35) or slides more (kt 1.0-1.25) -- the whole opening falls onto the face, shot 3
  head 0.56 -> 0.14-0.53 (in the item 2 model); in the fit without the hiding, a separate kfEo 0.91 (kfE 0.88) -- difference +0.006, removed.
- The key light lower (el 20 / 10 / 0 / -10; in the item 2 model) -- shot 3 worse; an upward wind component
  as in the snow (0.6, 1.0; the snow flies 45 deg upward in the world, the hair wind 11 deg) -- worse; the fan's swing and length -- no effect
  (both without the hiding).

**Accepted:** (1) `SHADOW_BLACK` off; (2) the fan's back rows flat (`HAIR.fan.flatten` 1.0 -- in item 1 the fit had chosen ~0,
because at that time the hiding painted the crown hair in the inner tone; without the hiding flatten 0 -> 1: shot 2 top 0.777 ->
0.810, shot 3 whole frame 0.419 -> 0.433); (3) a re-fit without the hiding (`test/hood_structure_fit_I.json`): visor 0.14 -> 0.01,
muzzle 0.51 -> 0.56, fi1 40.5 -> 41.4, kfE 0.83 -> 0.88, fan L 0.80 -> 0.82.

**Result (item 2 -> item 3):**

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| whole-frame head / top / inner | 0.671 -> 0.667 / 0.594 -> 0.589 / 0.131 -> 0.142 | 0.724 -> 0.739 / 0.762 -> 0.810 / 0.241 -> 0.255 | 0.481 -> 0.433 / -- / 0.088 -> 0.030 |
| shell 0.2: head / inner / outer | 0.757 -> 0.752 / 0.100 -> 0.110 / 0.727 -> 0.731 | 0.805 -> 0.809 / 0.300 -> 0.311 / 0.812 -> 0.811 | 0.659 -> 0.548 / 0.079 -> 0.034 / 0.843 -> 0.826 |
| shell 0.55: head / inner / outer | 0.665 -> 0.666 / 0.094 -> 0.109 / 0.831 -> 0.835 | 0.777 -> 0.775 / 0.197 -> 0.227 / 0.786 -> 0.788 | 0.442 -> 0.408 / 0.059 -> 0.007 / 0.856 -> 0.849 |

In shot 3 the amount of dark is now like the sample's (near side: k16 656 px, sample 664; k20 714, sample 374 -- before 1852 and 2312), the hair
under the visor is bright. The shot 3 head IoU dropped -- this is an HONEST number: with the hiding removed, our crown hair shows where the sample
shows the visor. Camera test: 0.0000 px over camPath (49 frames) and orbit (37 frames); in the mock-up the hair does not poke through.

**Residual:** in shot 3 the crown is visible through the opening. One cloth cannot give both the hair raised above the forehead in shot 2 and
the visor covering the crown in shot 3. A physical candidate -- the visor dropping onto the forehead under its own weight when the head tilts (a pose-dependent corrective
shape); but even the best static shape for shot 3 alone gives only +0.05 -- not done.

## Pass 13 (item 4): the neck and the collar -- a tool error found

**In the sample (measured by lightness, 320x180, median 3):** under the chin, in all three shots, a very dark patch (L 0-9; the snow background
in the lower part of the frame is L 20-50): in shot 1 the "X" fold of the neck and the collar, in shot 2 the neck/collar straight down from the chin and on the left
the dark folds of the cloak, in shot 3 the collar under the chin.

**Tool error (PRIVATE target, `test/parts/human/part_target.py`):** the figure bit had been taken in shot 2 as only L 15..33 cloth, in shots 1/3 as L >= 6,
the inner bit as L >= 5 -- the darkest cloth and the neck (L < 15) were marked as BACKGROUND: 126-798 px in each frame, in shot 2
3610-3617 px. The fits in passes 12-13 were fitted to "background" under the chin (in shot 2 the lower front of our hood was pushed away
from that place). Fixed: in the lower part of the frame (y >= 110; the background there is L 20-50) patches with L < 15 (>= 20 px) touching the figure or the head
become figure, and those up to 28 px from the head -- inner. Old target: `part_target_12_old.json`. From this section on the numbers are on the new
target.

**Model:** the neck's size is now in `CLOTHES.neck` (rT, rB, z; the values did not change). Tests on the fixed target: a wider neck
(r 0.40-0.55) and further forward (z 0.1-0.15) -- it changes only in shot 1 and is worse (in shots 2 and 3 the neck is behind the lower front
part of the hood); opening up the lower part of the opening (fi4 60-70) -- worse; fitting the bottom of the opening + the neck ring + the neck + the top of the cloak
together (`test/hood_structure_fit_K.json`, 71 evaluations): F 16.009 -> 15.921 -- at noise level (~0.04 between pages), not written
into the source.

**Residual:** in shot 2 the sample's dark neck/collar under the chin is ~15 px in front of our dark boundary (ours has sky in that
place), in shot 3 the collar is L 0-9 in the sample, ours is cloak at L 20-29. The cause may be in the lighting: in ours the head does not cast shadow or AO
onto the hood/cloak (only the hood and the cloak are in the AO atlas), so the cloth under the chin does not darken in the head's shadow.

**The current state over the whole of pass 13 (on the fixed target; BEFORE = delivered 12, with its own SHADOW_BLACK hiding):**

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| whole-frame head / top | 0.664 -> 0.667 / 0.593 -> 0.589 | 0.655 -> 0.739 / 0.549 -> 0.810 | 0.495 -> 0.433 / -- |
| whole-frame inner | 0.093 -> 0.150 | 0.101 -> 0.136 | 0.084 -> 0.042 |
| shell 0.2: head / inner / outer / figure | 0.778 -> 0.752 / 0.111 -> 0.136 / 0.728 -> 0.731 / 0.898 -> 0.915 | 0.782 -> 0.809 / 0.232 -> 0.236 / 0.812 -> 0.811 / 0.918 -> 0.942 | 0.685 -> 0.548 / 0.084 -> 0.076 / 0.820 -> 0.826 / 0.810 -> 0.843 |
| shell 0.55: head / inner / outer | 0.661 -> 0.666 / 0.069 -> 0.110 / 0.797 -> 0.835 | 0.682 -> 0.775 / 0.048 -> 0.114 / 0.779 -> 0.788 | 0.439 -> 0.408 / 0.062 -> 0.047 / 0.848 -> 0.849 |

The head drop in shot 3 comes from removing the hiding (item 3): the shot 3 number in the BEFORE column came from painting the hair standing in the open
in the inner tone.

## Pass 13 (item 5): the camera last -- the shot 1 camera and pose to the new model; wrap-up -- `out/before-now-3d-13.gif`, `out/mockup-13.png`

The shot 1 camera had not been re-checked in pass 12 (only shots 2 and 3). Face target: Alonur's marks (R03, R10 --
the eyes, the nose tip, the mouth centre, the chin; `test/face13_s1.mjs`, PRIVATE) -- at the current camera/pose RMS 4.18 px (in frame 10 the far eye
6.6 px, the mouth 5.3 px; in frame 3 the chin 4.7 px too high). `test/fit_camera_structure.mjs --shot 1` (face + whole-frame classes + figure):
the camera almost in place (az +0.65, el -1.09 deg, d -0.05), a whole-shot pose addition -- tilt +0.077 (4.4 deg), turn -0.114
(6.5 deg): face RMS 4.18 -> 2.94 px (chin -4.7 -> -2.5, far eye -6.6 -> -3.9). The hood was re-fitted in the new pose
(`test/hood_structure_fit_L.json`: fi1 41.4 -> 35.1, fi2 63.6 -> 56.8, kfB 0.79 -> 1.02, kgB 0.04 -> 0.13, kfE 0.88 -> 0.81, muzzle 0.56 ->
0.68), then the shot 1 camera once more -- a local optimum (change < 0.02). The shot 2 and 3 cameras: +/-3 deg, +/-0.3 d,
+/-0.05 turn/tilt -- all worse (local optimum).

**Wrap-up (delivered 12 -> 13; on the fixed target; 12 with its own SHADOW_BLACK hiding and on the old shot 1 camera):**

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| whole-frame head IoU | 0.664 -> 0.717 | 0.655 -> 0.751 | 0.495 -> 0.478 |
| frame top (60 rows) head | 0.593 -> 0.678 | 0.549 -> 0.776 | -- |
| whole-frame inner IoU | 0.093 -> 0.140 | 0.101 -> 0.097 | 0.084 -> 0.053 |
| figure (soft) | 0.898 -> 0.908 | 0.918 -> 0.940 | 0.810 -> 0.852 |
| shell 0.2 agreement / shell 0.55 agreement | 0.799 -> 0.811 / 0.778 -> 0.798 | 0.855 -> 0.874 / 0.812 -> 0.837 | 0.721 -> 0.775 / 0.713 -> 0.743 |
| face RMS (Alonur's marks) | 4.18 -> 2.94 px | 2.50 (unchanged) | 4.03 (unchanged) |

Camera test (calibration PROVEN again): every part 0.0000 px over camPath (49 frames) and orbit (37 frames). In the mock-up the hair does not poke through.

**Residuals (with their causes):** in shot 1 the far-side brim stays a dark band to the right of the face contour (in the sample there is
sky there; the right-side dark 1703 -> 1635 px) -- one cloth can hide it only by breaking shots 2 and 3; in shot 3 the crown is visible through the opening
(in the sample it is under the visor); the collar shadow under the chin (the head casts no shadow/AO); in shot 2 the dark triangle shrinks
(shell inner 0.176 -> 0.116 in the item 5 re-fit; 0.132 in delivered 12).

## Pass 13 (item 6): a SAM 2 hair mask -- a new eye on the sample side -- `out/before-now-3d-13-hair.gif`, `out/mockup-13-hair.png`, `out/hair-sam2-13-overlay.png`

BEFORE = the wrap-up of pass 13 (item 5) (`frames-sample/anime-structure13f`, role `role-structure13f`), NOW = `frames-sample/anime-structureN` (role `role-structureN`).

**Mechanism (on Alonur's computer, RTX 3050 4 GB):** `Documents\Code-Video\` -- the machinery at the root, the projects separate:
`env\` (PyTorch CUDA 12.4 + Meta SAM 2 `sam2.1_hiera_small` + CoTracker3, once, ~3.5 GB; `setup.bat` -> `env\bootstrap.py`),
`tools\sam2_video.py` (shared: turns `frames\*.png` in the project folder into a video shot by shot and propagates the
point/mask prompts in `prompts.json`/`prompts.npz` forward AND backward; two runs: A -- only the first marked frame of each shot is a prompt
(the remaining marked frames are the test: not shown), B -- all of them (production); `output\masks_A.npz, masks_B.npz,
sheet_B_<object>.png, log.txt`), `Projects\personaj3d-sam2\` (PRIVATE data: 22 frames, prompts, Alonur's marks, `run.bat`).
A new project = `Projects\<name>\` + frames + prompts + a copy of `run.bat`; nothing to install. A run over 22 frames on the GPU takes 11 + 13 s.
Objects: `face` (points: the nose, the mouth, the chin, the eye line, and points 35 % inward from the jaw marks are positive; 8 hair points
and the inner centre negative), `head` / `interior` / `garment` / `dark` (mask prompts -- from our bit1/bit2/figure/neck masks),
`hair` = `head` minus `face` (derived). Here (the workspace) there is only a copy of the result: `private/test/parts/human/sam2_masks_{A,B}.npz`, `sam2_log.txt`
(PRIVATE, does not go into the repo).

**Calibration (run 5, against Alonur's marks and our masks; A -- the frames not shown):**

| | prompt frames (k03, k12, k20) | not shown k10 / k13 (A) | shot 3 not shown k14 / k17 / k22 |
|---|---|---|---|
| face: jaw+chin points to the mask edge, median px (+ inside) | -1 / 0 / +1 | -1 / -1 | +1 / +1 / -1 |
| head mask IoU to our bit1 | 0.999 (this is the prompt) | 0.951 / 0.981 | 0.928 / 0.880 / 0.878 |
| inner mask IoU to our bit2 | 0.99 | 0.78 / 0.95 | 0.64 / 0.69 / 0.80 |
| Alonur's hair points inside SAM's hair | 79 % / 100 % / 31 % | 81 % / 41 % | 36 % / 22 % / 44 % |

The farthest of the jaw points (-7 .. -17 px) are all on the NEAR side, under the hanging strand (Alonur marked the jaw through the hair;
SAM calls that pixel hair) -- not an error. In run 4 SAM's face had dropped the cheek in shadow (jaw points down to -28 px), and
the derived hair was polluted with skin in shadow and the neck; run 5 (positive points inside the jaw) fixed it.

**Why SAM (not lightness), measured:** in shot 3 hair in shadow is L ~47 (p50) and skin in shadow L ~43 -- they do not separate by lightness;
in shots 1-2 Alonur's hair points are 78-100 % inside SAM's hair, while our bit8 (lit skin, by lightness) had taken most of those points
as SKIN (R10: 13 of 27). **Limit (measured):** in shot 3 (the head tilted) the forehead strands fall over the face
and SAM's face takes them too -- Alonur's hair points are R14 54 %, R17 52 %, R20 31 % inside SAM's FACE (0-22 % in shots 1-2); our
bit8 had also called these strands skin (R14: 22 of 39). They cannot be separated -> SAM's face (bit32) is excluded from the hair comparison.

**Target (`test/parts/human/sam2_hair.py` -> `part_target_12.json`):** bit16 = SAM hair (run 5 B), bit32 = SAM face (not counted in
the hair IoU). The part of SAM's hair outside our head mask (bit1) was kept: 0-2 px in the prompt frames, 60-390 px in the rest --
mostly side strands in shadow (k06, k14: bit1 had lost them with its L >= 40 threshold), in k18 a small leak onto the hood cloth at the top.

**Tool (`src/main.js hoodStructureScore`, `test/fit_hood_structure.mjs --wsF --wsY`):** hair IoU (sample bit16 vs our role green, bit32
not counted) and "hair over the face" (our hair on the hairless part of SAM's face, a fraction; a penalty in shots 1-2 -- in shot 3 the sample itself has
strands over the face). The same parameters give the same number (5 times, 0.000 difference); one strand's azimuth +1 deg -> hair IoU 0.007
(a strand is 1-2 px wide -- the tool's "noise floor" is ~0.01).

**Fitted (one world; `hood_structure_fit_M` with hair penalty 3, then `_N` with penalty 10, `_N` into the source):** the fan (L, HK, swing0/1, flatten),
the face-side strands (az0, az1, dAz, en, off, y0, y1), and in M also the opening top (openV0 0.037 -> 0.030) and the muzzle (0.68 -> 0.70):

| | 13 (item 5) | 13 (item 6, N) |
|---|---|---|
| face side: top azimuth az0 / extra at the bottom dAz | 26.9 deg / 27.3 deg | 22.6 deg / 37.9 deg |
| face side: width en / offset from the surface off / root y0 / tip y1 | 0.49 / 0.084 / 0.53 / -0.76 | 0.62 / 0.110 / 0.28 / -0.80 |
| fan L / HK / swing0 / swing1 / flatten | 0.82 / 1.11 / 0.23 / 0.97 / 1.00 | 0.99 / 0.91 / 0.39 / 0.94 / 0.96 |

**Result (the same tools; the fit page / render (`structure_measure`, `frame_score`) ):**

| | shot 1 | shot 2 | shot 3 |
|---|---|---|---|
| hair IoU (SAM bit16, face not counted), fit page | 0.381 -> 0.494 | 0.526 -> 0.586 | 0.358 -> 0.393 |
| hair IoU, render | 0.403 -> 0.498 | 0.526 -> 0.585 | 0.399 -> 0.429 |
| hair over the face (hairless part of SAM's face, fraction) | 0.032 -> 0.041 | 0.078 -> 0.101 | 0.074 -> 0.095 (no penalty) |
| whole-frame head IoU, fit page | 0.717 -> 0.738 | 0.751 -> 0.760 | 0.478 -> 0.500 |
| frame top (60 rows) head | 0.678 -> 0.705 | 0.776 -> 0.781 | -- |
| whole-frame inner IoU | 0.140 -> 0.147 | 0.097 -> 0.114 | 0.053 -> 0.052 |
| figure (soft) | 0.908 -> 0.907 | 0.940 -> 0.939 | 0.852 -> 0.850 |
| shell 0.2 head / shell 0.55 head (render) | 0.772 -> 0.772 / 0.706 -> 0.734 | 0.832 -> 0.820 / 0.751 -> 0.778 | 0.621 -> 0.621 / 0.432 -> 0.471 |
| Alonur's 182 hair points that land on hair in our render | 17 % -> 26 % (R03 0 -> 4 / 24, R10 8 -> 13 / 27) | | |

M (penalty 3) takes more hair (0.535 / 0.607 / 0.404) but more of it over the face (0.069 / 0.124); N was chosen (the error of pass 10
-- the near strand moves onto the face when the head turns -- starts right here). Camera test (`test/camera_test9.mjs`, calibration
PROVEN): every part 0.00 px over camPath (49 frames) and orbit (37 frames). In the mock-up (`out/mockup-13-hair.png`) the hair does not poke through the cloth.
Face RMS unchanged (the camera/pose was not touched).

**Residual (a 2D drawing, measured -- the `src/personaj.js` HAIR.faceside comment):** in shot 1 (3/4) the near strand lies OVER the cheek, up to
7-15 px from the near eye (R03: hair x 62-90, eye x 97); in shot 2 (profile) the same strand is 20-40 px BEHIND the eye (R12: hair x 96-117, eye x 138),
the front of the cheek is clear. Pinhole-camera reckoning: a rigid point that reaches 7 px from the eye at 3/4 (head azimuth ~35-45 deg) falls in profile
in front of the eye (off 0) or in front of the nose (off 0.5-1) -- one rigid strand cannot give both; even with penalty 10 the fit
took the middle (az0 21.6 -> 22.6 deg). The remaining difference: in shot 1 the near-upper side of the opening (our hair comes out of the hood there,
in the sample it is hood; item 1's residual); in shot 3 SAM hair's 0.43 IoU -- the bright crown under the visor in the sample is missing in ours (item 3).

**Use of Alonur's marks (hair, PRIVATE):** R03, R10, R12, R13, R14, R17, R20, R22 -- 182 hair points; in this pass only
for checking (how many of them SAM and our render take), they did not enter the fit (a point is not a line, it does not suit IoU).

## Open (after pass 12)

1. ~~**The hair on top and the hood**~~ -- see pass 13 (item 1); residual: in shot 1 the near-upper side of the opening, in shot 3
   the forehead strands in front of the visor.
2. **The dark triangle:** see pass 13 (item 2) -- the opening under the chin is narrower; the excess dark in shot 3 was resolved
   in item 3 (the hood-shadow hiding was removed); residual: in shot 1 the far-side brim -- in item 5 the shot 1 camera/pose
   was re-checked, it does not explain this residual (the right-side dark 1703 -> 1635 px).
3. **Shot 3:** see pass 13 (item 3) -- the hair under the visor is now bright (the hiding was removed); residual: the crown is visible through
   the opening (in the sample it is under the visor).
4. The hood is very wide (side half-width 1.88 head units) -- the sample's three views (az 45-64 deg in head space) do not constrain the pure
   side: from 90 deg the face stays behind the brim. Pass 13 (item 2): narrowing (wideX 1.0, R0 1.4) is worse in all three shots --
   the measurement does not call for changing the width.
5. From the previous list: the neck (pass 13 item 4: the target was fixed; residual -- the collar shadow under the chin, the head casts no shadow/AO), the brow detector, the snow (continuity across the cut, density), no hands, `ink`/
   `watercolour` not checked with the new hood, no sound.
6. **Hair (SAM 2 mask, pass 13 item 6):** hair IoU 0.49 / 0.59 / 0.43 -- the residual is 2D: the near strand is over the cheek at 3/4, behind
   the eye in profile (one rigid strand cannot give both); in shot 3 the crown under the visor. Next: bring Alonur's hair points into the fit
   as lines (the strand axis); SAM with CoTracker3 (the motion of the strand tips -- for the physics swing/shK).
