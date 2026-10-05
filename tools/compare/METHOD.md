# Method: reaching the sample by measurement

This document is **what was used, how it was measured and what was paid attention to** while
bringing an animation drawn with code closer to a sample clip (the sample). Behind every rule
there is an exact case and a number found in this work; a rule without a number was not
written. The tools themselves and the commands — [`README.md`](README.md).

The source work: shot 1 of one anime clip (11 images, 320×180), passes 8..10.

---

## 0. What is measured, what is not taken

**Technique** is measured from the sample: timing (holds, rhythm, cuts), placement, motion,
tone, the mass of a shape. The sample's character and drawing are not reproduced. A shape is
drawn **from our own model** and *fitted* to the measurement — the sample is not traced
(rule 9).

Every detail is **measured or counted**, not made up. In pass 9 two "looking up" rules —
shortening the lower face by 8% and raising the chin — were made up and came out the OPPOSITE
of the sample: in the sample the mouth is 38 px below the eye and the chin 60 px; ours were 24
and 47. Both were removed, and measured keys came in their place.

## 1. The same code on both sides

Both sides go through one size (320×180, LANCZOS, then L), one function, one threshold,
one filter. The difference must be only in the input image.

**This applies to model fitting too.** In pass 10, when the arm silhouette was fitted, the
sample's mask had gone through a median 5 and our model had not. A median shortens a thin
tip — the fit put the tip at the sample's *already shortened* tip, and the drawn hand tip came
out 3..13 px short (in the images where the probe was not broken). After the model's mask too
was put through a median 5 and fitted again — −1..−4 px.

**Measure on a jitter-free render**, then check on the ordinary render.
In pass 9 the eye-track loop measured our jitter (boil, sway) and added it back into the
track: boil rose from 1.96 to 2.34 px, until the loop was made to measure the jitter-free
render.

## 2. Calibration first

Every instrument is tested on a synthetic image whose answer is known: the good case and a
deliberately broken case. If it cannot tell them apart — `UNPROVEN`, and a number that comes
out of it is not a measurement (`python3 -m compare calibrate`).

The test itself can be wrong too. In pass 9 two tests failed, but the error was not in the
measurement: (a) in the unwarp test's small rectangle the share of edge cells held the IoU at
0.90; (b) in the overlay test the largest colour difference possible in the synthetic image
was 50, while the test expected more. The test was made fair; the measurement was not
touched.

## 3. Every image, every feature — not a few picked ones

5 picked images are not enough. What only the table of all 11 images showed in pass 10:

- in images 2..6 the cloak's shadows were drawn unclipped (not in image 1 — had image 1 been
  taken as the pick, it would never have been found; rule 10);
- in 1..4 the slit under the arm, in 8..11 a separate crescent under the forearm;
- 1..6 a held drawing, 7..11 moving.

The order: the table (`probe`, `silhouette`) → the largest differences → the sheet of that place.

## 4. The anchor: a landmark whose shape does not change

In pass 9 the head track was tied to the dark component of the near eye.
In the sample, in images 1..6 the eye component moves 97.6 → 95.4 (a hair strand slides off
the eye, tears gather), while the rigid landmarks — the far edge 130.3, the front of the chin
129.6, under the jaw 109.7 — are **the same to within 0.1 px**. The track tied to the eye made
the head follow that change of shape and shifted the lower face by 2..4 px.

The track now: dx = the median of the far-edge and chin-front differences, dy = the median of
the under-jaw differences; a jitter-free render; the held images in one place. The result: the
rigid landmarks at 0.0 px in 1..6.

## 5. Held images

**Detection:** the rigid landmarks the same to within 0.1 px, and the median of the pair block
shift in the face area 0.00 (`motion`).

**A held drawing does not jitter.** Ours drew every image with its own jitter seed: in the
delivered pass 9, in the held pairs (face box 72,22,140,112) motion was 0.00..1.12, boil
1.12..1.80 (in the sample motion 0.00). The first
attempt — a single seed — was not enough: a single seed's displacement field moves the six
images THE SAME way: the rigid landmarks 0.7..1.1 px off (jitter-free 0.0), the mouth 1.2 px
up — the same in all six (the track was set on the jitter-free render). The held images
were made jitter-free.

**But something can move in a held drawing too.** The difference map (`diffmap`)
showed: in those held pairs of the sample the edges of the hair strands change in every
image — the energy of the left 40% of the frame (hair, face, body; on the map the change is in
the hair) is 0.067..0.095, ours 0.009..0.017. The
MEDIAN of the block shift does not see it: the hair is a minority of the blocks. A median of
0.00 means "the rigid parts stand still", not "nothing moves".

## 6. After the number, the sheet (Goodhart)

A number can be right for the wrong reason.

- Pass 9: a hair lag raised the between-image difference measure (0.347 → 0.351),
  but in the sample the head blocks move at 10→11 TOGETHER with the head (+2,+2) — the lag
  raised the motion difference from 1.1 to 2.2 px. It was removed.
- Pass 10: the acceleration of shot 1 (the trend) was +14.6% in the delivered pass 9,
  the sample +14.3% — almost exact. After the face jitter was removed it became +39.4%. The
  reason: the face jitter in the held pairs had been standing in for the sample's hair
  movement. The number got worse, the truth came out; the fix is in the hair.
- A two-point trend (the first and the last pair) is brittle: print every pair's difference
  and the pairs MAE too. In pass 9, when the MAE improved 0.043 → 0.029, the
  trend "got worse" +17.7% → +7.7%.

## 7. A probe error — not a drawing error

Check every large difference on a sheet: **what did the probe touch?** Often it touches
something else, and the difference in the table is the probe's error, not the drawing's.

