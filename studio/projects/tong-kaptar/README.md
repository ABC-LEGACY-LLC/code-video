# Tong · kaptar

A 21.0 s film drawn in Canvas 2D from code: at dawn, on a Tashkent rooftop, a boy throws a
pigeon up to join the flock, and the flock comes back down. Five shots; edit B is 504 frames at
24 fps, 1280×720. No image files and no 3D model: every frame is drawn by the code in `src/`.

The sound (v3) is synthesized offline from the picture's own state and checked with measuring
tools. Alonur approved v3 on 2026-09-27. Music has not been started.

The project card is `catalog/cards/6-tong-kaptar.json` (counted and measured by the repo's
own tools, like the other five).

## Layout

| path | what |
|---|---|
| `scene.html`, `src/` | the picture. Shot 1 is in `frame.js`, shots 2–5 in `shot2.js` … `shot5.js`; the sky, town, pigeon, boy and props each have their own file. The page exposes `renderFrame(i[, layer])` and `setShot('s1'…'s5')` for a shot's own frames, and the studio's contract over the film: `__frameTo(n)` is frame n of edit B (`src/edit.js`) |
| `render.mjs` | frames to PNG: `SHOT=s3 node render.mjs all frames/s3`, or a list `0,12,24` |
| `make_film.sh` | the whole picture of edit B from source → `sound/out/picture.mp4` |
| `audit/film/filmB.json` | edit B: which frames of which shot, the whip pan from shot 1 to 2, the fades. `filmB_frames.json` is the same edit reading `frames/`. `audit/assemble.py` builds it |
| `sound/` | `probe.js` + `scan.mjs` read every cause of a sound from the picture (→ `scan.json`); `synth.py` makes the stems; `mix.py` + `mix.json` the master; `dsp.py`; `lab.py` is a bench for single sounds; `SOURCES.md` says where each number comes from and which are choices |
| `sound/out/v2/` | the previous sound, v2, as an archive: its synth, mix, event log and page, and the film with v2 audio |
| `audit/sound/` | the sound's checks: `sound_check.py` (SYNC, BEAT, MOTOR, EAR, MIX, CUTS, SILENCE), `ear.py` (AudioSet tagger), `ear_compare.py` (two versions side by side), `measure.py`, `spec.py`, `calibrate.py`, `metrics.py`. Reports: `check_v3.txt`, `measure_v3.txt`, `ear_compare.json` (v2 → v3) |
| `out/sound_page/` | the review page: `page.src.html` + `build.py` → `index.html`. The film, each sound group solo or muted, its accents on a timeline, V switches v2/v3, M marks a moment |
| `audit/` (the rest) | picture audits from the making: per-frame scans, determinism, overlays, head and neck construction, the flock, the rag, the landing |
| `proto/`, `test/` | early prototypes and tests (scripts only) |
| `history/` | earlier states of the picture code (see its README) |

## Setup (Linux)

```bash
cd tong-kaptar
npm i                                    # playwright 1.56.0: the version the film was rendered with
npx playwright install --with-deps chromium
pip install -r requirements.txt          # Python 3.11
sudo apt install ffmpeg
git clone https://github.com/fschmid56/EfficientAT tools/EfficientAT
git -C tools/EfficientAT checkout a425fdce92572e602a1d5634799bd9f1f2efa806
```

The tagger downloads its weights (`mn40_as_ext_mAP_487.pt`, 274 MB, from that repo's GitHub
release) into `tools/EfficientAT/resources/` the first time `ear.py` runs.

Keep Playwright pinned: frames are compared pixel for pixel, and another Chromium can draw the
same canvas with different antialiasing.

## Run

Times are the ones measured on the machine this was made on.

| step | command | time | writes |
|---|---|---|---|
| picture | `./make_film.sh` | 18 min | `frames/`, `sound/out/picture.mp4` |
| sound probe | `node sound/scan.mjs` | 19 s | `sound/scan.json` |
| stems | `python3 sound/synth.py` | 22 s | `sound/out/stems/`, `sound/out/events.json` |
| mix | `python3 sound/mix.py` | 5 s | `sound/out/master.wav`, `sound/out/mixed/` |
| check | `python3 audit/sound/sound_check.py` | 54 s | table, `audit/sound/check_report.json` |
| measure | `python3 audit/sound/measure.py` | 10 s | report on stdout |
| page | `python3 out/sound_page/build.py` | 5 s | `out/sound_page/index.html`, MP3s, `film.mp4` |

The page fetches its MP3s, so serve it rather than opening the file:
`python3 -m http.server -d out/sound_page 8000`. On claude.ai the page stores marks in the
artifact's database; served anywhere else it keeps them in the page and offers them as text to
copy.

The picture step is only needed for the page's film; the sound reads the picture through
`scan.mjs`, not through rendered frames. Without `picture.mp4`, `build.py` puts the sound under
the v2 film's picture, which is the same picture.

## Expected check result

