# Skills — for this project (code-video) only

The instructions the work in this repository was done under live here: **`.claude/skills/`**
(Claude Code reads them as project skills, inside this repository only). These files are the
source.

| skill | version | what it does |
|---|---|---|
| [`media-audit-reality`](../.claude/skills/media-audit-reality/SKILL.md) | 1.3.0 | checks a produced film, picture or sound against reality by measurement, not by eye and ear. Oq Ko'cha's checks and the catalog's grew out of it: every check carries its own deliberately broken case, and if it cannot prove itself it is `UNPROVEN` |
| [`code-audit-structure-scale`](../.claude/skills/code-audit-structure-scale/SKILL.md) | 1.0.1 | whether a grown source should be restructured: blast radius, a synthetic scale test, the cost to the machine and to the author |
| [`media-match-reference`](../.claude/skills/media-match-reference/SKILL.md) | 1.4.1 | brings a code-drawn animation toward a sample clip frame by frame, by measurement; its tool is [`tools/compare/`](../tools/compare/), the method and findings [`tools/compare/METHOD.md`](../tools/compare/METHOD.md) |
| [`media-staging-audit`](../.claude/skills/media-staging-audit/SKILL.md) | 1.1.0 | the staging before the details: what each shot does, where it looks, where the camera is (in 3D; one view gives only the relative direction), contour rows, checked on the render |
| [`media-sound-check`](../.claude/skills/media-sound-check/SKILL.md) | 1.0.0 | builds a film's synthesized soundtrack from the picture's own state and checks it with calibrated tools (sync, beat fold, motor, an AudioSet tagger, mix, cuts), with an A/B page and marks; made on Tong kaptar |
| [`media-3d-consistency-audit`](../.claude/skills/media-3d-consistency-audit/SKILL.md) | 1.0.0 | finds "2D thinking inside 3D" when a 3D model is fitted to a drawn sample: shape, place or background tied to a shot, a view angle or a frame; a calibrated test where only the camera moves; one world fitted to all shots together instead of a patch per shot |

## The boundary

These skills are **not part of the abc UX-audit family** (`github.com/AlonurKomilov/skills`, the
`ux-audit-*` skills for web and dashboard projects). They are not added there, not written into its
README or taxonomy, and the skills there are not changed from here. The boundary is written at the
top of every SKILL.md.

Why: when one family's files carry another project's facts, someone working with that family can
read them as right and change their own right facts into wrong ones.

## Versions

- `media-match-reference` 1.4.1 — content unchanged; its tool moved to `tools/compare/` and speaks
  English now: `calibrate`, `probe`, `sheet --rows sample,before,ours,overlay`, the `note` field, and
  the method in `METHOD.md`.
- `media-sound-check` 1.0.0 — new. `media-match-reference` 1.4.0 gains "When the drawings differ".
- `media-3d-consistency-audit` 1.0.0 — new (personaj3d pass 9, step 1). Six patches gathered over
  eight passes (eye card, lower-face shift, hair blend, per-shot hood, snow stuck to the camera,
  background "top"); a test where only the camera moves (pose and time held; calibration: with the
  patches frozen 0.0000 px, an artificial shift is the independent camera model itself) — the hood
  jumps 114 / 159 px, the eye 33 / 36 px, the snow travels 138 px with the camera; the suspected
  cause in the snow box was tested and not confirmed.
- `media-staging-audit` 1.1.0 — sections 4 and 6: a view-dependent drawing method and a 2D
  background layer are now MEASURED, not built into the 3D model (1.0.0's eye card and background
  "top" slid and jumped in the camera test); a link to `media-3d-consistency-audit`.
- `media-staging-audit` 1.0.0 — new (pass 5: staging first).
- `media-match-reference` 1.4.0 — "parts apart: the bare model first, then the layers" (a list,
  calibration on our side, model trace = render, the pose swallows the shape, a main shot plus a
  do-not-get-worse penalty, overlapping masks) (pass 10).
- `media-match-reference` 1.3.0 — the section "a 3D model is fitted to all shots together, not shot
  by shot" and a link to `media-3d-consistency-audit`.
- `media-match-reference` 1.2.0 — camera and physics: the camera is read first, then contact and
  weight constrain the model; the centre of a partly occluded mass is not a place.
- `media-match-reference` 1.1.0 — the optimizer breaks what it does not see (the hair pass).
- `media-audit-reality` 1.3.0 — three additions from pass 10: ids in a document of many frames
  are per frame (a repeated clip id); see what each probe touched; a held image does not jitter
  (with one seed too), and the real secondary motion in a held place is seen by a difference map,
  not a median. Its heading is now bound to this project (it was written to the abc family before).
- `code-audit-structure-scale` 1.0.1 — content unchanged; only its scope (this project) and the
  pointer to the source were fixed.
- `media-match-reference` 1.0.1 — "before" has to be the delivered file itself: pass 10's "before"
  folder was a re-render and carried the new head placement. The result numbers were measured
  again against the delivered pass 9 (silhouette 0.71 → 0.87, figure map 0.89 → 0.95); 1.0.0's
  "0.86" error was corrected.
- `media-match-reference` 1.0.0 — new.

The copies in the Claude account are loaded from these files; where they differ, the one here is
right.