| probe | what it touched | the fix |
|---|---|---|
| mouth (9b) | it took in the lip shadow | the lip shadow in a box of its own |
| far eye (9b) | at L<30 it joined the temple line above and pulled the centre up by 3 px | the core of the iris, threshold 22 |
| hand tip (10) | at L<26 the mask leaked into the sky of L 17..30 in the sample's images 2, 3, 8 — the "tip" on the edge of the box (198,118) | threshold 20, the seed in the darkest spot of the body |
| the tear on the cheek (10) | "brightest" — the lower eyelid and the light edge of the near hair strand (7×36) | the box away from the strand and the eye |
| the tear on the jaw (10) | a snow particle in the background (L 150) brighter than the ring's glint | a tight box |
| mouth (10) | after the jitter was removed, a systematic −1.7..−2.0 px "mouth to the left" in 1..6 — in fact the line's left end was 3 px long, its right end right | a key for the left end only |

The last one matters: a centre difference also comes out of a SHAPE difference. List the
component (its extremes, its centre) and see which end differs.

When a probe is fixed, the reason stays in the config (`"note"`), otherwise the next person
breaks it back.

## 8. Misreading — check with a number

On a zoomed dark image the eye is quickly fooled:

- Pass 9: the ring beside the jaw was read as a "pin" — in fact a second tear
  (in image 6 a drop under the jaw, in 7..9 a hanging ring, in 10..11 it falls).
- Pass 10: the light line under the arm had been read in pass 9 as a "light cuff".
  The L table: 40..60, the snowy background is also 46..60 — this is the background seen
  through the SLIT between the arm and the lower body.
- Pass 10: the "band" behind the far cheek — hanging hair strands; in 7..9 the sky shows
  between them (the band probe +10..28%).

The rule: compare the brightness with the background in numbers. If it is the same as the
background — it is a hole or a slit, not a detail.

## 9. Do not trace — fit the model

Copying the sample's contour point by point is tracing. Instead, our
parametric model is fitted to the measurement (the `test/qol-fit.py` method):

- **The body edge:** in every row the end of the dark run starting from the left
  (an inner light band of ≤6 px is bridged), a 3-row median, a key every 3 px. In the drawing
  the gaps between keys are linear — in the fit exactly the same.
- **The arm:** a "tongue" model — base B, half-width hB, tip T, the upper edge's control U,
  the lower edge's control D (two quadratic curves). One in images 1..7, two in 8..11
  (forearm + crescent).
- **The fit:** a soft mask (4× supersampling, area share), IoU, Nelder–Mead,
  several starts + a random perturbation and again; penalties: the edges do not cross (the
  upper control above the lower control along the normal — otherwise SVG nonzero and PIL fill
  differently), the tip inside the frame, the base in the body.
- **After the fit, the real render is measured**, not the model (the model in the fitting
  box IoU 0.84..0.95; the render, in the silhouette box, jitter-free 0.84..0.91).

The result (against the delivered pass 9, both sides through the same GIF path):
figure silhouette IoU 0.71 → 0.87, figure map IoU 0.89 → 0.95 (pass 10 on PNG
0.871, jitter-free 0.881).

## 10. Errors of code structure show up in the measurement

In pass 10 the silhouette measurement showed a round "D" bulge under the chin in images 2..6.
The reason: the 22 images are in one HTML document, each in its own `<svg>`; the cloak's
clip id was made from the head centre (`pl`+cx+cy), and in 1..6 the centre is the same → six
identical ids. `url(#id)` binds to the FIRST element in the document; since that one is in a
hidden (`display:none`) svg, in the visible image the clip is dropped
and the shadows spill out of the cloak. Because the id was made from the integer part of the
centre, it also collided in two images standing close (in pass 9's earlier
track, images 3 and 4: both `pl156_76`); once the held images were put in one place,
all six became the same. It was not noticed: the old diagonal edge
had kept the shadows inside.

The check: the number of repeated ids in the built document must be 0.

```bash
grep -o ' id="[^"]*"' film.html | sort | uniq -d
```

## 11. "Before" — the delivered file itself

Re-rendering the old sources does not give "before": a render also reads the files that changed
later (for example the head track `izlar.json` is read by an absolute path).
The `ff-9` folder in pass 10 was such a re-render and carried pass 10's head
placement: the near-eye anchor's x difference in ff-9 2.11, now 2.18,
in the delivered pass-9 GIF 1.01. Images 12..22 are the same as the delivered file to the
level of GIF noise (mean difference 0.02..0.15), in 1..11 they differ by 1.4..2.7;
the trend in ff-9 +19.9%, in the delivered one +14.6%. As a result the before/after
table hid the change of head placement and mixed two different "befores".

The rule: "before" — the very file delivered to the user (here `ff-9t/` —
the images of `kadr-toliq.gif`). If it is a GIF, send "after" through exactly the same path
(`ff-10t/`): this path moves the silhouette IoU by up to 0.001, the trend by 0.2 points, the
mouth probe by 0.4 px.

## 12. Hair: the face held, the hair alive

**The tool.** A silhouette for a light mass (`"condition":">85"`, `"median":3`, `"fill":false`,
`"min_area":60`, `"values":true`) and `--consecutive` (k and k+1 on one side). Calibration:
`silhouette/light` (a strand 6 px short → "bottom" −6.0; shifted 2 px → "left" +2.0; a large
particle does not enter the mask; the hole stays open), `silhouette/consecutive` (an identical
pair 0.00, 2 px → 2.00), `silhouette/values` (median/p90 exact).

**The finding.** The sample's images 1..6 are held (face 0.00 px), but its hair changes in
every image: consecutive mask IoU 0.61..0.72 (ours 0.96..0.98), between 1 and 6 IoU 0.40,
area −30% — mostly a change of tone in the middle band (light strands pass into shadow).
Two layers, two times: the face — a held drawing, the hair — its own motion.

