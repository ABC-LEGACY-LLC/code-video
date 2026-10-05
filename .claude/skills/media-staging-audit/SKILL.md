---
name: "media-staging-audit"
description: "code-video project only: before matching a reference clip's face or other details, recover per shot what the subject does, where it looks and where the camera is, in 3D (a single view gives only the relative orientation), fit contours not only points, measure view-dependent drawing cheats as targets without building them into a 3D model, and check the staging on the render with the same code on both sides."
---

# Media Staging Audit

> **code-video project skill · `media-staging-audit` v1.1.0**
> Scope: the code-video repository only — bringing its code-built (3D or drawn) animation toward a reference clip. Not part of the abc UX-audit skill family (github.com/AlonurKomilov/skills): do not use it for web or dashboard work, and do not add it to that repository.
> Source of truth: `.claude/skills/media-staging-audit/SKILL.md` in <https://github.com/AlonurKomilov/code-video>.
> Pairs with `media-match-reference` (measuring details against the clip) and `media-audit-reality` (would it be true in the world). This one comes FIRST. In a 3D model, `media-3d-consistency-audit` decides what may differ between shots: only the camera.

Use it before any detail matching (face, eyes, mouth, hair) against a reference, and whenever the reviewer says the result "looks the wrong way": "ours looks sideways, the reference looks down", "the camera is wrong", "she is looking up, not down".

**Rule: staging before details.** Details fitted under the wrong staging pass the numbers and fail on screen. In one round the profile shot matched four face landmarks at RMS 2.0 px while the whole profile line was off by up to 19.5 px (RMS 9.9): a view-dependent "lower face forward" push had been fitted instead of the head pitch, and the face was tilted ~20 deg up. The reviewer said it exactly: ours looks sideways, the reference looks down.

Rule 0 still holds: only technique is measured (timing, staging, placement); the character and drawing are our own.

## 1. Write the staging table first

Per shot (and per frame range inside it), before touching any detail:

| field | what to write | how |
|---|---|---|
| does | holds (identical frames), what moves, how far, when; blinks; events (tears, drops) | block motion / difference maps; landmark tracks per frame |
| looks | eye state (open / half / closed), iris position under the lid, lid-line tilt, head direction | zoomed luminance tables around the eye |
| head | which side of the face is visible, 3/4 or profile, jaw underside or top of head seen | landmarks + contour rows |
| camera | which side of the character, azimuth from the face direction, height, distance (head size), lens | 3D fit (section 2) |

Every entry carries a number. Read dark frames enlarged 4-8x with a gamma lift and a pixel grid, and print luminance tables: a hood interior at L 7 next to an eye lash line at L 3-10 fools both the eye and a naive detector.

Anchor the story across cuts. In the reference we measured: shot 1 head raised ~17 deg, eyes open, looking out; shot 2 profile, head level, eyes closed; shot 3 bowed ~39 deg into the hood, eyes half-open looking down. The "down" the reviewer saw lived in shots 2-3, and in the lid lines (closed-eye line tilted 17 deg down toward the front), not in shot 1.

## 2. One view gives only the relative orientation

Face landmarks fix the head-versus-camera orientation (3 DOF). The world split has 2 free DOF:
- camera elevation <-> head pitch plus roll: shot 1 fitted equally (RMS 0.6 px) at el -8 / -20 / -30 with the head +17 / +8 / 0 deg up, but needing 3 / 13 / 21 deg of head roll;
- camera azimuth <-> head yaw.

Fit with the elevation fixed and scanned, and report the family, not one point. Then choose with:
1. natural pose: no head roll or twist unless there is evidence; fit with tight roll/yaw priors and compare RMS (shot 3: el -30 az 55 with roll/yaw ~0 fitted at RMS 0.88 px; the side camera needed 29 deg of roll);
2. the story across cuts (raised -> level -> bowed);
3. gravity cues only if they are 3D (a falling drop, hanging hair) - not a 2D composited layer (section 6);
4. body and hood attachment.

## 3. Fit contours, not only points

Pose and camera fits need silhouette rows (the profile line, the jaw underside, the far contour), not only landmarks. Profile shot: 4 points at RMS 2.0 px hid a 19.5 px contour error; with 21 contour rows plus the jaw underside the correct pose fitted at RMS 1.33 px (head level, not the tilted one). Sample the model silhouette densely: a 110x70 grid put one row 3.3 px off (checked against 600x400); restrict the sampled region instead of thinning it.

## 4. View-dependent drawing cheats: measure them, do not build them into a 3D model

Drawn animation moves features by view. In the reference profile the eye sat 17.5 px (0.6 head units) behind and 5 px above where a rigid head puts it. Measure it: fit the pose WITHOUT the cheated feature, then back-project the reference feature (both ends of the closed-eye line) onto the model surface — that is the target. Do not reach it by deforming the silhouette either: pushing the lower face forward tilted the whole face up.

v1.0.0 of this skill went on to relocate the feature along the surface with a chart weighted by the view angle, and to give a cheat seen only in some frames its own per-frame weight. In a 3D model both are patches: with the camera moved between the reference positions (pose and time held) the eye popped 33–36 px and in an orbit slid up to 38 px along the face; the per-frame lower-face push popped the jaw 5.3 px. Give the feature one 3D place fitted to all views at once and report what is left as a residual — see `media-3d-consistency-audit`. In a drawn (2D) rig a view-weighted chart is the rig's own mechanism and stays valid.

## 5. Verify the staging on the render, same code on both sides

The model does not know occlusion. For the old shot 3 the model said the eye was 1.0 / 2.3 px off; in the render the eye box held no dark lid line (min L 38) and the chin rows were behind the cloak. Measure the render: contour rows scanned from a seed inside the face, the eye lash line as the darkest 5x2 window in a box that excludes dark neighbours (a box reaching the hood interior locked onto L 7 instead of the eye), the eye track per frame. Cross-check the node projection against the page once per change (it matched to 0.0 px).

## 6. 2D background layers are a property of the reference, not of the camera

If the reference's background gradient and particle motion are the same in every shot (snow density top->bottom 11.7->35.4, 12.5->37.6, 10.4->34.0; particles +2.9,-1.1 px/frame in all three), it is a 2D layer. It says nothing about the camera. v1.0.0 tied the 3D background's "up" and the snow to the camera instead; the camera-only test then showed the snow following the camera (138 px off the world between the reference cameras, 398 px in an orbit) and the sky tilted 22 deg. In a 3D model fit one world background to all shots under their own cameras and report what remains (`media-3d-consistency-audit`, section 6).

## 7. Deliver

- The staging table per shot (does / looks / head / camera / evidence with numbers).
- A sheet: reference with the measured marks, the same marks on the previous and current renders, and a top + side camera diagram per shot.
- The GIF reference | previous as delivered | now.
- Before -> after numbers measured on the renders.
- The remaining non-staging differences listed separately (hair covering the side of the head, hood coverage), so nobody tunes the camera to fix a hair problem.

Reference implementation (`personaj3d/test`): `sahna_fit.mjs` (elevation scan), `sahna2_fit.mjs` (profile contour fit plus eye back-projection), `sahna3_fit.mjs` (low camera, elevation/azimuth scan with no-twist priors), `sahna3_harakat.mjs` (per-frame head offsets from the eye track), `fit_poza1c.mjs`, `sahna_oldin_hozir.mjs`, `sahifa_tekshir.mjs` (page versus node projection), `audit_misol/sahna_olch.py` (render-side contour and eye), `sahna_varaq.py` (sheet).

<!-- SSOT: github.com/AlonurKomilov/code-video/.claude/skills/media-staging-audit -->
