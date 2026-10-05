# Studio — a person and an AI on the same piece

```bash
make start                      # http://127.0.0.1:4321/  (from the repository root)
make stop
make install                    # as a systemd user service: back if it dies, up after a reboot
make expose                     # on https://code-video.abclegacyllc.com, login through the Telegram bot
node studio/test/run.mjs        # 15 checks: the server, the login, the notes, the colours
node studio/test/ui.mjs         # 15 checks in Chromium: the page itself (cd studio && npm i first)
```

No library, Node alone. The server listens on this machine only (127.0.0.1). If you use VS Code
in a browser, forward port 4321 in the Ports panel and open that address: the page uses relative
URLs, so it also opens behind a path prefix.

## On a public name

```bash
make expose-dry   # checks DNS, the studio and its login, prints what would be written — changes nothing
make expose       # https://code-video.abclegacyllc.com (asks for sudo once)
make unexpose     # take it off again; the studio keeps running locally
```

From outside the studio asks for a login, and the login is a Telegram bot
([auth.mjs](auth.mjs)): send `/login` to the bot in a private chat, it answers with a link that
works once and for five minutes, and the link sets a session for thirty days. `/logout` to the bot
ends every session of that person. Only the ids in `TELEGRAM_OWNER_IDS` get a link. The bot's
token and the owners are read from the repository's `.env` (never committed):

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_OWNER_IDS=111111111,222222222
```

After changing them: `make restart`. On this machine (127.0.0.1) no login is asked: the person at
the terminal and the AI already have the repository.

- Telegram opens a link to draw its preview. So opening a login link only shows a page; the
  session is made by the POST that page sends, and a preview spends nothing.
- Links and sessions are stored as SHA-256 hashes (`build/run/sessions.json`), so that file is no
  key to the studio.
- A studio started without a token or without owners refuses every outside request, and
  `make expose` refuses to expose a studio whose outside requests are not refused.
- A change (a build, a note) is accepted only as JSON and only from the studio's own page, so a
  foreign page cannot use a logged-in browser.

`make expose` writes the site block to `/etc/caddy/code-video.caddy` and adds one `import` line
to `/etc/caddy/Caddyfile`. It reloads Caddy only after `caddy validate` accepts the whole
configuration, and puts both files back if it does not. The Labs-rendered Caddyfile is never
touched.

## Layout

```
studio/
  projects/<work>/    one work and everything that belongs to it: page, source, tests, build
  works.json          the works the studio shows, and how each one is controlled
  notes/<work>.md     a person's notes to the AI, and the AI's answers under them
  server.mjs          the studio server
  index.html          the studio page
  tokens.css          every colour, size and space the studio and its login pages use
  DESIGN.md           how to use them, and the studio's budgets
  test/               the studio's own checks: run.mjs (Node), ui.mjs (a browser)
