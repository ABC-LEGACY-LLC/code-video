# s6 — huggingface.co/datasets/Linzhan/UniML3D

Read 2026-09-30 without an account: the dataset card (`dataset-card.md`, gitignored) and the API record (revision
`faaa81773b31`, last modified 2026-09-27T11:01Z, `gated: false`, licence `other`, 33,915 files, 53.3 GB of storage).
Line numbers are of `dataset-card.md`.

- **What is in it** (`:48-55`): 13,769 clips, 7,430 skeletons, 18.5 h at 30 fps. Truebones: 1,097 clips, 74
  skeletons. Mixamo: 2,317 clips, **1** skeleton (65 joints). Objaverse-XL: 10,355 clips, 7,355 skeletons. After
  the skip lists and stage-4 filters, the paper's training set is 11,850 clips, 6,554 skeletons, 9.9 h (`:208-215`).
- **What layer is shipped**: `export/`, "one NPZ per clip in a uniform format, plus every caption and annotation …
  the training layer is derived locally rather than shipped here" (`:76`). Everything ≈ 51 GB (`:70`); motions
  ≈ 48 GB, 46 GB of it Objaverse-XL (`:132`).
- **Captions** are machine-made: "a vision-language model (Qwen3.5-9B) reads a four-view render of the clip"
  (`:166`).
- **Licensing** (`:242-254`): no relicensing. Mixamo motions under "Adobe's Mixamo terms". Objaverse-XL: "every clip
  inherits the upstream licence of the Objaverse-XL object it was exported from; there is no blanket licence".
  Truebones: "a commercial library that may not be redistributed. `export/truebones/motions/` is therefore not
  part of the public release: purchase the pack from Truebones …". What the project adds (captions, joint labels,
  categories, lists) is "offered under ODC-BY 1.0".
