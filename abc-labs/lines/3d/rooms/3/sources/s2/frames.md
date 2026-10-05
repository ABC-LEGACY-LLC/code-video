# s2 — the post's video, frame by frame

## How it was taken

`sources/s2/get.sh`, run as `labs room run 3 --image=docker.io/alfg/ffmpeg:latest -- sh /room/sources/s2/get.sh`
on 2026-09-30:

- the 1920x1080 variant from the mirror's `tweet.media` ([s1] `post.json`), saved as `video.mp4` (gitignored);
  `sha256 b42ce80cf8d4e30b65329c8a2073f55cb01ca1062422f274eadfffa34049cc0d` (`video.sha256`). The source
  registry's fingerprint for the same URL is `e4aa52f8a521`: the sha256 of the first 4 MiB only
  (`lib/rooms.mjs:103`), and `head -c 4194304 video.mp4 | sha256sum` gives exactly that. Same bytes, two
  lengths hashed. (Corrected 2026-10-01: this note first said "the two fetches differ", which was wrong.)
- `probe.txt`: h264 1920x1080 at 60 fps, 1857 frames, 30.999 s; an AAC track that is silent throughout
  (`audio.txt`: mean and max volume −91.0 dB, one silence from 0 to 30.9986 s). Nothing is said; there is no
  transcript to make.
- `frames/t000.jpg`–`t030.jpg`: one per second, scaled to 1280 wide; `tNNN` ≈ NNN.5 s (the fps filter rounds to
  the nearest slot, so these times are approximate).
- `scenes/c001`–`c007` with exact times in `scenes.txt`: 1.333, 5.883, 8.900, 10.417, 11.933, 18.500, 22.450 s.
- `crops/credit-*.jpg`: the small line in the bottom-left corner, cut from the full-size frame and enlarged ×4
  (`credit-q-*`: one quadrant of the 2x2 grid, ×5). Command: `ffmpeg -ss <t> -i video.mp4 -frames:v 1 -vf
  "crop=420:30:0:1044,scale=iw*4:ih*4:flags=lanczos"` (run inline in the container).

All 31 per-second frames were opened at full size.

## The film

Every frame: a dark checkerboard floor, textured characters with their skeleton drawn over them (green/blue
bones, an orange root dot), a monospace label above each character (the prompt), a serif title card at the top,
and in the bottom-left corner, small: **"Models © their respective owners · research use only"**
(`crops/credit-0.5.jpg`, `credit-12.5.jpg`, `credit-28.5.jpg`; in each quadrant of the grids, `credit-q-6.5.jpg`).

