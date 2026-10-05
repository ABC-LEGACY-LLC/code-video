---
name: "media-sound-check"
description: "code-video only: build a synthesized film soundtrack from the picture's own state and check it with calibrated tools (sync, beat fold, motor, AudioSet tagger, mix, cuts), plus an A/B page with marks."
---

# Media Sound — build it from the picture, check it with tools

> **code-video project skill · `media-sound-check` v1.0.0**
> Scope: the code-video repository only — synthesized sound for code-drawn films. Not part of the abc UX-audit skill family (github.com/AlonurKomilov/skills): do not use it for web or dashboard work, and do not add it to that repository.
> Source of truth: `.claude/skills/media-sound-check/SKILL.md` in <https://github.com/ABC-LEGACY-LLC/code-video>.
> Pairs with `media-audit-reality` (its Pass 2: source line, psychoacoustics, what never stops). Where the two disagree, this one is newer and measured on a finished soundtrack: see *Corrections* at the end.
> Reference implementation: the Tong · kaptar film — `sound/` (probe.js, scan.mjs, scanlib.py, dsp.py, synth.py, mix.py, mix.json), `audit/sound/` (sound_check.py, ear.py, ear_compare.py, metrics.py, measure.py, spec.py), `out/sound_page/` (build.py, page.src.html).

You cannot hear. The user can, and their "the sound in shot 3 does not match the picture" is the most valuable thing you will get. This skill turns that sentence into numbers, finds the causes, fixes them, proves what changed, and hands the listener a page on which their ear becomes data. Measured case: that one sentence resolved into three separate causes, none of which a level meter shows — a 14 Hz random tremolo on the wing grain (as much as a 42 % tremolo), a band so narrow that 93 % of the shot's energy sat under 1.2 kHz and the tagger heard "sine wave", and three out-of-focus birds whose beats filled the gaps between the hero's, so the fold of his own beat fell from 37 dB alone to 17 dB.

**The rule:** every sound is caused by something the picture draws, at the moment it draws it, and every check is calibrated on a known-good and a known-bad case before it reports on the film — including the checks you write yourself, and especially the ones you change after seeing a result.

## 1. Fire every sound from the picture's own state

- **Probe the picture, do not imitate it.** Inject a probe into the scene page that calls the shots' own functions on the edit's clock and records, per source per frame (a few sub-samples a frame): screen x/y, distance, on-screen flag, wing phase, amplitude, mode; contact times; and the simulation's own state (a cloth's air speed and edge acceleration, re-run at every substep). One JSON of that is the score.
- **Accents at the drawn moment:** a wingbeat where the phase crosses an integer (the top of the upstroke), a touchdown at its contact time, a whistle on the body's blow curve, a snap at an acceleration peak above a threshold. Add half a frame (a state reached at t is first drawn on the next frame). Log every accent with its source, its screen position and `t_vis`, the first frame that shows it: that log is the SYNC check.
- **Perspective from the shot's base lens, not its zoom:** effective distance = r × 1000 / focal. A zoom inside a shot is optics and does not bring the world nearer. Pan from screen x, air absorption from ISO 9613-1, reverb sends that grow with distance.
- **A cut into a different world stops what belongs to the old one.** Every event gets an end time (`tmax`): at a cut into or out of slow motion it ends with the picture, elsewhere it may ring a quarter second. Sparse layers are the ones that forget it (a sparrow's chirp, a flag's flip). Run the reverb per part and truncate it at those cuts. A sample pair that spans a cut must not generate events: the world clock jumps there, and a phase-crossing test logged a flip that was never heard.
- **Smooth what the drawing makes jagged.** A speed taken as the difference of drawn positions spikes frame to frame (a hand: 5.8, 5.6, 5.7, 6.8, 4.3, 2.6, 8.2, 2.4 m/s at a release). Cloth does not follow that: median over a few samples, then a zero-phase low-pass on the control. The throw's shirt went from "clapping, tick, scissors" to "rustle" with nothing else changed.
- **One seed per event, and each jitter on its own stream, drawn before any texture.** A flock's per-beat level drawn after the grain's noise from the same stream moved by up to 3.2 dB when the grain's tick density changed by 2.5 %.
- **Physical timing for far things.** A car d metres off at v m/s swells over about 2d/v: 200 m is half a minute. Swells of 4–8 s every few seconds at that distance are unphysical, and the tagger heard them as surf.

## 2. Synthesis that reads as the thing it is (all measured)

