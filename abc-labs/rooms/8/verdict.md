# Verdict — Cardboard for Mac, "bring your agent", 2026-09-30

**In one line:** do not build — Cardboard is a closed, credit-metered editor. Its "bring your agent"
means your own Claude or ChatGPT subscription driving Cardboard's chat inside Cardboard's app. There
is no published API, CLI, MCP server or project format to build on. What is worth taking for
code-video comes from the open tools next to it, not from Cardboard.

## What this is

- **The post** [s1]: "We have solved video editing once and for all … It's FREE … Available on your
  nearest Mac. PS this video was made on @usecardboard". Of the 233 replies, the mirror served the
  first 56, 21 of them the author's (`thread-all.json` holds 57 entries, the post itself included)
  [s9]. Only one reply asks a real question and gets an answer:
  "free ?" → "Free on the desktop app" (2105244345821761580). A question about how it works "under the
  hood" got no answer in those 56 (2105011928317956287).
- **The product**, from its own pages. It is an agentic editor, in the browser and as a Mac app for
  Apple Silicon. It has a multi-layer timeline (video, audio, image, text and caption tracks) and an
  in-house agent, "Director" [s3:7-19]. The browser version renders with a custom WebGL2 compositor
  and WebCodecs [s3:17]. It exports MP4/MOV up to 4K, plus AAF or FCPXML to Premiere Pro, Final Cut
  Pro, DaVinci Resolve and Avid [s3:61; s4 `faq.txt:23`; s5 `changelog.md:1135-1136`]. "Save As" writes
  one `.cbproj` file, footage included [s5 `changelog.md:28`]. That format is not documented anywhere
  the room found.
- **How an outside agent drives it**:
  - **The route the pages document.** In the Mac app you open Settings → Agents, sign in with Claude
    or ChatGPT, and pick that agent in the chat [s7 `faq.txt:11`]. You need a paid Claude or ChatGPT
    plan, "which pays for the model" [s7 `faq.txt:11`, `desktop.txt:112`]. There are "No API keys. No
    terminal. Nothing extra to install." Cardboard gives the agent "the footage, timeline, and editing
    tools" [s7 `desktop.txt:110-111`]. What leaves the Mac is "frames and the transcript" [s7
    `faq.txt:18`].
  - **What the film shows.** The chat's model menu offers Fable, Opus, Sonnet, ChatGPT and Cloud
    (t045). The agent says "I'll start by reading the Cardboard skill and the current project state"
    and "Ran 4 commands and used 1 tool" (t030) [s2 `frames.md`]. So Cardboard hosts Claude Code or
    Codex under a skill file of its own, and the user sees only Cardboard's chat.
  - **The one mention of anything else.** A single FAQ answer on the home page says "any agent can
    drive Cardboard through its CLI or MCP server" [s4 `faq.txt:21`]. The same site's agent guide says
    "Cardboard has no public API … not documented for third-party use. Write to founders@cardboard.ai"
    [s3:110-111]. The room found no CLI, MCP server, package or docs:
    - the npm names tried all return 404;
    - GitHub has no `usecardboard` or `cardboardinc` org;
    - the author has no Cardboard repository (`work/fetch/probe.txt`).
    - The `cardboard-ai` GitHub org (created 2019, one repo last pushed 2023) is not linked from the
      site.
- **The timeline in the film.** The only Cardboard timeline shown runs 0:16 and has four tracks:
  "Grid guides", "Launch titles", a voice file and a music file (t033). The kinetic typography sits on
  it as one long graphic clip per track, not as separate text items. None of the filmed scenes and
  none of the final cut appear on a Cardboard timeline. "Made on Cardboard" stays the author's claim
  [s2 `frames.md`, "What it does not establish"].

**The claims, as they come out:**

- **"FREE"** means the Mac app is free to download and includes the Lite plan [s6 `pricing.md:40`]:
  - Lite on the Mac gives "The Director · 30 credits", "30 min of footage", "3 exports at 1080p"
    [s7 `desktop.txt:63-72`].
  - Lite's usage credits are "a one-time allowance" [s4 `faq.txt:2`], and generative AI is "not
    included" [s4 `home.txt:178`].
  - Exporting to Final Cut or Premiere, the only published way to get the timeline out as data, is "on
    Starter and up" [s4 `faq.txt:16`], which costs $29/month [s6].
  - Your own agent needs a paid Claude or ChatGPT plan [s7].
