# For code-video, from the line vision
(rewritten 2026-10-04, room 22's entries cited 2026-10-05, room 27's on 2026-10-05, against your `ff977c2`, public `main` as the workshop's clone still holds it; from rooms 13 (GPT Astra + SAM 3 auto-labelling, read again with its Policy), 22 (DINOv3 + SAM 3.1 visual search, read again with its Policy), 27 (Muhammad Rahman Shahid's apple counter, read again with its Policy), 4 (Airplane turnaround analytics), 10 (Drone herd counting) and 9 (Marigold video depth); entries e0066, e0068, e0069, e0072, e0077, e0078, e0079, e0096, e0097, e0099, e0101, e0147, e0149, e0150, e0151, e0183, e0184, e0185, e0210, e0212, e0213, e0215, e0094 linked from the line `video`, e0146 from the line `ai` and e0211 from the line `dataviz`)

## What this line has for you

One room read a vendor's demo of automatic labelling: 1,430 segmentation masks in 71.5 s,
boxes from a vision-LLM and masks from SAM 3, shown on one drone clip of one utility pole
[room 13 s1, s2]. The pipeline is not for you; you label no footage and train no model. What
is for you is how the room took the demo apart, because both of its measurements are checks
you can run on your own films, with the film's data as the truth. It divided every count the
film printed by its frames and compared the result with what can physically be in the
picture, and it looked at every frame instead of one a second, which is where a mask that
vanishes for a frame shows [room 13 s2] (e0151). In oq-kocha the first becomes a count per figure
against the shot's `two`, the second the same count on every frame of a shot. Both read a
buffer you already render. The room also left a lead: a film drawn with code knows which
object every pixel belongs to, so it can be the exact truth a labelling model is scored
against [room 13 s2, s16]. The room had not read your code. The line has: your material
pass is that truth already, with three gaps listed in item 3. Whether anything is scored
against it is the owner's decision (question 1).

A second room read a "visual search engine": SAM 3.1 cuts every instrument on a tray out,
DINOv3 embeds each cut-out, and the rest are ranked by likeness to one [room 22 s2, s4]. The
library keeps the technique (e0185), the open model for it (e0184) and why its scores carry no
threshold (e0183). It adds nothing to take. Your material buffer already knows every object, and
`style/leaves-the-drawing-alone` already pins identity across your two styles to the pixel
(`oq-kocha/test/checks-style.mjs:52-72`). The one thing an embedding could add, whether a
figure still reads as itself in the other style, is costed under "Not worth taking" so it is
not researched again.

A third room read an apple counter's film: a detector boxes the fruit, a tracker follows it, a
drawn line counts it once, and a panel prints totals and shares [room 27 s1]. None of it is
for you as code; you count nothing and train nothing. What is for you is the room's habit:
every figure the panel printed was set against its other figures and against the picture (e0215).
Two failed outright: the shares are floored, so they sum to 99, and a "real-time" panel prints its
own rate as 1.2 to 1.4 FPS. The total could not be settled from the picture, even by a photo-finish
of the line (e0210) [room 27 s1, s2]. The library also keeps how such a counter is built right
(e0212) and why Ultralytics' YOLO is not used here at all (e0213). Your films print almost no
figures. The one that prints measurements, not-a-measurement, says they
are real, and five of its eight have no source in your tree: item 4.

A fourth room read a demo that claims to log a 40-minute airplane turnaround from video: a vision
model for the states, a tracker for the vehicles, optical flow for which way the bags go
[room 4 s1]. The video is a time-compressed replay and shows none of the pipeline [room 4 s2]. The
library keeps the anatomy (e0070), and two parts of it are yours. First, frame differencing says
*that* something moved and never *which way*. Its proof is the frames played backwards (e0066).
Your `detail/snow-falls` is that kind of check: it would pass on snow that rose. That is item 5.
Second, the same drawn truth as item 3 has an event-time half. Your film knows every state change
to the frame, so a video model's timing can be scored against it (e0072). That joins item 3,
behind the same question 1.

