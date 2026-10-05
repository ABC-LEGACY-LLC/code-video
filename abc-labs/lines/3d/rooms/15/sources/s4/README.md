---
library_name: pixal3d.cpp
license: other
license_name: mit-and-dinov3
license_link: LICENSE.md
pipeline_tag: image-to-3d
tags:
  - 3d-generation
  - gguf
  - webgpu
  - trellis
  - single-view
---

# Pixal3D model set `pixal3d-sv-q8_0` v1 (single-view)

GGUF weights for [`pixal3d.cpp`](https://github.com/raven38/pixal3d.cpp), a GGML-based C++
image→3D pipeline. This is the **single-view (SV) Web release set**: Q8_0 quantization, 9 files,
7.54 GiB. It is the one-image counterpart of the multiview set
[`raven38/pixal3d-q8_0-v1`](https://huggingface.co/raven38/pixal3d-q8_0-v1): the four flow
DiTs are the official Pixal3D **single-view** checkpoints, and the five shared models
(image encoder, NAF, three decoders) are byte-identical to the multiview set.

The repository layout is flat and the file names are exact, because the consuming client
verifies every file's `size_bytes` and SHA-256 against the committed manifest
`pixal3d-models.json` (`model_family: sv`) before the set is marked usable. The Web app never
substitutes multiview weights for a single image and never substitutes these weights for a
multiview run; the two families are selected only through their own manifests.

## Files

| file | role | size | shared with the MV set |
|---|---|---|---|
| `dinov3.gguf` | image encoder | 323,657,920 | yes (identical bytes) |
| `pixal3d_naf.gguf` | NAF | 1,334,656 | yes (identical bytes) |
| `pixal3d_ss_flow_sv.gguf` | sparse-structure flow (SV) | 1,426,559,744 | no |
| `ss_dec.gguf` | sparse-structure decoder | 147,379,392 | yes (identical bytes) |
| `pixal3d_shape_flow_512_sv.gguf` | shape flow 512 (SV) | 1,476,761,760 | no |
| `pixal3d_shape_flow_1024_sv.gguf` | shape flow 1024 (SV) | 1,476,761,760 | no |
| `shape_dec.gguf` | shape decoder | 881,361,568 | yes (identical bytes) |
| `pixal3d_tex_flow_1024_sv.gguf` | texture flow 1024 (SV) | 1,476,813,984 | no |
| `tex_dec.gguf` | texture decoder | 881,344,576 | yes (identical bytes) |

## Provenance

The four `*_sv.gguf` files were converted with `tools/convert.py` from the official
[TencentARC/Pixal3D](https://huggingface.co/TencentARC/Pixal3D) single-view checkpoints
`ckpts/ss_flow_img_dit_1_3B_64_bf16.safetensors`,
`ckpts/slat_flow_img2shape_dit_1_3B_512_bf16.safetensors`,
`ckpts/slat_flow_img2shape_dit_1_3B_1024_bf16.safetensors` and
`ckpts/slat_flow_imgshape2tex_dit_1_3B_1024_bf16.safetensors` (the variants **without** the
`_mv` suffix) to F16 GGUF, then quantized with `tools/quantize_gguf.py <src> <dst> Q8_0`.
The SV and MV checkpoints share the same config and tensor layout; only the trained values differ.

## Usage

Point the Pixal3D Web app at this repository as the **single-view** model source:

```
sv_manifest_url   = https://huggingface.co/raven38/pixal3d-sv-q8_0-v1/resolve/main/pixal3d-models.json
sv_model_base_url = https://huggingface.co/raven38/pixal3d-sv-q8_0-v1/resolve/main
```

(query parameters `?sv_manifest_url=…&sv_model_base_url=…`, or the deployment's injected
`PIXAL3D_SV_MODEL_*` values). For the native CLI, place the nine files in one directory and run
`trellis-cli` with `--pixal3d-weights sv` and a single `--views` entry. The client streams each
file into origin-owned storage and refuses the set unless every file matches the manifest exactly.

## Licensing — read before redistributing

**This repository contains files under two different licenses.** `LICENSE.md` is the
per-file index; the two license texts are `MIT_LICENSE.md` and `DINOV3_LICENSE.md`.

### `dinov3.gguf` — DINOv3 License (not MIT)

`dinov3.gguf` is a format conversion of Meta's
[DINOv3 ViT-L/16 (lvd1689m)](https://huggingface.co/facebook/dinov3-vitl16-pretrain-lvd1689m)
and remains governed by the **DINOv3 License**, a copy of which is included in this
repository as `DINOV3_LICENSE.md`.

The DINOv3 License grants the right to "use, reproduce, distribute, copy, create derivative
works of, and make modifications to the DINO Materials" (§1.a), and this conversion is
distributed under that grant. If you redistribute `dinov3.gguf` or any derivative of it,
§1.b.i requires that you do so **only under the terms of that same Agreement** and that you
**provide a copy of the Agreement** alongside it. §1.b.ii requires acknowledging DINO
Materials in research publications. §1.b.iii and §1.b.v impose Trade Control / ITAR
restrictions and prohibit military, nuclear, espionage and weapons end uses. §1.b.iv
prohibits reverse engineering the materials.

### All other files — MIT

The remaining files derive from the [TRELLIS.2](https://huggingface.co/microsoft/TRELLIS.2-4B)
backbone (MIT, © Microsoft Corporation) and from [Pixal3D](https://github.com/TencentARC/Pixal3D)
training on top of it (MIT, © 2026 Tencent). Both copyright notices and the MIT permission
notice are reproduced in `MIT_LICENSE.md`, which you must keep when redistributing them.
The `pixal3d.cpp` runtime is MIT as well.

## Contents of the weights

The GGUF metadata in every file consists of `general.architecture`, `general.name` and, for
eight of the nine, a `trellis.config_json` holding model hyperparameters. No file paths,
usernames, hostnames, timestamps or contact information are embedded.
