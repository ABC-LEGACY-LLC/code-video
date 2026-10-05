# For code-video, from room 5
Written 2026-09-30 against code-video `ff977c2` (the workshop's clone) and Cuelume `caf1548` (= npm 0.2.4)
with its promo as last committed at `0d993f0` [s3]; the posted film [s2]. Nothing of Cuelume was run.

## What this is

Cuelume is a browser library that strikes bars in Web Audio for UI sounds. Its film is measurable from
its sound alone: the modes, their decay order, the onsets. The same measurements, run on
`__renderAudio`'s samples, would give `oq-kocha` audio checks that hold something.

Where to start: item 1 (render events alone and check every onset against the timeline), then item 3
(the bar's decay order, with a broken state that really breaks).

## Worth taking

1. **Check onsets in the rendered samples, not in the timeline.**
   What the source does: the promo's check reads the WAV and asserts its first non-zero sample lies within
   −1 frame … +40 ms of the first cue's frame (promo `scripts/check.mjs:26-35` at 0d993f0) [s3]. This room
   went further on the posted film. On a 1 ms RMS envelope, an onset is the first ms above −45 dBFS after
   ≥ 80 ms below. That found all six strikes, each at the moment the strips show the dot touching, to the 0.1 s the
   strips resolve (`sources/s2/frames.md`, strips e1–e6) [s2].
   → The gap in code-video: `audio/footfall-sync` scores `TIMELINE` times against the drawings
   (`oq-kocha/test/checks-audio.mjs:48-77`) and never opens the PCM. A voice scheduled late inside the graph
   would pass it; for example, `s.start(t+0.05)` in `step()` (`oq-kocha/src/sound.mjs:104`). The one-frame
   slip described at `tools/mkfilm.py:214-218` sat in the event list, where `footfall-sync` can see it; the same
   slip inside the graph would pass unseen.
   → How:
   - Give `__renderAudio` an options argument, `{beds:false, only:['step']}`. Skipping the `beds.set` loop
     leaves every bed at its initial gain 0 (`sound.mjs:56,73,76`), so the events render alone.
   - Add `onsets(x, sr)` to `dsp.mjs` (1 ms RMS, gate as above; ~15 lines).
   - Add a new check `audio/onset`. For every `step` in `TIMELINE` with no other event in the 120 ms before
     it, `measure` = the worst |onset − t| in ms. `pass` = ≤ 3 ms (the step rises linearly in 4 ms,
     `sound.mjs:99-100`). `calibrate` = the same render with every event moved one frame, 1/FPS ≈ 42 ms,
     which must fail.
   → Where: `oq-kocha/tools/mkfilm.py:354-373` (`__renderAudio`), `oq-kocha/test/dsp.mjs`,
   `oq-kocha/test/checks-audio.mjs`.
   → Effort: S.

2. **A struck object's modes as one table that the renderer and the checker both read.**
   What the source does: a material is a list of `[ratio, level]` pairs, `BAR = [1,1],[2.76,0.3],[5.4,0.1]`
   and `MALLET = [1,1],[3.99,0.2]` (`src/sounds/recipes.ts:91-96`). One function turns any pitch and
   material into one sine per mode, each decaying over `decay/ratio` (`:111-127`), and its tests read the
   same table (`test/runtime.test.mjs:275-290`) [s3].
   → How: `metal()` keeps its table inline in the loop `[[1,1],[2.76,0.5],[5.40,0.22]]`. The pitch 430 Hz
   and the law `0.55/Math.sqrt(r)` sit in the call (`oq-kocha/src/sound.mjs:135-140`). Export
   `METAL = {f0:430, modes:[[1,1],[2.76,0.5],[5.40,0.22]], ring:0.55, law:0.5, attack:0.003, floor:0.0003}`,
   make `metal()` read it (`T_k = ring / r_k^law`), and let item 3 read the same object. It is the same
   rule as a work's card agreeing with its source (`loyihalar/tools/karta.mjs`, per the profile), applied
   to one voice.
   → Where: `oq-kocha/src/sound.mjs:133-143`.
   → Effort: S.

3. **Measure that the bar's upper modes die first, and pick the broken state that really reverses it.**
   What the source shows: in the film's logo hit, the free-bar modes 392 → 1080 → 2116 Hz fall at
   134 → 235 → 292 dB/s. The ratios read 2.755 and 5.397 even through AAC at 128 kb/s (`sources/s2/frames.md`,
   `audio/events.json` event 6) [s2]. One subtlety applies to both codes: gain ramps exponentially to an
   *absolute* floor (Cuelume 0.0001, `src/audio/engine.ts:52` [s3]; code-video 0.0003, `sound.mjs:140`).
   A mode's slope is therefore 20·log10(peak/floor)/T. It depends on the mode's level as well as its time.
   → Worked on `metal` at its event gain 0.045 (`tools/mkfilm.py:223`). The peaks are 0.108, 0.054 and
   0.0238. With T = 0.55/√r, the slopes come out at **93, 136, 160 dB/s**, rising as they should. With one T
   for all modes (`law: 0`, the natural mistake), they come out at **93, 82, 69 dB/s**: the order
   *reverses*, because the quieter upper modes have fewer dB to fall. So the check has a broken state that
   really breaks, and no invented one is needed.
   → How: a new check `audio/metal-modes`.
   - Render one `metal` event alone (item 1's `only:['metal']`, 1 s, 48 kHz).
   - Take each mode's ±3 % band level in 20 ms windows every 5 ms and fit a line over the first 40 dB.
     `band_decay` in this room's `sources/s2/analyse.py` does this in ~20 lines; `dsp.mjs` already has
     the FFT.
   - `pass` = slope(mode k+1) > 1.2 × slope(mode k) for both pairs, and each measured f_k/f_1 within 1 %
     of `METAL.modes`.
   - `calibrate` twice: `law: 0` must fail the order, and harmonic ratios `[1, 2, 3]` must fail the ratio
     test. That is their own warning, "harmonic partials give you a flute" (`sound.mjs:134`).
   → Where: `oq-kocha/test/checks-audio.mjs`, `oq-kocha/test/dsp.mjs`, `sound.mjs` (reads item 2's export).
   → Effort: S once items 1–2 are in.

4. **Prove the render is the same samples every time, including after a reload.**
   What the source shows: Cuelume draws on `Math.random` in four places, plus `performance.now()` cadence
   and per-page module state (`sources/s3/README.md`, "Everything that differs") [s3]. Its author could
   capture it reproducibly only by replacing `Math.random` with a seeded LCG, faking `state` and
   `userActivation`, and **loading a fresh page for every cue** (promo `scripts/audio.mjs:36-49` at 0d993f0;
   "Noise is seeded for reproducible capture", promo `README.md:55`) [s3].
   → code-video is already seeded: noise seed 22222 (`sound.mjs:18`), crunch seeds (`:28`), buffer offsets
   derived from `t` (`:112,122,131`). Nothing proves it stays that way, though. One future voice with
   `Math.random`, a clock, or a borrowed synth would turn every audio number into a sample of one.
   → How: a new check `audio/replay`.
   - Render `__renderAudio(2, 16000)` twice in one page, then once more after `page.reload()`. The reload
     is the promo's page-per-cue move, and it catches module state.
   - Hash the Float32 bytes (sha256). `pass` = three equal hashes.
   - `calibrate` = the same with the noise seed passed as an option and changed by one (22223): the hash
     must differ.
   - Write the hash and `browser.version()` into the work's card. A Chromium change that moves the samples
     (compressor and biquad are the engine's) then shows up as a stated fact. The render already pins a
     build (`tools/render-audio.mjs:2`; `test/browser.mjs:4-14`).
   → Where: `oq-kocha/test/checks-audio.mjs`, `tools/mkfilm.py:354-357` (a `seed` option).
   → Effort: S.

5. **Keep both channels out of the offline render, and measure the stereo.**
   What the source shows: the film's stereo told this room what its own code could not. The side channel
   stays 22.6 dB under the centre in a dry cue's tail. It rises to 14 dB under in `success` and `ready`,
   the two cues that send twice as much to the stereo room. That is how we knew the posted film was not the
   committed mono capture (`sources/s2/stereo.py`, `audio/stereo.json`, `frames.md`) [s2].
   → code-video's own skill says "Capture in stereo" and asks for L/R correlation and mono collapse
   (`skills/media-audit-reality/SKILL.md:253,258`). But `__renderAudio` averages L and R before returning
   (`tools/mkfilm.py:370-372`), so no check can see the `StereoPanner` on every voice (`sound.mjs:91`).
   → How:
   - Return `{sr, L, R}`; the mono mix can still be made in the check.
   - Add `audio/mono-collapse` = 20·log10(RMS(mono) / √mean(L², R²)), as the skill defines it.
   - `pass` > −3 dB. `calibrate` = R with its polarity inverted, which collapses and must fail.
   → Where: `tools/mkfilm.py:354-373`, `tools/render-audio.mjs:16-25` (its only other caller),
   `test/checks-audio.mjs:12-14`.
   → Effort: S.

## Not worth taking

- **Cuelume itself in a film.** Its cues mean UI states (success, error), not events in a scene. Rendering
  it reproducibly needs the promo's whole harness: a fake `AudioContext` state, fake user activation,
  `Math.random` replaced, a page per cue [s3]. And its outcome cues still carry a random mallet noise offset
  on every play (`src/audio/engine.ts:95`) [s3].
- **The shared room** (0.25 s of stereo noise as an impulse response, `engine.ts:120-172`) [s3].
  `oq-kocha` is outdoors in snow, where a small room is wrong. The impulse is also `Math.random` per page
  (`:154`); if a room is ever wanted, seed it.
- **Rendering to files and embedding them**, as Vercel's fx does with the recipes
  (`src/core/notifications/sound.zig:18-26`) [s8]. That is the opposite of "the code makes them again".
- **Cuelume's way of testing**: stub AudioContexts that record parameters, with no sample ever rendered
  (`test/runtime.test.mjs:47-102`) [s3]. Such a check passes without holding the sound; code-video already
  does better.
- **Changing `metal`'s law to Cuelume's 1/r** only because Cuelume does. Both laws make upper modes die
  first; 1/r would give 93, 226 and 373 dB/s here, which is sharper, not truer. Item 3's check holds either.

## Open questions for the owner

- Is `metal` meant to be heard as a struck bar, or is it an incidental tick? If it is a bar, item 3 guards
  it; if not, items 1, 4 and 5 still stand without it.
- May `__renderAudio` change its return shape to `{sr, L, R}`? Item 5 needs it, and
  `tools/render-audio.mjs` is its only other caller.
- Should this room write these as patches? It would clone the repository into the room and put one
  `.patch` per item in `for/code-video.patches/`.

---
*From room 5 of the Labs workshop (Cuelume UI sounds). Edited there, never here: `labs rooms pull` brings the newest.*
