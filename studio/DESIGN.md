# Studio design

The rules the studio page (`index.html`) and the login pages (`auth.mjs`) are built by. The
values live in one file, [tokens.css](tokens.css); the server puts it into the studio page and
`auth.mjs` reads it into the login pages, so the two cannot drift. Three checks hold this:
`studio/tokens-contrast`, `studio/no-stray-colours` and `studio/favicon-quiet`
(`node studio/test/run.mjs`).

## Colour

| token | for | rule |
|---|---|---|
| `--pa` | the page | |
| `--panel` | raised surfaces: buttons, the selected work, a text field | |
| `--ink` | text | 4.5:1 on `--pa` and `--panel` |
| `--mut` | secondary text: metadata, ages, captions | 4.5:1 on `--pa` and `--panel` |
| `--rule` | dividers between regions | decorative, no minimum |
| `--edge` | the edge of a control a person has to find (button, field) | 3:1 on `--pa` and `--panel` |
| `--acc`, `--acc-ink` | selection, the one primary action of a surface, links | `--acc` 4.5:1 as text; `--acc-ink` 4.5:1 on `--acc` |
| `--ok`, `--warn`, `--bad` | a result: holds, needs a look, broken | 4.5:1 as text |
| `--stage`, `--stage-ink`, `--stage-mut` | the stage, dark in both themes, and text on it | 4.5:1 on `--stage` |
| `--shade` | a dialog's backdrop | |

- **The accent is not the failure colour.** They were one red, and the primary button read as an
  error. They stay at least 60° of hue apart (the check measures it).
- **Colour is never alone.** A state is a word first ("2 failing", "stale", "reconnecting…");
  the dot or the colour beside it only repeats it (WCAG 1.4.1).
- Light and dark come from `prefers-color-scheme`; `data-theme="light|dark"` on `<html>` forces
  one. The two dark blocks in `tokens.css` must be the same (the check compares them).
- Native controls take the accent through `accent-color`; nothing is left browser blue.
- No colour is written outside `tokens.css`. The palette strip on the Card tab is the work's
  measured data, not a colour of the studio.

## Type

One family for words (`--sans`), one for identifiers (`--mono`).

| token | size | used for |
|---|---|---|
| `--fs-1` | 11px | captions under a row, the shot strip, the log, section labels |
| `--fs-2` | 12px | controls, tables, metadata |
| `--fs-3` | 13px | body text |
| `--fs-4` | 15px | the studio's name, login text |
| `--fs-5` | 18px | a login page's heading |

- **Mono only for identifiers and numbers that are identifiers**: check names, evidence keys,
  file paths, commit hashes, commands. Prose, descriptions and table text are sans.
- Numbers that change in place (the readout, measured values, line counts, ages) use
  `font-variant-numeric: tabular-nums`, so they do not jitter.

## Space, size, depth

- Spacing steps `--s-1`…`--s-5` (4, 8, 12, 16, 24 px); radii `--r-1`…`--r-3` (4, 6, 10 px).
- One button primitive, `.btn`, in `tokens.css`; `.btn.primary` is the single main action of a
  surface ("Add note", "Open the studio"). Tabs, shot buttons and inline links have their own
  quiet styles in the page.
- `[hidden]` always hides, whatever a component's own `display` says.
- Focus is always visible: `:focus-visible` draws a 2px `--focus` ring.

## Layout

- **One transport, one clock.** The stage shows the work in `?embed` mode: the page's own title,
  notes, play buttons and clock step aside, and the studio's transport is the only one. A
  sandbox keeps its own controls, because they are the work.
- **Three columns** above 1100px: works, stage, the side panel. To 700px the side panel goes
  under the stage; under 700px the works become a row on top. The header never wraps.
- **Slots do not move.** A control that does not apply to a work keeps its place (Rebuild is
  hidden by visibility, not removed), so the scrubber does not jump between works.
- The list is drawn once and updated in place; focus and a half-written note survive every
  update.

## Depth: what a value links to

- A hint leads to its answer: a note count opens that work's Notes, a note's "frame 140" goes to
  frame 140, a shot in the strip goes to its first frame.
- Every result says how old it is, and a result older than the last change to the work's files
  is marked **stale**.
- Nothing that matters is only in a `title` attribute: errors, notes and the signed-in user are
  visible text.

## Budgets

| what | budget |
|---|---|
| the studio answers a click or a key (INP), even while a work loads | < 200 ms |
| a work is ready on the owner's machine | < 3 s |
| one scrub step at 4× CPU throttle | < 50 ms |

A work that is not ready after 10 s is not waited on in silence: the stage says so and why it
may be.