**Tone.** In the sample the light hair is flat: median ~100, p90 103..104. Ours had light
lines at L 124 (p90 122..124); now one flat tone — p90 101..102.

**Mass and tips.** Pixel IoU also compares the strand TIPS — and the tips are the drawing's design. To
compare the mass, both masks are spread with a Gaussian of sigma 2 px and cut at 0.5
("mass IoU"). The fit is made to the mass; the size of the tips is measured as TECHNIQUE
(the residue of the mask edge from a smooth shell, rays every 1 degree): the strands on the
right have a period of ~14 px and a depth of ~7.7; the bottom of the near side ~8 / 3.4; the
forehead ~8 / 3.2. Our teeth are at that size, while their places come from our own seed,
tied to the angle (when tied to the arc length, the teeth "crawled" along the edge as the mass changed).

**The model.** The first attempt — strand groups (sweep, forehead, near side; per
group a length, a direction, a width) — took the IoU in image 1 only from 0.33 to 0.42:
the group parameters could not give where the mass stands. The second — a polar shell
around the head centre (an outer and an inner radius every 12 degrees) — mass IoU 0.67..0.80.
The fitting model = a clean hairless render of that image + the geometry (from the server, one
code), drawn at 4x and reduced → the compare pipeline; against the real render mask IoU
0.977..0.987. The head centre is on the near eye itself (0.02..0.08 R) — everything aimed at
the centre lands on the eye (rule 13).

**Movement.** A tooth-tip jitter (every tooth with its own phase along the flow) was not enough:
even at 0.08 R the held pairs' IoU 0.85 → 0.82, the sample 0.67 — the tips are a small
part of the mass. A smooth displacement field over the whole hair geometry (wave ~1.06 R, each
image its own phase; the face does not boil), its amplitude chosen until the pairs' IoU equalled
the sample's (0.06 R) — pairs 0.64..0.72. But it had been added AFTER the fit
(rule 13); when the fit was redone with it in the model, it covered the long wave at the level
of the mass — the pairs went back to 0.73..0.83. A second, fine random field
(wave 0.3 R — the measured tooth periods lie within 0.21..0.37 R), put into the model
and refitted: pairs 0.68..0.73 (the sample 0.61..0.72) — the number is right. On the sheet,
though, the hair edges waved as if melting; in the sample the edges stay sharp, the change is
the strands passing from light into shadow. The number right, the reason wrong (rule 6) —
removed. What stayed: the long wave inside the fit, pairs 0.73..0.83; the strand
shadows (the inner structure) — the next hair step.

## 13. The optimizer breaks what it does not see

- The forehead shadow's (the dark hair band's) thickness `soyaH` grew to 1.0 R and brought the
  whole face down from L 60 to 30: the objective saw only the light hair and two
  zones above the eyes. A probe that was not in the fit found it — the near-eye anchor
  (x difference 2.2 → 7.5 px). The fix: a bound of 0.30 R, a cheek zone (the dark share to the sample's).
- Then the shadow covered the white of the eye (drawn after the hair, over the eyes) — one
  dark component with the pupil (anchor 8.4 px). The fix: the shadow BEFORE the eyes;
  the fitting model in the same order too. The first model did this APPROXIMATELY: after the shadow
  was drawn, the "eye pixels" (the difference of the background with and without the eyes > 0)
  were restored from the background — this mask also took in the faint eyelid line above the
  eye, and a skin-coloured line stayed inside the shadow. The brow
  zone 0.62 in the model, 0.78 in the real render (image 1; the sample 0.66): the fit had
  over-darkened the brow while the log said "exact". The fix: one render with a full
  shadow-coloured layer in the shadow's place (`__soyaTest`, inside exactly that clip) — the model
  takes that render inside the shadow polygon; model and render differ by 0.00..0.02 in the brow
  zones (image 8, zone B 0.05).
- Then the shadow covered the tops of both eyes and joined them into one component (anchor 10.4 px).
  The fix: the shadow only over the near eye (the angle of the brow box ±30).
- With an independent fit (every image on its own) the hair in the held images changed PIECE
  BY PIECE: large blotches on the difference map (thin edges in the sample), the occlusion map
  0.95 → 0.88 (it read the moving light tips as particles). The fix: a tie to the previous
  image (a penalty on the difference of the radii) — occlusion 0.93..0.94; and the fine movement
  with the boil of rule 12.
- After every number had improved, THIN ARCS appeared on the sheet: a light arc under the far
  eye like a spectacle rim, radial lines below, ink lines cutting across the face from under the
  dropped mass. The shell is a single ring — at an angle with no hair the fit had made ro=ri,
  and the inner edge was clamped by ro−0.01. The tool does not see them: at 320 an arc is 1..2 px,
  L ~75 — below L>85, and it does not survive a median 3 either; they do not affect the brow zones
  either (when removed, the brow share in images 1, 4, 7 changes by less than 0.01) — the fit
  did not see them and did not choose their place. The fix: a place thinner than `minQal`
  is dropped, the ink is clipped inside the hair. `minQal` from the mask IoU plateau: at 0 0.594,
  at 0.10..0.18 0.595..0.598 — the one chosen 0.15.
- The hair boil (rule 12) had been added AFTER the fit — the brow zones were now "exact" only
  in the fitting log. In the real render image 4 without boil 0.82/0.38, with
  boil 0.46/0.17 (the sample 0.60/0.38); image 7 0.83/0.28 → 0.57/0.14 (0.66/0.29). The
  0.82 in A is itself the model error above. After every change following the fit all the
  probes are measured again; the fit was redone with the boil and `minQal` in the model.

The rule: after every fit run ALL the probes and look at the sheet, not only the
fitted one; every free parameter needs a measurement that sees its whole area of effect;
what the tool does not see (thinner than the filter, fainter than the threshold) is closed
with a model constraint; the model must repeat the order of the render's layers.

- "Before" in one more guise: the band-slit fit, while measuring the "no slit" case, also
  loaded the previous result in `varaq.mjs` — and wrote "not needed" for every image.
  When measuring again, the parameter being changed is given EXPLICITLY (null too).

## 14. Camera and physics: the hood

**Where the camera is.** Read first, then draw: in all three shots the character looks to the
right of the screen, the camera is on the character's RIGHT side (the visible side of a face
looking right is its right side; in pass 12 it was written as "left" — an error); in shot 3 it
is BELOW — only the things seen from below tell this: the light lining UNDER the brim (the rim)
L 43..48, the INSIDE of the hood L 7..9, the outer surface L 19. The edge spread (sigma ~1.0 px,
hair 0.6..0.7) — the "soft" look is not defocus. The particles are the same in the three shots
(+2.9,−1.1) — the wind from behind to the front.

