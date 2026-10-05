# s5 — huggingface.co/Linzhan/UniMate (the checkpoints)

Read 2026-09-30 without an account: the model card (`model-card.md`, gitignored — the `raw/main/README.md`), the
API record (`/api/models/Linzhan/UniMate`: revision `387a344c3031`, created 2026-09-27, last modified
2026-09-30T00:25Z, `gated: false`, card licence `mit`, 87 downloads, 14 likes) and the file tree (`tree.json`,
gitignored). Line numbers are of `model-card.md`.

- **Three models** (`:32-34`): `unimate_uniml3d_f60_v2` (graph attention + AdaLN text, 5–70 joints, 100k steps,
  74.1M parameters, "Recommended"), `…_v2_full_cross_attn` (66.2M, "Variant"), `…_preview` (5–60 joints,
  "Superseded"). All are "f60": "60 frames at 30 fps, 12 features per joint: 3-D position, 6-D rotation relative
  to the T-pose, 3-D velocity" (`:48`). "Params¹ Denoiser only. The frozen `google/flan-t5-base` text encoder is
  downloaded from the Hub on first use." (`:36`)
- **Sizes** (from `tree.json`, summed in the container): 468 files, 36.72 GB in all. The recommended model's
  final checkpoint `checkpoint_step_100000.pt` is 1,185,827,848 bytes. It holds model, EMA, optimizer and
  scheduler state (`:132`).
- **Licence**: "The checkpoints and the UniMate code are released under the MIT License. The training data remain
  under their source licenses: Adobe's Mixamo terms of use, the per-object licenses of Objaverse-XL, and the
  commercial Truebones ZOO license. Review these terms before using the models." (`:149`)
- **To sample at all**, step 1 is to build the stage-4 features of the dataset the model was trained on, from the
  Hub dataset at revision `faaa817`, with `run_extract_features.sh truebones|mixamo|objaverse` (`:56-62`). "The
  Truebones motions come from a commercial pack and are not on the Hub" (`:64`).
- **Limitations, verbatim** (`:142-145`):
  - "a sample is a fixed 60-frame window (2 seconds). Longer motion requires chaining samples with the expansion
    application."
  - "Skeletons with more than 71 joints (61 for the preview model) cannot be sampled."
  - "**New skeletons:** there is no skeleton-only input. A new rig must be converted into a feature directory with
    `data_process/scripts/run_preprocess_char.sh`, and needs at least one animation clip."
  - "every training caption has the subject 'An object'; the skeleton determines the character. Prompts should
    describe the motion only."
- **Training cost** (`:105-109`): v2 on 8× H100 "about 22 hours"; full-cross-attn 8× H100 "about 36 hours";
  preview 6× H100 "about 23 hours". The configs named there (`configs/uniml3d_60frames_graph_adaln_v2.json`,
  `…full_cross_attn_v2.json`) are not in the code repository at `5d6aabe` ([s3]).
