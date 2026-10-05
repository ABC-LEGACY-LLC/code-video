# Catalog — the architecture of the works

Five projects, one block of data. Every new project carries that block, and when the block
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

## The measurement is calibrated too

Every check carries a deliberately broken case; if the broken case passes too, the check is
`UNPROVEN` and the build fails. The measuring tool has two of its own:

- **`measure/sees-the-broken`** — when a frame is blurred, texture drops **9.6 times**; without
  the blur, **1.0**. So the tool knows what it measures.
- **`measure/order-independent`** — this check caught a real error. The first version took edges
  from the **first** frame only, and the same three frames measured one by one differed by
  **19.6 points**. That broke a conclusion: "Oq Ko'cha and Not A Measurement are drawn by the
  same hand" was that artefact. Now each frame is measured on its own and averaged: the
  difference is **0.9**.

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