- **"Local"** covers editing and export on the Mac [s4 `faq.txt:20`]. It does not cover the rest:
  - "AI features like transcription and generation use the cloud either way" [s4 `faq.txt:20`].
  - A failed export is finished "in the cloud" [s5 `changelog.md:57-58`].
  - The desktop app's data sharing is on by default. It can include "conversation text and visible
    agent activity, such as filenames, paths, tool inputs, and tool results" [s10 `privacy.md:72-76`].
- **"Solved"** is contradicted by their own hiring page, which lists ten open problems. On
  verification it says: "There's no linter for video. We have to build one" [s8:41].
- **"Every export gets checked"** [s5 `changelog.md:57-58`] is described by symptom only: "If the
  picture or sound didn't make it … No more frozen frames, no clicks in the audio". The method is not
  published.

## What already exists

- **VEED open-edit** [s11], Apache-2.0, last commit 2026-09-29. It is a CLI plus a Claude Code skill:
  - The agent writes the piece as an HTML page, and "the code is the edit".
  - A JSON EDL (edit decision list) with frame-grid snapping [s11 `edl.ts:10-24,98-112`].
  - A renderer that injects a virtual clock, so every frame depends only on its index
    [s11 `page-runtime.ts:1-4`].
  - It re-renders only changed segments and refuses a render that drew nothing.
  - Audio is levelled to −14 LUFS.
  - It is the open-source answer to most of what Cardboard claims.
- **Palmier Pro** (YC S24) [s12] is a macOS editor that exposes a local MCP server at
  `127.0.0.1:19789/mcp` for Claude Code, Codex and Cursor:
  - `get_timeline` returns tracks and clips as `[start, end)` frames.
  - `inspect_timeline` returns composited frames with a 0–1 grid and the frame number burned in,
    plus the ids of the clips on screen [s12 `ToolDefinitions.swift:87-99`].
  - Source is GPLv3 through v0.7.6; later versions are proprietary [s12 `README.md:2`].
  - This is what "an outside agent drives the timeline" looks like when it is published. Cardboard
    publishes none of it.
- Cardboard's own FAQ names Descript's agent as its nearest rival [s4 `faq.txt:14`].

## Worth building?

No. The three facts behind that:

1. **Nothing to build on.** There is no public API [s3:110-111]. The "CLI or MCP server" is one
   unsupported FAQ sentence [s4 `faq.txt:21`; `work/fetch/probe.txt`]. The agent integration lives
   inside Cardboard's app, behind a Cardboard account and your own paid model plan [s7].
2. **The free tier is a trial, and the data leaves only behind the paywall.** Lite has 30 one-time
   credits, 30 minutes of footage, 3 exports at 1080p and no generative AI. FCPXML/AAF (the timeline
   as data) needs Starter at $29/month [s4, s6, s7]. The service and its prices are "launch pricing"
   and can change [s4 `home.txt:230`].
3. **The open tools already hold the mechanisms, with code and a licence:** open-edit (Apache-2.0)
   [s11] and the GPLv3 Palmier source [s12]. Cardboard's contribution that can be read from outside is
   a list of what it says its checks catch [s5]. That goes to code-video as test ideas, not as a
   product.

## How, if yes

Nothing is built and nothing is rented from Labs. The room's usable output is `for/code-video.md`:
- mechanisms from s11 and s12, with the files they would go into;
- Cardboard's named failure modes (frozen frames, audio clicks, missing picture or sound, captions
  that overlap or shrink) turned into checks, each with its broken state.

## What was checked and what was not

- **Opened:**
  - the post and its first 56 replies [s1, s9];
  - Cardboard's llms.txt, home, changelog, pricing, Mac page, hard-problems and privacy pages, read
    raw [s3–s8, s10]; the FAQ answers were taken from the pages' JS bundles, since they are not in the
    HTML;
  - the film: 81 per-second frames, 84 scene cuts, caption sheets and crops [s2];
  - npm and GitHub [`work/fetch/probe.txt`];
  - open-edit's EDL, renderer and audio code, and Palmier's README and tool list [s11, s12].
- **Not opened, by the brief:** no account, no app download, no agent connected. So the room has not
  verified:
  - what "the Cardboard skill" says;
  - which tools the agent actually gets;
  - whether a local MCP server or CLI exists;
  - the timeline's data shape;
  - what the export check measures.
  Answering these needs a Mac with the app installed and signed in. The room has neither.
- **Not read:** the other 177 replies (the mirror serves one page); the ~49 quote posts; the other
  "video MCP" services a web search lists (OpusClip, reap, VideoEdit MCP, Selects), which were not
  registered and are not claimed here.

*Last rewritten 2026-09-30.*
