# For code-video, from the line voice
(written 2026-10-04 against your `ff977c2`, still the head of the workshop's clone that night; from rooms 5 (Cuelume UI sounds), 12 (Retro note app, item 3's bed rule), 19 (Gapirov rain sound, with its policy pass of that evening), 32 (Eleven v4) and 41 (parakeet.cpp); items 1–5 from entries e0084–e0087, items 6–8 and 10 from e0004–e0006, a wide bed's check in items 5 and 8 from e0168, item 9 from e0087, e0092 and e0093, with e0090 and e0091 behind its "not worth taking"; on 2026-10-05 one "not worth taking" from room 29 (Cactus Whistle), e0222 and e0223, and later that day whisper `small`'s Uzbek in it, e0225)

## What this line has for you

Three rooms read other people's sound beside your tree. Room 5 took apart Cuelume, an MIT
library that strikes bars in Web Audio, and measured its film's sound without hearing it [room 5
s2, s3]. Room 19 never got the rain film it was opened on and was concluded without it; it read
the literature on what a rain sound is made of, ran a trial of three files and 225 lines (the
rain itself is 73): a seeded rain and a check that tells it from hiss, and then tried that check
on five rains recorded by others [room 19 s6, s8, s11, s19, s27]. Room 32 read Eleven v4, ElevenLabs' new cloud voice, and
the spec ad made with it, and ran an open voice twice [room 32 s8, s10, s16, s23]. Room 41 read
parakeet.cpp, a local engine that hears words, speakers and 527 kinds of sound in one stream,
and ran one part of it alone: CED, the sound tagger, on a rain made by code after room 19's
recipe, on that rain's phase twin and on two recorded rains [room 41 s2, s14]. What comes
out for you is audio checks that open the rendered samples (a repeat, an onset, a decay order, a
stereo collapse, a texture), each with a broken state that was worked out or run; one door they
all need in `__renderAudio`; for `mushuk`, whose rain is random on every load and unmeasured, the
three steps and the numbers that would put it under your own rule; a second opinion on a rain
bed from a model trained on recorded sound, for your audit; and, for the day a work
speaks, the terms on which a voice is one the code makes again, which a cloud voice can never
meet. Nothing in your suite becomes a dependency, and nothing is a recording.

