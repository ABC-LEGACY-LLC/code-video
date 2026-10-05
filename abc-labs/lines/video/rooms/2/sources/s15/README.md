# s15 — actions/cache

Fetched 2026-09-30 in the room's container: raw `README.md` and `action.yml` on `main` (copies:
`work/review/web/s15-*`, gitignored).

- The current major is `actions/cache@v5`, on Node.js 24, runner 2.327.1 or newer (`README.md:21,86`).
- `action.yml:11-12`, `restore-keys`: "An ordered multiline string listing the prefix-matched keys, that are used
  for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case."
- `README.md:156`: `cache-hit` is `true` only when the primary `key` restored the cache.
