---
name: "media-3d-consistency-audit"
description: "code-video project only: catch 2D thinking inside a 3D model matched to a drawn reference (shapes, feature placement, cloth or background keyed to shot, view angle or frame) with a calibrated camera-only test, then replace each patch with one world fitted jointly to all shots."
---

# Media 3D Consistency Audit

> **code-video project skill · `media-3d-consistency-audit` v1.0.0**
> Scope: the code-video repository only — code-built 3D animation brought toward a 2D (drawn) reference clip. Not part of the abc UX-audit skill family (github.com/AlonurKomilov/skills): do not use it for web or dashboard work, and do not add it to that repository.
> Source of truth: `.claude/skills/media-3d-consistency-audit/SKILL.md` in <https://github.com/AlonurKomilov/code-video>.
> Pairs with `media-staging-audit` (where the camera is), `media-match-reference` (measuring against the clip) and `media-audit-reality` (would it be true in the world). Run it whenever a 3D model is fitted to a drawn reference shot by shot — before per-shot fixes pile up, and after every round.

Use it when:
- a 3D scene is being matched to a drawn clip, shot by shot, and each shot's numbers keep improving;
- the reviewer says some version of "if the camera moves, it will be in the wrong place" — a statement about the model that no per-shot number can confirm or refute;
- any value that changes a shape, a feature's place on a surface, cloth, hair or the background is read from the shot index, the camera or the frame number;
- two measurements of one shot disagree (the camera distance that fits the face is not the one that fits the silhouette).