Where to start: item 1 (the door: a voice or a bus alone, both channels, a seed), then item 2 (the repeat hash) and item 3 (the onset, which is the video line's item 9 as well); items 4 and 5 after those; item 6 when a work has a texture to hold, which today means after item 7, and item 10 beside it in the audit; item 9 only when a work speaks (question 5).

How to read it. `[room 5 s3]` is room 5's source s3. `src/…`, `test/…` and promo paths beside
[room 5 s3] are Cuelume's at `caf1548`; `work/trial/…` is room 19's trial [room 19 s19]; every
other path is yours at `ff977c2`. The rooms read your code and ran none of it; your working
tree as you reported it to the video line may differ. Numbers for `metal` in item 4 are
arithmetic from your code, the numbers in items 6 to 8 come from two synthetic rains that nobody
has listened to (room 19's trial and room 41's rebuild of it) and, for item 6's check, from five
recorded rains measured and not heard; item 10's from eleven clips on one CPU, none of them heard;
those in item 9 come from one English line on one CPU that nobody has listened to either. Check and field names are proposals in your idiom. Effort: S an afternoon, M days, L
weeks. No patch exists yet; ask for one in the line's log and the room whose finding it is
makes it.

## Worth taking

1. **A render the checks can aim: one voice or one bus alone, both channels, the seed as an
   argument** (e0087 — inspiration: the idea of each sound rendered alone in a fresh context,
   never the promo's script, which its author removed from the tree). Cuelume's author renders each cue alone, on a fresh page, into an
   `OfflineAudioContext` (promo `scripts/audio.mjs:36-49`) [room 5 s3]; room 19's trial renders
   any layer alone, `render(recipe, only)`, and draws each layer from a stream of its own so
   that adding a layer moves no other (`work/trial/rain.mjs:43-48`) [room 19 s19]. Every
   measurement below needs the same: your `__renderAudio(seconds, sr)` renders the whole mix,
   averages L and R before it returns (`oq-kocha/tools/mkfilm.py:370-372`), and the noise seed
   is a literal (`oq-kocha/src/sound.mjs:18`).
   → How: a third argument, `__renderAudio(seconds, sr, {beds:true, only:null, seed:22222,
   stereo:false})`, whose defaults leave today's four numbers where they are. `beds:false` skips
   the `beds.set` loop (`mkfilm.py:360-363`); every bed then stays at its initial gain 0
   (`sound.mjs:56`, `:73`, `:76`) and the events render alone. `only:['step']` filters the event
   loop (`mkfilm.py:364-368`). `seed` goes to `noiseBuffer(ctx, seconds, seed)`. `stereo:true`
   returns `{sr, L, R}` in place of `pcm`. `oq-kocha/tools/render-audio.mjs:16` is the only
   other caller and needs no change.
   → Where: `oq-kocha/tools/mkfilm.py:354-373`, `oq-kocha/src/sound.mjs:15-21`.
   → Effort: S.

2. **The same samples every time, proved by a hash that survives a reload** (e0087 —
   inspiration: the five sites and the proof, rebuilt as your own check). Cuelume draws on
   `Math.random` in four places and on `performance.now()` and per-page state in a fifth; its
   promo says "Noise is seeded for reproducible capture" and gets there by replacing
   `Math.random` and loading a fresh page for every cue [room 5 s3]. You are already seeded:
   noise from 22222 (`sound.mjs:18`), crunches from their index (`:28`), buffer offsets from
   `t` (`:112`, `:122`, `:131`). Nothing proves it stays so, and one future voice with
   `Math.random` or a clock would turn every audio number into a sample of one.
   → How: a check `audio/replay`. Render `__renderAudio(2, 16000)` twice in one page and once
   more after `page.reload()`, which is what catches module state; sha256 of the Float32 bytes;
   pass on three equal hashes. Calibrate with `seed: 22223`, which must give another hash. Room
   19's trial does exactly this in Node: one hash twice under seed 19, another under seed 20
   [room 19 s19]. Write the hash and `browser.version()` into the card, so a Chromium that moves
   the samples (the compressor and the biquads are the engine's) shows up as a stated fact.
   → Where: `oq-kocha/test/checks-audio.mjs`; item 1's `seed`.
   → Effort: S.

3. **A footstep's onset read from the samples, not from the schedule** (e0085 — as it is: the
   workshop's own method). Room 5 found all six
   strikes of Cuelume's film from the sound alone: on a 1 ms RMS envelope, an onset is the first
   millisecond above −45 dBFS after at least 80 ms below; each landed where the frame strips
   show the dot touching [room 5 s2]. Cuelume's own promo asserts less, that the WAV's first
   non-zero sample lies within −1 frame … +40 ms of the first cue (promo `scripts/check.mjs:26-35`)
   [room 5 s3]. Your `audio/footfall-sync` scores `TIMELINE` times against the drawings and
   never opens the PCM (`oq-kocha/test/checks-audio.mjs:48-77`): a voice started late inside the
   graph, `s.start(t+0.05)` at `sound.mjs:104`, passes it.
   → This is one check with the video line's item 9, which reached it from open-edit; build it
   once. What this line adds is the finder and the gate.
   → How: `onsets(x, sr)` in `dsp.mjs`, about 15 lines. Render with `{beds:false,
   only:['step']}`. Leaving the beds out is required, not optional. Over a bed, a fixed gate
   finds nothing between events: in a 15 s promo, `silencedetect` at −30 dB found only the head
   and the tail of dozens of key clicks (e0085, Limits) [room 12 s2]. Score the steps that have no other step in the 220 ms before them, and throw
   when fewer than a handful qualify. (A step falls about 357 dB/s, `sound.mjs:100-101`, so it is
   under the gate some 130 ms after it lands and the gate wants 80 ms more; that is the line's
   arithmetic, not a measurement, and room 5's 120 ms was too short by it.) `measure` = the
   worst |onset − t| in ms; pass under half a frame, 21 ms, as the video line has it.
   `calibrate`: the same render with every step started one frame late inside the graph, which
   must read about 42 ms; it is the slip your comment at `mkfilm.py:214-218` describes, moved to
   where `footfall-sync` cannot see it.
   → Print the median offset as well. The step rises in 4 ms (`sound.mjs:99-100`), so room 5
   expects it within 3 ms. Every voice also passes a `DynamicsCompressor` (`sound.mjs:43-46`),
   and no room has measured whether that delays an offline render; if the median is a constant
   few milliseconds, that is the bus, and it belongs in the card.
   → Where: `oq-kocha/test/dsp.mjs`, `oq-kocha/test/checks-audio.mjs`.
   → Effort: S after item 1.

4. **The struck bar as one table the renderer and the checker both read, and a check that its
   upper modes die first** (e0084 — inspiration: the ratios are physical facts, the table
   rebuilt in your `sound.mjs`, never `recipes.ts` copied; e0086 — as it is: arithmetic). In Cuelume a material is a list of `[ratio, level]` pairs, `BAR =
   [1,1],[2.76,0.3],[5.4,0.1]`, one function turns it into a sine per mode decaying over
   `decay/ratio` (`src/sounds/recipes.ts:91-127`), and its test reads the same table
   (`test/runtime.test.mjs:275-290`), though only the table: it renders no sample [room 5 s3].
   In the film's sound the property itself is measurable: the modes at 392, 1080 and 2116 Hz
   fall at 134, 235 and 292 dB/s, ratios 2.755 and 5.397, through AAC at 128 kb/s [room 5 s2].
   Your `metal()` is the same bar with its table inline: `[[1,1],[2.76,0.5],[5.40,0.22]]`, 430
   Hz, decay `0.55/Math.sqrt(r)`, floor 0.0003 (`sound.mjs:135-140`).
   → How, the table: export `METAL = {f0:430, modes:[[1,1],[2.76,0.5],[5.40,0.22]], ring:0.55,
   law:0.5, attack:0.003, floor:0.0003}` and let `metal()` read it, `T = ring / r^law`. It is
   your card rule (a work's data agrees with its source) applied to one voice.
   → How, the check `audio/metal-modes`: render `{beds:false, only:['metal']}`; the events are
   17 frames apart (`mkfilm.py:223`) and a voice stops at `t+0.7` (`sound.mjs:141`), so each
   sits in its own window, and alone no footstep drives the limiter under it. For each mode,
   the level of its ±3 % band in 20 ms windows every 5 ms, a line fitted over the first 40 dB;
   room 5's `band_decay` does it in about 20 lines of numpy (`sources/s2/analyse.py`) [room 5
   s2], and `dsp.mjs` has the FFT. Pass when each mode's slope is more than 1.2 times the one
   below it and each measured ratio is within 1 % of `METAL.modes`.
   → The broken state is real, not invented. A ramp to an absolute floor falls at
   20·log10(peak/floor)/T dB/s, so a mode's slope depends on its level as well as its time
   [room 5 s3, `src/audio/engine.ts:49-53`]. At the event gain 0.045 (`mkfilm.py:223`) the peaks
   are 0.108, 0.054 and 0.0238 and the slopes 93, 136 and 160 dB/s. With one T for all modes
   (`law: 0`, the natural mistake) they are 93, 82 and 69: the order reverses, because the
   quieter modes have fewer dB to fall. Calibrate twice: `law: 0` must fail the order, and
   ratios `[1, 2, 3]` must fail the ratio test, which is your own warning at `sound.mjs:134`.
   → Where: `oq-kocha/src/sound.mjs:133-143`, `oq-kocha/test/checks-audio.mjs`,
   `oq-kocha/test/dsp.mjs`.
   → Effort: S for the table, S for the check. Whether `metal` is meant as a bar is question 1.

5. **Both channels out of the render, and the stereo measured** (e0085 — as it is: the
   workshop's own method). The stereo of Cuelume's film
   told room 5 what the code could not: the side channel sits 22.6 dB under the centre in a dry
   cue's tail and 14 dB under in the two cues that send twice as much to a stereo room, which is
   how the room knew the posted film was not the repository's mono capture [room 5 s2, s3].
   Your own skill says "Capture in stereo" and defines mono collapse
   (`skills/media-audit-reality/SKILL.md:253`, `:258`), and every voice has a `StereoPanner`
   (`sound.mjs:91`), but the measured render is the average of L and R (`mkfilm.py:370-372`), so
   no check can see a pan.
   → How: a check `audio/mono-collapse` on item 1's `stereo:true`: 20·log10(RMS((L+R)/2) /
   √mean(L², R²)), as the skill defines it; pass above −3 dB; calibrate with R's polarity
   inverted, which cancels and must fail.
   → On the events, never on a wide bed. Two channels that are unrelated and equally loud read
   −3.0 dB by this formula (half the power survives the sum), which is the skill's own line for
   "something cancels" (`SKILL.md:258`), and inverting one of them changes nothing, so the
   calibration cannot fail on such a bed. A recorded rain is one: its side stands +0.2 to −1.5 dB
   against the centre in 1–8 kHz [room 19 s27], which is −3.1 to −2.3 dB here (the line's
   arithmetic, not run). So the check renders with `only:` the panned voices, and a bed made wide
   as item 8 says stays out of it.
   → A wide bed gets its own check, the day there is one (e0168 — as it is: arithmetic, ours).
   It has two numbers. The first is the fold per band on the bed's bus, broken by replacing R
   with −L, which folds to nothing. The second is the peak L/R correlation over ±40 ms, broken by
   R = L delayed 0.5 ms. It needs the second because a 0.5 ms copy reads −3.0 dB in every octave
   from 1 to 8 kHz, exactly like two seeds. Both are arithmetic and neither has been run.
   → Where: `oq-kocha/test/checks-audio.mjs`.
   → Effort: S after item 1.

6. **A texture held by its band envelope, proved against its phase twin** (e0005 — inspiration:
   the statistic is from a published paper and is cited, never copied; room 19's code for it is
   ours, and you may take it unchanged). A rain, a fire or a
   crowd has no separate events to find and the long-term spectrum of a hiss; what makes it the
   thing is in time. Listeners recognise water textures from the sparsity of each band's
   envelope and not from the power per band [room 19 s8]. Room 19 measures that as the kurtosis
   of one band's envelope, taken as the median over 1 s blocks: about 3 for a hiss (3.05 for
   white noise), 10.3 in 4–8 kHz at 16 kHz for its trial's rain of 105 near drops a second over a
   bed. Its broken state is the phase twin, the same magnitude spectrum with every phase replaced
   by a seeded random one: 3.2–3.3; with the near drops' gain at 0 the trial reads 3.8 [room 19
   s19, s27]. On rains nobody here made, five from Wikimedia Commons measured where they lay in
   three 20 s windows each, four pass a threshold of 5 in every window at the 16 kHz your checks
   run at: a window pane 17.7–32.7, a light rain 23.1–55.3, rain on leaves 8.1–14.9, and the one
   lossless file, rain in a wood, 5.49–7.20; every twin reads 3.19–3.31 [room 19 s22, s24, s25,
   s26, s27].
   → How: four functions in `dsp.mjs` on the `fft` already there (`:2-22`), about 30 lines,
   written out in room 19's `work/trial/dsp.mjs:45-81` and `work/trial/measure-real.mjs:24-30`,
   which you may copy as they are:
   `bandEnvelope(S, sr, lo, hi)` (keep the band's positive frequencies, double them, inverse FFT,
   magnitude), `kurtosis(env)` (m4/m2²), `kurtosis1s(env, sr)` (the band's envelope of the whole
   render cut into whole seconds, the kurtosis of each, their median), `phaseTwin(x, seed)`. Then
   a check in the shape of `checks-audio.mjs:18-22` on the texture's bus rendered alone:
   `{name:'audio/rain-is-drops', unit:'4–8 kHz envelope kurtosis, median of 1 s blocks, 3 = hiss',
   measure, pass: v => v > 5, calibrate: () => kurtosis1s(bandEnvelope(spectrum(phaseTwin(X)), sr,
   4000, 7900), sr)}`.
   → Why the median: over 20 s of a recorded rain a few loud drops rule the fourth moment, and
   the whole-window number of one file swings from 64 to 245 between windows, where the 1 s
   median reads 8.1–14.9. On the trial's steady rain the two agree, 10.24 and 10.28 [room 19 s27],
   so for a rain of yours the median costs nothing and keeps its number on the scale of a
   recorded one.
   → The band and the threshold: 4–8 kHz (4–7.9 at 16 kHz) and 5 hold the trial and four
   recorded rains; 5 is 0.49 under the lowest of them, read off a table and not a law. A rain
   without that band does not pass: a heavy rain recorded at 8 kHz on a phone's voice-recorder
   app reads 3.57–3.63 in the 2–3.6 kHz it has [room 19 s23, s27]. Your checks run at 16 kHz
   (`checks-audio.mjs:12`), which keeps the band; do not measure a bed below that. For a new
   bed, measure the octave bands from 500 Hz up once, as `work/trial/measure.mjs:10-16` does, and
   see that 4–8 kHz is where the bed and its twin stand farthest apart before taking it on trust.
   → Where it stops holding: near drops 16 dB under the bed read 4.84, at 22 dB 3.74; ten times
   as many drops at the same power 3.90, a hundred times 3.43 [room 19 s19] (whole-window numbers
   on the trial, where whole and median agree). Other events in the band count as drops: a
   wood's distant thunder and a bird read 90–310 in 0.5–1 kHz over the whole window [room 19
   s25, s27]. So the check
   runs on the rain bus alone, item 1's `only`. Whether a bed that fails reads as hiss to an ear
   was not tested.
   → A third place it stops: drops that ring long. Room 41 rebuilt the trial's rain from its
   description, 105 near drops a second 10 dB under a bed; with each drop a burst over eight
   bands decaying in 3–30 ms it read 3.46, hiss, and with room 19's leaf (one band of Q 2,
   2–8 ms) 5.51 and 5.53, twin 3.24 [room 41 s14] (e0004). Two things follow. The check catches
   a recipe that drifts towards long drops, which is what it is for. And the margin on a rain of
   yours may be half a point, not five: the same description gave 10.3 in one hand and 5.5 in
   another, so print the number in the card, not only the pass.
   → A second opinion agrees: on all eleven of room 41's clips, CED named a rain class first
   exactly where this number was over 5.5 and none where it was 3.2 [room 41 s14] (e0006).
   That is item 10.
   → Keep `audio/flatness` off such a bus. It reads 0.249 for the trial's noise bed with drops and
   0.251 for its twin [room 19 s19]; on the four recorded rains at 16 kHz it reads 0.020 to 0.336
   and is over your 0.20 limit (`checks-audio.mjs:18-22`) in 8 of 12 windows, with no relation to
   the drops: rain on leaves 0.332–0.336 at a kurtosis of 8–15, a window pane 0.026–0.029 at 18–33
   [room 19 s27]. It was written for events and for the wind's moving resonance
   (`checks-audio.mjs:22`), and a work whose mix is mostly bed would fail it for being what it is.
   → Where: `oq-kocha/test/dsp.mjs`, and the check beside whichever work has the bed.
   → Effort: S. It has nothing to measure until a work renders a texture offline (item 7).

