# cuelume

Cuelume is fourteen interaction sounds for the web, one for each interface
job, synthesized live with Web Audio. Add an attribute, call `bind()`, done.
Zero runtime dependencies, no audio files, 6.4 kB min+gzip. MIT licensed.

This page is the complete guide for AI agents adding cuelume to a project.

- npm: https://www.npmjs.com/package/cuelume
- repo: https://github.com/danielwh2/cuelume

## Quickstart

```sh
npm install cuelume
# or: yarn add cuelume · pnpm add cuelume · bun add cuelume
```

```html
<button data-cuelume-tap>Save</button>
```

```ts
import { bind } from "cuelume";
bind();
```

Cuelume is **ESM-only** (native `import` or any ESM bundler; no CommonJS
`require()`). It targets modern browsers. Importing on the server is a safe
no-op, so it works in SSR frameworks; playback only happens in the browser.

## Two ways to use it

### 1. Declarative, for interface chrome

| Attribute               | Fires on                                           | Default cue |
| ----------------------- | -------------------------------------------------- | ----------- |
| `data-cuelume-tap`      | `click`                                            | `tap`       |
| `data-cuelume-type`     | `keydown` that edits text                          | `type`      |
| `data-cuelume-select`   | `change` on a native select or input, else `click` | `select`    |
| `data-cuelume-toggle`   | `click`                                            | `toggle`    |
| `data-cuelume-open`     | `click`                                            | `open`      |
| `data-cuelume-close`    | `click`                                            | `close`     |
| `data-cuelume-navigate` | `click`                                            | `navigate`  |

Leave the value empty for the default cue, or set it to any cue name. When
marked elements nest, the innermost one decides. `data-cuelume-emphasis`
(`subtle`, `normal`, or `strong`) on an element or any ancestor sets how much
the action matters. `data-cuelume-theme` (`default`, `mech`, `bubble`, or `press`)
sets the material the same way. `bind()` is idempotent, delegated, and covers
elements added later.

### 2. Imperative, for outcomes and progress

```ts
import { play } from "cuelume";

play("loading");
try {
  const { warnings } = await deploy();
  play(warnings.length ? "warning" : "success", { emphasis: "strong" });
} catch {
  play("error");
}

play("navigate", { direction: "back" });
play("count", { duration: 900 });
```

## Cues

| Cue         | Job                                   | Character                                  |
| ----------- | ------------------------------------- | ------------------------------------------ |
| `tap`       | Buttons, links, direct activation     | Small glassy tap                           |
| `type`      | Text entry                            | Keyboard keystroke, different every stroke |
| `select`    | Dropdowns, menus, lists               | Crisp woody detent                         |
| `toggle`    | Switching between states              | One crisp snap with a knock of body                       |
| `open`      | Menus, drawers, dialogs, disclosures  | Air drawing up over a light mallet note         |
| `close`     | Closing or dismissing                 | Air falling shut over a low, damped note               |
| `navigate`  | Routes, pages, carousels, galleries   | Soft whoosh that rises, and falls going back |
| `success`   | Confirmed completion                  | One soft mallet chord, C–G–E spread wide              |
| `warning`   | Done, but needs a look                | One mallet fifth, A and E              |
| `error`     | Recoverable failure or refusal        | One muted low chord, short            |
| `loading`   | Slow work started                     | One soft, low note that swells and fades   |
| `ready`     | A result is there, nothing confirmed  | One warm glass note in a small room             |
| `attention` | Blocked until the user answers        | One high glass bell, ringing longest        |
| `count`     | A number animating to a new value     | One breath that rises with the count       |

The material tells you the kind of event before you know which one: mallets for outcomes, glass for presence, air for motion, wood and keys for input.

## Which cue?

Pick by the job, not by the sound. Every row uses a cue that exists; emphasis and options do the rest.