A fifth room read a vendor's 30-second ranch film, which claimed live herd counts from drones
[room 10 s1, s2]. It held every number the film printed against the size, geometry and time of what
the picture shows, and the numbers failed by a factor of ten: a "150 m" line over about 15 m of
grass, and an altitude that climbs while the cow under it grows (e0079). Your films draw few
numbers on the picture, all in not-a-measurement. The rule is yours already: a printed number is held to a witness
it does not compute. The line `video` holds its clock and its `560 px` bracket (its item 25), and
item 4 here holds its readout's source. Nothing else of the room is for you, since you count
nothing; why is under "Not worth taking".

A sixth room read a post about a depth model fine-tuned for depth of field in film [room 9 s1]. The
library keeps what it found: the open video-depth models with their licences, data and cost a frame
(e0097, e0096), TAE as the check of a depth video against its camera (e0099), and how to read a
comparison clip (e0101). None of it is for you as a model or a metric. oq-kocha already computes the
exact distance of every pixel along its camera's ray and shows it as debug channel 6
(`oq-kocha/src/comp.frag:208`), and your style check already holds that depth buffer fixed across
styles (`oq-kocha/README.md:118`). The room's steadiness score from frames alone is the line `video`'s
(e0094); its page for you takes it in its item 4. The rest is under "Not worth taking".

Where to start: item 1, then item 2 in the same loop; item 5 stands apart and is the smallest;
item 4 stands apart and needs no render; item 3 only after question 1.

How to read it. `[room 13 s2]` is room 13's source s2. Every `path:line` is yours at
`ff977c2`. The line read your code and ran none of it, so every floor and every cost below
is to be set by a first run. Check names are proposals in your idiom. The line `video` keeps
its own page for you; where an item here touches one of its items, it says so. Effort: S an
afternoon, M days, L weeks. No patch exists; ask for one in the line's log.

## Worth taking

1. **Instances per frame: count each figure, against the shot's own `two`** (e0151; ours, as
   it is). The room's
   division: a count the film prints, over its frames, against how many of the thing can be
   there. 489 transformer masks over 480 frames with one transformer in view is at least 9
   too many; a ratio below the physical count is a miss [room 13 s2].
   Your shot list states the physical count: `two:0` or `two:1`, with `B:[…]` where the
   second figure stands (`oq-kocha/src/shots.mjs:5-26`), handed to the shader as `uTwo`
   (`oq-kocha/tools/mkfilm.py:250`, `oq-kocha/tools/build.mjs:115`). Nothing counts it back
   from the picture. `occupancy/<shot>` pools both figures: `CHARACTER` is materials 1 to 6
   and 16 to 26 together (`oq-kocha/test/browser.mjs:52`), and the check passes above 1 % of
   the frame (`oq-kocha/test/checks-render.mjs:99-105`). A two-shot whose second figure is
   out of frame or behind a building passes on the first figure alone.
   → How: `figures/<shot>` beside `occupancy/<shot>`. From the material buffer
   (`pixels(f,W,H,{},1)`), the area of A is the pixels with material 1 to 6, the area of B
   those with 21 to 26 (the second character's ids are the first's plus 20,
   `oq-kocha/tools/build.mjs:96`, `:128`). Leave 16 to 20 out: the face decal writes the same
   ids for both figures (`oq-kocha/src/geo.frag:293-323`). Measure the number of figures
   whose area is above a floor; pass when it equals `1 + sh.two`. Two broken states, one per
   direction. Too few: the lifted camera `occupancy` already uses (`checks-render.mjs:106`)
   must read 0. One short of the truth: a knob in `OPT` (`mkfilm.py:386`) that overrides the
   shot's `two` where the uniform is set (`mkfilm.py:250`); with it at 0 a two-shot must read
   1, which is the case `occupancy` cannot tell from a good frame.
   → Where: `oq-kocha/test/checks-render.mjs`, one knob in `oq-kocha/tools/mkfilm.py`.
   → Effort: S.