- **A whoosh is a moving band.** Use a state-variable filter whose cutoff moves every sample with the mover's speed (up through the stroke and back down). A fixed narrow band reads as a tone: "sine wave", "theremin".
- **Texture from sparse impulses, not Gaussian noise.** Impulses at a density, each rung through a short resonance (velvet noise, crackle), make feathers, fibres and cloth. Band-passed Gaussian noise reads as hiss or static.
- **Never add "life" as amplitude tremolo on noise.** Random modulation at 8–40 Hz is a motor to the ear.
- **Slow motion slows everything, texture included.** Tick density divided by the slow factor, pitch × about 0.7, a low body band under each stroke, and a slowed world's own tail (a real 0.4 s tail heard five times slower: about 1.6 s, diffuse, darker) sent harder. Dropping the pitch an octave instead left 93 % of the energy under 1.2 kHz: muffled.
- **Many identical sources summed become an engine.** Vary every beat (level ±3 dB, colour ±15 %: a wing's dipole turns as the flock banks), give far sources a narrower band and fewer ticks (a detail knob by distance). Every beat alike, 27 birds read "vehicle".
- **A few sources beating regularly read as music.** Five near flock birds louder than the rest read "music, percussion, wood block" (0.14–0.49), and resonant taps (Q 4–5) leaned the same way: a board is low and damped (Q under 2) under a soft pad thump. Cloth opens over about 10 ms with its band falling as it dies: hard 4 ms attacks read "chop, whip", and single flaps over silence "bang, gunshot".
- **A voiced call as a clean sine with vibrato reads "theremin".** Roughness (the level wavering at up to 40 Hz), breath and harmonics make it read "animal" — and no synthesized coo in several hundred variants ever read as the species (the best read "animal, cat"). Say that plainly.
- **Sound follows the lens's focus without denying the picture.** Birds soft in the frame are soft in the ear (−20 dB, low-passed), not silent: they are visibly flapping. At −11 to −16 dB their beats filled the hero's gaps.

## 3. The automatic check — run after every build

One script, one table: `PASS / WARN / FAIL` per check, the number, the threshold, and for anything not passing, what the tool heard. Write the results to JSON so a page and a report can quote them.

| check | question | method and threshold |
|---|---|---|
| SYNC | is every accent within a frame of its cause? | the event log: \|t_vis − t\| ≤ 1 frame |
| BEAT | does the sound beat with the drawn wing? | fold the stem's 300–6000 Hz energy envelope on the drawn beats (40 bins): depth ≥ 8 dB, peak inside the downstroke; rhythm from the log envelope detrended over 1.5 beats, searched at 0.5–2.5× the drawn rate, within 15 % |
| MOTOR | is there a tremolo the picture does not make? | see below |
| EAR | what does something that has heard the real thing hear? | see below |
| MIX | is the mix sound? | per shot: relief (97th − 35th pct of 30 ms) ≥ 5 dB, phone speaker (4th-order HP at 450 Hz) ≤ 6 dB lost, mono ≥ −3 dB; spread across shots 4–9 dB; peak ≤ −1 dBFS; the loudest real source is the loudest (≥ 6 LU); bed hiss ≤ 0.12 |
| CUTS | do cuts cut? | ≥ 12 dB drop within 20 ms after a world-changing cut; nothing rises more than 3 dB in the last 20 ms before any cut |
| SILENCE | is anything left when everything is muted? | digital zero |

**BEAT** can be unmeasurable, not wrong: where eight other birds brake at 6.9–8.2 Hz in the same stem, the stem's rhythm is the crowd's. Say so in the check; the fold's depth and phase still bind the one you care about.

**MOTOR — read it against the passage itself.** Take the fast (8–40 Hz) against the slow (0.3–8 Hz) modulation energy of the band's log envelope. A noise's own bandwidth and grain shake its envelope, so compare with 20 surrogates of the same passage: its power spectrum with random phases, times its own envelope smoothed under 4 Hz (14 Hz for 6 Hz beats). Express the excess as the depth of an 11 Hz tremolo that, laid on the same surrogates, adds as much. PASS under 10 % (a tremolo on noise is heard from about 5–6 %, Viemeister 1979, JASA 66:1364) or within 2 SD of its own noise; FAIL from 15 %. Each earlier form failed in a way worth knowing:
- a fixed white-noise calibration was biased against every band-limited sound;
- a pass line halfway to a 40 % tremolo let 15 % through;
- surrogate mean + 2 SD failed any grain that is not Gaussian — the slow whoosh measured the same with its ticks removed.

**EAR — an AudioSet tagger as a stand-in ear.** EfficientAT `mn40_as_ext` (527 classes, mAP 0.487; weights from its GitHub releases when HuggingFace is blocked), one window per layer, normalised, at least about 1 s long: a 0.35 s window returned "whir 0.73, snort 0.73, fire alarm 0.57". For each layer list the right classes; mark as neutral the catch-alls (Sound effect, Silence, the room, Outside) and the ontology's broad parents (Animal, Domestic animals; breathing's own children); everything else is wrong.
- PASS: a right class in the top 3, at least 0.10, above every wrong one.
- FAIL: a wrong class at least 0.10 and at least twice the best right one.
- WARN: neither — the tagger is not saying anything definite.

