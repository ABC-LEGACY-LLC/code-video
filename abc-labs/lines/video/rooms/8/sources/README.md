# Room 8 — what each source folder holds

Fetched 2026-09-30 inside the room's container (`labs room run 8 -- curl …`); the scratch copies,
full HTML and the site's JS chunks are in `work/fetch/`.

- `s1/fxtwitter.json` — the post as the mirror returned it (text, counts, video variants).
- `s2/` — the film: `frames.md` first; frames, scenes, sheets, captions, crops, `get.sh`.
- `s3/llms.txt` — Cardboard's agent guide, verbatim.
- `s4/home.md` (the page as Markdown, `Accept: text/markdown`), `home.txt` (the visible text of the
  HTML, `work/fetch/text.mjs`), `faq.txt` (the landing FAQ's answers, which are not in the HTML: they
  are in the JS chunk `/_next/static/chunks/0n38e2est7gdz.js` the page loads).
- `s5/changelog.md` — the whole changelog as Markdown. Its entries carry dates and titles, not
  numbers; `s3/llms.txt:80-87` maps #44…#37 to their dates.
- `s6/pricing.md` — pricing as Markdown.
- `s7/desktop.txt` (visible text), `faq.txt` (the Mac page's FAQ answers, from the JS chunk
  `0x3a4tj0pm-gu.js`, sha256 048bc842…), `desktop.ldjson.txt` (its JSON-LD).
- `s8/hard-problems.txt` — visible text.
- `s9/thread-all.json|txt` — 57 entries: the post itself and the first 56 replies under it (the
  first page; the mirror's cursor did not page), 21 of the replies by the author; `thread.mjs`
  fetched them.
- `s10/privacy.md`, `excerpt.md` — the privacy policy; the desktop-telemetry paragraph.
- `s11/notes.md` — veedstudio/open-edit at 7f212e0.
- `s12/notes.md` — palmier-io/palmier-pro at eeafde2.