2. **Dropouts counted on every frame of the shot, not at its midpoint** (e0151; ours, as it
   is). The room's
   per-second frames showed nothing wrong with the pole's mask. A sheet of every frame, the
   tile's index equal to the frame number, showed it missing in at least 12 of 160 frames,
   ten of them inside the first 21, under a printed confidence of 0.90 [room 13 s2].
   `occupancy/<shot>` looks at one frame per shot, `Math.round((STARTS[i]+sh.d*0.5)*FPS)`
   (`oq-kocha/test/checks-render.mjs:98`). A figure that leaves the frame for three frames
   of a walk is not seen. Nor is one the other covers in `o'tish`, where the two close from
   1.90 to 0.40 apart and A, at z 0, stands nearer the camera than B at 0.12
   (`oq-kocha/tools/mkfilm.py:240-241`, `oq-kocha/src/shots.mjs:23-24`).
   → How: `presence/<shot>`: item 1's per-figure areas on every frame of the shot; measure
   the number of frames in which a declared figure is under the floor; pass at 0. The broken
   state is one frame, because one frame is what a sample misses: the options are given per
   call (`oq-kocha/test/browser.mjs:40-44`), so run the loop again with the lifted camera on
   a single frame, and the measure must read exactly 1.
   → Cost, unmeasured: 350 more renders, each replayed from frame 0 with only the last step
   drawn (`oq-kocha/tools/mkfilm.py:388-390`), on a suite that already took 43 and 75
   minutes on your runners (`checks-render.mjs:37-40`). Take the buffer smaller than the
   200×144 of the other checks, calibrate on the shortest shot only, and time it before it
   goes into the audit.
   → The line `video`'s item 10 asks the same buffer for the first and last frame a figure
   is on screen. One loop over the shot gives both: its span, and the holes inside it.
   → Where: `oq-kocha/test/checks-render.mjs`.
   → Effort: S.