Calibrate it on the film's own sounds first: its whistle (0.83), breath and sparrows named right, above every wrong class; the old theremin coo, vehicle flock, eruption town and chop flag caught at 0.13–0.42. Read the wet stem, not the dry bus: dry sparrows read "mouse", with their reverb "bird". **What it cannot do:** "Bird flight, flapping wings" never rose above 0.01 for any synthesized wing, and no coo read "pigeon". It clears wrong categories; it never certifies right ones. A noise bed reads as a noise bed ("white noise", "wind", "surf") whatever you do: a synthesized town carries no town.

**MIX details that bit:**
- The bed for the hiss test is what is continuous in that shot (30 ms relief under 12 dB), not a list of layer names: slow wings that swing 16 dB are an event. Print the old definition's value beside it as INFO, so the redefinition hides nothing.
- Fader rides are assigned per half-open span, never multiplied over widened spans: two rides meeting doubled the gain for 10 ms, +8 dB right before the cut into slow motion, invisible to a drop check that skipped the last 10 ms. Assert the ride curve never exceeds the largest declared gain.

## 4. The bench — one layer at a time

Improve a layer outside the full build, then port it.
- Render the layer function into a fresh bus with the candidate model patched in, add the reverb exactly as the render does, and read the tagger and the metrics in the check's own windows with the check's own rule.
- Grid a handful of physically motivated parameters, rank by the rule, save the finalists as WAVs.
- **Time-box it.** When every variant reads the same wrong family, the representation has hit its limit: stop and report it (the town: never "traffic" in about 50 variants, only white noise, wind, surf or static; the coo: never "pigeon" in several hundred).
- Port, rebuild, run the full check, and read old against new under one rule (`ear_compare.py`). Keep the previous version's stems, mix and page for the A/B.

## 5. Keep your own checks honest

- **A check changed after you saw a result** carries its old definition, the new one and the reason, written in the check. When you redefine what a number covers, keep printing the old number.
- **A parent class is never "right".** Counting "Animal" right passed a coo the tagger heard as a cat.
- **A pass needs a floor.** Without one, a flag read at 0.05 "passed".
- **A comment is a claim.** A note saying slowed ticks made the motor worse was the opposite of the measurement.
- **Get a fresh-eyes review of the code and the checks,** from an agent that has not seen the work: in one round it found two lenient checks, the ride bug, random-stream coupling, a phantom event across a cut, unphysical traffic timing, a wrong comment, and reports older than the last change.
- **Re-run the check and the measurements after the last change**, and compare timestamps before you quote a number.

## 6. Put it in front of the listener: an A/B page with marks

Build the page from a script, never by hand (`build.py`: stems → layer groups as MP3, level curves, accent ticks, the film re-muxed with the new master, the page from a template).
- **The film** with the new master (copy the video stream, encode the audio). Each layer group as MP3: it decodes everywhere, including the headless Chromium used for checks (no AAC there), at zero lag and exact length. The previous version's layers sit beside them.
- **Controls:** version switch (key V); per-layer on/off and solo (solo one layer, switch versions: that layer old against new); frame stepping; a level map per layer with its accent ticks and the listener's marks.
- **Playback:** the film's own audio when the selection is exactly the new full mix; otherwise the layers through Web Audio with the video muted, started with the output latency compensated and restarted when drift exceeds 60 ms.
- **A mark button (key M):** pause; capture time, frame, shot, version and the enabled layers; quick tags ("mos emas", "noto‘g‘ri ovoz", "juda baland", "juda past", "kech / erta", "yoqdi") and a note. Store the marks in the artifact's database (the `db` capability, collection `marks`) so they can be read back with the artifact data tool; without it, keep them in the page with a copy-as-text button. A mark's "go" restores how it was heard: its version and its layers.
- **The page's own CSS needs `[hidden]{display:none!important}`**: a local file has no platform skeleton, and a panel with its own `display` rule stays visible.

## Output

Lead with the listener's words translated into measurements, then the causes found, what changed, and the check table before and after under the same rule. Say what the tools cannot certify (the tagger never names synthesized wings or coos) and which checks you changed and why. Hand over the page and ask for marks. Never say you listened: say measured, read from a spectrogram, or tagged.

## Corrections to `media-audit-reality` (measured here)

- **Narrowing Q to cure hiss has a second cost.** Narrow fixed bands read as tones ("sine wave", "theremin"), and many narrow grains summed read as engines ("vehicle", "train"). For moving sources use a band that moves with the source, textures of sparse impulses, and per-event variation; narrow only what is far.
- **Calibrate against the tested signal's own kind.** A white-noise reference is biased against any band-limited sound; read modulation against surrogates of the passage itself and report it as an equivalent (a tremolo depth).
- **"Bed" means continuous, not a layer list.** Define it by the envelope's relief in that shot.

## What this cannot tell

Whether the sound is pleasant, or right for this film. That is the listener's, and the page exists to collect it. Real recordings of the real sources (a pigeon's take-off and wing claps, a flock passing, a coo, a distant town) are the one thing that would let the tagger be calibrated on the right answers, not only the wrong ones.