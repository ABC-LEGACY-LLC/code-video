# s12 — motion-canvas/motion-canvas

Fetched 2026-09-30 10:28 UTC in the room's container: the repository API (copy: `work/review/web/s12-repo.json`,
gitignored). "Visualize Your Ideas With Code"; created 2022-08-03; last push 2026-07-02; 19,212 stars; MIT.

## How it organises making a film (README fetched 2026-10-02 02:00 UTC, for code-video's question)

The raw `README.md` on `main` (5,266 bytes, sha256 9895daa20be7…; copy `work/review/web/s12-README.md`). Its
documentation was not read.

| question | what the README says | where |
|---|---|---|
| what it is | "two things: A TypeScript library that uses generators to program animations. An editor providing a real-time preview of said animations."; made "to create informative vector animations and synchronize them with voice-overs" | `:20-26` |
| a project on disk | "a bootstrapped project" with a `package.json` and a `vite.config.ts` that loads `motionCanvas()` from `@motion-canvas/vite-plugin`; the `create` package bootstraps it | `:43,80-116` |
| who authors | a person in code; "the editor allows you to edit certain aspects of the animation which could otherwise be tedious" | `:28-29` |
| preview | the editor (`ui`, "The user interface used for editing") and a `player` custom element | `:48,50` |
| render | `core`: "All logic related to running and rendering animations" | `:42` |
| check | `e2e`, the tool's own end-to-end tests | `:45` |

Not known from the README: how a render is started and what it writes, which aspects the editor edits, any check on
a project's output.
