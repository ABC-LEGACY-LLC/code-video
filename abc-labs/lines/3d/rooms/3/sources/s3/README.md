# s3 — github.com/Friedrich-M/UniMate

Cloned into the room's container on 2026-09-30 (`labs room run 3 -- git clone https://github.com/Friedrich-M/UniMate
work/UniMate`; the clone is gitignored). Read at **`5d6aabedd947297b5ba6706d8e9113e68c0c3e4f`**, 2026-09-27T15:56
−04:00, "Link the checkpoints and the UniML3D dataset in the README badges". Nothing was installed or run from it.
Every `path:line` below is at that commit.

## History

`git log --oneline | wc -l` → 20 commits, all by `Friedrich-M`, 2026-07-22 → 2026-09-27: README + MIT licence +
figures (07-22), data pipeline (08-30), "Release the training and inference code" `0dd8855` (09-06), one config per
dataset and variant `9f3076e` (09-11), preview checkpoints announced `adbf992` (09-27). 169 files outside `.git`.
No tag. **No tests**: no `test/` or `tests/`, and `grep -rln "def test_\|import pytest\|unittest"` finds nothing.

## What it says it is — README.md

- MIT for the code (`README.md:321`; `LICENSE`: "Copyright (c) 2026 Linzhan Mou"). The data "remain governed by the
  licenses of their original sources": Mixamo terms of use, Objaverse-XL per-object licences, Truebones' commercial
  licence (`README.md:323`).
- "Given a rigged 3D asset and a text prompt, UniMate generates articulated motion for arbitrary skeletons in real
  time — with no per-skeleton retraining and no test-time optimization." (`README.md:153`)
- But: "The target skeleton — T-pose and topology conditioning — is taken from the dataset, so the
  `dataset/features/<dataset>/` directory the model was trained on must be present." (`README.md:159`);
  "`object_type` must exist in the dataset" (`README.md:171`).
- Output: `motions/<case_id>-rep_<r>-<i>.npy`, "Generated motion features `(T, J, 12)`", and a skeleton render
  `_fk.mp4` (`README.md:197-198`). A mesh is driven afterwards by stage 5 of the data pipeline, "which exports an
  animated GLB + FBX" (`README.md:209-217`).
- In-betweening and editing "clamp against a real clip, so their test-case keys must be `<object_type>-<clip_id>`
  naming a clip the dataset actually holds" (`README.md:302`).
- "The processed **UniML3D** dataset is being prepared for open release" (`README.md:327`) — stale: the export
  layer is on the Hub since 2026-09-27 ([s6]).

## What the code does

- **The skeleton comes from a feature dataset, and it must have a clip.** `unimate/inference/sample.py:192-199`:
  `_known_object_types` = "Object types with at least one train or eval clip — only these can realize a test case
  (otherwise no reference clip is available)". Test cases whose object type is not in it are skipped
  (`sample.py:337-343`). A feature directory is `cond.npy` + `motions/` (+ optional `captions.json`)
  (`unimate/dataset/mixture/dataset.py:1550-1581`).
- **A new rig goes through Blender.** `data_process/mesh_animation/preprocess_char.py` ("Stage 5",
  `data_process/scripts/run_preprocess_char.sh:2`) runs export → feature extraction → canonical bake on one GLB/FBX
  under `blender -b -P`, writing `<name>_canonical.{glb,fbx}`, `cond.npy`, `motions/<clip>.npz`
  (`preprocess_char.py:17-24`). It has a rest-only fallback for an asset with no animation
  (`preprocess_char.py:35-37, 109-149, 320-323`) that writes a `cond.npy` and **no** `motions/`, and the sampler
  would then skip that object type (`sample.py:192-199`). The wrapper script asks for a "rigged, ANIMATED asset"
  (`run_preprocess_char.sh:16,30`). The model card says the same ([s5] `model-card.md:144`). No README step
  shows how to point the sampler at such an output directory. The config's `<dataset>.path` entries
  (`configs/uniml3d_60frames_graph_adaln.json:6-17`) are the obvious place, but that was **not tried**.
- **Facing** needs a named left/right joint pair (`--face_r/--face_l`), else identity facing
  (`preprocess_char.py:32-33, 290-295`).
- **Device**: `SamplingArgs.device: str = "cuda"` (`unimate/configs/schema.py:323`), read from the run's
  `config.json` (`sample.py:1148`). Checkpoints load with `map_location='cpu'` (`sample.py:171`), and no `.cuda()`
  call is hard-coded in `unimate/` (`grep -rn "\.cuda()" unimate/` → none). So CPU sampling looks possible by
  editing that field. **Not tried, not timed.**
- **Environment**: "Python 3.10, CUDA 12.4" (`requirements.txt:2`); `torch==2.5.1+cu124` (`:30`); `bpy==4.0.0`, i.e.
  Blender as a Python module, for export/render/animate (`:77`); a git dependency `Motion @
  git+https://github.com/inbar-2344/Motion.git` (`:70`); OpenAI's CLIP from git (`:44`).
- **Keys only for rebuilding data**: joint annotation can call DeepSeek or OpenAI (`data_process/joint_annotation/llm.py:37,123`),
  captioning Gemini/OpenAI or a local Qwen3.5-9B (`data_process/README.md:93, 301`). Sampling needs none.
  The frozen `google/flan-t5-base` text encoder is fetched from the Hub on first use (`README.md:132`).
- **Configs**: eight, all `60frames` (`ls configs`). The `_v2` configs the model card names ([s5]
  `model-card.md:107-108,116`) are **not in the repository**; each released model directory carries its own
  resolved `config.json`, which is what inference reads (`sample.py:1078-1081`).
- **Training**: flow matching, EMA, AdamW, cosine schedule (`README.md:125`); `accelerate launch`, 8 GPUs on one node
  in the example (`README.md:100-104`).