**Physics in the measurement.** The hood is cloth resting on the shoulders, its rim RESTS on the
hair; when the head bends, the brim comes down over the forehead: in 14→18 the lower edge of the
lining band goes 53 px down, the hair tips only 18 px, the light hair area −67%. The brim
COVERS the hair — the back of the head is hidden inside the hood, and in the gap the inside
(the wedge) shows.

- **A straight line between two measured points is a guess.** The rim had been taken as a
  straight line from the peak to the temple (both ends measured): in the sample that line runs
  ACROSS the lining band, and in ours the band was left as a "horn" in the sky. The rim — the
  band's measured top edge (7 column keys), the band — the top and the bottom edge.
- **A median eats a sharp tip.** The wedge's (median 5) tip went 5 px down on a synthetic image,
  its lower tip 3 px up; straight edges are kept. The tips are not taken from the mask: in every
  row the left/right extreme, `x = a·y + b` for the edges, the tips — the intersections
  (calibration: ≤0.8 px; when the right edge is vertical, two tips R1, R2). With a fit (IoU,
  Nelder-Mead) the tip stayed 2 px off — the objective does not see an eaten tip.
- **A free fit broke the hood.** A 17-parameter CMA produced a sharp spike and a crossed rim
  (rule 13: it breaks what it does not see). Instead — measured keys, smoothed by
  [1,2,1]/4 within the shot.
- **Our head is different.** The sample's head is seen from below, bent; ours is 3/4, larger —
  its back exactly where the wedge is. Just as the outer surface covers the back of the head, the
  wedge is also drawn OVER the head (drawn behind it, our hair covered it completely, wedge
  0..129 px).
- **The anchor landed on something else.** The band/wedge tools were tied to the largest light
  piece of hair; in ours that is the long strands left of the face (x 130..170) — in images
  15..18 the box did not see the band (11..35 px, the sample 378..881). An additional measurement:
  inside the sample piece's area widened by 4 px, the same class threshold on both sides
  (in-place IoU).
- **The centre of a partly covered mass is not a place.** Re-tuning the head track by the centre
  of the light area (the pass-5 loop) made the head jump 27 px at 19→20 with the new hood: the
  part the brim/wedge covers changes with every shift. Instead a physical condition — the brim
  touches the hair: the gap between the band's lower edge and the top of the hair (0 by
  definition in the sample), a smooth track, after image 18 the head is HELD (in the sample the
  band edge stays at 87..88). With this the light-area centre difference also went 18.7 → 7.7 px.
- **The number right, the reason wrong (again).** In pass 11 shot 3's pairs MAE was 0.0448 —
  the difference came from the head going 15 px back UP at 19..22 (not in the sample). With the
  head held the MAE is 0.0501: the 18..22 pairs 0.29..0.30 in the sample, 0.22..0.26 in ours.
  What is missing is on the difference map: in the sample the left 40% energy is 0.06..0.08, ours
  0.00..0.01. There, in the sample, snow particles are ON the cloak (bottom left, x 0..110,
  y 100..180: 46..65 of them, ~2% of the area; ours 0) — our snow is drawn BEHIND the figure.
  The pair difference = 0.4·left + 0.6·right: at 18-19 the difference 0.303 vs 0.223 — 0.026 from
  the left, the remaining 0.053 in the right 60% (snow, hair tips). The rule: do not restore
  the number by adding extra movement — find the missing layer.
- **When the hood changes, the tone that depends on it is measured again.** With the hood shadow
  on the face at 0.22 the face was L 49 (it fell into the lining class); the sample's face class
  median L 59 in every image → 0.03 (face class IoU 0.19 → 0.26).
- **A coarse profile must not cross a measured line.** The cloak, an 18-row profile — at the top
  of shot 3 it had gone 30 px right of the sample's hood line (L 19 in place of the sky's L 2..8);
  it was cut at the measured line (where it crosses the top of the frame → the top-right corner)
  — the peak probe from (205..207, 0) to (220..233, 23..30) (the sample 225..238, 29..35).

## 15. The scene first: where it looks, where the camera is (3D, pass 5)

The user: "ours looks to the side, the sample looks down". The face details had been fitted before the scene was understood.
- **One view gives only the RELATIVE direction.** Shot 1's face points land the same at el -8/-20/-30
  (RMS 0.6 px): the head +17/+8/0 deg up, but then it has to be tilted 3/13/21 deg to the side. The absolute value --
  is chosen by the principle "the head is not turned/tilted", by what happens between the cuts, and by 3D cues; the family
  (every variant) is written in the report.
