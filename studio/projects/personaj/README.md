# personaj

The earlier, 2D version of the hooded figure in the night snow (an archive): SVG drawings with canvas snow, drawn
frame by frame and measured against the same sample clip up to pass 12. `../personaj3d` is its 3D continuation; it
keeps using this work's 2D renders as its "before" side and imports two of its measurement modules
(`test/composition.py`, `test/tone_class.py`).

- `sheet.mjs` holds the 22 frames' values (pose, placement, hood, hair, timing); `images.mjs` assembles each frame's
  SVG from `portrait2.mjs`, `face.mjs` and `head.mjs`; `film.mjs` writes `film.html` (the 22 frames, the black overlay
  and the canvas snow) and `view3.mjs` captures it into `ff/00.png .. 21.png`.
- Generated pages, kept because they are what was delivered: `film.html` (`film.mjs`), `frame.html` (`frame.mjs`),
  `grid.html` (`grid.mjs`), `head.html` (`head-view.mjs`), `model-sheet.html` (`model-sheet.mjs`). `p1.html`,
  `v1.html` .. `v3.html` are the first hand-made versions.
- `test/`: the measurement and tuning tools of the passes. They use this repository's `tools/compare/` with the
  project config `compare.json` (sample: `../personaj3d/private/sample/k%02d.png`, ours: `ff/%02d.png`) and the head
  transforms in `compare-transform.json` (written by `compare-transform.mjs`).

```
npm install
node film.mjs                  # -> film.html
node view3.mjs                 # -> ff/00.png .. 21.png  (OUT=folder to write elsewhere)
python3 test/tone_class.py --calibrate
```

The page tools launch Chromium through `chrome.mjs` (`$PERSONAJ_CHROME`, else the newest installed Playwright
Chromium). The Python tools read the sample frames from `../personaj3d/private/sample/` (private, never in git; see
`../personaj3d/README.md`, "Private files"). Several of them compare with renders of earlier passes (`ff-9t/`,
`ff-10/`, `ff-10t/`, `ff-11t/`, `ff-12t/`, ...), which are not kept: those renders were made from earlier states of
the code. `test/focus.py`, `test/hair3-fit.py` and `test/hood3-measure.py` also need opencv or `cma`.

The work came from the old workspace (code-video v2) on 2026-10-05 and was translated from Uzbek into English
without changing what it computes, together with personaj3d (names: `bosh` -> `head`, `yuz` -> `face`, `varaq` ->
`sheet`, `tasvirlar` -> `images`, `portret` -> `portrait`, `kadr` -> `frame`, `kor` -> `view`, `taqqos` ->
`compare`, ...; in the old comments "N-kadr" meant shot N). The generated `film.html` is the same drawing as before
(markup and numbers equal, names renamed one to one), and every frame `view3.mjs` captures equals one of the
original layout's own captures (the capture of the SVG filters is not deterministic from run to run).