3. **The film's own truth as files: its mask for a labeller, its timeline for a video model**
   (e0072; ours, as it is; a scoring run only on the owner's key; only after question 1). Room 13's lead: render a shot twice, once as the film and once with every
   object in a flat colour; the second render is the mask of every object in every frame,
   and against it a labelling model gets overlap, misses, inventions and dropouts per class
   instead of a showreel. Nothing published does this for a vision-LLM's boxes turned into
   masks; what exists measures boxes on everyday classes (mAP50 0.768 on auto-labels against
   0.817 on people's) [room 13 s16]. The one public comparison of two labellers scored both
   against masks one of them had drawn, and its one large lead sat where that bias would put it
   (e0149) [room 13 s22]. Your buffer is a reference no labeller drew.
   You render that second pass already: pass one writes the material id of every pixel
   (`oq-kocha/src/geo.frag:351`), `__matFrame` shows it (`oq-kocha/tools/mkfilm.py:378`,
   `oq-kocha/src/comp.frag:198`), and `checks-world.mjs` reads it throughout. As truth for an
   outside model it has three gaps:
   - It names materials, not objects. Coat, boot, skin and blade are 1 to 4, snow 10, a
     building 11, a window 12 or 15, parapet and lamp post 13, road 14, the lamp 15
     (`geo.frag:74`, `:139`, `:161-179`, `:347`). Every building is 11; the cell index that
     tells one from the next exists (`geo.frag:151-155`) and is not written out. Class truth
     is there today; truth per building needs that index in a channel.
   - It does not say whose face. Ids 16 to 20 are written for either figure
     (`geo.frag:293-323`), and offsetting the second by 20 would pass the 32 the channel is
     scaled to (`geo.frag:351`). A mask of "figure B" takes the face from position, or the
     buffer gets a second channel.
   - The picture has weather the buffer does not. Flakes and fog are laid over in pass two
     (`oq-kocha/src/comp.frag:185-194`), so the truth says "coat" under a flake. For scoring
     that is the right truth, and `fog` and `snow` are knobs already (`mkfilm.py:386`): the
     same frames with and without weather are a variable for free.
   → How: a script that writes, for thirty frames of one shot, the picture and the material
   buffer as two lossless PNGs of the same size, and one legend file (id → name, from
   `characters/*.json` and the list above). The mask never goes through a video encoder:
   an id is a value, and lossy coding changes values. Its own check, before any model sees
   it: the truth shifted by ten pixels must score lower against itself than unshifted.
   → The event half, from room 4. Nobody publishes how late or early a video model logs an event:
   the open turnaround pipeline is "not yet … validated using large-scale independent manual ground
   truth timestamps" [room 4 s14], and its vendor offers times "to within a sampling step"
   [room 4 s8]. Your film knows every state change to the frame before it renders. The truth file is
   the line `video`'s item 22: `SHOTS` as the camera lane and `ACTS` as what each figure does, in
   frames (e0064, linked into this library). Hand a model the film, collect its `{state, start,
   end}` per lane, and score each event's error in frames, its misses and its inventions. Do it per
   sampling rate and per price. The broken state: the truth moved by 48 frames must score worse.
   At list prices a native-video model reads about 100 tokens a second of film, so a minute is
   about 6,000 input tokens, a fraction of a cent on the cheapest (e0069) [room 4 s15, s18].
   Room 4 calls this the cheaper first proof of the two halves.
   → The scoring run is not yours. A room does it with the owner's key and brings back the
   table.
   → Where: `oq-kocha/tools/`, or beside the export the line `video` proposes
   (`loyihalar/tools/`); the truth file comes from `oq-kocha/src/shots.mjs` once item 22 of the
   line `video` has given it `ACTS`.
   → Effort: S for the files and the legend; S more for the building index; the event file is S
   once `ACTS` exists.

4. **A figure printed on the picture stands in its source: not-a-measurement's readout** (e0215,
   e0079; ours, as they are). Room 27 recomputed every figure the apple film printed from its
   other figures and from its own picture. The shares are floored: 1 of 157 prints 0%, and the two shares sum to 99. The
   panel prints its own rate, 1.2 to 1.4 FPS, under a post that says real-time [room 27 s1,
   s2]. A figure on screen is a claim, and it is checked against where it came from. Room 10
   held a film's printed numbers against its own picture the same way (e0079) [room 10 s2]. The
   line `video`'s item 25 takes this film's other printed numbers, the clock and the bracket, with
   a reader of the draw calls. This item keeps the readout.
   Your one film that prints measurements does it in its `data` cut, under "A NUMBER YOU HAVE
   NOT CALIBRATED" (`not-a-measurement/not-a-measurement.html:93`). There are four rows, before
   → after (`:102-107`, drawn at `:283-296`), introduced as "Real figures from the work this
   manifesto came out of" (`:100-101`). Nothing binds them. At `ff977c2` three of the eight
   stand anywhere else in your tree. Flatness 0.483 → 0.091 is the before and after of
   `skills/media-audit-reality/SKILL.md:249`. −19.7 dB is bir-tomchi's volcano after the change
   that made it quiet on a phone (`bir-tomchi/bir-tomchi.html:956-958`). Roughness 0.213 →
   0.040, sharpness 1.93 → 1.27 and −16.8 dB are found nowhere else, searched as numbers. The
   card counts a fixed list of tables and `READOUT` is not on it
   (`loyihalar/tools/sanoq.mjs:58`), so `karta/sanoq-bilan-mos` cannot see these rows.
   → How: `karta/yozuv-manbada` beside `karta/sanoq-bilan-mos` (`loyihalar/test/run.mjs:25-33`),
   in its idiom. The card names the file each row came from, one field in
   `kartalar/5-not-a-measurement.json`. The check reads `READOUT` out of the film's source and
   measures how many printed figures do not stand in their file, with the card's own `nums`
   (`loyihalar/tools/karta.mjs:49`); pass at 0. The broken state is the neighbour's: one figure
   with a digit changed must measure 1 (`run.mjs:30-32`). On day one it measures 5; what
   happens to those five is question 3. A figure that stands in prose proves where it came
   from, not that it was measured. The stronger form, a figure one of your checks produces, is
   out of reach for these today.
   → The page's line under the film, `16.8 s · 8 kadr · 100 BPM` (`:71`), is typed by hand and
   true today: the cuts sum to 16.8 s, there are eight, and `BEAT` is 0.6 s (`:86-98`). The same
   check can carry it as three more rows against `TOTAL`, `CUTS.length` and `60/BEAT`.
   → One more printed figure that cannot tell the truth, outside the cards, and it is e0215's
   second check turned on yourselves (a printed rate against the frames really made): masofa-maydoni's
   meter takes its frame time from `dt` after the clamp to 0.05 s
   (`masofa-maydoni/masofa-maydoni.html:859`, `:863`). So it never prints more than 50 ms or
   fewer than 20 fps (`:866`): a machine that draws five frames a second still reads 20. Take
   the interval from `now-last` before the clamp, and the meter reads the page's real rate.
   → Where: `loyihalar/test/run.mjs`, `loyihalar/kartalar/5-not-a-measurement.json`, the
   reader in `loyihalar/tools/karta.mjs`; one line in `masofa-maydoni/masofa-maydoni.html`.
   → Effort: S for the check and the meter. Finding or measuring the five figures again: not
   known.

5. **The snow falls, proven by its direction: the sign of the motion, and the frames reversed as
   the broken state** (e0066; inspiration, our own code). Frame differencing in a region says
   *that* something moved, never *which way*: on and off give the same spikes. Direction is the
   sign of the motion along the region's axis, and its proof costs nothing: play the frames
   backwards and the sign must flip [room 4 s14, s1].
   Your `detail/snow-falls` is a frame difference. It takes a held pair, two consecutive frames of
   one drawing (`pairs()`, `oq-kocha/test/checks-world.mjs:48-58`), and measures the share of wall
   pixels (materials 11 and 13) whose luminance moved by more than 6. It passes above 1.5 %, and its
   calibration is the same pair with `{snow:0}` (`:292-309`). `Math.abs(lum(A,i)-lum(B,i))` is the
   same with A and B swapped (`:298`). So snow that rose, or flakes that flickered in place, pass as
   well as snow that falls: the name says "falls", the number says "changes".
   What falls is known exactly. The shader moves every flake layer along
   `fall=normalize(sFlakeDir)` at `sFlakeSpeed/sFlakeScale` screen heights a second
   (`oq-kocha/src/comp.frag:177-183`). Both styles set `FlakeDir` to (−0.8, −1.0)
   (`styles/oq-qalam.json:145-148`, `styles/tekis-cel.json:145-148`). `sp` is
   `gl_FragCoord.xy/iRes.y` (`comp.frag:37`), so y is up, as `readPixels` returns the rows
   (`oq-kocha/test/browser.mjs:47`). With oq-qalam's speeds 11 to 24 and scales 23 to 58
   (`oq-qalam.json:113-116`, `:129-132`), at 24 fps (`oq-kocha/src/sheet.mjs:7`) and 173 rows
   (`checks-world.mjs:14`), a flake moves about 3 to 3.5 px a frame along (−0.62, −0.78): left and
   down. That is computed from the constants, not run.
   → How: `detail/snow-direction` beside `detail/snow-falls`, in its idiom. For each frame of the
   held pair, the flake layer is the picture minus the same frame with `{snow:0}`, kept on the wall's
   pixels. Find the integer shift within ±6 px that best maps the first layer onto the second
   (least absolute difference). The measure is that shift projected on the declared fall, in pixels.
   Pass above 1. The broken state is the same pair in reverse order, which must measure below −1;
   with it, `snow-falls` finally proves the word in its name. Match the layer, not the picture: on the
   picture the static wall wins, and the best shift is 0.
   → Where: `oq-kocha/test/checks-world.mjs`, after `:309`.
   → Effort: S. It costs four more renders at 240×173, two of them with `{snow:0}`.

## Not worth taking

- **The demo's pipeline** (vision-LLM boxes, SAM 3 masks, a small RF-DETR Seg model trained
  on them: e0150, e0148). It labels footage and trains a segmenter; you do neither. It is also
  a menu option at Roboflow and open under Apache-2.0 as Autodistill, and every part needs a
  paid key, a gated checkpoint with a CUDA GPU, or a GPU to train [room 13 s8, s11, s14].
