# s2 — the post's video, frame by frame

## How it was taken

- File: `https://video.twimg.com/amplify_video/2105008689988210688/vid/avc1/1920x1080/njEEXzjAuXFfqhoI.mp4`,
  fetched with wget in `docker.io/alfg/ffmpeg:latest` by `get.sh`; the mp4 is gitignored.
  sha256 of the room's copy `8e9d292cd70b4d448956e6bd2539f39945368f8992430eebbd0bd4bce5fe3ef6`
  (`video.sha256`; the registration's own fetch hashed `fb19b41dd668…` — a second request to the CDN, not
  necessarily the same bytes).
- `probe.txt`: 30.06 s, h264 1920x1080 at 24 fps (720 frames), AAC stereo 48 kHz.
- `frames/t000–t029.jpg`: one per second (tNNN ≈ NNN.5 s; fps rounds, so the times are ±0.5 s).
- `scenes.txt`: cuts the detector found (threshold 0.12), exact times: 9.958, 10.000, 10.083 (the PTZ cut),
  19.500, 21.000, 25.750–25.875. The drone-to-drone changes at ~4 s and ~8 s are wipes it did not flag;
  the 4 fps sheets place them.
- `sheets/s00–s03.jpg` (`look.sh`): the whole film at 4 fps, 30 tiles a sheet, tile i = 7.5·sheet + 0.25·i s.
- `crops/*.jpg`, `seq/tank-*.jpg` + `seq/tank-sheet.jpg` (`look.sh`): enlarged moments, named by time.
- `audio.txt`: mean −16.8 dB, max −4.0 dB, no silence of 0.7 s anywhere. `speech/transcript.txt`
  (`speech.sh`, faster-whisper small.en, VAD on): **no speech segments**. The film has a soundtrack
  and no narration; nobody says anything about how it was made.
- Every frame t000–t029 was opened at full size; the four sheets and every crop were read.

## The film, in order

The badge **HIGGSFIELD / GPT-6.1 SOL** sits top right on every frame. Every shot has a header top left:
`● LIVE · <camera> · coordinates · clock`, and an event log bottom left whose lines fade upward.
The clock runs 17:42:08 → 17:42:37, one second per second of film, across every cut.

