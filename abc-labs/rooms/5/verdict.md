# Verdict — Cuelume, UI sounds as struck bars, 2026-09-30

**In one line:** do not build — Cuelume is a finished, MIT, dependency-free browser library that
`npm install` already delivers, with nothing for Labs to host or rent. What is worth having is a
mechanism, not the package: the struck-bar model as data, and the author's own seeded offline capture.
Both go to code-video (`for/code-video.md`).

## What this is

- **The post** (Daniel White, 2026-09-29 15:05 UTC): "What if every sound in your UI was a struck object
  instead of an audio file?" and a link to cuelume.dev, with a 21.3 s video [s1]. The site credits
  "Built by Daniel White" and links the repository [s5]. Its commits are authored "Daniel White", and the
  licence and npm author field say "Daniel Belyi". The repo was renamed from Danilaa1 [s3 commit 1cacab4].
  The chain is one author's by every link; the two surnames are recorded, not explained.
- **The code** [s3, commit caf1548 = npm 0.2.4 [s4]]: about 1,700 lines of TypeScript (`wc -l src/*/*.ts`).
  It has fourteen cues (tap, type, select, toggle, open, close, navigate, success, warning, error, loading,
  ready, attention, count) in four themes (default, mech, bubble, press) and three emphases. Every sound is
  built live from Web Audio oscillators and filtered noise. `bind()` wires `data-cuelume-*` attributes, and
  `play()` is for outcomes. A layer rises linearly over `attack`, then ramps exponentially to an absolute
  0.0001 over `decay` (`engine.ts:49-53`).
- **"Modelled on real bars"** means, in numbers [s3/README.md], one sine per mode:
  - a free bar at ×1, 2.76, 5.4 (levels 1, 0.3, 0.1), or a marimba bar at ×1, 3.99 (1, 0.2) (`recipes.ts:91-96`);
  - each mode decays over `decay / ratio`, so a higher mode dies sooner (`:111-127`);
  - a 3 ms linear strike (`:101`) and a 3 ms low-passed noise burst as the mallet (`:131-139`).

  This covers the **outcome cues** of default and mech: success, error, warning, ready, attention. The
  rest are noise bands, pitch-dropping "knocks" and plain sines. The press theme's notes are *harmonic*
  (×1, 2, 3, 4, `press.ts:65-72`), and bubble is glides. "Every sound … a struck object" describes five
  cues in two themes.
- **The video is the code's sound** [s2, `sources/s2/frames.md`]. There are six strikes on wireframe
  objects, with no music between them. Each one sounds the theme whose caption types in next: bubble,
  press, mech, default, `play("count")`, then the logo. Measured through the AAC track:
  - the logo hit has peaks at 392.1, 1080.3 and 2116.1 Hz: ratios 2.755 and 5.397, the free bar;
  - the default `success` hit has 522.7/783.8/1317.0 Hz, with the ×3.99 modes at 2086.6 and 3128.8 Hz;
  - higher modes decay faster (392 → 1080 → 2116 Hz: 134 → 235 → 292 dB/s).

  The logo hit is **not exactly 0.2.4**. It has the strong-only 196 Hz bar at normal pitch, while 0.2.4's
  strong emphasis also lowers pitch by 2% to 384/192 Hz (`context.ts:32`). The film's own render source
  was untracked the same day ("promo/ stays local", commit 5e099a8).
- **Claims checked**:
  - *Zero runtime dependencies*: holds (package.json has none; esbuild bundles it with no externals) [s4].
  - *Fourteen cues*: holds (`recipes.ts:154-324`).
  - *"6.4 kB min+gzip"* [s7:5]: our esbuild 0.25 bundle is 26,768 B minified, **7,415 B min+gzip** and
    6,584 B (6.43 KiB) min+brotli (`sources/s4/sizes.txt`). The figure fits brotli, not gzip.
    `themes.ts` imports all four themes, so nothing tree-shakes away.
  - *"Outcome cues play the same every time"* (README.md:303, [s6]): holds only for the tonal layers of
    default and mech. The mallet noise starts at a `Math.random` offset on every play (`engine.ts:95`),
    and the room is random noise per page (`:154`). Bubble and press outcomes vary ±8% in level, ±10% in
    ring, ±0.5% in pitch (`bubble.ts:45`, `press.ts:89`, `engine.ts:227-231`).
  - *"Used by Vercel in fx"* [s5:2]: fx, Vercel's Zig coding-agent CLI, embeds **AAC files rendered from
    the recipes** and plays them with `afplay` on macOS. Other systems get the terminal bell
    (`sound.zig:7-26,160-165`) [s8]. The one named adopter uses rendered files, not live synthesis.
