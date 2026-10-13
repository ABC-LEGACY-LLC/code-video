# Catalog — the architecture of the works

Six projects, one block of data. Every new project carries that block, and when the block
stops agreeing with its source, the build fails.

## Why

These projects are research, and in research there is no *plausible*: a number is either
measured, or counted, or it is not a number. So the four parts of a card have different rights:

| part | who writes it | how it is checked |
|---|---|---|
| `count` | **a tool** — `tools/count.mjs` reads the source | never touched by hand |
| `method` | a person, but every line is bound to one value in `count` | the value has to stand in the line's text |
| `look` | a person — how the work looks | the one free field |
| `measure` | **a tool** — `tools/measure.mjs` measures the frames | never touched by hand |

The `method` binding is the main mechanism. A line is written like this:

```json
{"text":"4 poses written by hand — CONTACT, DOWN, PASSING, UP — become 8 in the mirror.",
 "evidence":"tables.PW"}
```

If the source goes from 4 poses to 6, `count.tables.PW` becomes 6, the 4 in the line no longer
matches it, and `card/matches-count` fails. **A card cannot quietly become a lie** — it either
agrees with its source, or the build stops.

## A claim and a goal are two different things

- **`claims`** — a promise about what a project *is now*. Whiteout is WHITE; Mushuk is
  COLOURFUL. If one breaks, that is a regression and the build fails.
- **`goals`** — where a project is *going*. Whiteout's value range should reach 90, it is 50
  now. An unmet goal is not a fault but a work plan — it is not hidden, it just does not fail.

Mixing them gave three false "failures" on the first try.

The audit **renders every card from its current source** before evaluating claims or
goals. Committed `measure` numbers are historical snapshots; neither a recent audit
timestamp nor an unchanged file modification time makes those numbers fresh. The
audit does not update cards, claims, goals, or thresholds.

Browser captures use a temporary loopback HTTP server so module imports and authored
JSON load just as they do in Studio. It serves only the selected work and shared
renderer code; hidden files, node_modules, other works and paths outside the repository
are refused. Local HTTP resources are mapped back to disk for content hashing.
WebGL uses SwiftShader; Canvas2D uses Chromium's CPU canvas renderer so a CPU-only
audit does not compile a software GPU pipeline for every 2D paint operation.

Each rendered result in `build/audit/catalog.json` carries `evidence`: SHA-256 input
and pixel hashes, the sampling schedule, the browser and Node versions, and the time
of measurement. Inputs include declared sources, the built page, measurement tools,
and local resources actually requested by the page. If one changes during sampling,
the run fails. A page must render without a script error and provide a drawable canvas.

`card.mjs refresh` explicitly records new numbers and `measureEvidence`; it leaves
thresholds unchanged. `card.mjs` and the generated catalog label recorded numbers as
`unverified` (legacy data without provenance), `stale` (changed local inputs or
sampling settings), or `recorded` (local hashes still match). These labels never
replace a fresh render in the audit. `refresh --fast` updates counts only and leaves
measurement provenance untouched.

Some cards still use elapsed-time sampling rather than a seek hook. Their evidence
says `live-clock`; results can vary with machine speed. Remote resources are listed,
but their contents are not pinned. A matching local hash is not a claim that those
renders are reproducible. Converting those works to deterministic sampling remains
separate work.

## Authored document fingerprints

Evidence schema 2 distinguishes byte provenance from render identity. A card can
explicitly name its managed document in `frame.project`. Only that document is
projected to canonical `{schemaVersion, project}`; known generation/history/receipt
and migration bookkeeping is excluded. Unknown envelope fields and unsupported
schemas fail. Every project field remains included conservatively. Other inputs,
including undeclared JSON, code, media and fonts, remain byte-sensitive.

The same projection is used for source counts, so Undo history no longer grows the
reported authored lines/bytes. Exact on-disk hashes remain in backup manifests and
input evidence. An old schema-1 measurement is stale until rerendered. The opt-in
requires a renderer that reads only the declared authored fields for its output;
changing that contract requires updating the projection and evidence version.

Run `node --test catalog/test/render-input.mjs catalog/test/freshness.mjs` from the
repository root to verify metadata stability, real-change invalidation, legacy
evidence handling and an actual pixel-level known-bad. The tests also run in
`make audit-fast`.

Whiteout's sampling was explicitly migrated from live-clock `[4, 10, 16]` seconds
to `__frameTo` at `[96, 240, 384]`: exactly 4, 10 and 16 seconds at its authored
24 fps. This removes startup-delay and machine-speed drift for the pilot. Its old
recorded measurement values and all claim/goal thresholds were retained; the audit
measures the current deterministic frames and can still report a genuine claim failure.

For migrated works, include `project.studio.json` in `sources`. The count tool reads
its authored shot array, frame lengths, total frames and shortest shot; it does not
guess a shot count from the JavaScript expression that imports this document.

## The measurement is calibrated too

Every check carries a deliberately broken case; if the broken case passes too, the check is
`UNPROVEN` and the build fails. Missing calibration is `UNCALIBRATED` and also fails.
Visual claims run the same measurement on deliberately damaged pixels (desaturated,
flattened, darkened, or stripped of hard edges), rather than returning a threshold
number as their control. The measuring tool has two of its own:

- **`measure/sees-the-broken`** — blurring the captured pixels must lower measured texture
  by more than 2.5 times; without the blur, the ratio is 1.0.
- **`measure/order-independent`** — this check caught a real error. The first version took edges
  from the **first** frame only, and the same three frames measured one by one differed by
  **19.6 points**. That broke a conclusion: "Oq Ko'cha and Not A Measurement are drawn by the
  same hand" was that artefact. Now each frame is measured on its own and averaged: the
  difference must be zero when the same frames are reordered.

The calibration itself can be unstable: this check used to sit on a project sampled by time and
gave 19.6 on one run and 5.4 on the next. It now sits on the project that takes frames by number
with `__frameTo`.

## Commands

```
node tools/count.mjs <file...>         # count from the source
node tools/measure.mjs <file> <t...>   # measure from frames
node tools/card.mjs                    # do the cards agree with their sources
node tools/card.mjs refresh            # refill count and measure
node tools/catalog.mjs [out.html]      # the catalog page, build/style-catalog.html by default
node test/run.mjs                      # everything, with calibration
node test/run.mjs --only whiteout      # current Whiteout pixels; other results keep their old timestamps
node --test ../harness/test.mjs test/freshness.mjs # quick regression fixtures
```

## Six numbers

Six numbers the renderer does not know about — which is why a cat drawn with Canvas can be
compared with a street solved from a distance field.

| number | what |
|---|---|
| `value` | the darkest and the brightest (2% and 98% quantiles), 0–255 |
| `saturation` | mean saturation, % |
| `hardEdgeShare` | the share of hard edges (Δluma > 0.16) among all edges |
| `texture` | mean energy left after a 3×3 blur, on a 0–255 scale |
| `ink` | the share of pixels with luma < 0.15, % |
| `palette` | median-cut, 6 colours, with their share of the area |

Median-cut on purpose: k-means gave a different answer for every starting point, and a
measurement that answers differently every time is not a measurement.