| time | shot (header) | what is on screen | words read |
|---|---|---|---|
| 0.0–3.9 | **DRONE 02 · ALT 122 m**, 45.8129–45.8130 N 108.4971–108.4972 W, 17:42:08–11 | top-down pan over ~250 cattle (black, red, Hereford) on dry golden grass, a water tank, a dirt road, a fence; a yellow-green circle with a 4-digit id on each animal; a vertical line wipes the overlays in from left to right during the first ~0.5 s (sheet s00, tiles 0–2: raw footage right of the line) | card **HEAD IDENTIFIED · PASTURE 3 · 0 missing · no tags · no chips**, counting 111 (0.0) → 172 → 225 (0.5) → 229 → … → 261 (3.75); callouts PEARL #2636, WILLOW #5729, JUNO #1143, OLIVE #9747, SAGE #4193, IVY #4495; log "DRONE 02 sweep started · Pasture 3 ALT 122 m", "PASTURE 5 herd A inside geofence all in", "17:42:08 PASTURE 3 first sweep pass 229 head", "17:42:09 WATER TANK 2 drinking now 38 head", "17:42:10 PASTURE 3 all present vs 06:00 count 0 missing" |
| 4.0–7.9 | **DRONE 01 · ALT 31 m**, 45.8074 N 108.4891–108.4889 W, 17:42:12–15 | oblique shot, a herd of black cattle walking left on green-gold grass; river with cottonwoods, hills, low sun; a dashed ellipse round the herd; circles and corner brackets with ids; one white-faced black cow walking away to the right | **HERD A · 117 HEAD**, **GEOFENCE · PASTURE 5**, "ROSIE #0417 LEAVING HERD"; card **STRAY ALERT 17:42:12 · ROSIE #0417 · 150 m from herd · heading NE · NE fence · 38 m**, the number growing 150 (t005) → 158 (t006) → 165 m (t007); a dashed line from the ellipse to her labelled with the same number; inset **PASTURE 5 · LIVE MAP 1.4 km²**; log "ROSIE drifting from herd → NE 142 m", "left the herd → NE fence 146 m", "17:42:14 approaching geofence 38 m" |
| 8.0–9.9 | **PASTURE CAM 07 · PTZ**, 45.8036 N 108.5117 W, 17:42:16–17 | wide, slightly fisheye view from beside a red barn wall, looking down on a flat lush green pasture under overcast sky; hay ring feeder, galvanised water tank, deciduous tree line; ~100 cattle with circles/ids; one Hereford marked orange; then a zoom, card **PTZ ZOOM 1.0× → 1.1× → 3.6× → 10.1× → 12.0× · SLEWING** (sheet s01 tiles 5–9), the Hereford seen from above, red brackets | "#0288 GAIT IRREGULAR", "HAZEL #0288 GAIT IRREGULAR · LOCKED", "LOCKED TRK 0288 · 0.98", BELLE #0374; log "17:42:16 HAZEL gait irregular · front left LF", "PASTURE CAM 07 PTZ lock → HAZEL 12×" |
| 10.0–13.9 | header still **PASTURE CAM 07 · PTZ 12×**, 17:42:18–21 | **hard cut at 9.96–10.08 s** to a side-on, eye-level telephoto shot of a Hereford walking; shallow depth of field; two black cows grazing behind; sparse grass with weeds and bare patches; a stick skeleton over the four legs, the front-left red | **HAZEL #0288 GAIT ANALYSIS**, then **HEALTH ALERT · CRITICAL · LAMENESS · FRONT LEFT · Severity 3/5 · Action Treat today · HAZEL #0288 · Hereford · ✓ Vet notified 17:42:19**; panel **GAIT ANALYSIS · LOAD PER LEG: LF 40 % ▼ · RF 100 % · LH 96–97 % · RH 100 % · STRIDE LF 0.41 s RF 0.63 s** |
| 14.0–17.9 | **FEED BUNK CAM 04**, 45.8011 N 108.5203 W, 17:42:22–25 | high oblique over a concrete feed bunk in a dry dirt feedlot pen, sunny, dust; 17 cattle eating; a circle and a small bar on each head | panel **RATION CONTROL · PEN 4 · 25.4 lb DM/head · Corn silage 46 % · Alfalfa hay 27 % · Rolled corn 19 % · Supplement 8 % · Delivered 3,860 lb · 06:42 · Target 25.4 lb DM/head · Head at bunk 17 · Avg intake now 22.5 → 24.5 lb**; **LOW INTAKE #8194 −31 % vs target**; RUBY #0733, CLOVER #0829, DUKE #1046 |
| 18.0–19.4 | **SCALE CAM 01**, 45.8008 N 108.5219 W, 17:42:26–27 | a Black Angus heifer standing on a checker-plate platform inside green steel pipe panels, in a shed; a yellow outline round her; L and H dimension lines; a mouse pointer moves onto a button and clicks it (t018 → t019) | **DAISY #0612 · BLACK ANGUS · 22 MONTHS**, **LIVE WEIGHT est. from camera** counting 1,120 → 1,178 → 1,182 → 1,184 lb, **Body condition 6/9**, **L 1.58 m**, **H 1.24 m**; card **CREATE LISTING · Breed Black Angus · Heifer · 22 months · 1,184 lb · BCS 6/9 · ✓ Vet clear**, button **✦ Create with Higgsfield**, under it "sale card · GPT Image 2.5" |
| 19.5–20.9 | (no camera header) | panel **Create listing DAISY #0612 · MODEL GPT Image 2.5 · HIGGSFIELD**: left the scale-cam still ("SOURCE · SCALE CAM 01 · 17:42:27"), right a card being generated, 60 % | "REQUEST Sale card for this animal: breed, age, weight, price." "FROM THE HERD RECORD Black Angus · Heifer · 22 months · 1,184 lb · BCS 6/9 · Vet clear · $2,650" |
| 21.0–22.4 | — | the finished card: the same heifer, same pose, now standing on a sunlit pasture | **SPRING CREEK RANCH · MONTANA · FOR SALE · DAISY #0612 … $2,650 · Camera-verified · no tag · Listed 17:42:29** |
| 22.5–25.7 | — | **Spring Creek Ranch · SALE CATALOG · CARDS GENERATED FROM HERD CAMERAS**, cards appearing 1 → 2 → 4 → 6 → 8 | "7 listings live · 1 on hold · LIVE"; DAISY $2,650, RUBY $2,480, CLOVER $2,560, DUKE $2,390, BELLE $2,950, MAPLE $3,150, ROSIE $3,400, HAZEL "ON HOLD · Lameness · front left · Listing paused · HOLD · treatment"; every card "Camera-verified · no tag" |
| 25.75–30.0 | **DRONE 03**, 45.8190–45.8191 N 108.4811–108.4810 W, 17:42:34–37 | sunset over a sagebrush plain, flat-topped buttes on the horizon, a fence line, a few hundred cattle; circles/brackets wiped in again from the right | ALT **72 m (t026) → 107 → 153 → 185 m (t029)**; card **HEAD IDENTIFIED · ALL PASTURES** 262 (25.75) → 277 → 423 → 858 → 1,722 → 2,437 → 2,758 → 2,843 → 2,847 (27.75); log "17:42:34 ALL PASTURES every head identified 2,847"; title **Every head. No tags.** and **Built with GPT-SOL 6.1 · powered by Higgsfield** |

## Measurements

