# s4 — arXiv 2609.05415, "UniMate: One Unified Model to Animate Diverse Skeletons"

Fetched 2026-09-30 (`work/fetch-web.sh`: the abstract page, the HTML full text and the PDF, 30.6 MB). The HTML was
turned into text in the container (tags stripped, math kept as its alt text) → `paper.txt` (gitignored, 2,240
lines). Line numbers below are of that file. Authors: Linzhan Mou, Jiahui Lei, Zhiyang Dou, Chenyue Cai, Chaoyue
Song, Adam Finkelstein, Szymon Rusinkiewicz (Princeton, UC Berkeley, MIT, NTU — [s3] README). Licence line of
the HTML: `cc-license: by` (`paper.txt:129`).

## What it claims

- A "unified foundation model that synthesizes articulated motion for arbitrary skeletons from a rigged 3D asset
  and a text prompt, with no test-time optimization or per-skeleton retraining" (`:123`). Architecture: a
  topology-aware diffusion transformer (TADiT) with a graph-aware attention bias, "Spec-RoPE" (rotary positions
  from the graph Laplacian) and a global topological conditioner (`:124`). Dataset UniML3D, "13,006 motion
  sequences" (`:125`).
- Inference: noise → fixed-step Euler integration of the flow, classifier-free guidance at each step (`:292`);
  "50 steps", guidance 3.0, the two branches batched; "Sampling a 60-frame clip on a single NVIDIA H100 GPU takes
  roughly 1.2 seconds end-to-end" (`:1627`, `:1632`). The main text puts it as "inference runs at 50 FPS" (`:325`). That is
  60 frames / 1.2 s, measured on an H100.
- Training: "8 blocks with hidden dimension 512", frozen FLAN-T5, "8 NVIDIA H100 GPUs for one day" (`:325`). (The
  released v2 model has 10 layers — [s5] `model-card.md:46`.)
- Long horizon: "A variant trained at 180 frames" (`:218`, Figure 8, the robot duck of [s2] t012–t016).

## Against what

- **Skeleton-conditioned generation**: one baseline, AnyTop (Gat et al. 2025), which the authors "augment … with a
  cross-attention module for text conditioning, following MDM", trained and tested on **Truebones only**
  (`:399`). 7 held-out Truebones skeletons, 58 sequences (`:401`, list at `:1736-1738`). FID 2.711 → 0.757,
  diversity 8.139 → 9.200 (`:329-339`, `:403`).
- **Mesh animation**: AnimateAnyMesh and V2M4 on 18 meshes, VBench metrics, time per mesh 15.5 s / 1.64 h vs 1.214
  s for UniMate (`:340-365`, `:406-408`); a user study, 32 participants × 12 cases (`:409`, `:366-391`).
- **No human text-to-motion benchmark.** No HumanML3D number, no comparison with MDM, MoMask or MotionGPT. Those
  are named only as template-bound related work ("assumes a single fixed skeleton template, typically inherited
  from … SMPL … and SMAL", `:161`).
- Closest prior work, by its own account: AnyTop "is limited to a small animal corpus …, requires motion data of
  the target skeleton at inference to estimate its normalization statistics, and offers no text conditioning"
  (`:165`).

## Its limits, by its own account

- Foot sliding, drift, hovering, ground penetration: "it imposes no unified contact model" (`:446-448`).
- "less reliable on rare skeletal topologies and out-of-distribution motions, where results can become static,
  jittery, or semantically inaccurate" (`:450-451`); the data "favor humanoids and common locomotion" (`:451`).
- Conditioning is only a rigged skeleton + text: no video, no exemplar clip, no "shape-only inputs (a mesh without
  an authored rig)" (`:1924`). No spatial control: a prompt "cannot precisely place a foot on a target" (`:1926`).

## The measurement worth keeping — Appendix E.5 (`:1898-1917`)

Foot sliding, measured without per-rig annotation:

- contact joints chosen automatically: "the distal-most joint of every limb chain whose canonical name contains a
  ground-contact term (Foot, Toe, Ball, Paw, Hoof, or Pastern)" (`:1899`);
- all lengths in units of the rest-pose root height `L`; ground = the horizontal plane through the lowest rest-pose
  joint; 30 FPS; near-ground when height `h < 0.05 L`; skating when the per-frame horizontal displacement
  `d > 0.025 L`. These are the 5 cm / 2.5 cm human-scale thresholds of Karunratanakul et al. 2023 (`:1901`);
- **Skate** = P(d > δs | h < δh). **Slide** = mean over near-ground frames of `d · (2 − 2^(h/δh))`, the
  height-weighted drift of Zhang et al. 2018, in 10⁻² L (`:1903`);
- **foot locking**: contact = `h < δh and d < δs`, median-filtered over 5 frames, segments under 3 frames dropped,
  each segment pinned to its mean ground position by damped-least-squares IK over the contact joint and up to three
  parents, blended in and out over 5 frames (`:1905`). Result: Skate 0.107 → 0.023, Slide 0.542 → 0.191 (`:1917`).
