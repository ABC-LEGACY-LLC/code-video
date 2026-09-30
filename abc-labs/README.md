# abc-labs/rooms — from the Labs workshop

This repository is one of ours, and the Labs workshop works for it. What its rooms found lands here
(`labs rooms pull`): one folder per room — `for.md` (worth taking, how, where, at what cost),
`verdict.md`, `thread.md` (what this project asked the room and what it answered), `room.json`.
Written in the rooms, never here; commit what you keep.

From this repository's root, with LABS_PROJECT_TOKEN in .env (never committed):

    npx -y https://labs.abclegacyllc.com/cli.tgz rooms status        # did anything come from Labs?
    npx -y https://labs.abclegacyllc.com/cli.tgz rooms pull          # bring it here
    npx -y https://labs.abclegacyllc.com/cli.tgz rooms ask <n> "…" --wait   # ask a room's agent
    npx -y https://labs.abclegacyllc.com/cli.tgz rooms send "…" --wait      # give the secretary something to look at

`abc-labs/beat.mjs` and the hooks in `.claude/settings.json` put this repository's Claude Code
sessions on the workspace floor as this project's developers — a tool's name and a path, never content.