- **Age**: first commit 2026-07-02 and on npm since 2026-07-10 [s3][s4]. The struck model and the room
  landed in 0d993f0 at 13:42 UTC on 2026-09-29, 1 h 23 min before the post [s3][s1]. The README already documents a "0.3" that npm
  does not have (README.md:274-296; npm latest 0.2.4 [s4]).
- **Its tests never render a sample.** They run against stub AudioContexts that record parameters
  (`test/runtime.test.mjs:47-102`). "Higher modes die sooner" is checked on the recipe's fields
  (`:275-290`), not on sound [s3].

## What already exists

- **UI sounds from files**: use-sound, a React hook over Howler.js that plays an MP3 you supply ("<1kb …
  ~10kb loaded async") [s9]. This is the audio-file approach the post argues against.
- **Parameterised synthesis in the browser**: ZzFX, "less than 1 kilobyte when compressed", one parameter
  array per effect, with randomness from `Math.random` [s10]. jsfxr, the sfxr port with presets, renders to
  a buffer or WAV data URI [s11]. Tone.js is a full framework: transport, synths, effects [s12]. None of
  them offers a curated UI palette by job, which is what Cuelume adds.
- **Modal / struck-bar synthesis**: STK's ModalBar gives the marimba mode ratios 1.0, 3.99, 10.65 [s13].
  Cuelume keeps the first two (`recipes.ts:96`).
- **Ours**: code-video's `oq-kocha/src/sound.mjs:133-143` already strikes a free bar: modes 1, 2.76, 5.40,
  each mode decaying over 0.55/√r. It renders offline through `OfflineAudioContext` with seeded noise
  (`tools/mkfilm.py:354-373`, `sound.mjs:15-21`) [code-video @ ff977c2].

## Worth building?

No. Three facts:

1. **There is nothing to build or host.** It is an ESM package with no server side, MIT, no dependencies,
   on npm [s3][s4]. A Labs surface that wanted UI sounds would install it. `host`, `mcp` and `web` have
   nothing to carry, and a wrapper would only add a layer.
2. **The valuable part is small and is technique.** It is the modes as [ratio, level] data, decay ∝
   1/ratio, a short linear strike and a noise contact (`recipes.ts:86-139`, ~50 lines). Our own film code
   already holds a sibling of it (`sound.mjs:133-143`).
3. **As a library it is not reproducible offline.** The randomness sits in four `Math.random` sites, plus
   `performance.now()` cadence and per-page module state [s3/README.md]. Its own author had to fake
   `state`, `userActivation` and `Math.random` and reload the page per cue to capture it (promo
   `scripts/audio.mjs:36-49` at 0d993f0). Its one named adopter shipped rendered files [s8].

## How, if yes

Nothing is built and nothing is rented. The one piece of work this room recommends is in code-video's own
repository, proposed on `for/code-video.md`:
- mode tables and decay law as data;
- a decay-order check on the rendered samples;
- an onset check on the rendered samples.

It needs no key and no account; the greenlight is the code-video developer's to give.

## What was checked and what was not

- **Opened**: the post via the fxtwitter mirror [s1]; every frame (t000–t020) and six 1-second strips of
  the video; its audio as six measured events with STFT pictures and stereo analysis [s2]; the whole source,
  tests and history, and the untracked promo recovered from history [s3]; the npm tarball, weighed [s4]; the
  site, docs and agents.md [s5–s7]; fx's source [s8]; the comparison READMEs and ModalBar [s9–s13].
- **Not done, on purpose**: Cuelume was not installed, built, run or listened to (the brief forbids it before
  `building`). The film's audio was measured, not heard. The size was weighed with esbuild, not the
  author's tool.
- **Not done, for lack of a way in**: the posted film's own render source (untracked, local). Replies under
  the post (the mirror returns none). euphonics.org and van den Doel & Pai, which the code cites, were not
  fetched.
- Two ffmpeg containers of this room (`room-5-3389273`, `room-5-3402681`) hung in `showspectrumpic` and
  were still running at this writing. `labs room stop 5` only stops a detached run, so they need a
  `podman stop` by someone allowed to (`sources/s2/frames.md`).

*Last rewritten 2026-09-30.*
