# For code-video, from the line 3d
(written 2026-10-04 against your `ff977c2`, still the remote's head at the workshop's last fetch; from room 15 (image-to-3dlab) and room 3 (UniMate, text-to-motion), whose Policy sections each item carries; two patches beside this page, for items 3 and 1, both proved through your own commands and both yours to apply as they are; since 2026-10-05 each item names its entry in the line's library: item 1 e0265, item 2 e0269, item 3 e0274)

## What this line has for you

Two rooms read other people's 3D:
- room 15: a local image-to-3D lab, with the C++ port of its model under it [room 15 s2, s3];
- room 3: a research model that animates rigged characters from a sentence [room 3 s3, s4].

You draw with a distance field, take no mesh and draw your walk by hand, so neither tool is for
you. What is for you is how each one measures what it made. Each room has written its measure
into your tree as a patch, and run your own commands on both sides of it.

- **Contact from the pose (item 3).** The motion paper finds a planted foot from the pose
  itself, and room 3 ran that rule on your `poses.json`. Today a timing chart with its second
  half re-timed passes every check run on it: the four sheet checks, the five audio checks and
  the card's. With the patch, two checks fail on it and the film is unchanged.
- **Silhouettes against the document (item 1).** The image-to-3D port proves a model is the
  one its picture asked for by projecting it back and comparing silhouettes. Room 15 did that
  for your walker: his character file is marched on the CPU and compared with the mask your
  renderer draws.
  - With the patch, your render checks print `figure/matches-sheet PASS 0.979`, against a
    known-bad of 0.641 from the next drawing.
  - With the picture one drawing off the sheet, the check fails at 0.645.
  - Without the patch, your thirteen render checks pass that fault.
- **The run record (item 2, read and not run).** The lab's run record, whose reason is
  "parameters can lie", describes the state your cards' measured block is in.

What has been run:
- Room 15's four harness runs are the first full tables of your render checks in the workshop.
  At `ff977c2` the thirteen pass in 560–615 s on four CPUs [room 15 s16].
- Your world and style checks have not been run by anyone here. Room 3 started your full
  audit, 41 checks, and stopped it after twenty minutes with no table [room 3 s13].

How to read the citations:
- `[room 15 s2]` is room 15's source s2, with paths at image-to-3dlab `5ed8e98`.
- `[room 15 s3]` is pixal3d.cpp at `d1b4926`.
- `[room 15 s16]` is room 15's runs on your tree: `ref2.out.txt`, `dump.out.txt`,
  `render.out.txt`, and its `README.md`.
- `[room 3 s3]` is UniMate at `5d6aabe`, and `[room 3 s4]` its paper as text.
- `[room 3 s13]` is room 3's runs on your tree; `§n` is a section of its `patch.out.txt`.
- Every other path is yours, at `ff977c2`.

The copies of the patches here are the rooms' files, with their blank context lines written as
empty lines; `git apply` reads them the same. Apply them at the root of your tree. File, field
and check names below are proposals in your idiom; ask in the line's log for anything else.

Each item says what it may be used as. That comes from its room's verdict, its Policy section:
- **Item 3: as it is.** Patch 1 is ours and owes no notice.
- **Item 1: as it is.** Patch 2 is ours, with one credit to add.
- **Item 2: inspiration only.** Take the shape, write the code.

Where to start:
1. Item 3: apply patch 1, run `npm run audit:fast`, add its three rows to the README.
2. Item 1: apply patch 2, add "(iq)" beside its three distance functions, run
   `checks-render.mjs` once and expect the row below, add it to the README.
3. Item 2's source hash on the cards.

## Worth taking

1. **The figure on screen checked against the drawing its document names: silhouette IoU
   against a reference marched from the character file, with the next drawing as the
   known-bad. A patch, proved in four runs through your harness:
   `code-video.patches/2-figure-matches-sheet.patch`.**

   **In the library:** e0265, as it is (keep "(iq)" beside the distance functions).

   **Where it comes from.** pixal3d.cpp's `tools/silhouette_iou.py` projects the finished model
   through the camera the generator used. It compares the silhouette with the input's alpha as
   intersection over union, and exits 1 under `--min-iou`. Its header says why: a run that
   finished is no evidence. On 2026-09-08 a missing `mesh_scale` gave a non-empty model that
   scored 0.107 (`:2-23`) [room 15 s3].

   **Your side.** Nothing says the figure drawn is the drawing the sheet has up.
   - The sheet checks read `poses.json` and no pixel (`oq-kocha/test/checks-sheet.mjs:1`,
     `:24-28`). Your own comment says what that cost: foot-plant "is arithmetic on the sheet
     and never looks at a pixel" (`oq-kocha/test/checks-world.mjs:76-80`).
   - The renderer checks read pixels and no pose. `occupancy/*` counts character pixels and
     passes above 1.0 % (`oq-kocha/test/checks-render.mjs:99-106`); `detail/cloak-moves` asks
     a centroid to move (`checks-world.mjs:311-323`).
   - The proof that the generated character equals the hand-written one, `equiv.mjs`, is named
     in `oq-kocha/README.md:42-43` and is not in the tree.

   → **The patch: five files against `ff977c2`.** `oq-kocha/test/checks-render.mjs` gains
   `figure/matches-sheet`.
   - **The rendered mask** is the one occupancy counts: `CHARACTER(matOf(…))` over
     `pixels(f,200,144,{},1)` (`checks-render.mjs:100-101`, `oq-kocha/test/browser.mjs:52-53`).
   - **The drawing** is the one the film reports, `state(f).idx`, asked and never recomputed
     (`browser.mjs:57-62`, `oq-kocha/tools/mkfilm.py:392-398`). It is taken at the first frame
     of each of the eight drawings in `yurish`.
   - **The reference is drawn from the documents alone:**
     - the drawing's sixteen joints come from `joints(K)`;
     - `oq-kocha/src/characters/hooded-walker.json` is read as a distance field in JavaScript
       (round cone, ellipsoid, sheet, smooth min, min and subtract). The body's parts are
       joined by their `joinK` and the rest laid over by `min`, as
       `oq-kocha/tools/build.mjs:58-77` writes them;
     - it is marched through the shot's camera and loop as `oq-kocha/src/geo.frag:242-256` has
       them, inside the figure's bounding sphere (`geo.frag:17`), with the ground as the plane
       y = 0.026 (`:115`).
   - **Pass and known-bad.** The worst IoU over the eight drawings passes above 0.90. The
     known-bad is the same measure with each reference built from the next drawing.
   - **What moves.** `joints`, `NZ` and `FZ` leave the page template (`mkfilm.py:84-98`) for
     `oq-kocha/src/sheet.mjs`, which the page already inlines with `export` stripped
     (`mkfilm.py:4-6`, `:403`). `JOINT` leaves `build.mjs:8-11` for the same file. The test
     then runs the function the film runs, and the builder and the test read one table.

   → **The first run, outside the harness** [room 15 s16 `ref2.out.txt`]. The patch's reference
   code against masks your page rendered at `ff977c2` in the room's container, in SwiftShader
   with your flags (`browser.mjs:25`). IoU per drawing:
   ```
   drawing           0     1     2     3     4     5     6     7
   the sheet's     0.980 0.980 0.984 0.985 0.979 0.981 0.986 0.983
   the next one    0.745 0.658 0.751 0.709 0.738 0.641 0.757 0.718
   the one before  0.715 0.747 0.657 0.750 0.707 0.741 0.645 0.758
   ```
   Between the worst true drawing and the best neighbour there are 0.22, so 0.90 needs no
   tuning and 200×144 is enough.

   → **The fault it is for**: the picture one drawing ahead of the sheet, put into the page's
   `render()` as `WALK[(idxAt(phA)+1)%8]` (`mkfilm.py:236`), while `state(f).idx` still reports
   the sheet's drawing.

   → **Proved through your harness** [room 15 s16 `render.out.txt`, `README.md`]. Four runs of
   the patched `oq-kocha/test/checks-render.mjs`, through `test/lib.mjs` `report()`:
   - each on a fresh `git archive` tree of `ff977c2`;
   - with the patch file applied by `git apply` in the two "after" trees;
   - in the Playwright 1.47.0 image, SwiftShader, four CPUs.
   ```
   tree                    checks  result                                             exit  time
   after, picture ahead    14      figure/matches-sheet FAIL 0.645 (known-bad 0.979)  1     927.7 s
   after                   14      figure/matches-sheet PASS 0.979 (known-bad 0.641)  0     713.3 s
   before, picture ahead   13      0 problems                                         0     615.0 s
   before                  13      0 problems                                         0     559.6 s
   ```
   What they say:
   - **Today nothing in `checks-render.mjs` sees the fault.** With it in, the thirteen pass.
     Occupancy moves (`yuz` 46.962 → 42.993 % character), but every shot stays above its
     1.0 %; the lowest is `ko'cha`, at 1.781.
   - **The row is the one this page predicted.** It equals the room's own script to three
     decimals in both trees.
   - **The patch moves no other number.** The thirteen rows match digit for digit between
     before and after, with the fault and without. The build was already byte-identical
     before and after (`build/film.frag`, `film.ramp.json`; the keeper hashed both trees). So
     moving `joints` and `JOINT` into `sheet.mjs` changes nothing the film draws.
   - **When the check fails, read both columns.** The measured value falls to what the
     known-bad read (0.645 against 0.641), and the known-bad rises to what the measured read
     (0.979). The failure names its cause: the picture is the next drawing. Print the known-bad
     on failure in any check of yours whose broken state is the nearest wrong answer.

   The keeper compared the file room 15 sent with its run's own output (identical), and checked
   the room's numbers against the four tables.

   → **What it costs** [room 15 s16 `dump.out.txt`, `ref2.out.txt`, `README.md`]:
   - eight masks at 8–22 s each in SwiftShader;
   - one state query per frame of the shot: 3 s for 52 frames;
   - eight references at about 1.1 s each in node.

   Through the harness, the clean pair puts the check at +154 s (713.3 against 559.6) and the
   faulted pair at +313 s. The four ran one after another on a shared six-CPU box, and room 28
   found that a frame in this harness costs whatever the page's playback loop has queued
   (f0366). So read it as three to five minutes more on render checks that take about ten
   today.

   → **What it does not see.**
   - One figure in one shot only. The second character, drawn mirrored (`build.mjs:116`), has
     a `box` part (`oq-kocha/src/characters/plated-guard.json`), and the reader has no `box`
     case. It throws "unreadable shape" rather than pass, so the two-figure shots need `sdBoxR`
     in JavaScript and the mirrored query.
   - The reference holds nothing but the man and the ground. That is right for `yurish`, and
     reads low in a shot where something stands in front of him.
   - The builder and the check now share `JOINT`, so a wrong entry in that table passes both.
     What the check catches is a drawing that is not the one the sheet has up, and a builder
     that reads a part differently from the document.

   → **Your card counts `sheet.mjs`.** The file goes from 23 to 43 lines and from 1,271 to
   2,495 bytes.
   - The patch changes the sentence at `loyihalar/kartalar/1-oq-kocha.json:38` to "710 satr".
   - `refresh` rewrites the stored `sanoq`: `funksiyalar` 4 → 5, `baytlar` 39,095 → 40,319.
     The keeper recounted the six files in both trees [room 15 s16].
   - `mkfilm.py`, `build.mjs` and the test are not among the six (`1-oq-kocha.json:3-9`).

   → **With item 3's patch.** The two touch `sheet.mjs` in different places: patch 1 rewrites
   lines 6–22, and patch 2 adds after line 23, with lines 21–23 as context, which patch 1 leaves
   as they are. Patch 1 keeps the file at 23 lines, so with both the sentence is still 710. That
   is read from the two files; nobody has applied one on top of the other. Once `joints` is in
   `sheet.mjs`, item 3's ground can go through the toe the page draws (see there).

   → **Where:** `oq-kocha/test/checks-render.mjs`, `oq-kocha/src/sheet.mjs`,
   `oq-kocha/tools/build.mjs`, `oq-kocha/tools/mkfilm.py`,
   `loyihalar/kartalar/1-oq-kocha.json:38`. Its row in the table at `oq-kocha/README.md:67-77`
   is not in the patch: add `figure/matches-sheet` there.

   → **Effort: S.** Apply, run the render checks once (about twelve minutes on four CPUs), add
   the README row.

   → **Status: ours, as it is** [room 15 verdict, Policy]. Room 15 wrote the patch for your
   tree, which carries no licence file at `ff977c2`. It holds three things:
   - tables moved unchanged out of your own `mkfilm.py` and `build.mjs`;
   - the gate itself, the idea of pixal3d.cpp's script written fresh, with none of its Python.
     That script is MIT in any case [room 15 s3 `LICENSE:1-4`];
   - three of Inigo Quilez's distance functions, restated in JavaScript from your
     `oq-kocha/src/geo.frag:42-63`: the round cone, the ellipsoid and the smooth minimum.

   There is one obligation, and your shader already meets it: keep iq's name beside those
   functions. `geo.frag:42` heads its block "distance primitives (iq)". The patch names
   `sdRoundCone` and not iq, so add "(iq)" to the comments at `cone`, `smin` and the `ellip`
   case in `checks-render.mjs`. That file is not among the card's six, so no count moves.
   iq's article states no licence: the word does not occur in the page [room 15 s17]. Whether
   more than the name is owed is the film's question, not the patch's (open question 2).

2. **The card says which tree its numbers came from: a hash of its sources, the commit, a
   dirty flag, and the borrowed parts with their terms.**

   **In the library:** e0269, inspiration only.

   **Where it comes from.** image-to-3dlab writes a JSON beside every output
   (`image_to_3dlab/provenance.py:221-285`) [room 15 s2]. It holds:
   - sha256 of input and output, and the parameters;
   - each component with its licence;
   - one entry for a model deliberately not loaded (`"loaded": false`);
   - the backend's commit, and its own commit with `dirty`.

   The comment gives the reason (`:162-176`). "Parameters can lie": a recorded setting whose
   fix landed five days after the run. And uncommitted changes mean "the SHA does not pin the
   code". It later finds a file's record by hashing the file (`viewer/finish_api.py:218-243`).
   Its own record is thinner than its README says, so take the shape, not the file: the
   recommended backend writes one licence string and no commit
   (`scripts/pixal3d_generate.py:102-116`).

   **Your side.**
   - A card's `olchov` is written only by `refresh` (`loyihalar/tools/karta.mjs:76-83`). With
     `--tez` the stored block is kept while `sanoq` is recounted (`:81`).
   - Nothing in the card says which sources those numbers were measured from
     (`loyihalar/kartalar/1-oq-kocha.json:81-118`). You met the case twice in one session: the
     source changed and the old page was measured (`karta.mjs:28-32`).
   - The stored count drifts the same way, and no check notices (`1-oq-kocha.json:57`): item
     3's patch moves `baytlar` from 39095 to 39293, item 1's to 40319 [room 3 s13 §5; room 15
     s16].
   - Two works draw their letters with fonts fetched at play time: whiteout
     (`whiteout/whiteout.html:4`) and not-a-measurement
     (`not-a-measurement/not-a-measurement.html:4`). `sanoq` counts the names
     (`loyihalar/tools/sanoq.mjs:48`, `loyihalar/kartalar/2-whiteout.json:55-58`), and their
     terms are written nowhere.

   → **How.** In `refresh`, beside the numbers, write
   `olchov.manba = {sha256, commit, dirty}`:
   - `sha256` over the card's `manba` files, in their listed order;
   - `commit` from `git rev-parse HEAD`;
   - `dirty`: whether `git status --porcelain` printed anything. `execFileSync` is already
     imported (`karta.mjs:13`).

   The check `karta/olchov-manbasi` recomputes the hash and compares; its broken state is one
   byte appended to a copy of one source. It needs no browser, so it can say "these numbers are
   another tree's" before the video line's proposed check (`karta/olchov-yangi`, its item 19)
   spends a render to say by how much. The same hash is the key that line's item 8 wants for
   its segments, so write the function once. The commit and `dirty` are for the reader; the
   hash is what the check holds.

   → **The borrowed parts.** A person's block in the card, one entry per font: its name,
   where it loads from, its licence, and `loaded: false` (the upstream's form) for anything
   named and left out on purpose. Bind it the way `uslub` is bound: every name in
   `sanoq.shriftlar` must have an entry, and the broken state is one entry removed. The line
   has not read these fonts' licences.

   → **Where:** `loyihalar/tools/karta.mjs`, `loyihalar/test/run.mjs`,
   `loyihalar/kartalar/2-whiteout.json`, `loyihalar/kartalar/5-not-a-measurement.json`.

   → **Effort: S.**

   → **Status: inspiration only** [room 15 verdict, Policy]. image-to-3dlab is Apache-2.0,
   © 2026 Bingeljell and contributors [room 15 s2]. Its code could be taken with LICENSE and
   NOTICE kept and changes marked, but nothing of it is. The fields above are its idea, written
   in your terms; write the code yourself.

3. **Both feet planted, and contact found from the pose. `foot-plant` reads one ankle from a
   list kept by hand, and a re-timed chart passes every check run on it. A patch, tested:
   `code-video.patches/1-foot-plant-both-feet.patch`.**

   **In the library:** e0274, as it is (credit the thresholds' origin, as the paper does).

   **Where it comes from.** The UniMate paper measures foot sliding on twenty rigs with no
   frame marked by anyone [room 3 s4 `paper.txt:1899-1903`]. The ground plane goes through the
   lowest joint of the rest pose, `L` is the rest pose's root height above it, and a contact
   joint is down when its height is under 0.05 L.

   **Your side.** `plantDrift` knows where the foot is down from a comment, `if(i>4) continue;
   // drawings 0-4: the near foot is down` (`oq-kocha/test/checks-sheet.mjs:16`), and takes
   `WALK[i].na` only (`:17`). `fa` is read once in the tests, as a limb length (`:36`).

   Room 3 ran the paper's rule on your drawings, with `STAND` as the rest pose: the pose the
   film draws when a figure is not walking (`oq-kocha/tools/mkfilm.py:236-237`). That puts the
   ground at y = −3 and L at 49.5 pose units [room 3 s13 `contact.out.txt`]. The keeper redid
   the arithmetic by hand from `poses.json` and `sheet.mjs`:
   - **Height alone returns your list**, drawings 0–4 for the near foot, with a wide margin:
     the highest planted ankle is at 0.020 L, the lowest lifted one at 0.091 L.
   - **The far foot is down in drawings 4, 5, 6, 7 and 0.** That stretch runs across the end
     of the cycle, where `travel` adds a whole `TRAVEL` (`oq-kocha/src/sheet.mjs:19`). Today it
     holds, 0.0000 for both feet, and no check says so.
   - **Re-time the second half of the chart**, `HOLDS` 3·2·1·2·**2·3**·1·2 instead of
     3·2·1·2·3·2·1·2 (`sheet.mjs:3`). The near foot still reads 0.0000, while the far foot
     slides 0.0425 body-heights, ten times your mark of 0.004 (`checks-sheet.mjs:26`). The far
     drawings are the near ones swapped (`sheet.mjs:21-23`), so they are right only while both
     halves of the chart are timed alike.

   **What passes that chart today**, run by room 3 on your tree:
   - `npm run audit:fast`: 4 checks, 0 problems, exit 0. `sheet-arithmetic` prints the
     re-timed chart in its note and passes it, because the slots still add up to 16
     (`checks-sheet.mjs:72-76`) [room 3 s13 §2].
   - The five audio checks. `audio/footfall-sync` reads 0.000, because it recomputes the
     drawing with the same `idxAt` the page follows (`oq-kocha/test/checks-audio.mjs:9`, `:63`)
     [room 3 s13 `audio.out.txt`].
   - The card (below).

   Not run on this chart: the render, world and style checks. The render checks have since been
   run on item 1's trees, not on this chart. By reading, they take only `FPS` from the sheet
   (`checks-render.mjs:5`, `checks-world.mjs:13`, `checks-style.mjs:22`), and the world checks
   ask the film which drawing is up (`checks-world.mjs:48-59`). So none is built to see it.

   → **The patch: two files against `ff977c2`.**
   - **In `oq-kocha/src/sheet.mjs`:**
     - `idxAt(ph, H=HOLDS)` and `travel(p, H=HOLDS)` take the chart as an optional last
       argument, and `CUM` comes from a new `cumOf(chart)`. A check can then re-time the chart
       and still run the film's own functions.
     - `export const` and `export function` stay at line starts, as the page's inlining needs
       (`mkfilm.py:4-6`, `:403`).
   - **In `oq-kocha/test/checks-sheet.mjs`:**
     - `GROUND` is the largest `y` among `STAND`'s stored joints (y grows downward), and
       `L = GROUND − STAND.hip`. An ankle is down under 0.05 L.
     - `plantDrift(travelFn, chart)` walks the same 97 phases for `na` and for `fa`. Each
       stretch is measured against the `x` where it began.
     - The reference is dropped when the foot lifts, not at drawing 0 as `plantDrift.ref` does
       today (`:18-19`). That is what carries the far foot across the wrap.
     - It reports the worst stretch, never an average: your README lists a foot drift
       "averaged across stances" among the metrics that lied (`oq-kocha/README.md:59`).
   - **Three checks where there was one**, because the harness takes one `calibrate` per check
     (`harness/lib.mjs:18`):
     - `foot-plant`: broken state constant velocity, as today;
     - `foot-plant/both-halves`: the same measure, broken state the re-timed chart;
     - `walk/support`: below.

   The rows it prints [room 3 s13 §3]:
   ```
   foot-plant              PASS             2.22e-16           0.106 body-heights
   foot-plant/both-halves  PASS             2.22e-16           0.042 body-heights
   walk/support            PASS                0.000           1.000 drawings with neither ankle down
   ```

   → **How it was proved**: from the patch file, on fresh `git archive` copies, in four runs
   [room 3 s13 §1–4].
   - before: 4 checks, 0 problems;
   - before, with the re-timed chart: the same;
   - after: 6 checks, 0 problems;
   - after, with the re-timed chart: `foot-plant` and `foot-plant/both-halves` FAIL at 0.042
     (0.0425 to your harness's three decimals), exit 1.

   What must not move did not:
   - `idxAt` and `travel` equal the old ones with `===` over 22,098 phases.
   - `npm run build` gives a page whose script parses, and which differs only in the sheet's
     eleven lines [room 3 s13 §5–6].
   - In a browser, the film's own `state(f)` gives the same drawing and distance at fifteen
     frames, and two 200×144 frames hash the same before and after [room 3 s13
     `probe.out.txt`].

   → **Your card counts this file.** The patch keeps `sheet.mjs` at 23 lines and four named
   functions (the new helper is an arrow in a `const`), so "690 satr" still holds [room 3 s13
   §5]. If you change the patch so the file gains a line, `karta/sanoq-bilan-mos` fails until
   the sentence at `loyihalar/kartalar/1-oq-kocha.json:38` changes with it.

   → **The guard, `walk/support`.** Contact found from the pose can pass by finding none. A
   redrawn ankle that sits above 0.05 L drops out of its stretch, and the drift over what is
   left is still zero. So the support itself is held:
   - the measure is the number of drawings in which neither ankle is down, and it passes at 0.
     Today every drawing has one, and drawings 0 and 4 have both;
   - the broken state is drawing 2 with its near ankle at its far ankle's height (y −14.5,
     0.232 L), which reads 1.

   Both characters are drawn over the same poses (`mkfilm.py:236-238`), so one `STAND` serves
   both.

   → **Ankle or toe.** The patch's ground goes through the lowest joint a pose stores, the
   ankle. The page also draws toes from the ankle and the foot's angle (`mkfilm.py:87-88`), and
   in `STAND` the far toe is lower, at y −2.12. Through the toe, L = 50.38, the contact lists
   are the same, and the margins are 0.037 and 0.107 around the 0.05 mark [room 3 s13 §5]. The
   threshold needs no tuning for this figure either way. Item 1's patch moves `joints` into
   `sheet.mjs`; with both applied, put the ground through the toe `joints` returns (indices 6
   and 11 of its sixteen). Neither patch does that.

   → **The card still prints the old chart.** Its sentence "Ekspozitsiya varaqasi 8 slotdan
   iborat: 3·2·1·2·3·2·1·2, …" is bound to `jadvallar.HOLDS`, which is the table's length
   (`1-oq-kocha.json:34-35`, `sanoq.mjs:58`). `tasdiq` passes a number found anywhere in the
   sentence (`loyihalar/tools/karta.mjs:49`, `:55-56`).
   - The re-timed chart passes it.
   - Since `·` splits the quoted chart into single numbers, it would also pass a table of 1,
     2, 3, 8, 12 or 24 entries [room 3 s13 §7].
   - Its words are loose as well: 8 drawings, 16 slots (`sheet.mjs:3-4`).

   That is the video line's item 13 (a card line binds every number it states); this line adds
   its broken state:
   - `sanoq` returns the table's values beside its length; it already walks the brackets
     (`sanoq.mjs:13-29`);
   - the sentence is held to the joined chart;
   - the re-timed chart must fail it.

   Not in the patch.

   → **Also not in the patch:** the table in `oq-kocha/README.md:67-77`, whose other rows are
   browser checks. Add the three rows above. The copy here is room 3's file with its four blank
   context lines written as empty lines, which `git apply` reads the same. Apply it at the root
   of your tree.

   → **Together with item 1:** this makes the sheet's arithmetic cover both feet, and item 1
   ties the pixels to the sheet's drawing. Together they answer the note in
   `checks-world.mjs:76-80`.

   → **Where:** `oq-kocha/src/sheet.mjs`, `oq-kocha/test/checks-sheet.mjs`,
   `oq-kocha/README.md:67-77`; for the card, `loyihalar/tools/sanoq.mjs` and
   `loyihalar/tools/karta.mjs`.

   → **Effort: S.** With the patch, an hour.

   → **Status: ours, as it is** [room 3 verdict, Policy]. Room 3 wrote the patch for your
   tree from the paper's rule [room 3 s4 `paper.txt:1899-1903`] and your own files. It copies
   no line of UniMate's code and no sentence of the paper, and every identifier and comment in
   it is yours. So apply it unchanged; no notice is owed, since a rule and a threshold are not
   the paper's text. The paper is CC BY 4.0 [room 3 s4 `abs.html:182`]. A credit in the
   commit message is a courtesy: "contact rule after UniMate, arXiv 2609.05415, App. E.5".
   Room 3 found your remote's head still at `ff977c2` on 2026-10-04, so it applies as tested.
   Nobody has applied it on top of patch 2 yet.

## Not worth taking

- **The paper's two sliding numbers, Skate and Slide, as checks** (e0274). Skate is the share of
  near-ground frames whose step is over 0.025 L; Slide is a height-weighted mean step
  [room 3 s4 `paper.txt:1903`]. On a walk drawn on holds, the frame a foot lands on carries the
  whole swing. So Skate reads 0.045 on your film, where nothing slides, and the threshold
  (0.031 L a frame at 24 fps, 0.015 body-heights) is four times your whole pass mark
  [room 3 s13 `contact.out.txt`]. They were made to rank generated motion that slides a little
  everywhere. Your worst drift per stretch is the stricter number; item 3 takes the paper's
  contact rule and leaves its measures.
- **A dead-shot check**, from UniMate's activity filter (e0272): the spread over time of each joint
  relative to the root, dead under 0.02 (`data_process/utils/skeleton.py:468-532`) [room 3 s3].
  The numbers transfer: your walk reads 0.235, one held drawing 0.000 [room 3 s13
  `clipchecks.out.txt`]. But on the sheet it would compare a constant with a constant:
  - a walking shot draws `WALK[idxAt(phA)]`, eight drawings that differ by construction;
  - `ikkovi` and `qarama` hold `STAND` on purpose (`oq-kocha/src/shots.mjs:19-22`,
    `oq-kocha/tools/mkfilm.py:236-237`).

  The fault it names, a walking shot whose phase stands still, lives in the page
  (`mkfilm.py:276`). There it is seen without any spread: `state(f).idx` not changing across a
  shot that says `aw:1`.
- **A pose-jump check**, from its discontinuity filter (e0272): largest step at least 0.20 of the
  clip's extent and 8.0 times the median step (`data_process/utils/motion_features.py:506-541`)
  [room 3 s3]. It does not fit your film [room 3 s13]:
  - per frame, the median step on holds is zero, so the ratio is infinite;
  - per drawing change, a dropped half-cycle reads 0.199 and 5.0, under both marks, so it
    passes;
  - the step is divided by the clip's extent, which for a figure that travels is the distance
    walked;
  - the sheet cannot drop a drawing: `idxAt` goes through `HOLDS` in order
    (`oq-kocha/src/sheet.mjs:12-16`).

  Between shots, `cut-sizes` already watches (`oq-kocha/test/checks-sheet.mjs:55-69`).
- **Foot locking**, the paper's repair (e0271): contact stretches pinned to an anchor by inverse
  kinematics and blended in over five frames [room 3 s4 `paper.txt:1905`]. It repairs motion
  nobody drew. Your foot is planted by the sheet, the world stepping when the drawing steps
  (`oq-kocha/src/sheet.mjs:17-19`). Its first three steps, the stretches and their anchors, are
  item 3's measure.
- **UniMate and the models beside it** (MDM, MoMask, MotionGPT, AnyTop; e0273, e0275) [room 3 s3, s9–s12].
  They generate 3D joint rotations for a rig, on a GPU; your walk is sixteen poses a person
  drew. UniMate puts any skeleton into one space: it calibrates on the rest pose, scales by the
  figure's own size and writes the choice into the file (`data_process/utils/skeleton.py:422-461`)
  [room 3 s3]. That matters the day a figure has poses of its own; until then, item 3's `L`
  from `STAND` is the part of it you need. No motion these models generate is cleared for a
  work of ours [room 3 verdict, Policy]. UniMate's authors show theirs as "research use only",
  its weights are CC BY-NC 4.0 since 2026-10-01 (e0273), and the others' bodies and data have
  terms nobody here has read.
- **Pixel Match, and its four tests as a shader.** It copies a picture onto a surface by a
  trust that is seen × facing × away from the outline × inside the cut-out
  (`image_to_3dlab/photo_paint.py:229-264`) [room 15 s2], and the room notes each test is a
  line in a ray-marcher. But it needs a picture to project, and your film has "No image, no
  mesh, no video, no texture" (`oq-kocha/README.md:3-4`). The face is already a decal in the
  surface's own frame, "so it wraps instead of being projected flat" (`README.md:96-97`). The
  mechanism is in the line's library, e0267, for the day a work takes a drawn frame as an input.
- **The before/after rule as something new** (e0267, its Limits). The announcement film credits a face count for
  what a repaint did, because two things changed between its panels [room 15 s9, s2]. A
  before/after proves a step only when that step is the only thing that changed, and your
  `calibrate` already holds that rule (`harness/lib.mjs:1-7`, `oq-kocha/README.md:49-52`). The
  one place no check of yours reaches is a published side-by-side: there, the caption should
  name the option that changed.
- **Upstream's 0.85, its search over 48 axis orders, and its splatted vertices**
  (`tools/silhouette_iou.py:20-23`, `:51-53`) [room 15 s3].
  - The 0.85 belongs to dense meshes and a 256-pixel mask. Yours is 0.90, from your own runs
    (item 1).
  - The search answers two programs that disagree on axes. You own both ends, and the one flip
    you have is written down (`oq-kocha/test/checks-world.mjs:18-19`).
  - Splatting is good only for a dense mesh. Your figure is a field, and the patch marches the
    field itself, about forty lines [room 15 s16].
- **The tools themselves**: image-to-3dlab, Pixal3D, Tripo, Meshy, and mesh reduction in
  Blender [room 15 s2, s13, s14]. They make and finish 3D assets on a 32 GB Mac or a 16–24 GB
  NVIDIA card, and you have no mesh to hand them. Their outputs are not cleared for anything
  we publish either [room 15 verdict, Policy]:
  - Hunyuan3D 2.1 and any port of it: not to be used. Its licence excludes the EU, the UK and
    South Korea, outputs included.
  - Pixal3D and TRELLIS.2: not as they are. Both need Meta's DINOv3 encoder, whose terms
    nobody has accepted in the company's name, and their training data's terms are open.
  - Tripo's paid plans and Meshy: not as they are. Their binding terms were not read.
  - Tripo's free plan: not to be used. It is non-commercial.

  What the line read about them is in its library: e0270 (the models and their terms) and
  e0268 (reduction in Blender).

## Open questions for the owner

1. **The two works with fetched fonts: record their terms, or bring the files into the tree?**
   - Recorded (item 2): the film still needs the network to be the film.
   - Vendored: the tree makes the film alone, and the repository carries someone else's files
     under their licence.

   The answer unblocks the second half of item 2. Item 2's source hash does not wait for it.

2. **iq's distance functions: does the film owe more than his name?** Your shader uses them
   under "(iq)" (`oq-kocha/src/geo.frag:42-63`), and item 1's patch restates three. iq's
   article states no licence [room 15 s17]. The Shadertoy shaders it links carry their own
   headers, but Shadertoy answers a script with 403, so no room could read them.
   - The check: open `shadertoy.com/view/tdXGWr` (the round cone) and `lt3BW2` (the smooth
     union) in a browser, and write down what their headers say, with the date.
   - It settles the question for the whole film. Until then, keep "(iq)" beside every copy.

---
*From the line "3d" (3D) of the Labs workshop, kept by its keeper from what the line's rooms sent. Edited there, never here: `labs rooms pull` brings the newest.*
