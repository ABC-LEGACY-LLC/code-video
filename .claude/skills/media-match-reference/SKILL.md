---
name: "media-match-reference"
description: "code-video project only: bring a code-drawn animation toward a reference clip by measurement, frame by frame: the same code on both sides at one working size, calibrated probes anchored to rigid landmarks, silhouette profiles, per-pair motion and boil, difference maps, rhythm; every probe hit verified on a sheet; shapes fitted from your own models, never traced. Only technique is taken from the reference, never its character or drawing."
---

# Media Match — reference

> **code-video project skill · `media-match-reference` v1.4.1**
> Scope: the code-video repository only — bringing its code-drawn animation toward a reference clip. Not part of the abc UX-audit skill family (github.com/AlonurKomilov/skills): do not use it for web or dashboard work, and do not add it to that repository.
> Source of truth: `.claude/skills/media-match-reference/SKILL.md` in <https://github.com/ABC-LEGACY-LLC/code-video>.
> A calibrated reference implementation (Python: numpy, scipy, Pillow) is the `tools/compare/` folder of that repository; where only this file is available, fetch it from there. Everything below also works with your own code — the method is what matters, not the tool.

Use this when someone gives you a reference clip and asks to get closer to it: "make it 1:1", "check every frame", "what is still different". It pairs with `media-audit-reality`, which asks *would this be true in the world*; this skill asks *where exactly does ours differ from that clip, and why*.

**The rule that governs everything here: a difference you did not measure is a guess, and a measurement you did not look at is a guess too.** Every number is produced by the same code on both sides, by an instrument proven against a known-bad case, and then checked on a sheet to see what it actually touched. The one exception — features the two drawings define differently — is in *When the drawings differ*.

## Rule 0 — technique, never the character

Measure **technique**: timing (holds, rhythm, cuts), staging (where the masses sit), motion (direction, amplitude, boil), tone (value ranges), shape *masses*. Do not reproduce the reference's character, design or linework. Shapes come from **your own parametric models, fitted to the measurements** (see *Fit, don't trace*). If a step would copy the reference's drawing point for point, it is the wrong step.

Every detail must be **measured or counted**, never invented. Two plausible "looking up" rules in one build — shorten the lower face 8%, lift the chin — were invented and were the opposite of the reference: mouth 38 px and chin 60 px below the eye there, 24 and 47 in ours. Both were removed and replaced with measured keys.

## Setup

1. **One working size, one loader, both sides.** Resize reference and render to the same size with the same filter (LANCZOS), THEN take luminance. Line width, highlight peaks and particle size all depend on scale; comparing a 540 px render with a 320 px reference measures the resize.
2. **A project file, no paths in code.** Frame patterns and first indices, working size, shot groups, the anchor, the probes, the silhouettes, an optional "previous" render for before/after. Give every probe a `note` field: why it sits there and what it got wrong before.
3. **Calibrate every instrument first.** Each gets a synthetic case whose answer is known and a deliberately broken one: a disc moved by (+3,+2) must read (+3.00,+2.00); an edge moved 2 px must read 2.00; a limb shortened 10 px must read −10 on its own rows; a rigid 1 px shift must give boil ≈ 0 and per-block random shifts must not; a uniform motion must give trend ≈ 0 and an accelerating one a positive trend. An instrument that cannot separate its pair is UNPROVEN and its numbers are not measurements.
4. **Check the test, too.** Two tests in one run failed for the test's own reasons — edge cells of a small rectangle capped a transform test's IoU at 0.90; an overlay test demanded more contrast than its synthetic image could produce (max 50). Make the test fair; do not bend the instrument to pass it.

## The round