| time | frames | title card (read) | what is on screen, labels as read |
|---|---|---|---|
| 0–1.3 s | t000 | "Given a rigged 3D asset and a text prompt, UniMate generates animations for characters with **diverse skeletal topologies** within a **single unified model**." | a humanoid robot with "UNITREE" on its chest ("A humanoid robot waves its hand."), a WALL-E-like robot and an EVE-like robot ("A robot spreads both arms and waves." each), a quadruped robot dog ("A quadruped robot rears up to greet.") |
| 1.3–4 s | t001–t003 | "UniMate generalizes across **heterogeneous skeletons** and **diverse motion prompts**" | ten creatures in one scene: an orange winged dragon ("A dragon hovers and sweeps its tail."), a winged insect-dragon ("A dragon flaps its wings."), a small bird ("A bird flaps its wings and hovers."), a spiky reptile ("A monster walks in place."), a chicken ("A chicken attacks forward."), a stegosaurus ("A dinosaur attacks forward."), a blue sea serpent ("A serpent sways its tail."), a jellyfish ("A jellyfish wriggles its tentacles."), a whale ("A whale sweeps its tail.") |
| 4–5.9 s | t004–t005 | "The same model drives **long-range locomotion** — the rig travels, the motion stays in step" | the Unitree humanoid ("A humanoid robot walks forward.") and a quadruped robot ("A quadruped robot walks forward.") |
| 5.9–8.9 s | t006–t008 | a 2x2 grid, one word per quadrant: **Quadrupeds**, **Articulated objects**, **Bipeds**, **Plants** | quadrupeds: "A quadruped robot walks in place." / "…runs in place." / "…steps forward and extends its arm." (a Spot-like robot with an arm); articulated: "A satellite extend its bases." (sic), "A lamp bends backward.", "A robot arm pushes forward."; bipeds: "Garfield dances to a rhythm.", "A robot kicks with one leg." (a Gundam-like mech), "A human performs a backflip.", "A robot walks in place."; plants: "A flower closes its petals.", "A piranha plant bites forward." |
| 8.9–11.9 s | t009–t011 | "One rig, many prompts" (bottom) | two 2x2 grids, three or four copies of one character each under different prompts: WALL-E-like ("spins around in place" / "greets with a friendly gesture" / "turns left in place"), EVE-like ("looks around" / "raises one arm" / "bends backward and shakes"), Unitree humanoid ("picks up an object" / "jumps forward" / "waves its hand"), a red Baymax-like robot ("walks forward" / "dances with arms swinging" / "punches forward"); then a Gundam-like mech (4 prompts), a shark ("swims to right" / "swims and bites forward" / "swims and turns around"), a blue mech (4 prompts), an eagle ("takes off and soars up" / "strikes forward" / "descends and lands") |
| 11.9–17 s | t012–t016 | "**Long-horizon motion** — six seconds from one prompt, phase after phase" | a small two-legged "robot duck": "A robot duck walks forward, performs a forward roll, turns to its right, and then sits down." — seen walking (t012), mid-roll upside down (t013), walking right (t014–t015), sitting (t016) |
| 17–22 s | t017–t021 | "Zero-shot **motion editing** — 1. the source motion" → "2. the joints to hold, in white" → "3. resampled under a new prompt, the held joints kept" | a boxy two-legged robot: source "A robot turns its head to left."; step 2 labels "held — A robot turns its head to left." (a white circle on the body) and "resampled — A robot walks in place." (on a leg); step 3 "A robot walks in place." |
| 22.5–27 s | t022–t026 | "Zero-shot **in-betweening** — a start pose and an end pose are given" → "…three seeds fill the span between them"; bottom "GENERATED — squats and then rises back up." | a cartoon woman with hair curlers: "START POSE (given)" and "END POSE (given)" at the ends, three generated copies between them, squatting |
| 27–31 s | t027–t030 | "Zero-shot **motion expansion** — chained prompts, each continuing the last" | a cartoon boy: "1 · A human stands up." (t027–t028), "2 · A human walks forward." (t029), "3 · A human turns around in place." (t030) |

## What this establishes, and what it does not

**Establishes.**

- The video is the authors' material, not the poster's. Two of its title cards are the paper's figure captions:
  t000 is the caption of Figure 1 word for word ([s4] `paper.txt:120`), and t001 matches Figure 2's "Our method
  generalizes across heterogeneous skeletons and diverse motion prompts" ([s4] `paper.txt:151`). The credit
  line in the corner is the one on the authors' interactive demo page ([s7] `interactive.html:72`: "Models &copy;
  their respective owners · research use only"). The long-horizon duck is the paper's Figure 8 example, "a robot
  duck walking forward, performing a forward roll, turning right, and sitting down", from "a variant trained at
  180 frames" ([s4] `paper.txt:218`).
- The poster added nothing you can see or hear: no logo, no watermark, no caption of their own, a silent track.
  The authors publish their own video, "[SIGGRAPH Asia 2026] UniMate: One Unified Model to Animate Diverse
  Skeletons" by Linzhan Mou ([s8] `oembed.json`), and its thumbnail is a SIGGRAPH Asia / Princeton title card
  (`sources/s8/hqdefault.jpg`) that the post's 31 seconds do not contain. So the post carries a cut of the
  authors' material, most likely trimmed from that video. Who made the cut cannot be settled from here: YouTube
  asked for a sign-in before it would give the video's length or its file, and this room signs in nowhere.
- What the frames show is output, not use: rendered results in a 3D viewer. No prompt box, no terminal, no
  timing, no GPU, no file is on screen.

**Does not establish.**

- That the released checkpoints make these clips. The released models generate a fixed 60-frame (2 s) window
  ([s5] `model-card.md:48,142`); the six-second duck (t012–t016) is the 180-frame variant, which is not among
  the three released models ([s5] `model-card.md:32-34`).
- That these characters can be animated with the release. The sampler only accepts an `object_type` that
  already has a clip in its feature dataset ([s3] `unimate/inference/sample.py:192-199`). The paper does not
  say how many of these showcase rigs are in UniML3D.
- Anything about the characters' rights. Several look like well-known third-party characters (Pixar's WALL-E and
  EVE, Garfield, a Pokémon-like dragon and sea serpent, a Gundam-like mech, a Baymax-like robot, a
  Unitree-branded humanoid). The video itself says "research use only".
- Quality in general. These are the authors' chosen examples. The paper's own failure cases are foot sliding and
  rare topologies that stay static or come out wrong ([s4] `paper.txt:446-451`).