7. **mushuk's rain made again the same: a seed, a timeline, an offline render** (e0004 —
   inspiration: the method and its numbers are from papers and are cited; room 19's trial code
   is ours, and you may take it as it is). The four open
   rain generators room 19 read are a shaped-noise bed and random decaying bursts, and every
   one draws from `Math.random`, the one with an `OfflineAudioContext` path included [room 19
   s15, s16, s17, s18]. `mushuk` is the same family and has the same gap. Its picture has a
   seeded generator (`mushuk/mushuk.html:45`); its sound uses `Math.random` for the noise and
   pink buffers (`:76`, `:130`), the tap buffers (`:93`, `:132-133`), the reverb (`:105`) and
   every tap's time, buffer, rate, gain and pan (`:201-209`). The taps are started from the
   frame loop's `dt` (`:197`, `:515`), through a live `AudioContext` only (`:111`), and the card
   says `"ovoz": true` and nothing else about it (`loyihalar/kartalar/4-mushuk.json:51`). The
   code makes a rain again, never the same one, and no check would notice the taps gone.
   → How, in this order. A generator for the sound, seeded apart from the picture's, one stream
   per layer as the trial has it (`work/trial/rain.mjs:48`) [room 19 s19]; it is the stream
   "for what is heard" in the video line's item 26, which asks it of every work and of whiteout
   first, in its item 6; build it once. The taps from a timeline built once, as your footsteps
   are (`oq-kocha/tools/mkfilm.py:210-232`), with the live loop only scheduling from it. The
   graph built by a function that takes the context, as `buildBeds(ctx, …)` does
   (`oq-kocha/src/sound.mjs:49`), so a `__renderAudio(seconds, sr, {only:['rain']})` can run
   it offline. Then item 2's hash and item 6's check on the rain bus.
   → What the check will read is not known. The trial's 10.3 is for 105 drops a second 10 dB
   under its bed, and recorded rains read 5.5 to 55 [room 19 s19, s27]; mushuk's taps are about
   16 a second (one every 30–95 ms, `:201`) at a level nobody has measured against its bed, and
   most of its bed sits behind a 3 kHz low-pass (`:136-138`) while the taps do not (`:209`).
   Check the band by item 6's procedure.
   → Its taps are already short, which is what item 6's new limit asks. A drop tap decays as
   `exp(-t·7/dur)` over `dur` 16–40 ms (`:92`, `:132`), so τ is 2.3–5.7 ms, and 1.7–7.1 ms after
   a `playbackRate` of 0.8–1.35 (`:206`). Room 19's leaf is 2–8 ms. Unlike the leaf, they are
   broadband: a one-pole low-pass of white noise (`:93`), not one band of Q 2. The sill taps,
   12 % of them (`:203`), ring 10–20 ms at 200–420 Hz (`:133`), below the band. This is the
   line's arithmetic from your code, not a measurement. At about 16 a second they cannot
   overlap the way 105 long drops did.
   → Where: `mushuk/mushuk.html:61-213`, `loyihalar/kartalar/4-mushuk.json`.
   → Effort: M. It is the offline render the video line's item 5 says each Canvas work needs.

