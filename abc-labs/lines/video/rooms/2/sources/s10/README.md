# s10 — remotion-dev/remotion

Fetched 2026-09-30 10:28 UTC in the room's container: the repository API and the raw `LICENSE.md` on `main`
(copies: `work/review/web/s10-*`, gitignored).

- The API: "Make videos programmatically with React"; created 2020-06-23; 61,214 stars; licence `NOASSERTION`
  (its own licence, not an SPDX one).
- `LICENSE.md:7`: "Individuals and small companies are allowed to use Remotion to create videos for free (even
  commercial), while a company license is r[equired] …"
- `LICENSE.md:20-21`: the Free License covers "an individual" and "a for-profit organization with up to 3
  employees".
- `LICENSE.md:43`: "You are required to obtain a Company License to use Remotion if you are not within the group of
  entities eligible for a Free License."

## How it organises making a film (README fetched 2026-10-02 02:00 UTC, for code-video's question)

The raw `README.md` on `main` (4,158 bytes, sha256 c0aa4732decb…; copy `work/review/web/s10-README.md`). The README is
a list of links into its documentation ("more than 1000 pages", `:43`); the documentation was not read.

| question | what the README says | where |
|---|---|---|
| a project on disk | made by `npx create-video@latest`; "React Code is the source of truth" | `:23,36` |
| who authors | three ways, interchangeable: "agentically" (a coding agent), "interactively: Edit and animate using drag and drop", "programmatically"; "Switch your workflow at any point"; links to Agent Skills, Prompts, Templates | `:19-23,47-49` |
| preview | a Player and an "Editor Starter" are linked under "Making apps" | `:65-66` |
| render | Node.js APIs, Lambda, Vercel, client-side rendering | `:59-63` |
| check | nothing named | |
| deliver | "Batch rendering: Render millions of videos on your own infrastructure"; "Publish a simple tool or a complex video editor" | `:28-29` |

Not known from the README: the files of a project, the name and working of its preview, any check on a render.