`sound_check.py`: **45 pass, 8 warn, 1 fail, 5 info.**

- FAIL — EAR, shot 1 coo: the tagger's best right class is Bird 0.03 (rank 15), its worst wrong
  one Cat 0.22.
- WARN — EAR on the shot 2 and 5 coos, the shot 2 flock wings and the shot 5 landing (best right
  class Rustle 0.04, under Music), the flag, and the town in shots 1–2 and 5 (Wind against White
  noise); BEAT on the white one's braking in shot 5 (rhythm 7.01 Hz against the drawn 8.39 Hz).

## Verified from a clean unzip (2026-10-04)

Unpacked into an empty folder and run exactly as above:

- `make_film.sh`: all 504 frames of edit B identical to the frames the review film was cut from
  (0 differing pixels);
- `scan.json`, all 12 stems, `events.json`, the mixed stems and `master.wav`: byte-identical;
- `sound_check.py`: the same report, tagger probabilities included; `measure.py`: identical to
  `measure_v3.txt`;
- `build.py` on the v2 film's picture: `index.html`, `data.json`, the 7 MP3s and `film.mp4`
  byte-identical to the published page's.

## Open — not done

- **Music**: not started.
- **Coo**: no synthesized coo has been named a pigeon by the tagger (v2's read "theremin", v3's
  shot 1 coo reads "cat"). The **town** reads as wind and white noise: a synthesized wash carries
  no town.
- **Wings**: the tagger cannot certify them. Its right classes stay low (Rustle 0.04) even where
  the timing checks (SYNC, BEAT, MOTOR) pass.
- **Brightness**: v3 is sharper than v2 in every shot (s1 1.80 → 1.99, s3 1.60 → 1.88,
  s5 2.04 → 2.23, `measure_v2.txt` against `measure_v3.txt`). Whether that is too bright is a
  listener's call.
- **Real recordings** of the sources (a pigeon's take-off and wing claps, a flock passing, a coo,
  a distant town) are what would let the tagger be calibrated on right answers, not only wrong ones.
- **Picture**: the whip from shot 1 to 2 is a pan across the two frames made in assembly
  (`assemble.py`), not a camera move in the scene; the pushes in shots 4 and 5 have no motion blur;
  no delivery export yet (the review encodes' settings were not recorded; `make_film.sh` uses
  x264 CRF 18).

## Next version of the sound

1. Keep v3's mixed stems before changing anything: `cp -r sound/out/mixed sound/out/v3_mixed`.
2. Change `synth.py` / `mix.json`, then `synth.py` → `mix.py` → `sound_check.py` → `measure.py`.
3. `python3 audit/sound/ear_compare.py sound/out/v3_mixed sound/out/mixed` for the tagger's
   before/after. It rewrites `ear_compare.json`, which the page shows under "2 → 3": change that
   heading in `page.src.html`, and move v3's MP3s into the page's `v2/` slot, before `build.py`.

The method is the `media-sound-check` skill (`.claude/skills/media-sound-check/` at the repo root).

## In the studio

`src/edit.js` draws edit B in the page: which shot frame stands at each of the 504 film frames, the
whip pan from shot 1 to 2 and the fades, with `assemble.py`'s arithmetic (smoothstep easing, linear
light, the pan smeared along its motion) written for a canvas. So the studio scrubs the film,
shows its shots, joins and fades on the timeline, and exports it from the browser. A frame is
drawn, not played: a shot frame takes from a tenth of a second to several (the slow-motion shot),
so the studio's Play draws the next frame as soon as the last is done. The studio's export is
silent: the sound is made in Python, outside the browser.

`npm run audit` (or `make audit-tong-kaptar` at the root) holds the page to the master:

| check | what |
|---|---|
| `tong-kaptar/edit-is-the-master` | `EDIT_B` in `src/edit.js` against `audit/film/filmB_frames.json`, every shot, join and fade |
| `tong-kaptar/film-frames-are-shot-frames` | a film frame from four shots is pixel for pixel its shot's own frame |
| `tong-kaptar/fades-from-black` | the first and last frames are near black against the picture they fade from |

## Not in git

`.gitignore` keeps rendered media out, as the rest of the repo does. Two things in the zip cannot
be rebuilt exactly from this source, so keep the zip: `sound/out/v2/film_v2.mp4` (the review film
with v2 audio) and `out/sound_page/v2/*.mp3` (v2's layers for the page's V switch: `ambience`,
`wings`, `landing`, `coo`, `rag`, `boy`, `camera`). v2's mixed stems were not kept, and `mix.py`
has changed since v2. The v2 layer MP3s kept in `code-video-v2.zip` still carry the old Uzbek group
names (`muhit.mp3` → `ambience.mp3`, `qanot` → `wings`, `qonish` → `landing`, `ku` → `coo`,
`latta` → `rag`, `bola` → `boy`, `kamera` → `camera`) and must be renamed when copied into
`out/sound_page/v2/`.
