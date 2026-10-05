# Films drawn with code — and their measurement

Five short works, one on a WebGL distance field and four on Canvas. And beside them two things,
which are really the main thing:

- **every work carries its own suite of checks**, and every check also carries its deliberately
  broken case;
- **every work carries the same block of data**, and when the block stops agreeing with the
  source, the build fails.

This is not decoration. It is the central claim of the whole project: **a check that passes and
holds nothing is the worst check**, because it gives confidence and returns nothing. So every
check proves itself against its broken case; if it cannot, it is `UNPROVEN` and the build stops.

## What is here

Every work sits in its own folder, `studio/projects/<work>/`, with its page, source, tests and
build. Only shared things stay at the root: `studio/`, `harness/`, `catalog/`, `skills/`,
`abc-labs/`.

| folder | what | checks |
|---|---|---|
| `studio/projects/oq-kocha/` | A 350-frame film, 14.58 s at 24 fps. No drawn frame: 16 poses in JSON, the picture solved by marching a distance field at every pixel. Two styles — `oq-qalam` and `tekis-cel` | **43** |
| `studio/projects/whiteout/` | 4 poses written by hand, 8 in the mirror, a 3·2·1·2 sheet. **Oq Ko'cha's father** — the same sheet, another machine | card |
| `studio/projects/bir-tomchi/` | 8 scenes × 9 s, 379 draw calls a frame — the densest | card |
| `studio/projects/mushuk/` | A cat in three paths, a city in halftone; it answers a click | card |
| `studio/projects/not-a-measurement/` | 8 cuts, the whole film in 39 draw calls | card |
| `studio/projects/zarra/` | A particle layer measured from a sample GIF: two layers at the GIF's speeds; the check measures the speed again from the screen | **4** |
| `studio/projects/masofa-maydoni/` | An SDF sandbox — primitives, unions, marching | — |
| `studio/` | A person and an AI on the same piece: live viewing, frame scrubbing, card and checks, notes on a frame and the AI's answers; a timeline of each film's own tables; what the AI changes shows at once | **30** |
| `catalog/` | The architecture: tools that count the source and measure frames, five cards, the catalog generator | **15** |
| `skills/` | A record of the instructions this work was done under | — |

## Why this is research

Things that cannot be seen by eye were **found** here, and each one came out of the measurement
itself:

- The rim term read the floor as "a surface turning away from me" and **turned the ground
  white**: the road was written as 0.61 and measured as 250. 15% of every street frame was a
  road wiped out.
- The bounding (`uBound`) that made the film cheap **broke the shadow**: the field drops off a
  cliff at the shell, and the soft shadow reads the cliff as a surface. The saving was measured
  from the first day; its effect on the picture never was.
- **The street ran away from the walker.** One sign: after walking 1.23 units, a building moved
  from 24.35 to 25.91 away.
- The `contact-shadow` check read the rows above the head and reported the brightness of open
  snow — **254.95 / 255** — as "this many levels darker under the feet". A contact shadow cannot
  be 255 levels deep.
- `bounds-save-work` **had been reading depth**, and the probe was saturated: `2.85×` was never a
  measurement but a floor. The real one is **3.72×**.
- The measuring tool took edges from the **first** frame only, and a conclusion published on
  that basis came out wrong. The conclusion was withdrawn.
- **The film played one frame more than its list.** The page added time up 1/24 at a time: 72
  additions give **2.999999999999998**, so the first cut fell on frame 73, not 72, and the film
  looped after 351 frames while the sound was 350. Shots are written in frames now, and
  `cut-frames` asks the page itself about every cut.
- While `card/matches-count` was passing, Oq Ko'cha's card said **"15.6 s in total"** and the
  film was 14.6 s: that line was bound to the number of shots, not to their sum. Now the total
  is in the count and the line is bound to it.

The list is long, and long on purpose: it is this project's real result — **a list of criteria
that passed while they were blind**.

## Running

`make` lists everything. The studio runs as a service:

```bash
make start      # the studio at http://127.0.0.1:4321/
make status     # is it up, does it answer
make stop       # stop it
make install    # keep it running as a systemd user service (survives reboots)
make expose     # put it on https://code-video.abclegacyllc.com, login through the Telegram bot
make audit-fast # the quick checks
```

Or by hand, suite by suite:

```bash
cd studio/projects/oq-kocha && npm i && npm run build && npm run audit   # 43 checks
cd studio/projects/oq-kocha && npm run audio                             # the sound, offline: build/film.pcm
cd catalog && npm i && node test/run.mjs                                 # 15 checks
cd catalog && node tools/card.mjs                                        # do the cards agree with their sources
cd catalog && node tools/catalog.mjs out.html                            # the catalog page
cd studio/projects/zarra && npm i && npm run audit                       # 4 checks
cd studio && npm i && npm run audit && npm run audit:ui                  # 15 checks, then 15 in a browser
node studio/server.mjs                                                   # the studio: http://127.0.0.1:4321/
```

Rendered video and sound files are not kept here — the code makes them again.