1. Calibrate (all PROVEN).
2. Render **clean** — no boil, no sway, no particles — and measure every frame of the shot, not a sample. Rank differences against their tolerance.
3. For each large difference open the sheet: **what did the probe touch?** (see *Probe confounds*).
4. Fix through the model's own parameters — keys, tables, fitted shapes — with the measured number.
5. Re-measure the same probe, its neighbours, motion, rhythm, silhouette.
6. Check the normal render (with boil and particles) and make a before/after sheet: reference / previous / ours. "Previous" is the file you delivered last round, not a re-render of old sources (see *The before is what was delivered*).
7. Record in the project card: what was measured, before → after, what stays open.

**Every frame, not five.** In one round the only way three defects surfaced was the full per-frame table: shadows drawn unclipped in frames 2–6 but not in frame 1 (a sample built on frame 1 never finds it), a light slit under an arm in frames 1–4, and a second curved shape under the forearm in frames 8–11.

## Instruments

| instrument | answers | how |
|---|---|---|
| anchored probe | where is this feature, relative to the face/body? | anchor measured on the REFERENCE each frame; probe geometry relative to it, applied to both sides at the same place; diff = ours − reference |
| sheet | what did the number touch? | per frame: reference / previous / ours / overlay (R=reference, G=ours, B=reference: magenta = only reference bright, green = only ours bright, grey = agree); gridded zoom with pixel coordinates; a luminance table to read numbers, not impressions |
| mass IoU | is the mass the same, whatever the tips do? | blur both masks with a σ≈2 px Gaussian and cut at 0.5; tips differ by design, so fit the mass and measure tip size (period and depth along the edge) separately, as technique |
| pair masks | does a held frame still move, and how much? | the same mask on frames k and k+1 of ONE side; IoU and area change per pair, on both sides |
| silhouette profile | is the mass the same shape? | median filter (removes particles), threshold, the component connected to a body point, holes filled; per row the extreme x (or per column the extreme y); report IoU, area %, row ranges that differ and by how much |
| pair motion | is it held? how much does it boil? | 12×12 blocks at 2×, ±3 px search, low-gradient blocks dropped; motion = median shift, boil = median deviation from it; region-restricted |
| difference map | WHAT changes between two frames? | normalised abs difference, split into regions (e.g. left 40% / right 60%) with energy per region |
| rhythm | cuts, acceleration | pair differences, cut ratio, trend (last/first pair) AND per-pair MAE |
| occlusion map | where is the dark figure behind dark weather? | particles move: a block that never shows a moving particle has something in front (4 iterations of history are in the tool's docstring) |
| unwarp | shape independent of pose | map both frames into subject space with the frame's centre, roll, scale |

With `tools/compare/` (run `cd tools/compare && python3 -m compare <command> project.json`): `calibrate` calibrates every instrument, `probe` = probes and the ranked table, `sheet` = sheets (`--rows sample,before,ours,overlay`: reference, previous, ours, overlay), `grid` = gridded zoom, `table` = luminance table, `silhouette` = silhouette profile, `motion` = pair motion and boil, `diffmap` = difference maps, `rhythm` = rhythm, `occlusion` = occlusion map, `unwarp` = unwarp. An example project file with every key explained (`example-config.json`) sits beside the code, and the method with its findings is `METHOD.md`.

A minimal silhouette profile, enough to rebuild the idea without the tool:

```python
from scipy import ndimage
def mask(L, thr=20, med=5, seed=(126,150)):
    m = ndimage.median_filter(L, med) < thr
    lab, _ = ndimage.label(m)
    c = lab[seed[1], seed[0]]            # if 0: take the largest label in a 9x9 window
    return ndimage.binary_fill_holes(lab == c)
def right_edge(m, box):
    x0,y0,x1,y1 = box
    return [x0 + (r.nonzero()[0].max()+1) if r.any() else None for r in m[y0:y1, x0:x1]]
```

## Anchor to what does not change shape

A head track bound to the near eye's dark blob followed the blob as it changed — the hair lock slid off the eye and the tear collected, moving its centroid 97.6 → 95.4 — while the rigid landmarks (far contour, chin front, jaw bottom) were identical to 0.1 px. The track dragged the lower face 2–4 px off. Track from rigid landmarks (median of their differences) in a clean render; the rigid probes then read 0.0 px.

Measure in a clean render. A tracking loop that measured its own boil and sway fed that jitter back into the track: boil rose from 1.96 to 2.34 px until the loop measured a clean render.

## Read the camera first — the physics constrains the model

Before shaping an object, establish where the camera is from what is visible, then let contact and gravity constrain the model. In one hood round the reference showed the brim's lit underside (L 43–48), the hood's dark interior (L 7–9) and its outer surface (L 19) together — visible only from the side and below. The brim rests on the hair: as the head bows, the band's lower edge dropped 53 px in four frames while the hair tips dropped 18 px (lit hair −67%).

- **A straight line between two measured points is a guess about everything between them.** The rim was drawn from the measured peak to the measured temple; in the reference that line runs above the lit band, so ours hung the band in empty sky as a horn. Measure the edge itself — a few column keys along the band's top and bottom.
- **Filters eat sharp tips.** A median-5 class mask moved a wedge's apex 5 px and its lower tip 3 px on a synthetic case; straight edges survive. Take vertices from intersections of lines fitted to the edge rows away from the corners (calibrated to ≤0.8 px). An IoU fit of the polygon left the apex 2 px off: the objective cannot see the eaten tip.
- **Our subject may be bigger than the reference's.** The hood hides the back of the head; ours is larger, and its back sat exactly where the reference shows the interior. Draw the interior over the head, as the outer surface already is — behind it, our own hair hid it completely.
- **A centroid of a partly covered mass is not a position.** Re-running the lit-area centroid loop with the new occluders made the head jump 27 px between two frames: every shift changes how much the brim hides. A contact criterion — the gap between the band's lower edge and the hair top, zero in the reference by definition — gave a smooth track; the head holds once the brim stops, as in the reference, and the lit-centroid distance still fell from 18.7 to 7.7 px.

## Held frames

**Detect them:** rigid landmarks identical to ≤0.1 px and a block-motion median of 0.00 in the rigid region.

**A held drawing does not boil.** Ours redrew every frame with its own boil seed: in the delivered round the held pairs moved 0.00–1.12 px with 1.12–1.80 boil (face region) where the reference's motion was 0.00. Reusing one seed is not the fix — one seed's warp moves all held frames by the same field: the rigid landmarks went 0.7–1.1 px off (0.0 without boil) and the mouth 1.2 px up, in all six frames. Render held frames without boil; the calibrated geometry is the drawing.

**But a hold can still move.** In the same held frames the reference's hair strands changed every frame: difference-map energy in the left 40% of the frame (hair, face, body — the map shows it is the hair) 0.067–0.095 against ours 0.009–0.017. The block median said 0.00 because hair is a minority of blocks. A median of zero means *the rigid parts are held*, not *nothing moves* — check with a difference map.

**Give the moving layer its own motion — of the reference's kind.** Pair masks put a number on it: the reference's light hair changed between held frames at IoU 0.61–0.72 (ours 0.96–0.98) while its face moved 0.00. Moving only the strand tips was too weak — even the largest flutter took the pairs from 0.85 to 0.82, because tips are a small share of the mass. A smooth displacement field over the whole hair (its own phase each frame, the face left still), one head radius in wavelength, brought them to 0.64–0.72 — but it had been added after the fit and pushed the brow zones off (see *The fit breaks what it does not see*). Refitted with the field inside the model, the fit cancelled it at mass scale: 0.73–0.83. A finer random field (a tuft period in wavelength) got the number right again, 0.68–0.73, and the sheet showed edges wobbling as if melting, where the reference's edges stay sharp and its change is tufts passing from light into shadow. Right number, wrong mechanism: it was removed. Match the kind of change, not only its size.

## Same code on both sides — including the fit

A silhouette fit compared a median-5-filtered reference mask with an unfiltered model. The median erodes thin tips, so the fit placed the model's tip at the reference's *already eroded* tip, and the drawn limb came out 3–13 px short. Pass the model through the same filter before comparing; the tip difference dropped to −1..−4 px. Anything applied to one side — resize, filter, threshold, interpolation — is applied to the other, including inside optimisers.

## When the drawings differ — each side against its own truth, and a person's marks on the reference

Detectors on our render are calibrated against the model's known answer; on the reference they were checked only on sheets we judged ourselves — the same eye twice. A person marked the parts on eight reference frames, **only the reference**: an unfinished model has no "right place" to mark, and hand accuracy would mix with our 3D definition. Hand noise, from a drawing that appears twice: 0.4–1.3 px on points (σ ≈ 0.45), 5 px on brows (the person continues them under the hair).

- The marks found detector errors no sheet had: a "chin" that was the face edge at mouth height, 24 px off — the previous round's pose fit had been pulled to it, so our chin read "6 px low" when it was 16 px high; a nose tip taken from the contour below the nose (13 px); an eye correction calibrated on our render (centroid → 3D centre, +3.8 px) that gave 4 px error on the reference.
- Same code on both sides fails where the drawings define the feature differently: the reference's mouth stroke is darkest at its right end, ours at its left, and the same centroid code reported a 5 px gap with the wrong sign. For such features the reference side is the person's mark (else the corrected detector, with its definition offset measured against the marks — −2.5 px here) and our side is the model's own 3D point. Contours and silhouettes stay same-code.
- Keep the marks as a permanent test: after every detector change, "found but far from the person" must stay 0 (it was 8), and the parts a detector cannot find are covered by the marks.

## Probe confounds — the difference is the probe's, not the drawing's

Open the sheet for every large difference and see what the probe hit. Over two rounds with about twenty probes:

| probe | what it actually hit | fix |
|---|---|---|
| mouth centroid | the lip shadow, merged into the component | separate box for the shadow |
| far-eye centroid (L<30) | the temple strip above it, pulling the centre 3 px up | iris core, L<22 |
| limb tip (L<26) | the reference mask leaked into a dark sky of L 17–30; the "tip" sat on the box edge | L<20, seed at the darkest body point |
| brightest spot on the cheek (tear) | the lower-lid highlight and a lit hair edge (7×36 px) | box moved off the hair and the eye |
| brightest spot at the jaw (tear ring) | a snow particle (L 150) brighter than the ring's highlight | narrower box |
| mouth centroid −1.7 px, every held frame | not a shifted mouth: the stroke's LEFT end was 3 px long, the right end exact | move only the left key |
| band and interior boxes anchored to the largest lit component | in ours that component was a hair lock beside the face; the boxes missed the band (11–35 px against 378–881) | measure inside the reference's own mask dilated by 4 px, the same class code on both sides |

The last one generalises: a centroid difference can be a SHAPE difference. List the component's extents (left, right, top, bottom) on both sides before moving anything. Keep the reason for every probe fix in the project file, or the next person undoes it.

**Threshold outside the background's range.** A dark-figure threshold of 26 against a dark sky of L 17–30 flooded into the sky on three frames of eleven and not on the others; 20 did not. Print the background's range before choosing.

## Misreadings — compare brightness with the background, in numbers

Magnified dark frames fool the eye:
- a ring beside the jaw read as a clasp — it was a second tear (drop under the jaw, hanging ring, falling);
- a light bar under an arm read as a lit cuff — its values were 40–60 and the snow background 46–60: it was the background seen through a slit between the arm and the body;
- a flat band behind the far cheek was hanging hair strands, with sky between them in some frames.

If a "detail" has the background's values, it is a hole or a slit, not a detail.

## Fit, don't trace

Copying the reference outline point by point is tracing. Fit your own parametric model to the measured mass instead:

- **Body edge:** per row, the end of the dark run that starts inside the body (bridge interior light bands up to ~6 px), median over 3 rows, one key every 3 px; drawn as a polyline between keys — and the fit uses the SAME interpolation.
- **Limb:** a tongue of two quadratics — base point and half-width, tip, one control for the upper edge and one for the lower; a second tongue where the reference has a second shape.
- **Fit:** soft masks (4× supersampling, area fraction), IoU, Nelder–Mead from several starts plus random restarts, with penalties that keep the SVG equal to the rasteriser: edges must not cross (the upper control stays above the lower along the normal — otherwise nonzero fill and the rasteriser disagree), tip inside the frame, base attached to the body.
- **Then measure the real render**, not the model. Model IoU 0.84–0.95 became render IoU 0.84–0.91 (antialiasing, boil).

Result in one round, against the delivered previous round with the same pipeline on both sides: silhouette IoU 0.71 → 0.87, occlusion-map IoU 0.89 → 0.95.

## A 3D model is fitted across shots, not per shot

When the model is 3D and the reference is drawn, only the camera belongs to a shot. Fit shape parameters to all shots together — one camera per shot, one objective. A shape, a feature's place on a surface, a cloth or a background fitted per shot, per view angle or per frame improves each shot and makes the model inconsistent. In one project six such fits passed every per-shot measure; a camera-only test (pose and time held, the camera moved between the reference positions) showed the hood popping by up to 159 px, the near eye by 36 px and a camera-carried snow layer drifting 138 px. The method, the test and its calibration are in `media-3d-consistency-audit`.

## The fit breaks what it does not see

An optimiser moves every free parameter toward its objective and is free wherever the objective is blind. In one hair round:

- A hair-shadow band's thickness grew to a full head radius and darkened the whole face (L 60 → 30): the objective saw only the light-hair mask and two brow zones. A probe outside the fit caught it (near-eye anchor 2.2 → 7.5 px). Fix: a bound, and a cheek zone in the objective.
- The fit's model must reproduce the render's layer order. The shadow drawn after the eyes covered the eye whites (anchor 8.4 px), so it moved before the eyes. The model first imitated that by restoring "eye pixels" (any difference between renders with and without eyes) over the shadow; that mask also caught a faint lid crease, which left a skin-coloured line inside the model's shadow. Brow zone: 0.62 in the model, 0.78 in the render, 0.66 in the reference — the log said "exact" while the render was over-darkened. Exact fix: render once with a full shadow-coloured layer at the shadow's place in the stack, and use that render inside the shadow polygon; model and render then agree to 0.00–0.02 (one zone of ten 0.05).
- Independent per-frame fits swapped the hair chunk by chunk across held frames (large blobs in the difference map, occlusion map 0.95 → 0.88). A penalty on the change from the previous frame's parameters brought it back to 0.93–0.94.
- A closed shell cannot switch off: where the fit set outer = inner radius, a 1–2 px light arc remained (L ≈ 75 — under the L > 85 threshold, and removed by the median anyway): invisible to the instrument, a glasses-like arc across the face on the sheet, with interior lines drawn from under it crossing the face. Drop what is thinner than the instrument sees — mask IoU was flat for cut-offs of 0.10–0.18 head radius, so the cut cost nothing — and clip interior lines to the mass.
- A change made after the fit invalidates the fit's numbers: adding the hair boil after the fit moved one frame's brow zones from 0.82 / 0.38 to 0.46 / 0.17 (reference 0.60 / 0.38) while the log still said "exact" — and the 0.82 itself was the layer error above.

In a later pose and hood round:

- Points do not know what covers them. A pose, camera and hood fit brought a shot's face points to 1–7 px of the marks (from 9–16), while the hood came to cover 28 % of the reference's visible face (5 % before): the points sat under the hood. Measure layers as well — what covers the reference's visible skin in ours (hood, hair, background), and where our skin shows over the reference's lining or shadow.
- A shared rig key leaks into its neighbours. A hood key blended by Gaussian weights of the head pose carried about a third of the weight into the previous shot; the guard there watched head IoU and figure only, and that shot's lining-band probe went from +2 % to +27 % (tolerance 25). A parameter that no measure sees drifts freely (a lining width moved 1.75 → 5.31 with no effect on any number). Guard every shot a parameter reaches, with the probes that see it.

After every fit, run every probe on the real render and look at the sheet, not only the fitted measures. Every free parameter needs a measurement that sees its whole reach, and anything added later goes into the model and the fit is run again.

## The before is what was delivered

A re-render of old sources reads every file that has changed since. Our "previous" folder had been re-rendered after the head track was updated, so it already carried the new placement: near-eye anchor offset x 2.11 (now 2.18; 1.01 in the file actually delivered). Frames outside the shot matched the delivered file to GIF noise (mean abs difference 0.02–0.15); inside it they differed by 1.4–2.7, and its trend read +19.9% against the delivered +14.6%. The before/after table hid the placement change and mixed two baselines. Use the delivered file itself. If it is a GIF, put the "after" through the same GIF path — here that path moved silhouette IoU by 0.001, the trend by 0.2 points and a mouth probe by up to 0.4 px.

## Right number, wrong reason

After the numbers pass, look at the sheet — and when a number improves, ask what moved it.
- A hair-lag rule raised the frame-difference measure (0.347 → 0.351) while reversing the motion it modelled (difference 1.1 → 2.2 px): removed.
- A shot's acceleration trend matched the reference (+14.6% vs +14.3%) only because face boil in held frames stood in for the reference's hair motion. Removing the boil made it +39.4%: the number got worse and the truth came out; the fix belongs to the hair.
- A two-point trend (last pair / first pair) is fragile; report every pair and the per-pair MAE. One change improved MAE 0.043 → 0.029 while the trend "worsened" +17.7% → +7.7%.
- A shot's pair-difference MAE (0.0448) was helped by our head rising 15 px at the end of the shot, where the reference's brim holds. With the head held it read 0.0501. The missing change was a layer: the reference has snow falling in front of the cloak (46–65 specks in the lower-left; ours 0 — our snow is drawn behind the figure). Find the missing layer; do not add motion to restore the number.
- A visible-head IoU counted the hood lining as head, because in one shot the reference shows it. In another shot the reference shows no lining but a large light hair mass beside the face, and a fit held the IoU (0.656 → 0.657) by spreading lining where our hair was missing: lining on the reference's head 18 % → 30 %, hair and skin 73 % → 54 %. Per-class IoU exposed it; with the lining excluded the fit opened the hood instead. The missing hair is the next round's job, not the lining's.

## Structure bugs show up as measurements

Many frames in one document, each its own SVG: a clip id built from the rounded head centre collided whenever two frames' centres rounded to the same pixel, and six held frames shared one id. `url(#id)` resolves to the first element with that id — inside a hidden frame — and the visible frame silently dropped the clip: shadows spilled outside the body in frames 2–6. The silhouette profile showed a round bulge under the chin; nothing else did. Check: duplicate ids in the built document must be zero (`grep -o ' id="[^"]*"' out.html | sort | uniq -d`).

**Out-of-order evaluation must reproduce the sequential render.** Pose fields that one shot sets and the others omit were merged into the running state: an optimiser that rendered the last shot and then restarted at frame 0 kept that shot's head offsets in the first (~1 px; a coverage measure read 0.019 instead of 0.030). Test the harness: evaluate the same point first and again after another shot — the numbers must be identical.

## Output

A ranked per-frame table (probe × frame, ours − reference, flagged against tolerance), the sheets for the top items with the probe hits confirmed, before/after sheets (reference / previous as delivered / ours), and the project card updated with before → after numbers and what stays open. Say which differences were probe errors and how you know. Do not claim the clip was "watched"; say frames were measured.

## Division of labour

The user sees the clip in motion and knows the reference; you see numbers and still frames. Their "it's still not 1:1" is a request for a finer instrument, not a louder claim — check every frame, find the check you never ran, and show the numbers. When they name the next area, make the instrument complete and calibrated before starting on it.

<!-- SSOT: github.com/ABC-LEGACY-LLC/code-video/.claude/skills/media-match-reference -->