# Licensing of this model set

**The files in this repository are not all under the same license.** This page is the index; the
two license texts are in `MIT_LICENSE.md` and `DINOV3_LICENSE.md`.

| File | License | Text | Upstream |
|---|---|---|---|
| `dinov3.gguf` | DINOv3 License | `DINOV3_LICENSE.md` | Meta — DINOv3 ViT-L/16 (lvd1689m) |
| `pixal3d-models.json` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `pixal3d_naf.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `pixal3d_shape_flow_1024_sv.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `pixal3d_shape_flow_512_sv.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `pixal3d_ss_flow_sv.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `pixal3d_tex_flow_1024_sv.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `shape_dec.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `ss_dec.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |
| `tex_dec.gguf` | MIT | `MIT_LICENSE.md` | Tencent Pixal3D / Microsoft TRELLIS.2 |

`README.md` and the license files themselves are MIT.

## What this means when you redistribute

- **`dinov3.gguf`** is a format conversion of Meta's DINOv3 ViT-L/16 and stays under the DINOv3
  License. §1.b.i of that Agreement requires that you redistribute it (or any derivative) **only
  under the terms of the same Agreement** and that you **ship a copy of the Agreement** with it.
  §1.b.ii requires acknowledging DINO Materials in research publications; §1.b.iii/§1.b.v impose
  Trade Control / ITAR restrictions and prohibit military, nuclear, espionage and weapons end uses;
  §1.b.iv prohibits reverse engineering.
- **Every other file** is MIT: keep the copyright notices and the permission notice from
  `MIT_LICENSE.md` with any copy or substantial portion.

The Hugging Face metadata on this repository therefore declares `license: other` with
`license_name: mit-and-dinov3` — a single SPDX identifier cannot express the split.