- **A segmenter as a way to measure your frames, or to find an object in them.** SAM 3 on a
  frame of oq-kocha would estimate what `geo.frag:351` writes exactly and for nothing; that
  it now runs on a Mac as well as a CUDA GPU changes nothing here, and it still has no CPU
  path [room 22 s9-s12]. Searching a frame for "the same object" by its features, as the
  tray demo does (e0185), is a material id you already hold. An outside model belongs on the other
  side of item 3, as the thing being scored.
- **A feature distance between your two styles.** Today the style checks ask two things:
  that no material pixel moves between `oq-qalam` and `tekis-cel`
  (`checks-style.mjs:52-72`), and that the two differ by more than 8 mean levels
  (`checks-style.mjs:85-99`). Neither asks whether figure A still reads as A in the other
  style, and an image embedding could. The smallest proof: crop each figure by its material
  ids in both styles, embed the crops with DINOv2-small (Apache-2.0, an ungated ONNX copy
  that runs in Node; ship Meta's LICENSE beside it, and never DINOv3 until the owner accepts its
  licence: e0184 [room 22 s19, s20]), and pass when A's two styles are nearer to each other
  than A is to B; the broken state is the two figures swapped. The pass is relative on purpose:
  one model gave the same crops cosines from 0.14 to 0.64 by its CLS token and 0.35 to 0.92 by
  its patch mean, and its 8-bit file moved an object four places, so no fixed number would mean
  the same on the next file (e0183) [room 22 s20, s21]. That is the room's own lesson
  turned round: a likeness test means something only when the scene holds a true match, cut
  out apart from the query, and a near miss. On the tray the one near-duplicate went into the
  query's own mask [room 22 s4]. Your two styles of one figure are a true match, and your
  material ids cut each figure out exactly, so that failure cannot happen here. Not taken,
  because of what it costs: the suite's first dependency beside Playwright
  (`oq-kocha/package.json:12`); 0.86 s a crop one at a time, 0.47 s each in a batch of 16,
  on 2 vCPUs, and 88.5 MB of model (24.4 MB at 8 bits, no faster one at a time) [room 22 s20, s21]; and a threshold on model floats that nobody has checked are the
  same on every machine, in a suite that dropped its last wall-clock check because it
  "reported the runner's luck" (`oq-kocha/test/browser.mjs:20-24`). Worth a room only if the
  owner asks for "reads as itself" across styles; measure the floats on two machines first.
