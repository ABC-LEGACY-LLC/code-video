# pixal3d.cpp, as read [s3]

`https://github.com/raven38/pixal3d.cpp`, cloned in the room's container to `work/repo/pixal3d.cpp`
(git-ignored) on 2026-10-01 with `git clone --depth 30`.

**Commit read:** `d1b4926452f9e09702b891db5f05acc845e153ed`, 2026-09-24T02:58:56+09:00,
"feat(trellis2-mv): native multi-image pipeline, CLI and server (#58) (#71)". 824 tracked files.

Read for three things only: where the camera Pixel Match uses comes from, the projection it
restates, and the licence.

| file | what |
|---|---|
| `README.md:1-16` | what it is: a C++/GGML runtime for TRELLIS.2 and for TencentARC's Pixal3D; a fork of `pwilkin/trellis.cpp` |
| `NOTICE:1-58` | whose work is in it; weights "redistributed in GGUF form under their own license terms" (`:41-43`) |
| `LICENSE:1-4` | MIT, © 2026 Piotr Wilkin and © 2026 raven |
| `src/trellis_cli.cpp:681-725` | `--sv-image`: writes `<output>.svviews/input.png` and `transforms.json`, then runs the multi-view path with one view; the staging folder is kept on purpose |
| `src/transforms_json.cpp:386-420` | `synthesize_single_view_gauge`: the camera is made up, not estimated — distance `1 / (2 · mesh_scale · tan(fov/2))`, a fixed front pose, `mesh_scale` 1.0 |
| `tools/silhouette_iou.py:1-25` | the acceptance check: project the finished GLB through the input cameras, compare its silhouette with the input's alpha, fail under a threshold; and the day it was needed (2026-09-08, IoU 0.107 from a missing `mesh_scale`) |
| `PIXAL3D.md:92-106` | what the fork adds to trellis.cpp |

Not read: the model code, the flow transformers, the web and desktop apps, the tests. Nothing was
built and nothing was run.
