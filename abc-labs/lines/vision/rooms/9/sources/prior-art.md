# s16–s22: the open video-depth work and the film tools, as the room read them (2026-09-30)

Fetched by `sources/fetch-prior.sh` (READMEs, licence files, the two Nuke pages) and `work/grep_html.py`;
licence ids from `https://api.github.com/repos/<owner>/<repo>` (`license.spdx_id`). Line numbers are of the
files in `sources/s1x/` as fetched.

## [s16] RollingDepth — github.com/prs-eth/RollingDepth (ETH Zurich + CMU; Obukhov a co-author)
- `s16/README.md:1` "RollingDepth: Video Depth without Video Models", CVPR 2025; paper [s22].
- `s16/README.md:150` "This code of this work is licensed under the Apache License, Version 2.0";
  `:152` "The model is licensed under RAIL++-M License". `s16/LICENSE-MODEL.txt:1` "OpenRAIL++-M License";
  `:69` the use-restrictions attachment still reads "[insert use restrictions]". GitHub: Apache-2.0.
- `s16/README.md:96` `--snippet-lengths`: "number of frames to analyze in each snippet".

## [s22] the RollingDepth paper — arXiv 2411.19189 (`s22/abs.txt`)
- "naively applying a single-image depth estimator to every frame of a video disregards temporal continuity,
  which not only leads to flickering but may also break when camera motion causes sudden changes in depth range."
- "(i) a multi-frame depth estimator that is derived from a single-image LDM and maps very short video
  snippets (typically frame triplets) to depth snippets. (ii) a robust, optimization-based registration
  algorithm that optimally assembles depth snippets sampled at various different frame rates back into a
  consistent video." "able to efficiently handle long videos with hundreds of frames".

## [s17] DepthCrafter — github.com/Tencent/DepthCrafter
- `s17/README.md:43` "DepthCrafter can generate temporally consistent long-depth sequences with fine-grained
  details for open-world videos".
- `s17/LICENSE:10` "You agree to use the DepthCrafter only for academic, research and education purposes, and
  refrain from using it for any commercial or production purposes under any circumstances."
  `s17/README.md:36` business licensing by e-mail. GitHub: NOASSERTION.

## [s18] Video Depth Anything — github.com/DepthAnything/Video-Depth-Anything (ByteDance)
- `s18/README.md:19` "based on Depth Anything V2, which can be applied to arbitrarily long videos without
  compromising quality, consistency, or generalization ability".
- `s18/README.md:26` 2025-07-03: an experimental training-free streaming mode.
- `s18/README.md:176` "Video-Depth-Anything-Small model is under the Apache-2.0 license.
  Video-Depth-Anything-Base/Large model is under the CC-BY-NC-4.0 license." GitHub (code): Apache-2.0.
- This is the baseline the post's clips show beside "ours" (s12–s15 frames.md).

## [s19] FlashDepth — github.com/Eyeline-Labs/FlashDepth
- `s19/README.md:1` "FlashDepth: Real-time Streaming Video Depth Estimation at 2K Resolution"; `:7` ICCV 2025.
- `s19/README.md:59-63` the timing script over 100 frames at 2044x1148 printed "fps: 24.12".
- `s19/README.md:39` first stage trains from Depth Anything V2 checkpoints. GitHub (code): Apache-2.0.
  The weights' licence was not checked.

## [s20] Nuke ZDefocus — learn.foundry.com (`s20/page.txt`)
- "Blurs the image according to a depth map channel. This allows you to simulate depth-of-field (DOF) blurring."

## [s21] Nuke, applying blurs (`s21/page.txt`)
- "Note that the depth map should not be anti-aliased. If it is, pixels along an edge between two objects can
  be assigned a depth that is in-between the depth of the front object and back objects."
