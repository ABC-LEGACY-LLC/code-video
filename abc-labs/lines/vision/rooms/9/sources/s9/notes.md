# s9 — huawei-bayerlab/marigold-v2, read at commit bf21e4ad9fb0ae1376bbfb2ec79e999802f19a85 (2026-09-29T17:59:47+02:00)

Cloned in the container: `labs room run 9 -- git clone --depth 50 https://github.com/huawei-bayerlab/marigold-v2 work/marigold-v2`
(`work/marigold-v2/` is git-ignored). `git log -1 --format="%H %cI"` gave the commit above; 15 commits since
"Initial release" (`git log --oneline`), no tags.

What the room takes from it (paths at that commit):

- `README.md:8-10` — authors and affiliations: EPFL, **HUAWEI Bayer Lab**, University of Bologna; Anton Obukhov
  "Project lead". Not ETH Zurich (Marigold V1 is ETH's: `README.md:434`, `NOTICE`).
- `README.md:25-31` — "a family of models and a cost-effective fine-tuning protocol that repurposes a
  pretrained diffusion transformer into single-step dense predictors"; "Fine-tuning takes less than a week on
  a single consumer GPU".
- `README.md:66-68` — inference needs about 17 GB of GPU memory at 1024² and 29 GB at 2048²; the DiT is
  quantized to 4 bit on load.
- `README.md:86-94` — all checkpoints share the frozen **Qwen-Image-Edit-2509** backbone; the default depth
  checkpoint `depth/Log-stage2` is "Stage 1 → Stage 2 (SinkLoss, VAE decoder fine-tuned). The paper model."
- `README.md:295-297` — "All released models were trained on a single 32 GB GPU with batch size 1. Stage 1 of
  the depth model (160k steps) takes about five days".
- `README.md:299` — depth trains on Hypersim and Virtual KITTI 2.
- `README.md:443-445` — "Code and models are released under the Apache License, Version 2.0 … Qwen-Image-Edit-2509
  and the datasets keep their own licenses." (`LICENSE:1-2`: Apache License 2.0.)
- `marigoldv2/loss/loss.py:18-24` — `_sinkhorn_log`, Sinkhorn–Knopp normalisation in log domain;
  `marigoldv2/loss/loss.py:27-29` — `class WindowMatchedL1Loss`, "Windowed L1 with K x K Sinkhorn 1-to-1
  matching" — this is the paper's SinkLoss. Its input is `pred [B, C, H, W]` (`loss.py:106-110`): one image.
- `marigoldv2/experiments/20260316_qwen_depth/training_relative_log_depth_config_stage2.yaml:19-21` —
  `window_size: 5`, `sinkhorn_iter: 5`, `sinkhorn_tau: 0.1`; `:121` wires `WindowMatchedL1Loss`.
- `marigoldv2/experiments/20260316_qwen_depth/network_graph.py:100` — the decoded output is taken as
  `decoded.sample[:, :, 0]  # drop temporal dim`: one frame in, one frame out.
- No video: `grep -rliI "video|temporal|frames" --include=*.py --include=*.md --include=*.yaml .` finds only
  that comment, a VAE config key and dataset path names (`manifest_transforms.py:385,436`, "/frames/rgb/").

So "Marigold V2's Sink Loss technique" [s1] is a real, published, per-image loss (5x5 blocks, Sinkhorn
matching) meant to sharpen edges; nothing in the repository is temporal. The temporal part of Breakdown's
model is Breakdown's own.
