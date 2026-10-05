# s6 — veedstudio/weave-renderer-public-releases, VEED's engine binaries

Fetched 2026-09-30 10:28 UTC in the room's container: the releases API,
`/repos/veedstudio/weave-renderer-public-releases/releases?per_page=100` (copy: `work/review/web/s6-releases.json`,
gitignored).

**22 releases**, `weave-v0.4.1` (2026-06-30) to **`weave-v0.13.0` (2026-09-29 11:58:26 UTC)**. The review of
2026-09-30 counted 23; this fetch gives 22 tags. The room's note of 2026-09-29 ("nine releases from v0.8.1",
`work/source/sources.md`) was wrong.

| tag | published (UTC) |
|---|---|
| weave-v0.13.0 | 2026-09-29 11:58:26 |
| weave-v0.12.0 | 2026-09-24 08:22:14 |
| weave-v0.11.0 | 2026-09-22 12:08:37 |
| weave-v0.10.3 | 2026-09-21 09:51:26 |
| weave-v0.10.2 | 2026-09-03 12:01:34 |
| weave-v0.10.1 | 2026-08-28 10:26:18 |
| weave-v0.10.0 | 2026-08-27 16:49:42 |
| weave-v0.9.1 | 2026-08-24 08:57:27 |
| weave-v0.9.0 | 2026-08-19 13:07:49 |
| weave-v0.8.1 | 2026-08-14 09:27:40 |
| weave-v0.8.0 | 2026-08-11 14:58:33 |
| weave-v0.7.3 … v0.4.1 | 2026-08-03 back to 2026-06-30 (eleven more) |

Assets per release: `weave-viewer-cli-macos-arm64.tar.gz`, `weave-viewer-cli-windows-x64.zip`, their `.sha256`,
and `feature-support.md`. No asset of any release names Linux (`grep -c -i linux` over the download URLs: 0).
v0.13.0 came out 4½ hours before open-edit's commit `7f212e04` removed the engine from the CLI [s2].