1. **The stray distance against the picture** (`crops/rosie-5.5.jpg`, ×1.5, x 780–1880 y 420–680). At 5.5 s the
   dashed line labelled "150 m" runs from the ellipse's edge at x ≈ 1000 to the cow at x ≈ 1647 of the frame:
   ≈ 650 px. The cow herself, rump to nose, is ≈ 90 px, and the animals at the herd's edge on the same line
   of depth (#9782, 8276) are 80–90 px. On the scale-cam shot the video itself gives a heifer's body as
   "L 1.58 m"; nose to rump a grown cow is about 2 m. 650 px is about seven body lengths — **some 15 m, a tenth
   of the 150 m printed on it.** Assumption stated: both ends of the line sit at about the same distance from
   the camera (they are at the same height in the frame, y ≈ 520–545). The label also grows 150 → 158 → 165 m
   in two seconds (7–8 m/s).
2. **The altitude against the picture** (`crops/d03-8868-*.jpg`, ×2). The same red cow, bracketed #8868,
   measures ≈ 95 px long at 26.5 s (ALT 72 m) and ≈ 112 px at 29.5 s (ALT 185 m). **The printed altitude
   rises 2.6× while the animal gets bigger, not smaller.** A camera that climbs 113 m in three seconds with a
   fixed lens sees the ground shrink; a zoom could in principle compensate, and nothing on screen says zoom.
3. **Counters are animations.** DRONE 03's "HEAD IDENTIFIED" eases from 262 to 2,847 in two seconds, slowing
   as it lands (sheet s03, tiles 13–21); the scale's weight counts up 1,120 → 1,184 the same way (s02, 12–15).
   DRONE 02's count climbs with the wipe that reveals the circles (111 → 225 in 0.5 s). The log knows the
   total before the counter gets there: "17:42:34 ALL PASTURES every head identified 2,847" is on screen at
   17:42:35 with the counter still at 2,820 (t027). (DRONE 02's "first sweep pass 229 head", stamped 17:42:08,
   does agree with its counter, which passes 229 at 0.75 s — sheet s00, tile 3.)
4. **One camera, two viewpoints.** PASTURE CAM 07 zooms 1× → 12× from beside a barn looking down on the
   pasture, the Hereford seen from above on lush grass (`crops/cam07-hazel-8.5.jpg`, sheet s01 tiles 5–9); at
   9.96–10.08 s the detector marks a cut, and the "12×" shot that follows is eye-level, side-on, on sparse
   weedy grass (t010–t013). A roof camera zooming in keeps its downward angle. **The gait shot is footage from
   another camera and place under the same header.**
5. **Different places and seasons under one clock.** Dry golden grass in low sun (DRONE 02, 01), overcast lush
   spring green (PASTURE CAM 07, 17:42:16), a sunny dusty dirt pen (FEED BUNK 04, 17:42:22), a covered shed
   with green trees outside (SCALE 01, 17:42:26), a sunset over buttes (DRONE 03, 17:42:34) — thirty seconds of
   clock, six coordinates within 5 km of one another [s5].
6. **Ids in the densest cluster** (`seq/tank-sheet.jpg`, the water tank every 0.25 s from 0.5 to 3.5 s, while
   the pan drifts every animal ≈ 8 px per step). Most labels travel with their animal (#9118, PEARL #2636,
   7211). Some jump: the #4068 callout moves ≈ 60 px from the tank's upper left to its lower left between
   0.75 and 1.00 s and back up by ≈ 45 px at 3.25 s; #4451 moves up 22 px and then down 48 px against the drift.
   In a tracker that is an id switch between neighbours; in a designed overlay it is a label re-laid out. The
   frames do not say which.
7. **What the weight stands on.** The heifer whose weight is "est. from camera" stands on a checker-plate
   platform in a steel frame — the look of a livestock scale. The frame shows no reading from it.

## What this establishes, and what it does not

**Shown** — the film is a 30-second montage of six shots presented as live feeds, joined by a continuous clock
and nearby coordinates, over at least four visibly different places and light conditions (5, 4). Several numbers
it prints contradict its own picture: the stray distance by about ten times (1), the drone altitude (2); the
counters are count-up animations towards a total the log already states (3). It ends in an advertisement for
Higgsfield's image generation — a "Create with Higgsfield" button clicked by a pointer, a sale card made by
"GPT Image 2.5", a catalogue of eight generated cards. There is no browser, window, terminal, code or file on
screen at any point, and nothing is said.

**Not shown** — whether any circle came from a detector. They sit on animals, and in the pans most ids travel
with their animal, but motion graphics tracked by an artist do the same, and the jumps in the dense cluster (6)
fit either. Whether the footage was filmed or generated: the animals and places look photographic in every frame
read and no crop showed a merged or melting animal, but the room made no test that could tell, and a frame
cannot. Whether GPT-6.1 Sol wrote any code, what "built a prototype" means, and whether any part runs.

**Of the post's four claims [s1]** — "built a prototype": not shown. "Live herd counts": numbers are shown, and the
ones that can be checked are animations or disagree with the picture. "Tracking": ids that mostly stay on their
animals are shown; that they come from a tracker is not. "Alerts when an animal wanders off": an alert card is
shown; its distance is wrong by about ten times.