**Rule: one world, one model — only the camera belongs to the shot.** Position, orientation, field of view and lens shift are per shot. Everything else is constant, or a function of time (animation, physics), or a function of the pose (a rig's corrective shapes). Nothing that changes geometry or the background may depend on which shot it is or where the camera stands. Then putting the camera at each reference position gives the reference, and any camera in between still gives a true picture. What the one model cannot reproduce is a residual: measured and reported, never hidden in a per-shot patch.

## 1. How 2D thinking gets into a 3D project

Each shot of a drawn clip is its own drawing. When a 3D model is fitted to it shot by shot, every optimiser may use every free parameter, and shape parameters are usually cheaper than the camera. Each fix improves its own shot and looks like progress. Over eight passes of one project these accumulated:

| patch | keyed by | what it did | the measurement that justified it |
|---|---|---|---|
| near-eye drawing chart | view angle in head space (46→84°), per shot | slid the eye drawing along the face | reference profile eye 17.5 px (0.6 head units) behind and 5 px above a rigid head's eye |
| lower-face push | frame (shot 1, frames 7–11: 0.15, 0.3) | morphed the head between two shapes | reference drew the jaw ahead of the eye in a fast turn; contour −2.8 → −0.9 px |
| hair rest-shape blend | view angle (70→84°) | blended near locks between a 3/4 and a profile rest shape | with the 3/4 rest shape, near locks fell across the cheek as the head turned toward profile (shot 1, frames 10–11); in the reference the hair stays behind the cheek |
| hood per shot | shot index (+ a per-shot follow factor) | three different hood geometries, rebuilt at each cut | visible-head IoU 0.41/0.49/0.23 → 0.81/0.62/0.69 |
| snow layer | camera | snow carried with the camera, rescaled per shot | continuity across cuts r 0.12/0.03 → 0.88/0.83 (reference 0.71/0.69) |
| sky "up" | camera pitch | background gradient tilted by the camera's extra pitch | a camera 30° below turned the background into black sky |

None is visible in a single shot. All break once the camera moves (section 3).

Before accepting any patch, look for the 3D cause — and test it, because a plausible cause is a guess too. Shot 2's snow came out denser than shot 1's (+51 % at the first camera distance, +21 % at the corrected one: 235 against 195 particles per 10 000 px) — "the camera moved away". The snow box ended at z 7 and shot 2's camera stood at z 10.2, outside it, while the other two stood inside (z 5.7 and 5.0): a neat explanation. Enlarging the box to enclose every camera at the same density changed nothing — 245 against 195 and 186. The cause is elsewhere and still open; the camera-carried layer had only hidden it.

## 2. Inventory: every value read from shot, view or frame

Search the code for everything that reads the shot index, the camera (position or direction in object space, `atan2` of the view direction, camera matrices outside the projection) or the frame number (tables that are not motion). Classify each:

| class | examples | verdict |
|---|---|---|
| camera | position, orientation, fov, lens shift | per shot — correct |
| time | animation curves, blinks, running tears, physics steps, wind | correct if the world could do it |
| pose | corrective shapes driven by joint angles; cloth that follows the head by a fraction | correct — a function of the pose, not of the view |
| view or shot → geometry | a feature chart driven by view angle, a hair blend by view angle, a hood per shot | patch |
| frame → shape that is not motion | the lower-face push above: it exists because the reference drew the jaw ahead in those frames | patch |
| view → background | a layer carried by the camera, a gradient tilted by camera pitch | patch |

The test behind every verdict: would the object do this if nobody were looking? Shading that uses the view direction (rim light, Fresnel) is fine: it is a function of geometry, light and eye, as in the world.

## 3. The camera-only test

Hold the pose and the time (wind, particles, physics reset to the same state every frame). Move only the camera:
- **a path** through every reference camera: interpolate azimuth, elevation, distance, fov and lens shift, about 1° per step. Values keyed to a shot exist only at the reference cameras; between them take the nearest key — that is what the code would have to do;
- **an orbit** around the subject, 10° steps, with the view-driven rules active.

Read the world, not the picture. From the scene graph take sample points of every part in world space: surface vertices, the points of a drawn feature's chart, hair chain points, cloth vertices, particle positions after any layer transform; and the background's "up" vector. For each frame project the current points and the frame-0 points with the CURRENT camera: the distance is how far the part is from where a rigid 3D part would be. Project the previous frame's points too: that distance is the step change — a pop is one large step, a slide a run of steady steps. Report at the working size, per part: median and maximum (a local change such as a jaw hides under a median).

Calibrate before believing it:
- **Known good:** freeze every camera- or shot-dependent value you know of at frame 0. The instrument must read 0.0000 px on every part. If it does not, something you did not list depends on the camera — the test doubles as a completeness check of the inventory. Ours read 0.0000 px on both paths (49 + 37 frames).
- **Known bad:** move one part by a known world offset from frame N. The reading must equal an independent pinhole model written without the renderer, as one step at N and zero elsewhere. Ours matched to 0.000 %. Its first run read 2.27 px against 3.77: the offset had been applied in the character's local frame, whose root is rotated 90° — the test's error, not the instrument's. Check the test, too.

Result on the model with the six patches (path ~1.2° per step; px at 320×180):

| part | path between the reference cameras | orbit |
|---|---|---|
| hood | pops 114 / 159 px (largest point) at the two key switches, then 29 / 23 px median off rigid | 0 (one hood) |
| near eye | pops 33 / 36 px | slides up to 38 px along the face |
| head surface | pops 5.3 px (push 0.3 → 0) | 0 |
| hair | up to 18 px per step while the camera crosses 70–84° in head space | up to 98 px |
| snow | 10 px per step with the camera, 138 px at the last key | up to 398 px — no parallax |
| sky "up" | tilted 22° at the shot-3 camera | 0 (same pitch) |
| neck, cloak, inner hair | 0.00 | 0.00 |

Show it, because the reviewer judges motion: a GIF of the path and the orbit, the current model beside the same model with the patches frozen, per-part numbers and a POP flag burned into each frame.

## 4. Cross-shot contradictions are measurements

When two measurements of one shot imply different cameras or sizes, the model's proportions differ from the reference's. In shot 2 the face fit put the camera at distance 12.88, the figure and visible-head silhouettes at 10.32; at 10.32 the profile face is 1.25× the reference's (front contour 10–16 px ahead). One shot has one camera. Fit it to the big masses first, then change the MODEL (here the face against the head) until the small features agree in all shots together — or report the residual. Never a camera per feature, never a size per shot.

## 5. Replace each patch with one world

- **One joint fit.** Shared shape parameters, one camera per shot, all shots in one objective (a weighted sum of the per-shot losses). The per-shot fits are only starting points. Every shot's number will drop below its own per-shot optimum; report the drop per shot as the price of consistency. It is a temporary regression, not a failure — say so before the reviewer finds it.
- **Real differences between shots become time or pose.** A hood that lies differently because the head bowed is a pose-driven deformation or cloth physics, fitted as a function of the pose across all shots. If two shots with nearly the same pose need very different hoods, that is the reference redrawing per shot — a residual, not a pose rule to invent.
- **A feature the reference moves by view** gets one 3D place, fitted to all views at once; the leftover between the 3/4 and the profile position is the residual, not a sliding chart.
- **Volumes enclose every camera.** Make the particle volume large enough that every camera, plus the near-fade distance, is inside it, with uniform density where the cameras look. Then compare the per-shot statistics: a difference that remains has another cause, to be found — not a reason for a layer.
- **Background in the world.** One sky dome with one world gradient, fitted to the backgrounds of all shots under their own cameras. A gradient that has to turn with the camera is a residual to report.
- **Keep the instrument in the loop.** After each removal, measure all shots together and run the camera-only test; the removed patch's part must read 0.

## 6. Some reference properties are 2D-production artifacts

A drawn clip can hold things no single 3D world makes. In ours: the snow continued across the cuts (phase correlation r 0.71 / 0.69) while the camera jumped about 29° in azimuth; the background density gradient was the same in all shots (11.7→35.4, 12.5→37.6, 10.4→34.0 per 1000 px²) while the camera's pitch changed by 22°; the profile eye sat 0.6 head units behind the 3/4 eye. Measure how far the one-world model stays from each, list them as residuals with their cause, and let the owner decide. The default is the 3D world and the residual. If the owner wants a 2D effect kept, it is a labeled compositing layer in screen space after the render, named and documented as not part of the world — never a camera-keyed change inside the model.

## 7. Deliver

- The inventory with a verdict per value (section 2).
- The camera-only test: calibration lines, the per-part table, the GIF.
- Per removed patch: all-shot numbers before → after, including every drop; the camera-only reading of that part (must be 0); what remains as residual and why.
- The project card updated with the residuals that are properties of the reference.

Reference implementation (`personaj3d`): `test/kamera_sinov9.mjs` (camera-only test; `--kalibr`), `src/film.js` (`kamYol` path and `orbita` test films, nearest-key rule), `src/main.js` (`window.obyekt` world sample points, `window.proj`, `?vaqt=` hold time, `?yamoq=0` freeze, `?suniy=` known displacement), `test/sinov9_varaq.py` (sheet and GIF).

<!-- SSOT: github.com/AlonurKomilov/code-video/.claude/skills/media-3d-consistency-audit -->
