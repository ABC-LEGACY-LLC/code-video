# image-to-3dlab, as read [s2]

`https://github.com/Bingeljell/image-to-3dlab`, cloned in the room's container to
`work/repo/image-to-3dlab` (git-ignored) on 2026-10-01 with `git clone --depth 50`.

**Commit read:** `5ed8e9850d23515c424abc62fbca498e6da52f27`, 2026-10-01T01:01:20+05:30, "Merge pull
request #75 from Bingeljell/fix/viewer-syntax-error" — the head of `main` at the time
(`api-commits-1.json`), one commit after the release tag `v0.3.6`. Every `path:line` in the verdict
and the findings is at this commit.

## From the GitHub API (saved beside this file, fetched with `sources/get.py`)

| what | value | file |
|---|---|---|
| created | 2026-08-02T16:36:25Z | `api-repo.json` |
| stars, forks, open issues | 376, 36, 6 | `api-repo.json` |
| licence GitHub detects | Apache-2.0 | `api-repo.json` |
| commits on `main` | 509 (the `rel="last"` page of `commits?per_page=1`) | printed by `get.py`, 2026-10-01 |
| contributors | one: Bingeljell, 509 | `api-contributors.json` |
| releases | 8: v0.2.0 2026-09-22 … v0.3.5 2026-09-30T08:54Z, v0.3.6 2026-09-30T19:31Z | `api-releases.json` |
| newest issue or pull request | #78, 2026-09-30 | `api-issues-1.json` |

## Counted in the clone

Lines in `.py .js .sh .html .css` files, `find <dir> … | xargs cat | wc -l`, 2026-10-01:

| directory | lines | whose |
|---|---|---|
| `scripts/` | 25,918 | the author's (128 files) |
| `tests/` | 17,422 | the author's — 1,437 `def test_` in 108 files (`grep -c "^def test_\|^    def test_" tests/*.py`) |
| `viewer/` without `vendor/` | 11,251 | the author's |
| `image_to_3dlab/` | 2,957 | the author's |
| `hunyuan_mlx/` | 6,696 | Zimeng Xiong's Hunyuan3D-MLX port, MIT (`hunyuan_mlx/LICENSE`, `NOTICE`) |
| `viewer/vendor/` | 62,315 | three.js and its loaders |

No model, no weight and no mesh is in the repository; `vendor/` and `output/` are git-ignored
(`AGENTS.md`, Layout table).

## The dates of Pixel Match (`git log -1 --format="%h %cI %s" <commit>`)

- `8bc4408` 2026-09-28T13:36:48+05:30 "feat: keep the source photo's real pixels in Finish"
- `c7f4780` 2026-09-28T15:41:58+05:30 "feat(viewer): offer a 5,000-triangle preset in Finish"
- `6e99370` 2026-09-30T14:08:43+05:30 "feat(finish): call the photo stage Pixel Match and make repaint opt-in"

## The files that decide, and what each holds

| file | lines | what |
|---|---|---|
| `image_to_3dlab/photo_paint.py` | 471 | Pixel Match itself: numpy + Pillow, no Blender, no GPU (`:12`) |
| `scripts/photo_paint.py` | 73 | its command line |
| `scripts/retopo_repaint.py` | 398 | Finish: the order of the stages (`:78-94`), the photo stage (`:147-163`, `:319-330`), the defaults (`:213-235`), the record (`:366-389`) |
| `scripts/blender_retopo_bake.py` | 351 | "retopology": weld, voxel remesh, QuadriFlow that declines, collapse decimation, Smart UV, bake (`:185-324`) |
| `scripts/blender_bake_detail.py` | 291 | normal map and metallic-roughness from the original onto the low-poly |
| `viewer/finish_api.py` | 690 | the page's defaults (`:71-77`) and how a model is matched to its camera (`:218-243`) |
| `viewer/index.html` | 710 | the face-count presets (`:374-377`) |
| `scripts/pixal3d_generate.py` | 415 | the generator's wrapper; its run record (`:93-116`) |
| `image_to_3dlab/provenance.py` | 288 | licence profiles (`:45-88`), the gate (`:101-139`), the sidecar (`:203-288`) |
| `tests/test_photo_paint.py` | 291 | 22 tests on synthetic squares; they pass here in 0.76 s (`work/measure/result.txt`) |
| `README.md`, `CHANGELOG.md`, `AGENTS.md`, `NOTICE`, `LICENSE`, `docs/info_and_credits.md`, `docs/quadruped-pipeline.md`, `scripts/README.md` | | what it says of itself |

`install.sh` was read as a file (its first 60 lines) and never run.

## Not read

`viewer/generate_api.py` beyond one function, the `hunyuan_mlx/` port, the TRELLIS patch scripts,
the rig and animation scripts beyond their one-line summaries in `scripts/README.md`, the 107
other test files. Nothing in the repository was executed except `tests/test_photo_paint.py` and
`photo_paint.paint_texture` (see `work/measure/`).