8. **The rain as a recipe that is data: a rate, a size range, layers** (e0004 — inspiration:
   the formulas are facts, used with their citation, and the papers' text and figures and
   Farnell's patches are never copied; `work/trial/rain.mjs` is ours, to take as it is). The
   synthesis papers
   give a rain's parts numbers [room 19 s6, s10, s11]:

   | part | number | source |
   | --- | --- | --- |
   | drops per m³ per mm of diameter | N(D) = 8000·exp(−Λ·D), Λ = 4.1·R^−0.21 per mm, R in mm/h | [room 19 s10] |
   | fall speed by diameter | a two-piece cubic, `work/trial/rain.mjs:17-19` | [room 19 s6] |
   | so, at 5 mm/h | 2 109 drops per m² per second between 0.5 and 5 mm | [room 19 s19] |
   | the impact, on anything | a damped sine, f uniform in 1–16 kHz, down to 1/e² in two periods, amplitude with impact speed | [room 19 s6] |
   | on a plate or a window | decaying modes; Farnell's window is four resonances near 2 kHz | [room 19 s11, s5] |
   | on a leaf or a stone | a brief noise burst; at ~100 a second keep it to one band of Q 2 and 2–8 ms, since eight bands of 3–30 ms read as hiss | [room 19 s11], [room 41 s14] |
   | the far field | noise at fixed band levels, "a huge number of simultaneous drops with a low computational cost" | [room 19 s11] |

   The trial's recipe is one object: `{seed, sr, seconds, rate, dmin, dmax, layers:[{name, kind,
   area or radius, dist, fmin, fmax, tau, gain}]}` (`work/trial/rain.mjs:33-41`) [room 19 s19].
   No source gives one layer's level against another: in [room 19 s11] they are user controls,
   and foley does it by ear [room 19 s14]. So the gains, the near surface and its band stay
   yours. If the bed is ever meant wide: a recorded rain's two channels are nearly unrelated,
   the side +0.2 to −1.5 dB against the centre in 1–8 kHz in two recordings [room 19 s25, s26,
   s27], so a wide bed is one render per channel from two seeds, not one mono loop panned as each
   of mushuk's bed layers is (`mushuk/mushuk.html:139-145`), and not one render delayed between
   the channels. Item 5's events check then leaves the bed out, and the bed takes e0168's fold
   and correlation check instead.
   → How: mushuk's bed and taps already are this recipe without its fields: three noise bands
   and a hiss (`mushuk/mushuk.html:141-151`), taps of a noise burst plus a sine at 1300–3200 Hz
   (`:88-99`, `:132`), sill taps at 200–420 Hz (`:133`). Write them as one `RAIN` object the
   graph reads and the card counts, so the tap rate, the bands and the gains are declared
   values a check can read, as `METAL` is in item 4. For scale: 16 taps a second is what lands
   on about 76 cm² at 5 mm/h (16 / 2 109, the line's arithmetic), and the open generators run 6
   to 100 drops a second in bands from 300 Hz to 5.6 kHz [room 19 s15, s17]. If a film in
   oq-kocha's pipeline ever rains, the same object is a `rain` beside `snd:{wind,city,mute}`
   (`oq-kocha/src/shots.mjs:5`), built like the wind bed (`oq-kocha/src/sound.mjs:49-88`).
   → Where: `mushuk/mushuk.html:132-213`.
   → Effort: S once item 7 exists.

9. **The day a work speaks: an open voice pinned by its file with its noise off, cleared by its
   own card and data, and its captions timed from the voice** (e0087 — inspiration: the rule
   rebuilt in your own step; room 32's `replay.sh` and its numbers are ours, as they are; the
   Piper engine, GPL-3.0, run unmodified as a separate program, never vendored or imported.
   e0092 — not to be used: the voice tested, in anything published. e0093 — as it is: the
   caption rule is ours). No work of yours speaks today (the video line passes captions until
   one does). If one does, a neural voice is a sampler. Piper's `en_US-lessac-medium`, its
   `.onnx` pinned by sha256, said one line four ways in four fresh processes, 2.97 to 3.08 s
   long. With `SynthesisConfig(noise_scale=0.0, noise_w_scale=0.0)` two takes were
   byte-identical, 2.844 s each (piper-tts 1.8.0, onnxruntime 1.30.0, `sources/s23/replay.sh`)
   [room 32 s23]. A cloud voice cannot get there at all: Eleven v4 "may shift over time" under
   its id, and its seed is "a best effort" [room 32 s10, s16] (e0091).
   → How, the voice: a render step in a pinned container image, beside `mkfilm.py` (Python
   already lives in `oq-kocha/tools/`), that loads the voice by hash, sets both noise scales to
   0 and writes each line's PCM. The work's card holds the text, the voice's sha256, the engine
   and onnxruntime versions, and the sha256 of the samples, not of the WAV file. A check in
   item 2's shape: render twice in fresh processes, pass when both hashes equal the card's;
   calibrate with the voice's own noise (0.667 and 0.8, `sources/s23/voice-config.json`), which
   must give another hash. Write the CPU and the onnxruntime build into the card as item 2
   writes `browser.version()`: only one CPU was tried, and a float path may differ on another.
   → How, the captions: Piper renders a line per call, so each line's PCM is already alone. Its
   onset by item 3's `onsets()`, plus where the timeline places the line, is when the voice
   starts; check every caption's on-time against it, pass under half a frame (21 ms), and
   calibrate with one caption moved 0.3 s, which must fail. Not with a recogniser:
   faster-whisper put the first word about 0.5 s before the voice on both lines of the ad where
   a sob or a bite came first, and agreed within 0.1–0.2 s on clean starts [room 32 s8].
   A newer recogniser is no better here: Parakeet's word times sit on a 0.08 s grid and are
   proven equal to NeMo's offsets, not to a voice's start [room 41 s2] (e0007).
   open-edit's rule is the same, "transcript word boundaries are not cut points" [room 2 s2].
   Whether Piper reports its own phoneme times was not checked, so today the line's onset is
   the time you have (e0093).
   → The words inside a line, drawn as picture, are the video line's item 29: their times come
   from the same place, the voice's own alignment, and this item proves the line sits where the
   timeline puts it. Its "voice line's question 6" is question 5 below, renumbered on
   2026-10-04.
   → Not with the voice that was measured. `en_US-lessac-medium`, Piper's own example, was
   trained on the Lessac Blizzard 2013 corpus [room 32 s23 `voice-MODEL_CARD.txt:10-11`]. That
   corpus is under a "RESEARCH LICENCE AGREEMENT" that excludes "voice synthesis … products or
   services" by name [room 32 s24 `page.html:116, 485`] (e0092). It proves the rule, and it
   must not speak in a film you publish.
   → Before any voice speaks in a published film, read its `MODEL_CARD` and the licence of the
   dataset the card names. Then write into the work's card the voice's sha256, the licences
   read and the date, beside the samples' hash. A check can hold this: a voice with no reading
   on record fails. No Piper voice has been cleared yet.
   → The engine: GPL-3.0 lets you run it unmodified, and its audio is not GPL's [room 32 s19
   `COPYING:158-161`]. So install it in the render step's image and call it as a program. Never
   copy it into your tree or import it into your code.
   → Piper has Russian voices and no Uzbek one [room 32 s20]. Their cards were not read. That
   is question 5.
   → Where: a new step in `oq-kocha/tools/` or in the speaking work's folder; the finder in
   `oq-kocha/test/dsp.mjs`; the hashes in the work's card under `loyihalar/kartalar/`.
   → Effort: M, and nothing to do until a work speaks.

10. **A second opinion on a rain bed, from a model trained on recorded sound: CED in your audit**
   (e0006 — as it is: ced.cpp MIT, the weights Apache-2.0 © Xiaomi, fetched and never
   committed; credit the AudioSet ontology, CC-BY-4.0, where its class names are printed).
   Room 41 ran CED alone through ced.cpp, with no part of parakeet.cpp [room 41 s14]. On a rain
   made by code after room 19's recipe, both models put *Rain on surface* first on both seeds
   (0.43–0.59), then *Rain* and *Raindrop*. On that rain's phase twin, its bed alone and white
   noise, every rain class fell to #9 or lower (≤ 0.015); the twin's top was *Waterfall*. Six
   windows of two recorded rains each had a rain class first (0.51–0.72). It agreed with item 6's
   number on every clip. Two processes gave the same 5,797 floats to the byte, and the CLI printed
   the same at 1 thread as at 4. ced-tiny costs 115 ms per 10 s clip at 2 threads and 55 MB, from
   a 6.2 MB model. The bed alone reads like the twin, so it is the drops the model hears, not the
   bed's colour.
   → How: in your audit's bed question (`skills/media-audit-reality/SKILL.md:375-381`, §2i,
   "a vacuum cleaner with a different nozzle"), beside item 6's number, for a bed that is meant
   to be rain. Render the rain bus alone (item 1's `only`) and its seeded phase twin (item 6's
   `phaseTwin`). `ced-cli` reads WAV, and your render step writes raw Float32
   (`oq-kocha/tools/render-audio.mjs:23-25`), so add a 44-byte IEEE-float WAV header (format
   3). Then run `ced-cli classify ced-tiny-q8_0.gguf <bus>.wav --top-k 10` on both, in a
   container where ced.cpp is built at `61dec2a` (about 90 s, cmake) and the model is fetched
   from `mudler/ced-gguf` at revision `b5e9a4a`, its sha256 starting `48bee4e2fc3c`. The bus
   passes when *Rain*, *Raindrop* or *Rain on surface* is first at ≥ 0.3, and none of the three
   is in the twin's top 5. Today's margin on a made rain is 0.43–0.59 against ≤ 0.015. Write
   into the audit's table the ranks, the three scores, the commit and the revision. Never write
   floats as an expected value: byte-identity was shown on one machine only.
   → What it adds over item 6: an opinion that does not read the 4–8 kHz band item 6 reads.
   When the two disagree, that bed is the one to put in front of an ear first. For mushuk's
   rain, what it will say is unknown until item 7 renders it; its bed sits behind a 3 kHz
   low-pass, and the model was never asked about a rain heard through glass.
   → Why the audit and not the suite: it brings a C++ build and a model download into a suite
   that is JavaScript on its own FFT (`oq-kocha/test/dsp.mjs:2-22`). And it gives a model's
   opinion, which belongs beside §2j's "what none of this can see" rather than in a card's
   pass. Where between hiss and rain its opinion turns was not measured: the rain that read
   3.46 in item 6's new limit was never put to it.
   → Where: `skills/media-audit-reality/SKILL.md` §2i, and a script beside
   `oq-kocha/tools/render-audio.mjs`.
   → Effort: S once items 1 and 6 exist.

## Not worth taking

- **Cuelume itself in a film.** Its cues mean UI states (success, error), not events in a
  scene; rendering it reproducibly takes the promo's whole harness (a faked context state and
  user activation, `Math.random` replaced, a page per cue), and its outcome cues still start
  their mallet noise at a random offset (`src/audio/engine.ts:95`) [room 5 s3]. It is a web
  UI's tool, and the interface line keeps it as one (e0083).
- **Its shared room** (0.25 s of stereo noise as an impulse response, `src/audio/engine.ts:120-172`)
  [room 5 s3]. oq-kocha is outdoors in snow, and the impulse is `Math.random` per page. If a
  room is ever wanted, seed it; mushuk's reverb has the same fault (`mushuk/mushuk.html:101-107`).
- **Rendering to files and embedding them**, as Vercel's fx does with Cuelume's recipes
  (`src/core/notifications/sound.zig:18-26`) [room 5 s8], and as Cuelume's author now does in
  their own Claude Code plugin: eight 48 kHz WAVs from a renderer that is not in the repository
  and skips the library's limiter (`claude-code/README.md` at `6ee4f7f`) [room 5 s3]. Every
  deployment of it outside a browser plays a stored file (e0087). That is the opposite of "the
  code makes them again", and it is why your rule needs item 2's hash and not a file. The WAVs
  are not to be used in any case: they are stored recordings, and the author's.
- **Tests on a stub AudioContext** that records parameters and renders no sample
  (`test/runtime.test.mjs:47-102`) [room 5 s3]. A check that passes without holding the sound;
  you already do better.
- **Changing `metal`'s law to Cuelume's 1/r because Cuelume does.** Both laws make the upper
  modes die first; 1/r would give 93, 226 and 373 dB/s here, sharper and not truer. Item 4's
  check holds either.
- **Any of the four open rain generators** (`noised` ISC, `rainApp` MIT, two with no licence)
  [room 19 s15, s16, s17, s18]. A few hundred lines you would rewrite, two that may not be
  taken at all, and none renders the same samples twice.
- **Rendering every far drop.** 2.39 million impacts in 10 s read 3.94 where their hiss twin
  reads 3.28, and swapping them for noise moves the full mix from 5.75 to 6.19 [room 19 s19].
  The bed can be noise, as the paper makes it [room 19 s11]. The near layer is where the rain is.
- **An onset counter on a bed.** Item 3's gate needs silence between events and a bed has
  none; a relative finder counted 12.7 drops a second where 105 were rendered [room 19 s19].
- **Bubbles on water.** Only 0.8–1.1 mm drops ring one at every impact, it is what puts a peak
  near 14 kHz in rain heard under water [room 19 s6], the trial did not render it, and your
  checks run at 16 kHz, where nothing above 8 kHz exists.
- **Ambisonic or 3D placement of the drops**, which is what Gapirov's cover and post promise
  [room 19 s1, s3, s12]. Your measured render is mono and your audibility number is for a phone
  speaker; his own note is that 3D effects are what sags when a phone sums the channels [room
  19 s3]. Item 5 comes first, and a wide bed is item 8's two seeds, not a sound field, checked
  in mono as e0168 says. His 0.5 ms delay of the right channel was one mix's fix, "without exact
  numbers", and is not a rule.
- **Gapirov's film as a source of method.** Concluded unseen on 2026-10-04 by the owner's ruling:
  its start, middle and end frames are him talking to camera, the sound map and the leaf are a
  composite cover, and nothing of it is released, no project, no samples, no code [room 19 s1,
  s2, s3, s21]. What it would have settled (his layers, whether the mix is ambisonic, a designed
  rain measured) moves nothing above: the recipe's numbers come from papers and the check from
  measurement.
- **Recorded rains as fixtures for the check.** Room 19 measured five where they lay [room 19
  s22–s26]; the check needs only the phase twin as its broken state and the numbers in item 6 as
  its scale. Keeping one would be stored audio, which your rule forbids, and three of the five
  are CC BY-SA, attribution and share-alike [room 19 s23, s24, s26]. Were one ever wanted, only
  s22 (public domain) and s25 (CC0) carry no obligation; your rule decides, not the line.
- **Eleven v4, or any cloud voice, as a voice the code makes** (e0091, e0090 — not to be used
  in a film of yours without the owner's written exception). It moves under its id and its
  seed is not a promise [room 32 s10, s16]. Every take needs an account, publishing needs a
  paid plan, and WAV needs the Pro tier [room 32 s14, s16]. Its maker keeps a perpetual licence
  to what you send it and what it makes, and its output may not be yours alone [room 32 s14].
  Under your rule it can enter only as a stored recording. Fetching it at build time makes a
  hash check that fails the day the model moves, when nobody changed anything of yours. It is
  the one voice read that laughs, sobs and lists Uzbek [room 32 s10, s18]. Whether a stored
  voice track may be an exception is question 5.
- **Piper's `en_US-lessac-medium` in anything published** (e0092 — not to be used). Its
  training data is licensed for research only. Room 32's takes of it stay in the room.
- **faster-whisper's word times as a caption check** (e0093). About 0.5 s early wherever a
  non-speech sound comes before the word [room 32 s8]. Item 9 checks against the voice instead.
- **Kokoro-82M and Meta's MMS-TTS** (e0092). Kokoro's weights are Apache-2.0, but it speaks
  neither Russian nor Uzbek, its replay was not tested and its training data was not read
  [room 32 s21]. MMS speaks Uzbek under CC-BY-NC 4.0, which rules out a published film, and
  says itself that it needs a fixed seed [room 32 s22].
- **CED as a check in your suite, or as a clock for events** (e0006). In the suite it brings a
  C++ build and a model file to a suite that is JavaScript on its own FFT
  (`oq-kocha/test/dsp.mjs:2-22`), and its floats were proven equal on one machine only; item 10
  keeps it in the audit. As a clock, it names a 3 s window on a 1 s grid, so it replaces none of
  items 3 to 6. It cannot time a footstep, and its own film shows no short event caught: no label
  at the 0:48 still for a glass that broke at 0:47.6 [room 41 s1, s2 `docs/sound.md:42-78`].
- **parakeet.cpp for anything else** (words, who spoke, named voices) (e0007, e0008). Your films
  hold no speech; none of its models hears Uzbek [room 41 s5]; its word times do not change item
  9's rule; and naming a voice keeps a voiceprint, from a feature measured on one fixture
  [room 41 s2 `docs/speaker.md:283-337`].
- **A small recogniser to make or check captions against a script, such as Cactus Whistle**
  (e0223 — run only, pinned, its wrapper with telemetry off; e0222 — not to be used where Uzbek
  arrives). Your words are Uzbek, and Whistle hears seven European languages and no Uzbek. Given
  Uzbek, it wrote fluent Polish-, German-, English- or Spanish-looking sentences, each tagged as
  that language, with no flag, on 8 clips of 8 [room 29 s9, `work/results/score-whistle.md:10`].
  It refuses anything over 30 s [room 29 s5 `needle.h:63`]. The larger recogniser the workshop
  runs, whisper.cpp `small`, does no better on Uzbek: it tagged 8 clips of 8 as another
  language, and with Uzbek forced it was still at WER 93 % (e0225, e0222 —
  [room 29 `work/results/score-whisper-ru-uz.md:5-6`]). No local recogniser has been shown to
  hear Uzbek, so none can check an Uzbek line of yours. Your films hold no speech today
  (`oq-kocha/tools/mkfilm.py:70`, "Ovoz: o'chiq — sintez, 0 bayt namuna"), and the day one
  speaks, item 9 times captions from the voice, never from a recogniser (e0093). Before any
  recogniser enters a check of yours, give it one clip in a language it does not claim (e0222).
- **The ad's recipe: the voice first, a generated picture driven by it as a black video, the
  track laid back in the edit** [room 32 s2, s3]. It generates the picture with a model, which
  no work of yours does, and it is weakest at the joint, lip sync, which the ad hides by shooting
  the sung line from behind [room 32 s4, s8]. The video line's to keep, not this page's.

## Open questions for the owner

1. **Is `metal` meant to be heard as a struck bar, or is it an incidental tick?** If a bar,
   item 4 guards it. If not, the table still stands and the check is dropped. Unblocks item 4.
2. **Does the trial sound like rain?** Three 10 s files are in room 19, `work/trial/out/`: the
   rain, the rain with its bed as noise, and the phase twin. Nobody has listened. Item 6's number
   now agrees with four recorded rains, so the open part is item 8's recipe: an ear says whether
   the trial is worth writing down as mushuk's rain, and whether the twin sounds like the hiss
   the number says it is. Unblocks trusting item 8 beyond its arithmetic.
3. **Does mushuk get an offline render of its sound?** It is the video line's question 3 from
   this side: without it items 6 to 8 have nothing of yours to measure. Unblocks item 7.
4. **Patches?** Room 5 offered one per item for items 1 to 5, and room 19 offered one from its
   trial for item 6. Say which in the line's log and the room makes it; you apply it or not.
5. **Does a work ever speak, and in which language?** In English or Russian, item 9 with an open
   voice keeps your rule, once a voice is found whose card and data permit a published film. The
   one measured does not, and no other has been read yet (e0092). When you say yes, the line
   asks a room to read the candidates. In Uzbek nothing open and usable for a published film was
   found [room 32 s20, s21, s22]. So the choice there is between no Uzbek voice and one written
   exception (e0091): "a voice track is a recording", made once by a cloud voice such as Eleven
   v4, stored, its sha256 in the work's card with its provenance (model id, date, seed, request
   id), and no claim that the code makes it. Unblocks item 9, or that exception.

---
*From the line "voice" (Voice) of the Labs workshop, kept by its keeper from what the line's rooms sent. Edited there, never here: `labs rooms pull` brings the newest.*