```

The works' cards are still in `catalog/cards/`, because the measuring tools read them from there.
Stage 2 of room 2's plan makes the card a work's project file; then it moves to
`studio/projects/<work>/` as well.

## Why

The AI makes and measures the works through code, but it does not see a film with eyes or hear it
with ears. Whether a motion is smooth, whether a sound lands on its frame, whether a shot is
pleasant — a person learns that by watching it live. The studio joins the two into one piece of
work:

| who | what they do |
|---|---|
| a person | watches and listens to a work live, scrubs to any frame, reads its card and checks, leaves a note on a frame, decides the Labs questions |
| the AI | changes the code; the studio watches the files, rebuilds if needed and reloads the page; reads the person's notes and marks what it has done |

## What is in it

- **The list of works.** A work with a card takes its name, page and build from the card; works
  without a card (`zarra`, `masofa-maydoni`) are in [works.json](works.json). Each row says how
  the work is controlled (scrub by frame, by time, watch only, sandbox) and, in words, what its
  checks say ("21 pass · 3 stale", "2 failing"). "2 notes" opens that work's notes.
- **Stage and transport.** The work is shown in `?embed` mode, so its own title, buttons and
  clock step aside and there is one transport: Play/Pause, `−1` / `+1` (or `←` / `→`), the
  scrubber, and under it a strip of the shots — a click goes to a shot's first frame. Space
  plays and pauses. The readout says what is true: "Playing · frame 140 / 350" while it plays
  (the page reports its frame), "Paused at frame 140" when it is still, "Watch only" for a work
  with no frame hook. "Reload" reloads the work and keeps the frame.
- **Timeline.** Under the transport, the work's own tables as tracks: shots, camera, drawings,
  effects, sound. It is a view of the code, not a second copy: a click on a clip goes to its
  frame and names the file and line that declare it. What the film derives (a footfall, from
  the drawing changing to a contact) is drawn dashed and says why it has no handle. Layer
  switches (ink lines, snow, fog) and views (material, lines, depth) change what is shown,
  never the film. oq-kocha, whiteout, bir-tomchi and zarra have tracks.
- **A change on the timeline is a change in the code.** A clip may offer numbers to change
  (a shot's length, a sound bed's level): type one and Apply, or drag the clip's right edge.
  The studio rewrites that one number in that one row of the source (`POST /api/edit`), the
  work rebuilds and reloads, and Undo puts the old text back. Nothing else is editable: a
  derived clip has no handle, and what a change does to the checks and the card shows as
  stale or failing until they are run again.
- **A stuck work says so.** The studio does not wait for the page's `load` event: it asks the
  page whether it is ready. A page that sets `__failed` is shown as failed with its message; one
  that is not ready after 10 s is shown as not ready, with why that may be.
- **Live updates.** When a file in a work's folder changes, the studio sees it: oq-kocha is built
  first, then the page reloads and returns to the same frame. While the person is writing a note
  or scrubbing, the reload waits ("Updated — it reloads when you stop"). If the build fails, its
  error shows in the log and the page stays as it was.
- **Card, Checks, Changes.** The card's claims against their measurements, and each method
  line's evidence key with the value it is bound to (`tables.SHOTS = 8`). Each check's latest
  result, its known-bad value and its age; a result older than the last change to the work's
  files is marked stale, with the command that runs it again. The uncommitted files in words
  ("renamed · modified — from …", "+68 −17"), and the last commits.
- **Notes.** `studio/notes/<work>.md`, one note per line: `- [ ] time · frame N · text`. Writing a
  note pauses the work on the frame the note is about. The AI reads the file without the studio
  too, answers under a note with an indented `  > time · AI · what it did` line, and marks it
  `- [x]`. A note's "frame 140" goes to that frame. A half-written note survives every update.
- **Decisions.** The "open questions for the owner" from the Labs lines, rendered, with the
  command that answers each line.

## The contract a work page answers

What the studio reads from a page. A page answers what applies to it; the studio shows what it
gets and says what it does not.

| name | what |
|---|---|
| `?embed` | the page hides its own title, notes, transport and clock (`<html class="embed">`); a work's own options stay |
| `__ready` | `false` from the start of the page's script, `true` once it can be asked for a frame |
| `__failed` | a message, when the page cannot run (a shader that did not compile, say) |
| `__frameTo(n)` | draws frame `n` and holds it; returns `{frame, shot?}` (works.json `control: "frameTo"`) |
| `__seek(seconds)` | the same by time (`control: "seek"`) |
| `__frame()` | `{frame, shot?}`: the frame on screen now, playing or not |
| `__pause()`, `__play(fromFrame?)` | stop on the frame on screen; go on, from a frame if given |
| `__totalFrames`, or `__total` and `__fps` | the length (`__total` in seconds, a number or a function; `__fps` 24 if absent) |
| `__shots` | the shots, `[{k, df}]` (length in frames) or `[{k, f}]` (first frame) |
| `__tracks()` | the timeline: `[{id, name, kind: "clips"｜"events", items: [{f, n?, label?}], derived?, why?, src?: {file, find}}]`, read from the tables the film runs on; `src` names a file in the work and a piece of text, and the studio finds the line |
| an item's `edit` | what a clip lets a person change: `[{name, unit, file, row: {key, is}, key, value, min, max, step, per?, drag?}]` — the row of a table named by one of its own fields, and the key in it; `per` is the value of one frame for a drag |
| `__layers()`, `__layer(id, on)` | parts of the picture that can be switched off: `[{id, name, on}]` |
| `__views()`, `__view(id)` | the buffers the picture is made from: `[{id, name}]` |

Today oq-kocha, whiteout and zarra answer all of it that applies, bir-tomchi answers it by time,
and mushuk and not-a-measurement are watch only. masofa-maydoni is a sandbox: it says when it is
ready, and its controls are the work, so they stay.

## What was taken from Open Edit, and what was not

From its sources (open-edit, HyperFrames, Remotion, Revideo, Motion Canvas, editly) room 2
concluded that in these tools a studio is small — one folder per piece, one contract between the
page and the renderer, one command per step, a render that refuses bad output. Open Edit's large
version (eleven steps, recipes, gates, a preview server) was deleted within a week.

| taken | from |
|---|---|
| one folder per piece, everything it needs inside | open-edit `SKILL.md:31-35` |
| a contract with the page: a frame hook, a readiness signal | open-edit's render contract, HyperFrames `__timelines` |
| a read-only preview: watch, scrub, swap in the new result when it lands | open-edit's deleted `preview` command |
| rebuild what changed, not the whole piece | open-edit `--from/--to` |

| not taken | why |
|---|---|
| editing a timeline in the browser | a work is code; code changes it, the studio shows it |
| recipes, a design system, an eleven-step flow | Open Edit deleted them itself |
| the hand-off to VEED, golden mp4s in the repository | it needs a VEED login; video is not kept in the repository |

## Next stages

Room 2's six stages for a studio; this folder is the first step of stage 5.

1. Every page answers one contract (above). oq-kocha, whiteout, zarra and bir-tomchi do;
   mushuk and not-a-measurement have no stepped clock yet.
2. The card is every work's project file: fps, total frames, export size, sound. Cards for
   `zarra` and `masofa-maydoni` too.
3. One command per step, taking a card: audit, contact sheet, export.
4. The same floor of checks under every card, in one order in CI.
5. The studio page — this folder.
6. A short skill and a template work, last.
