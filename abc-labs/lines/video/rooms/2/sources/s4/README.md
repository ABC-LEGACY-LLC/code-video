# s4 — code-video, what was taken from it

Read at `ff977c2` (ff977c20065ca4a210939503f919e2bceff25e37), nothing run: in the workshop's clone
(`var/workspace/projects/code-video/repo`) and in a verbatim tarball, `work/review/cv-ff977c2/` (gitignored).
Paths below are code-video's.

## Lines the page for code-video rests on

| what | where |
|---|---|
| the cut rule of the film: frame time `t` belongs to shot `j` when `t>=S[j]` — a ceil, with no guard for rounding noise | `oq-kocha/tools/mkfilm.py:204` (`S=STARTS`, `:102`) |
| the sound timeline over `Math.round(TOTAL*FPS)` frames | `oq-kocha/tools/mkfilm.py:212` |
| "THE FILM SAYS WHICH DRAWING IS UP … A check that recomputes what it is checking is checking its own arithmetic."; `__frameTo` returns `{frame, t, shot, size, idx, di}`, `idx` = A's drawing | `oq-kocha/tools/mkfilm.py:387-399` |
| the footfall check recomputes the drawing in Node from `SHOTS`, `STARTS`, `CYCLE`; step times from `window.__timeline()`; unit "drawings away from a contact", pass at 0, calibration shifts 7 frames; a two-frame shift is "still in sync" by design | `oq-kocha/test/checks-audio.mjs:53-77` |
| every use of `STARTS` | `checks-render.mjs:98`, `checks-world.mjs:20,21,318`, `checks-style.mjs:29`, `checks-audio.mjs:60`, `mkfilm.py:102,204` (all under `oq-kocha/`) |
| sizes the checks render at | `oq-kocha/test/checks-render.mjs:6` (200×144), `checks-world.mjs:14`, `checks-style.mjs:24` (240×173); `loyihalar/test/run.mjs:64` (420×302) |
| the card's line "8 kadr, … — jami 15,6 s" proves only `jadvallar.SHOTS` = 8 | `loyihalar/kartalar/1-oq-kocha.json:30-31,66-79`; `loyihalar/tools/karta.mjs:53-62` |
| `katalog.mjs`: a JPEG still per card into `uslublar-katalogi.html`; Chrome looked for in `/opt/pw-browsers`; 1400 ms, then `t*1000` ms for a card with no hook; default output `/mnt/user-data/outputs/` | `loyihalar/tools/katalog.mjs:11-13,20-22,28,92` |
| bir-tomchi: `window.__seek=s=>{T=s%TOTAL;}`, `__total`, `__tapAudio` | `bir-tomchi/bir-tomchi.html:1135-1139` |
| seeded generators in bir-tomchi and mushuk; `Math.random` only for the linen texture and sound there; not-a-measurement draws with it | `bir-tomchi.html:57,94,1083`; `mushuk.html:45,314`; `not-a-measurement.html:211` |
| two works without a card: `zarra` (`window.__frameTo=kadr`, its own `test/`), `masofa-maydoni` (`window.__still`) | `zarra/zarra.html:75`; `masofa-maydoni/masofa-maydoni.html:888` |

## Where oq-kocha's cuts land today

Computed from `oq-kocha/src/shots.mjs` with the film's own rule (`mkfilm.py:204`), in the room's container:

```
awk 'BEGIN{split("3.0 2.2 1.5 1.3 1.4 0.8 1.6 2.8",d," "); a=0; for(j=1;j<=8;j++){S[j]=a; a+=d[j]} …
      for each shot: first frame f with f/24 >= S[j] }'
```

| shot | declared start | in frames | first frame | frames the film gives it | declared |
|---|---|---|---|---|---|
| 0 ko'cha | 0 | 0 | 0 | 72 | 72 |
| 1 yurish | 3.0 | 72 | 72 | 53 | 52.8 |
| 2 yuz | 5.2 | 124.8 | 125 | 36 | 36 |
| 3 ikkinchi | 6.7 | 160.8 | 161 | 31 | 31.2 |
| 4 ikkovi | 8.0 | 192 | 192 | 34 | 33.6 |
| 5 qarama | 9.4 | 225.6 | 226 | 19 | 19.2 |
| 6 o'tish | 10.2 | 244.8 | 245 | 39 | 38.4 |
| 7 yolg'iz | 11.8 | 283.2 | 284 | 66 | 67.2 |
| total | 14.6 | 350.4 | | 350 | |

That is the rule applied to `f/24`, which is what the checks do (`checks-audio.mjs:60`). **The film does not
compute `f/24`: it accumulates its clock**, `T+=dt` in `step()` (`mkfilm.py:275`) for the picture and
`t+=DT` in `buildTimeline()` (`mkfilm.py:228`) for the sound, with `DT=1/FPS` (`:103`). Replayed in the
container with the same double arithmetic (awk), frame by frame, `shotAt` on the accumulated clock against
`shotAt(f/24)`:

