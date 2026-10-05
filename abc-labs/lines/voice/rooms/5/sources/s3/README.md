# s3 — danielwh2/cuelume, read at commit caf1548 (2026-09-29T14:46:31+01:00, "0.2.4")

Clone: `work/cuelume` (`git clone --depth 50`, 25 commits — the whole history). Not built, not installed,
not run. Its promo folder, as last tracked, extracted from commit 0d993f0 into `work/promo-at-0d993f0/`
(`git show 0d993f0:promo/<file>`; unchanged since 3f0dc9f, 2026-09-19).

## What decides the sound (line numbers at caf1548)

| what | where |
|---|---|
| a layer = one sine or one filtered-noise source; gain: linear rise over `attack`, then exponential ramp to an absolute 0.0001 over `decay` | `src/audio/engine.ts:49-53`, `:55-97` |
| a struck note = one sine per mode of a material; mode decay = `decay / ratio` (floor 15 ms); 3 ms linear strike; modes above 5 kHz dropped; upper modes are `from: "normal"` (subtle leaves them out) | `src/sounds/recipes.ts:99-127` |
| materials: `BAR` = [1, 1], [2.76, 0.3], [5.4, 0.1] (cites euphonics.org, free-free bar); `MALLET` = [1, 1], [3.99, 0.2] (cites STK ModalBar's marimba) | `src/sounds/recipes.ts:91-96` |
| mallet contact = 3 ms of noise, low-passed at the mallet's hardness (1–3 kHz) | `src/sounds/recipes.ts:131-139` |
| knock = a sine struck 1.6× sharp, dropping to pitch in 18 ms | `src/sounds/recipes.ts:72-84` |
| which cues are struck: `default` success, error, warning, ready, attention (`recipes.ts:229-308`); `mech` success, error, warning, ready, attention (`mech.ts:80-149`). `press` notes use **harmonic** partials ×1, 2, 3, 4 (`press.ts:65-72`); `bubble` is glides (`bubble.ts:20-40`); tap, type, select, toggle, open, close, navigate, loading, count are noise bands, knocks and plain sines |
| shared output: gain 4 into a compressor used as a limiter (−8 dB, ratio 12, 2 ms attack) | `src/audio/engine.ts:39,174-191` |
| shared room: 0.25 s of stereo noise (independent per channel), 8 ms predelay, −60 dB over its length, unit energy, low-passed at 3.5 kHz, send 0.08 | `src/audio/engine.ts:120-172` |
| one voice per cue: a new play fades the last in 80 ms | `src/audio/engine.ts:208-215,262-267` |
| emphasis / context shapes: strong = pitch × 0.98, level × 1.08, length × 1.2; cadence lightens repeats closer than 220 ms | `src/sounds/context.ts:29-34,55-58,100-120` |

## Everything that differs from play to play

1. `Math.random` fills the shared 2 s noise buffer once per page (`engine.ts:111-118`).
2. `Math.random` picks where in it each noise layer starts, every play (`engine.ts:95`) — this includes the
   mallet contact of every struck outcome cue.
3. `Math.random` fills the room's impulse, once per page (`engine.ts:154`).
4. `nudge()` = `Math.random` (`engine.ts:193`) for cues with `vary`: one strike pitch and force per play
   (`:270`), then each layer's decay ±10 % and each tone ±0.5 % (`:204-206,227-231`). `vary` is set on
   default `tap`, `type`, `count` (`recipes.ts:172,187,322`); mech `tap`, `type`, `count` (`mech.ts:27,38,158`);
   **every** bubble and press cue, outcomes included (`bubble.ts:45`, `press.ts:89`, level ±8 %).
5. Time: `performance.now()` since the cue's last play shapes cadence cues (`engine.ts:349-356`,
   `context.ts:100-108`); module state keeps voices and last-play times per page.

So "Outcome cues play the same every time" (README.md:303; s6 docs.txt:259) holds for the tonal layers of
the default and mech outcomes only; their contact noise differs every play (2) and their room every page (3);
bubble and press outcomes vary in level, ring and a hair of pitch (4).

## Tests

`test/runtime.test.mjs` (one file) runs against stub AudioContexts that record parameters
(`:47-102`); no test renders a sample. "A struck note's higher modes die sooner" checks the recipe's `decay`
fields (`:275-290`), not audio. Where exact values are compared, `Math.random` is mocked to 0.5 (`:343,899`).

## History and versions

First commit 2026-07-02 (6e91b03); npm `cuelume` created 2026-07-10 (s4). Struck tones, the room and the
press theme arrived in 0d993f0 at 2026-09-29T14:42 +01:00; 0.2.4 was tagged four minutes later; the post went
out at 15:05 UTC the same day (s1). The README documents "0.3" and a migration "from 0.2" (README.md:274-296)
while package.json and npm say 0.2.4 (package.json:3; s4). Commit 1cacab4: "rename GitHub user to danielwh2";
the author field and LICENSE say Daniel Belyi (package.json:17, LICENSE:3); commits are authored "Daniel White".

## The promo, as committed (work/promo-at-0d993f0)

A Remotion film, "V5: 24 seconds … UI components" (promo/README.md:3,57-67) — not the posted 21-second film.
Its audio: `scripts/audio.mjs` builds the library, serves `dist/audio/engine.js` to headless Chrome, and for
each cue opens a fresh page (`:36-37`), creates `OfflineAudioContext(1, rate*2, rate)` (`:39`), forces
`state` to "running" and `userActivation` (`:41-42`), replaces `Math.random` with an LCG seeded 271828
(`:44-45`), calls the unmodified `play(name)` and renders (`:46-49`). The cues are then placed by sample
offset `round(frame / FPS * 48000)` with a gain each (`:57-64`), a separate score is synthesised in plain JS
(`:66-121`), and ffmpeg `loudnorm` masters it (`:139-142`). `scripts/check.mjs` asserts the WAV's first
non-zero sample falls within −1 frame … +40 ms of the first cue's frame (`:26-35`). The README says "Noise is
seeded for reproducible capture" (promo/README.md:55) and that the cues were "captured from the current 0.2.2
engine" (:83).