- **The room's contact sheets, read by eye.** They are the tool for someone else's film,
  where there is no buffer to ask; the room's own counts are floors for that reason
  [room 13 s2]. Yours are counted by program (items 1 and 2).
- **An id pass for the four Canvas works.** They have none: `sanoq` counts draw calls in the
  source (`loyihalar/tools/sanoq.mjs:7-9`, `:51-56`) and `olchov` measures the finished
  picture (`loyihalar/tools/olchov.mjs:50-94`). Giving each a second canvas painted in flat
  colours is M per work, and nothing asks for it until item 3 has shown a table worth having.
  The cheaper route an outside run used, a layer's alpha channel as its object's mask (e0072)
  [room 13 s22], needs one layer per object. mushuk and bir-tomchi draw each scene through one
  2D context (`mushuk/mushuk.html:43`, `bir-tomchi/bir-tomchi.html:48-49`), so their alpha is
  the whole scene.
- **The SAM licence.** It binds whoever passes on SAM 3's weights or a fine-tune of them;
  masks made with it are not among the licensed materials, by the room's reading
  (e0068) [room 13 s8]. You ship no weights.
- **The layered reader itself, a tracker, or hosted SAM 3 video** (e0070, e0067, e0068). They read
  footage nobody drew: a model for states, a tracker for identity, motion for direction. Your films
  hold all three by construction: the shot list and acts say the state, the material ids say who,
  the shader says which way. A tracker on your frames estimates what `geo.frag:351` writes exactly.
  On the far side of item 3, as the thing scored, they are welcome.
- **An optical-flow library for item 5.** Dense flow earns its cost on footage with texture
  everywhere. Your flakes can be rendered apart from the picture (`{snow:0}`), and a shift search
  over one isolated layer is twenty lines and no dependency. The suite keeps its one dependency,
  Playwright (`oq-kocha/package.json:12`).
- **The turnaround demo's lanes, Gantt and event log as a design.** The room's policy says no frame,
  overlay or layout of it is used [room 4 verdict]. The shape you can take, lanes of states that tile
  the film with the log derived, is the line `video`'s item 22, in its words (e0064).