- **A contour, not points.** Shot 2's profile had been fitted to 4 points (RMS 2.0 px) and to a lower-face
  shift tied to the profile weight -- the whole front contour had drifted by up to 19.5 px (RMS 9.9), the face tilted ~20 deg up.
  With 21 contour rows + under the chin: the head level, RMS 1.33 px. The silhouette is taken densely (on a 110x70 grid one
  row was +3.3 px off).
- **The anime way of showing a view -- the placement of features, not the shape.** In profile the sample's eye is 17.5 px
  (0.6 units) behind where a rigid head would put it: the eye drawing moves along the surface with a card (at w=0 itself,
  0.0014 units); shifting the lower face tilted the face. The weight -- an angle in HEAD space.
- **The scene is checked on the render.** In the old shot 3 the model said "eye 2.5 px"; on the render there is no dark
  line in the eye box (L 38), the chin is behind the cloak -- the model does not know occlusion.
- **A 2D background layer says nothing about the camera.** In the sample the snow density gradient and motion are the same in the three shots;
  in shot 3, with the camera looking from 30 deg below, the background's "top" is tied to the camera.
Skill: `media-staging-audit`. Report: `personaj3d/README.md` (pass 5).

## 16. The hair mass: what the sample's light lands ON in ours (3D, pass 6)

The rest of the "looks to the side" impression was in the hair: 28-33 px of bare skin behind the near eye (the sample 1-9), the forehead bare.
- **Not a difference -- where it lands.** A new tool (`personaj3d/test/audit_misol/soch_qoplash.py`): which CLASS a light hair
  pixel of the sample lands on in ours -- exact, from the role render (skin / hair in shadow / inner flap / hood / background).
  In shot 1 only 1 % of the sample's light landed on our light hair; 52 % on skin, 30 % on the hood -- one number
  told "no hair" from "the hood blocks it" (the hood was left for the next pass, the hair -- now). Calibration: itself 100 %,
  shifted 5 px 56 %.
- **Carry the sample's measurement into the model's space.** Every row of shot 2's light mass was turned into head
  space with the shot camera (28.7 px/unit): the hair ~1 unit above the crown, ~1 unit IN FRONT of the forehead. One 3D shape
  explained all three shots: in 3/4 seen from below, the front hair "covers" the forehead down to the eyes; when the head bends, it hangs in front of the
  face. The snow motion (right and up) gave the wind direction -- the spread of the hair is explained by it.
- **Where it stands is not enough -- where it hangs.** If the rest shape is frozen in head space, then when the head looks 17 deg up
  a "vertical" strand cuts the cheek diagonally on screen (a claw). In the sample the hair hangs in the world: the rest shape bends toward gravity and the wind.
  In 3/4 the near hair falls from behind the eye to BEHIND the jaw; if it stays over the cheek, it comes over the face when the head turns to profile
  (in the sample at 9-11 the hair is behind the cheek).
- **A view-dependent place with its own weight.** The hair weight is separate from the eye-card weight (from the camera angle, from 70 deg):
  the eye card was fitted at 0..0.1 in shot 1 10-11; with one shared weight the hair fell onto the cheek as a "claw".
- **A mask measures the size of the structure too.** The thin strands on the far side are light at 480 px (L 102..131), but
  at 320 px they mix with the contour lines and do not survive the mask's opening -- changing the light direction 4 times
  gave nothing. First look at the pixel value at full size, then choose the reason.
