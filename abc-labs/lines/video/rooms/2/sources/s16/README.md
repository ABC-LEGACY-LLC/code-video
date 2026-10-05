# s16 — code-video's developer, 2026-09-30 12:09, what was taken from it

Their report in room 2's log, kept verbatim in `work/project/code-video-2026-09-30T1209.md`. It describes changes
in their working tree on top of `9ac1402`, uncommitted; `9ac1402` is not on GitHub (codeload 404 at 12:10 UTC,
public `main` still `ff977c2`). **The room has not seen any of it**: every line below is what they say, cited as
theirs.

| what they report | their item |
|---|---|
| item 4 done: `shotAt` by `Math.round(t*FPS)` against `STARTS_F`, loop resets at `TOTAL_F`, `buildTimeline` runs `TOTAL_F` frames; `cut-frames` asks the page both sides of each cut and the wrap, measures 2 on the old page | 1 |
| `STARTS`/`TOTAL` stay in seconds (the page reads them); `STARTS_F`/`TOTAL_F` new exports | 2 |
| `sanoq.mjs` counts `df` into `kadrSonlari`, `kadrJami`; the card's total line bound to `kadrJami` | 3 |
| `frame-grid` measures `df` (a positive integer, and `d = df/FPS`); 8 on the old list | 4 |
| shots 72 53 36 31 34 19 39 66 = 350 frames = 14.583 s, each cut on the first frame at or after its authored start; nearest rounding would put the o'tish/yolg'iz cut at 283 — "the owner decides"; 310 of 351 old frames identical at 96×69 | 5 |
| no `Math.random`/clock pins in `browser.mjs`: oq-kocha reads neither for its pictures; pins belong in item 10's init script | 6 |
| five sleeps, not four (+ `zarra/test/olchov.mjs:24`, 300 ms); oq-kocha and zarra set `window.__ready`; hookless cards keep the wall-clock wait until item 10; katalog's default output now `loyihalar/build/` | 7 |
| `render-audio.mjs` from `browser.mjs`, renders `TOTAL`, refuses a length other than 643125 samples (44.1 kHz, 350 frames); `npm run audio` → `build/film.pcm` | 8 |
| zarra has its own CI job (4 checks) | 9 |
| audit: oq-kocha 43/43, loyihalar 15/15, zarra 4/4; sheet+render 21 min, style+audio 26, world 13 and 10 | 10 |
| the page's own rAF loop is not the audit's cost: 2–19 ms per `__frameTo` at 200×144 after ~7 s for the first two | 11 |

Checked by the room against `ff977c2` and arithmetic: 72+53+36+31+34+19+39+66 = 350 and those are the first
frames at or after each authored start (`sources/s4/README.md`, the table); 350/24 × 44100 = 643125 exactly;
283.2 is the only start where ceil (284) and nearest (283) differ.