| Moment | Cue |
| --- | --- |
| Primary button: save, send, submit | `tap` |
| Secondary or ghost button | `tap`, subtle |
| Destructive confirm: delete, remove | `close`, strong |
| Copy to clipboard | `success`, subtle |
| Like, star, bookmark | `toggle` |
| Undo / redo | `navigate`, subtle, `direction: "back"` / `"forward"` |
| Keystroke, delete, space, return | `type` (bindings set `key`) |
| Autocomplete accepted | `select` |
| Field fails validation | `error`, subtle |
| Menu, dropdown, or list option | `select` |
| Tab, segmented control, radio | `select` (bindings set `direction`) |
| Checkbox, switch | `toggle` (bindings set `direction`) |
| Slider or stepper step | `select`, subtle, `direction` |
| Menu or popover opens / closes | `open` / `close`, subtle |
| Dialog or drawer opens / closes | `open` / `close` |
| Accordion expands / collapses | `open` / `close`, subtle |
| Command palette | `open`, subtle, or nothing: it fires hundreds of times a day |
| Toast | the cue for what it reports, subtle |
| Route change | `navigate` |
| Back button | `navigate`, `direction: "back"` |
| Carousel, gallery, pagination | `navigate`, subtle, `direction` |
| Drag picked up / dropped / cancelled | `select` / `tap`, strong / `close`, subtle |
| Reorder a list item | `select`, `direction` |
| Saved, synced | `success`, subtle |
| Payment, publish, deploy confirmed | `success`, strong |
| Partial failure, deprecation, connection retrying | `warning` |
| Form rejected, permission denied | `error` |
| Upload, export, or build started | `loading` |
| Upload finished | `success` |
| Export ready to download | `ready` |
| Long job finished while the user was away | `ready`, strong |
| New message in an open conversation | `ready`, subtle |
| Reminder or timer due | `attention` |
| A number animates to a new value | `count`, `duration` matching the animation |
| A number counts down | `count`, `direction: "back"` |
| A live number that updates constantly: price feed, viewers | nothing |
| AI: prompt sent / generation started | `tap` / `loading`, subtle |
| AI: generation stopped | `close` |
| AI: reply finished streaming | `ready`, subtle |
| AI: tool call needs approval | `attention` |
| AI: agent task done (PR opened, file written) | `success` |
| AI: model, tool, or network failure | `error` |
| AI: suggestion accepted / rejected | `select` / `close`, subtle |
| AI: switch model or mode | `select` |
| One playful moment in a professional app, e.g. the AI model picker | the usual cue, `theme: "bubble"` |

Never play a cue per streamed token, per tool call inside an agent run, or on hover. Those fire in bursts and wear any sound out; play one cue when the run ends. An animated number gets one `count` when it starts moving, never one per digit.

## API (complete)

```ts
import { play, bind, setEnabled, setVolume, setTheme, sounds, themes, type SoundName, type Emphasis, type ThemeName, type PlayOptions } from "cuelume";
```

- `play(name?: SoundName, options?: PlayOptions)`: play a cue now. Defaults
  to `"tap"`. Options, for this play only: `volume` (0–1), `emphasis`
  (`"subtle" | "normal" | "strong"`), `direction` (`"forward" | "back"`,
  shapes `select`; `back` plays `navigate`, `toggle` and `count` backwards),
  `key` (`"printable" | "space" | "delete" | "enter"`, shapes `type`), `input`
  (`"mouse" | "touch" | "pen" | "keyboard"`, shapes `tap`), `theme` (a theme
  name, for this play only), `duration` (milliseconds, for `count`, clamped
  to 300–2000). Unknown values are ignored.
- `bind(root?: ParentNode)`: delegate all `data-cuelume-*` interactions under
  `root` (default: the whole document).
- `setEnabled(enabled: boolean)`: turn future playback on or off. Does not
  persist; your app owns the setting.
- `setVolume(volume: number)`: global volume for future playback, clamped to
  `0–1`. Does not persist.
- `setTheme(theme: ThemeName)`: `"default"` (glass, wood, air, soft mallets),
  `"mech"` (dry machined parts), `"bubble"` (knocks, drips, corks, gulps;
  playful), or `"press"` (a crisp click over a warm, swelling note). Every cue
  is one sound in every theme. Same cues, same levels. Unknown names are ignored.
- `sounds`: the fourteen cue names. `themes`: `["default", "mech", "bubble", "press"]`.

## Migrating from 0.2

The 0.2 names still play the cue that does their job until 1.0, and
TypeScript marks them deprecated: `chime` and `sparkle` play `success`;
`press`, `release`, and `pulse` play `tap`; `tick`, `whisper`, and `scan`
play `select`; `bloom` plays `open`; `droplet` plays `close`; `page` and
`arrival` play `navigate`. `loading` and `ready` are cues again. Replace
`data-cuelume-press`/`data-cuelume-release` with `data-cuelume-tap`, and drop
`data-cuelume-hover`.

## Framework recipes

React: call `bind()` once in a top-level `useEffect(() => { bind(); }, [])`.
Astro / plain HTML: `import { bind } from "cuelume"; bind();` in a client script.
Delegated listeners keep working when frameworks replace DOM under the root.

## Guarantees you can rely on

- One cue per action, even with nested marked elements.
- Click bindings follow native activation, so Enter and Space play too.
- Typing plays only for keys that edit text, never in password fields, at
  most once every 40 ms.
- One lazy shared `AudioContext`, created on first use and resumed when the
  browser allows it.
- Invalid names, blocked autoplay, or missing Web Audio make `play()` a
  silent no-op, never a thrown error. Invalid option values are ignored and
  the cue plays as normal.
- Nothing is stored or sent: no preferences, no behaviour data.

## Guidance for good sound design

- Pick the cue by its job; the tables above are the contract.
- Use emphasis for weight: `subtle` for frequent actions, `strong` for rare
  ones that matter.
- Give people a Sound toggle and pass it to `setEnabled()`; add a volume
  control with `setVolume()` when loudness matters.
- Browsers block audio until the first interaction, so don't plan for sound
  on page load.
- Keep `bubble` for products, or single moments, that should feel playful;
  `default` and `mech` are for all-day use.