- **The probe touches the hair.** The far-eye probe got worse 0.97 -> 2.25 px: strands now pass over the eye and move
  (in the sample too), the head geometry untouched. Because the median of our held images is low
  (0.229 vs 0.337), the rhythm detector marked the head-motion pairs (which had come closer to the sample's) as "cuts".
- **Check the fitting objective.** The hood fit (figure IoU + "the sample's hair under the hood" + "our hair in the sample's
  dark") gave away the figure IoU to uncover the hair -- in shot 1 the inner face of the far side was opened. It was not
  accepted; a minimal manual variant (checked with the same measurement) was taken.
Report: `personaj3d/README.md` (pass 6), `chiqish/soch-audit-6.png`.

## 17. The hood: the visible head in every shot -- size and jumps (3D, pass 7)

The user: "it jumps from image to image, gets bigger and smaller". The earlier probes measured only the PLACE (the eye centre,
a contour row) -- none of them saw size or jumps.
- **Size -- a measurement of its own.** The visible head's area and IoU (in the sample an L>=40 mask, in ours the role render): in the sample in the three
  shots 6300-7400 / 6600 / 4100-5700 px, ours 11 800-12 900 / 4 000 / 13 500-14 100 (1.75 / 0.61 / 3.03 times).
  Jumps -- the difference energy of neighbouring images (left 40 %): 9->10 0.490 (the sample 0.201); the map -- in the sample only the hair and
  the face features change, in ours the bare back of the head, the flap, the neck shift as a whole.
- **Anime clothing per shot.** In the sample the hood lies differently in every shot; ours is rebuilt at the cut and within the shot
  follows the head by a KF/KT share. Head IoU 0.41 / 0.49 / 0.23 -> 0.81 / 0.62 / 0.69, jump 0.490 -> 0.307.
- **A second objective -- not a weight but a CONDITION.** The figure was at weight 0.5: in shot 3, for head IoU +0.33, the figure went 0.857 ->
  0.784 (the top of the hood forward, the top-left corner sky). With the condition "not below the delivered level" the same
  shot gave 0.69 / 0.884. (A continuation of rule 16's "check the objective": checking is not enough -- set a condition.)
- **Before deleting an "artefact", measure the sample at those pixels.** In shot 1 the thin light line right of the face
  (the far rim's lining) looked like an error; in the sample at those pixels the L median is 43 -- the sample's own lining band, from the face edge
  to the rim ~14 px of L 43-45, and under the jaw L 7-10. The right thing -- widen the band at face height and end it at the jaw
  (the 2D project's band probe -86 % -> 11.6 %), not delete it.
- **A parameter at its bound -- a freedom is missing; a new freedom -- for an error that was seen.** The parameters stayed at their bounds
  (hole 1.0, shift -0.6); every freedom added answered one exact error seen on the sheet: the two rims separately
  (the far rim's line), the band width (the sample's lining), the band's end (under the jaw). Not adding parameters blindly.
- **One part shifts another's measurement through the light.** Once the hood covered the head, its shadow fell on shot 3's hair:
  the sample's light hair landing on ours 43 % -> 4 % (a shadowless render 39 %). The neighbouring measurements were measured again
  and written in the report as OPEN: in the sample the front strands hang from under the brim into the light -- hair work.
- **Covering covers motion too.** The part of the hair that went out of sight took the held pairs' energy with it too:
  shot 3 0.037-0.067 -> 0.009-0.039 (the sample 0.059-0.083). "Calmer" does not mean closer to the sample.
Report: `personaj3d/README.md` (pass 7), `chiqish/kapyushon-audit-7.png`.

## 18. "Camera zoom" -- a scale probe, the large mass, the background layer (3D, pass 8)

The user: "after 10 it gets bigger and smaller like a camera zoom". The probes measured the face relative to the near-eye anchor
-- none of them saw the frame itself growing and shrinking.
- **Scale -- a probe of its own.** An affine fit of the figure region between neighbouring images (ECC; calibration: 1.02 zoom ->
  1.0203): in the sample within a shot 0.985..1.008, ours 9->10 0.924. The reason was not in the place but in the cloth's FOLLOWING: as the head turned,
  the hood's rim kept covering the back of the head. The share of following the rotation within a shot became a parameter of its own (a scan:
  in shot 1 0.2, in shot 3 the old 0.35 is the best) -> 1.007.
- **The camera scale from the large mass.** Shot 2's distance had been fitted to the lower-face contour (21 rows) -- RMS 1.3 px, but
  the whole head and hood came out 20 % small (figure 0.407, the sample 0.509; in the sample the figure GROWS from shot to shot, ours
  shrank). An anime profile face is drawn small relative to its head: a small feature changes the face, not the camera. The order:
  the camera -- to the figure and the visible head silhouette, the face -- after, within that scale.
- **The background layer as technique.** In the sample the snow is one 2D layer: it carries on across a cut (phase correlation r 0.71 / 0.69),
  its density the same in the three shots (271 / 273 / 272 particles/10k px). 3D snow redrawn from every shot's camera broke at the cut
  (r 0.12 / 0.03) and got +51 % denser in shot 2 -- to the eye, "the camera moved away". The layer lives in camera space and is carried
  to a shot by similarity (the depth is stretched by d_shot/d_1 -- occlusion is kept).
- **The statistics box must be clear of the character.** The first snow measurement (the right 55 %) counted our hair as "large particles"
  in shots 2 and 3 (p99 15 / 32) -- for every shot, a box right of the character on both sides. If the density changes from box to box
  (our snow is sparse on the right: 195 -> 160), first compare the boxes within one shot.
Report: `personaj3d/README.md` (pass 8), `chiqish/kamera-audit-8.png`.

## 19. 2D thinking inside 3D -- a test where only the camera moves (3D, pass 9)

The user: "you have to make a fully 3D model, so that when the camera comes to that example position it is 1:1 ... if you treat it as
2D, when the camera moves things are likely to end up in the wrong place". Over eight passes six shape/background values tied to a shot, a view angle
or a frame had piled up (the eye card, the lower-face shift, the hair rest-shape blend,
the per-shot hood and following share, snow stuck to the camera, the background "top") -- each one improved the number in its own shot,
none of them shows in a single shot.
- **One world: only the camera belongs to a shot.** Everything else -- a constant, or a function of time (animation, physics) or of pose.
  The test: "would the object do this even if nobody were looking?" Shading that depends on the view direction (rim) -- allowed.
- **The test: pose and time are held, only the camera moves** -- continuously between the sample's cameras (~1.2 deg step) and around the head
  (10 deg). Not the picture but the WORLD is read: every part's sampled points from the scene graph; in every image the current points and
  those of image 0 are projected with the CURRENT camera -- the difference (px) from where the part should be were it rigid;
  against the previous image -- the step (a jump -- one big step, a slide -- consecutive steps).
- **Calibration.** With the known patches frozen at image 0, every part 0.0000 px (49 + 37 images) -- also a check that the list
  is complete. An artificial +0.1-unit shift -- exactly what an independent pinhole-camera model gives (0.000 %). On the first attempt the tool
  said 2.27 px and the model 3.77 px: the shift had been given on the character's local axis (the root turned 90 deg) -- the error was in the test.
- **The result** (320x180): the hood jumps 114 / 159 px when a key changes; the near eye jumps 33 / 36 px, and on the orbit slides up to 38 px
  along the face; the lower face 5.3 px; the hair slides up to 18 px per step at camera-to-head angles of 70..84 deg
  (98 px on the orbit); the snow walks with the camera (138 px at the end of the path, 398 px on the orbit -- no parallax); the background
  top tilted 22 deg in shot 3's camera. Neck, cloak, inner hair -- 0.00.
- **A convincing reason is a guess too.** Shot 2's snow is denser (+21 %, 235 / 195): the snow box ends at z <= 7, shot 2's camera
  is at z 10.2 -- outside. With the box around every camera (the same density) nothing changed: 245 / 195 / 186. The reason is open.
- **A contradiction between cuts is a measurement:** shot 2 to the face d 12.88, to the silhouette 10.32 -- the model's face/head ratio
  is not the sample's; one camera per shot, the difference is fixed in the model or reported as a residual.
- **The result (end of pass 9):** with the patches removed, the camera test is 0.00 px in every part (path and orbit). The hood
  is not per shot -- a POSE-dependent rig (key poses, Gaussian weights over a lagged pose): this too is one world
  (it does not depend on the camera); the pose-path test (the camera held, the pose continuous) -- no jumps. The residuals come from the sample's 2D
  production: the profile eye, the snow layer carrying across a cut, one sky plate for three shots.
Report: `personaj3d/README.md` (pass 9), `chiqish/kamera-sinov-9.{png,gif}`; skill `media-3d-consistency-audit`.

## 20. Parts separately -- the bare model first, then the layers (3D, pass 10)

The user: "you are not telling apart which is hair, nose, eye, brow, mouth, chin; do not measure the head down to the mouth and leave
the chin out; on our own model take the hair and the hood off and measure them one by one, then put them back and measure".
- **The list of parts -- before the measurement.** For every part in every shot: which measurement sees it? In this project the brow and the nose
  tip were measured nowhere, the chin tip and the part of the jaw toward the ear nowhere; in the head fit shot 1's chin was
  a single contour row. The face was fitted "down to the mouth" -- the jaw 17 px wrong, and no number showed it.
- **In ours the truth is known -- calibrate the tool on ourselves.** Named points of every part from the model (3D -> screen, 0.005 px
  against the page); the rule applied to the sample is checked on our render against those points: a constant offset (the piece centre
  -1.6, -3.7 px from the exact point) is the same on both sides -- it cancels; a large varying difference -- the tool found something else.
- **Bare first.** A render with the hair, the hood and the cloak hidden -- the head's own silhouette (the under-jaw line, the contour, the chin);
  then layer by layer: what ours has over the sample's VISIBLE face -- skin / hair / hood (in this project hair 16 / 18 /
  10 %). When a part is hidden in the dressed render -- it is measured as absent; in the bare one -- where it is.
- **The model's trace must match the render.** A silhouette of surface points taken only from the front came out 1.5-2.7
  px higher than the render scan (in shot 1 the jaw line comes from under the jaw at the middle of the head) -- the full azimuth; the row scan on average
  floor(y - 0.5) = y - 1.0.
- **The pose swallows a shape difference.** With only the lower-face landmarks and the pose free, the turn of shots 2 and 3 reached the bound (17 deg)
  -- the pose had been fitted with other things (hair, hood, mass); a penalty (x / 0.04 rad)^2.
- **Equal shot weights can sacrifice the main shot.** The sample's views do not fully agree with each other in 2D (the profile
  face ~20 % small relative to the head): at equal weights shot 1's chin moved 5-6 px. The main shot + a "the other must not get worse"
  penalty; the contradiction is written down as a residual.
- **The pose -- rig key -- scale chain.** When a shot's pose moves, the pose-dependent clothing rig changes in other shots too
  (shot 2's key came closer to shot 1's poses and brought back the 10 -> 11 scale jump) -- pose, rig and camera together.
- **When the metric does not match the look -- overlay the masks.** The hair coverage fell 14 -> 2 %, but the overlaid mask showed that in frames 1-9
  the old strand landed exactly on the sample's: one strand does not give 3/4 and the profile together -- the trial was not accepted.
Report: `personaj3d/README.md` (pass 10), `chiqish/qismlar-audit-10*.png`, `chiqish/soch-tutam-10.png`.

---

## The order of one pass

0. The scene (rule 15): what it does in every shot, where it looks, where the camera is -- rebuilt in 3D,
   checked on the render with the same code. The details after it. The mass (hair, clothing) -- by which part of ours
   the sample's light/dark lands on (rule 16). Together with the place, the SIZE and the JUMP from
   image to image are measured too (rule 17). The camera scale -- from the large mass, the background layer
   continuous across a cut; the figure scale in every pair (rule 18). In a 3D model only the camera belongs to a shot: after every pass a test
   where only the camera moves -- every part 0 px (rule 19).
1. `calibrate` — all PROVEN.
2. A jitter-free render → `probe` (every image) and `silhouette`: the largest differences.
3. For each one a sheet/grid/L table: what the probe touched (rule 7), what was read
   (rule 8).
4. The fix in the model's own parameters, with a measured number; a shape — by fitting
   (rule 9). The fitting model repeats the order of the render's layers exactly;
   everything added after the fit goes into the model and the fit is redone
   (rule 13).
5. Measure again: that probe, its neighbours, `motion`, `rhythm`, `diffmap`, `occlusion`.
6. Check with the ordinary (jittered) render; the before/after sheet (the `before` row —
   the delivered file, rule 11).
7. Write it in the card: what was measured, the before/after number, what was left open.

## Report of pass 10 (shot 1, 11 images)

Before — the file delivered in pass 9 (rule 11); both sides through the same path:
480×270 GIF → 320×180.

| measurement | before | after | sample |
|---|---|---|---|
| figure silhouette IoU (mean; worst) | 0.714; 0.63 | 0.872; 0.82 | — |
| figure map IoU | 0.89 | 0.95 | — |
| held pairs' motion (face box 72,22,140,112) | 0.00..1.12 | 0.00 | 0.00 |
| shot 1 trend | +14.6% | +39.6% | +14.3% (the reason: the hair — open) |

The probes were measured within pass 10 on PNG; their "before" is `ff-9`: the drawing of
pass 9 with the head placement of pass 10 (rule 11). The change of head placement
is not in this column.

| measurement | ff-9 | after | sample |
|---|---|---|---|
| hand tip x (with the fixed probe) | −8..+5, mean \|diff\| 3.00 | −1..−4, mean 2.36 | — |
| rigid landmarks (far edge, chin front; 1..6) | −1.2..+1.1 px | 0.0 px | — |
| mouth probe x, mean \|diff\| (1..11) | 1.66 | 0.71 | — |
| far eye mean \|diff\| x / y | 1.11 / 0.98 | 0.50 / 0.58 | — |
| under-chin column L | 19 | 8 | 7..9 |
| figure silhouette IoU / map | 0.697 / 0.92 | 0.871 (jitter-free 0.881) / 0.95 | — |
| shot 1 trend | +19.9% | +39.4% | +14.3% |

Open (next — the hair pass): the near strand's "(" mass over the face (6..9),
the sky between the strands on the far side, the hair movement in the held images,
the strand sliding off the near eye (anchor x +1.2..+3.5).

## Report of pass 11 (shot 1, 11 images — hair)

Before — the file delivered in pass 10 (the HOZIR ("now") panel of `oldin-hozir-10.gif` = the `ff-10`
render, film.html checked byte by byte); both sides through the same path: 480×270 GIF →
320×180 (`ff-10t`, `ff-11t`).

| measurement | before | after | sample |
|---|---|---|---|
| hair mask IoU (L>85, median 3; mean; worst) | 0.399; 0.30 | 0.639; 0.58 | — |
| `soch_osti` / `soch_ong` / `soch_yaqin_ichki` IoU (hair below / right / near inner) | 0.405 / 0.379 / 0.452 | 0.688 / 0.698 / 0.553 | — |
| figure silhouette IoU (`tana_ong`, the body's right edge) | 0.872 | 0.872 | — |
| held pairs' hair mask IoU (1..6) | 0.96..0.98 | 0.73..0.83 | 0.61..0.72 |
| light hair tone median / p90 | 100 / 122..124 | 100 / 101..102 | 99..102 / 103..104 |
| brow zones \|diff\| A / B / cheek (mean) | 0.566 / 0.248 / 0.019 | 0.046 / 0.021 / 0.004 | — |
| shot 1 trend (trimmed) | +39.6% (+91.0%) | +14.8% (+37.8%) | +14.3% (+31.2%) |
| pairs MAE | 0.0503 | 0.0424 | — |
| occlusion map IoU | 0.95 | 0.94 | — |
| band n% (the sky between the far side's strands) | 11.80 | 5.41 | — |
| anchor x / y, far eye x / y, mouth x (mean \|diff\|, px) | 2.19 / 1.27, 0.53 / 0.59, 1.15 | 2.15 / 1.59, 0.57 / 0.53, 1.03 | — |
| thin light (cheek, outside the hair mass; test/ingichka.py) | 417 | 743 (1167 with the thin arcs) | 803 |

Images 12..22 are the same as in pass 10 (the drawing unchanged; ±1 noise in the Chromium background).

Open: the near side's hair is a flat sheet — no inner strand shadows (in the sample the change
in the held images is exactly these shadows passing — pairs 0.73..0.83 → 0.61..0.72
come from here); the mid-tone strands on the forehead (L 70..85) — skin in ours; the shape of the
shadow over the near eye (in two pieces), anchor y −1.8..−4.3 px in images 4..6 (the shadow sticks to the eye
component); the hair of shots 2 and 3 is old; a face-shape pass (eye width 13 vs 9,
eyelid, nose, mouth).

## Report of pass 12 (shots 2 and 3 — the hood)

Before — the file delivered in pass 11 (the HOZIR panel of `oldin-hozir-11.gif` = the `ff-11` render);
both sides through the same path: 480×270 GIF → 320×180 (`ff-11t`, `ff-12t`).

| measurement (shot 2 \| shot 3) | before | after | sample |
|---|---|---|---|
| lining band in-place IoU | 0.00 \| 0.04 | 0.67 \| 0.67 | — |
| wedge in-place IoU | 0.52 \| 0.36 | 0.91 \| 0.86 | — |
| wedge area (the hood tool) | 2418..2556 \| 1275..1617 | 727..738 \| 356..735 | 745 \| 663..838 |
| band thickness 19..22 (px) | 2.4..5.8 | 19.3..21.6 | 19.8..21.2 |
| top-right corner (the peak probe) 17..22 | (205..225, 0..14) | (220..233, 23..30) | (225..238, 29..35) |
| tone classes mass IoU: outer / lining / inside / face / hair (shot 3) | 0.70 / 0.21 / 0.15 / 0.10 / 0.20 | 0.81 / 0.28 / 0.23 / 0.26 / 0.27 | — |
| tone classes mass IoU (shot 2) | 0.66 / 0.06 / 0.18 / 0.22 / 0.33 | 0.70 / 0.15 / 0.18 / 0.21 / 0.33 | — |
| light-area centre difference, 12..22 mean (px) | 18.7 | 7.7 | — |
| block motion vector difference, shot 3 (px/pair) | 1.58 | 0.68 | — |
| occlusion map IoU 12-13 / 14-22 | 0.90 / 0.90 | 0.91 / 0.92 | — |
| shot 3 trend; pairs MAE | −14.3%; 0.0448 | −21.0%; 0.0501 | −17.7% |
| whole-clip trend; MAE | −14.6%; 0.0425 | −17.6%; 0.0458 | −14.7% |

Shot 1's drawing is unchanged: the raw render ±1 (Chromium), the probes exactly the same on the raw render
(anchor 2.08/1.52, mouth 0.71/0.68). On the GIF path mouth x 1.03 → 1.18: the palette is one
for the whole clip — when shots 2-3 change, shot 1's dither moves.

Open: in shot 3 the head is larger than the sample's and in another pose (in the sample from below, bent; the face
bottom-left, a dark collar under it) — the chin leaves the frame, the face's left edge is the rim's vertical
line; the near snow passing over the cloak (ours is behind the figure); the cloak folds are
thin diagonal lines (ovals in ours in shot 1); shot 1's hood (the wedge tip ~8 px lower in images 6..10).
