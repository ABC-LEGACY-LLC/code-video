# code-video

What the Labs workshop found for this project is in `abc-labs/rooms/` (see
`abc-labs/README.md`). At the start of a session run
`node abc-labs/labs.mjs rooms status`; when something is
new, `node abc-labs/labs.mjs rooms pull` and read it before deciding. A question for a room's agent:
`node abc-labs/labs.mjs rooms ask <n> "…" --wait`.

The studio (`node studio/server.mjs`, see `studio/README.md`) is where a person watches the
works and leaves notes for you in `studio/notes/<work>.md`. At the start of a session read the
open `- [ ]` notes. When you have acted on one, answer under it with an indented line and mark
it `- [x]`; the studio shows the answer under the note:

    - [x] 2026-10-04 10:12 +0500 · frame 140 · the snow is too bright here
      > 2026-10-04 10:30 · AI · snow alpha 0.70 -> 0.55, whiteout.html:120

A work page answers the studio's contract (`studio/README.md`): `__ready`, the frame hooks, and
`?embed`. The studio's budgets (`studio/DESIGN.md`): it answers a click in under 200 ms even
while a work loads; a work is ready in under 3 s on the owner's machine; one scrub step takes
under 50 ms at 4× CPU throttle. The studio's colours and sizes come from `studio/tokens.css`
only.
