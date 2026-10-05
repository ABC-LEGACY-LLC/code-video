# s14 — actions/upload-artifact

Fetched 2026-09-30 in the room's container: raw `README.md` and `action.yml` on `main` (copies:
`work/review/web/s14-*`, gitignored).

- The README's examples use `actions/upload-artifact@v7` (`README.md:70,134`).
- `action.yml:11-19`, `if-no-files-found`: `warn` (the default), `error` ("Fail the action with an error
  message"), `ignore`.
- `action.yml:20-25`, `retention-days`: "Minimum 1 day. Maximum 90 days unless changed from the repository
  settings page." `README.md:346`: "Artifacts are retained for 90 days by default."
- `action.yml:26-34`, `compression-level`: 0 to 9, "0: No compression", 6 the default; `README.md:225` shows
  `compression-level: 0 # no compression` for files that are compressed already.