- **The counting panel's other checks**: shares that sum to 100 and never print 0% for a
  non-zero count (e0215; the rule that keeps a panel from failing it is the line `dataviz`'s
  e0211), a label that holds once it has settled (e0080), and a printed count against a
  photo-finish of its line (e0210) [room 27 s1]. Your films print no shares, put no labels on objects
  and count nothing across a line. The one share in your tree, the palette's `ulush`, is rounded
  and not floored (`loyihalar/tools/olchov.mjs:44-45`), and it is shown only as swatch widths
  (`loyihalar/tools/katalog.mjs:37`). Nobody crosses a line in your films either: in `o'tish`
  the two close and do not pass (`oq-kocha/tools/mkfilm.py:240-241`). The slit itself is the
  line `video`'s item 23, a `slice` helper in `browser.mjs`. If a film of yours ever counts
  things crossing a line, that slice read from the material buffer counts them exactly
  [room 27 s1]. A counter's rules then give its broken states: a figure that steps on the line
  and back, one that vanishes for a frame mid-crossing, one that crosses backwards (e0212)
  [room 27 s8].
- **A detector, a tracker or YOLO26 anywhere in the suite.** You count nothing. YOLO26 and every
  fine-tune of it are AGPL-3.0, and Ultralytics' terms want the paid licence even for internal tools
  and unpublished R&D, so not even a check of yours runs it (e0213) [room 27 s4, s6]. Where a
  detector is ever needed, the open one is RF-DETR (e0148). The same goes for a point
  counter (HerdNet, whose weights are research only, e0078) and for asking a vision-language model
  how many: above 50 objects it is exactly right 13.9 % of the time (e0077) [room 10 s6, s11].
- **A drawn film of room 10's contradictions, as a fixture.** The room's policy offers it: rebuild
  the ranch film's broken numbers in a film drawn with code, where the true values are known
  (a ruler, an altitude against size, a horizon, a count-up counter, one clock across seasons, one
  header across a cut). The film itself is Higgsfield's and is never a fixture [room 10 verdict].
  Such a film would test a demo-audit tool, and nobody builds one (e0079, "When to use it"). Your
  own checks already have their broken states. Worth a room only if the owner wants that tool.
- **A depth model, TAE, or depth of field from estimated depth** (e0096, e0097, e0099). Pass one
  computes `t`, the ray distance, for every pixel (`oq-kocha/src/comp.frag:208`): a model would
  estimate what you hold exactly, and the one with weights whose own licence allows commercial use has
  a non-commercial dataset in its training (e0096). TAE moves each frame's depth into the next by the
  camera and scores the mismatch. Yours is measured along that camera's own rays, so it agrees by
  construction, and the score would say nothing (e0099, "Limits"). If a style ever wants optical depth
  of field: blur by |t − focus| from one sample's depth per pixel, never an anti-aliased one, or every
  silhouette gets a halo at a distance that belongs to neither side (e0097). Your two styles draw
  ink lines and cels, so nothing asks for it.

## Open questions for the owner

1. **Do we score a model against a drawn film at all, and with which key?** The mask half
   needs an OpenAI key or a Roboflow account. Thirty frames cost about $1.2 to $2.4 with a
   vision-LLM's boxes and SAM 3 (e0150); Roboflow's own charge is $0.004 an image at $4 a
   credit (e0147) [room 13 s20, s21]. Roboflow only on a paid account in a private project,
   which licenses Roboflow to train on what is uploaded: your drawn frames, nothing else
   (e0147). Scoring trains no model, so OpenAI's clause on training from its Output is not
   met (e0146). The event half needs one native-video key: about 6,000 input tokens a
   minute of film, a fraction of a cent (e0069) [room 4 s15, s18]. Rooms 13 and 4 both name the
   event half the cheaper first proof. OpenAI's and Roboflow's terms are read now; any other
   provider's (a native-video model's) are read before the first call
   (room 4's policy). Yes unblocks item 3 and a room to run the scoring; no leaves items 1, 2, 4 and
   5 standing, which need nothing from outside.
2. **Classes or objects?** Is "coat, boot, skin, building" the truth to score against, which
   the buffer holds today, or "figure A, figure B, this building", which needs the face and
   the cell index of item 3? Unblocks the size of item 3.
3. **Is not-a-measurement's readout a measurement or an example?** Five of its eight figures
   have no source in your tree (item 4). If it is a measurement, they are found or measured
   again, and item 4 passes at 0. If it is an example, the film says so where the rows are
   drawn, and item 4 holds only the rows that claim to be real. Unblocks item 4's pass mark;
   the check itself can be written before.

---
*From the line "vision" (Vision) of the Labs workshop, kept by its keeper from what the line's rooms sent. Edited there, never here: `labs rooms pull` brings the newest.*