```
frame 72: accumulated T=2.9999999999999978 -> shot 0; f/24=3 -> shot 1
cut to shot 1 at frame 73 (T=3.0416666666666643)
cut to shot 2 at frame 125 … shot 3 at 161 … shot 4 at 192 (T=8.0000000000000213) … shot 5 at 226 … shot 6 at 245 … shot 7 at 284
```

So the picture and the sound cut to shot 1 at frame **73** (shot 0 is 73 frames, shot 1 is 52), and every
check that computes `f/FPS` puts that cut at 72. The other six cuts agree. It changes no check's result today
(shots 0 and 1 both walk A and neither walks B), but the checks model a film that differs from the rendered one
by a frame at its first cut. After 350 steps the clock reads 14.583 s, under `TOTAL` (14.600000000000001), so
`__frameTo(350)` still draws shot 7 and `step()` wraps at 351 (`:278`), while the sound timeline stops at 350
frames (`:212`).

## What a shot of oq-kocha depends on beyond its own entry

Read 2026-09-30 12:15, for item 2's segment key. The falling snow reads the film's global clock:
`gl.uniform1f(G.t,T)` and `gl.uniform1f(K.t,T)` (`oq-kocha/tools/mkfilm.py:249,263`) feed `iTime`, and
`float snowT = uSnow>0.5 ? iTime : 0.0` (`oq-kocha/src/comp.frag:177`). `step()` carries A's and B's walk phases
and A's distance through every shot that walks and resets them only at the end of the film (`mkfilm.py:273-278`),
as the comment inside `__frameTo` says: "the walk phase accumulates across every shot that walks and not from the
cut" (`:392-395`). So a shot's frames are a function of its entry, its start frame, and the phases and distance it
inherits; `__frameTo` returns `idx` and `di` but not the phases (`:396-398`).

## whiteout's cuts, the same replay

`whiteout/whiteout.html` declares 13 shots in seconds (`:73-77`), sums them into `S` and `TOTAL` (`:78-79`),
picks the shot with `T>=S[j]` (`:719`), and advances `T+=DT` per step (`:991`); at the end it clamps
`T=TOTAL` and stops rather than wrapping (`:993`). Replayed in the container with awk (double arithmetic, same sums):

```
TOTAL=19.350000000000001  TOTAL*24=464.40000000000003
frame 72 differs: accumulated shot 0, f/24 shot 1 (f/24=3, S=3)
cut to shot 1 at frame 73 (T=3.0416666666666643)
cut to shot 2 at 120 (T=5.0000000000000009) · 3 at 164 · 4 at 202 · 5 at 216 (T=9.0000000000000071) · 6 at 227
· 7 at 231 · 8 at 234 · 9 at 236 · 10 at 263 · 11 at 311 · 12 at 369
T>=TOTAL at step 465 (T=19.375000000000004)
```

The first cut is a frame late, exactly as in oq-kocha; the other eleven land on the first frame at or after
their authored start. By that rule (oq-kocha's choice, [s16]) the shots are 72 48 44 38 14 11 4 3 2 27 48 58 96
frames = 465, of which six are not whole frames as declared (1.80, 1.60, 0.60, 0.42, 0.17, 0.085 s; 0.125 s is 3).

## whiteout's camera shake lives on display frames, not film frames

`shake` is set in the `requestAnimationFrame` loop `frame()`, not in the step: `shake=1` in impactA's first 0.05 s,
`0.5` in after's (`:1000-1003`), and `draw()` decays it by 0.085 on every call (`:723-729`). `frame()` re-arms
itself whatever `playing` is (`:1007`) and calls `draw()` each time (`:1006`). `stepOnce()`/`sim()` never touch it
(`:990-994`), and neither does `__frameTo(n)` (`:1061-1065`) or `__step` (`:1081`). So a frame drawn through the
hooks and read in the same call has no shake; one read later carries whatever the live loop drew in between; and
in playback the shake lasts 12 `draw()` calls, which is 0.2 s at 60 Hz and 0.1 s at 120 Hz.

## whiteout's sound draws from the picture's generator

`rnd()` is the one seeded stream (`:67-69`) the simulation draws from (spray `:361-364`, breath `:384`, `:653`).
The sound draws from it too: `nz()` `s.playbackRate.value=0.8+rnd()*0.5` (`:910`), `steel()` `(rnd()-.5)*0.01`
(`:941`). `restart()` reseeds and then, with sound on, calls `arm()` → `score()` (`:1009-1010`, `:979`), whose
`nz`/`breathS`/`steel` calls (`:965-973`) pull from `rnd()` before the first step, and `crunch()`, which calls
`nz` twice (`:932-935`), fires from `hero.onStep` during the simulation (`:980-982`). `__frameTo` and `__rewind` reseed with no sound (`:1062`, `:1082`). So a
viewer with sound on sees other spray and breath than the silent film the checks measure; the comment in `draw()`
names the same hazard for the picture: "pulling from the seeded RNG inside draw() would have desynced it from the
simulation" (`:724-726`).
