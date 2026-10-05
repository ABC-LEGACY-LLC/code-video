---
base_model: Qwen/Qwen-Image-Edit-2509
language:
- en
license: apache-2.0
pipeline_tag: depth-estimation
tags:
- monocular-depth-estimation
- surface-normal-estimation
- albedo-estimation
- dense-prediction
- diffusion-transformer
- qwen-image-edit
- lora
---

<div align="center">
<h1 style="margin: 0;">Marigold V2</h1>
<h3 style="margin: 6px 0 0;">Revisiting Diffusion Transformers for Monocular Depth Estimation</h3>
</div>

<div align="center" style="line-height: 1.4; margin-top: 14px;">
  ACM Transactions on Graphics (SIGGRAPH Asia 2026)<br><br>
  Igor Pavlovic<sup>1,2,*,†</sup>, Thiemo Wandel<sup>2,*</sup>, Anton Obukhov<sup>2,§</sup><br>
  Luca Bartolomei<sup>3</sup>, Andrey Davydov<sup>2</sup>, Fabio Tosi<sup>3</sup>, Matteo Poggi<sup>3</sup>, Sabine Süsstrunk<sup>1</sup>, Dengxin Dai<sup>2</sup><br><br>
  <sup>1</sup>EPFL · <sup>2</sup>HUAWEI Bayer Lab · <sup>3</sup>University of Bologna<br>
  <sup>*</sup>Equal contribution · <sup>†</sup>Internship · <sup>§</sup>Project lead
</div>

<div align="center" style="line-height: 1; margin: 18px 0;">
  <a href="https://hf.co/spaces/huawei-bayerlab/marigold-v2-web" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/website.svg" alt="Project website" style="display: inline-block; vertical-align: middle; margin: 0;"></a>
  <a href="https://arxiv.org/abs/2609.08084" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/paper.svg" alt="Paper" style="display: inline-block; vertical-align: middle; margin: 0;"></a>
  <a href="https://huggingface.co/spaces/toshas/Marigold-V2" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/demo.svg" alt="Demo" style="display: inline-block; vertical-align: middle; margin: 0;"></a>
  <a href="https://github.com/huawei-bayerlab/marigold-v2" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/code.svg" alt="Code" style="display: inline-block; vertical-align: middle; margin: 0;"></a>
  <a href="https://twitter.com/antonobukhov1" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/follow.svg" alt="Follow" style="display: inline-block; vertical-align: middle; margin: 0;"></a>
</div>

<hr style="margin: 18px 0 20px;">

## News

2026-12: To appear in ACM Transactions on Graphics 45(6) and to be presented at
SIGGRAPH Asia 2026.<br>
2026-09-13: Mirrored on ModelScope: <a href="https://www.modelscope.cn/studios/huawei-bayerlab/marigold-v2-web" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/modelscope-website.svg" style="display: inline-block; vertical-align: middle; margin: 0; height: 17px;" alt="ModelScope website"></a> <a href="https://www.modelscope.cn/models/huawei-bayerlab/marigold-v2-0" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/modelscope-model.svg" style="display: inline-block; vertical-align: middle; margin: 0; height: 17px;" alt="ModelScope model"></a> <a href="https://www.modelscope.cn/studios/huawei-bayerlab/Marigold-V2" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 2px;"><img src="assets/shields/modelscope-demo.svg" style="display: inline-block; vertical-align: middle; margin: 0; height: 17px;" alt="ModelScope demo"></a><br>
2026-09-08: Initial release: inference, evaluation, and training code, the released
checkpoints, and the demo.<br>

## Usage

Inference, evaluation, and training code lives in the
[GitHub repository](https://github.com/huawei-bayerlab/marigold-v2), which
downloads this repository and the base model into its `assets/` folder:

```bash
git clone https://github.com/huawei-bayerlab/marigold-v2.git && cd marigold-v2
bash setup/setup_env.sh && conda activate marigold-v2
python scripts/download_assets.py --skip-datasets
python scripts/infer.py --modality depth --image_dir /path/to/images --output_dir output/depth
python scripts/infer.py --checkpoint assets/checkpoints/Marigold-V2/depth/Log-layered --image_dir ...   # any checkpoint below
```

Inference needs about 17 GB of GPU memory at 1024² and 29 GB at 2048², so a
24 GB card covers 1024² and 2048² needs 32 GB. Outputs are
affine-invariant, i.e. depth up to an unknown scale and shift per image.

## Checkpoints

| Path | Output | Training |
|---|---|---|
| `depth/Log-stage2` | affine-invariant log depth | Stage 1 → Stage 2 (SinkLoss, VAE decoder fine-tuned). The paper model; default in the code. |
| `depth/Log-stage1` | affine-invariant log depth | Stage 1 only: latent MSE + L1 + gradient + iREPA. Initialization for Stage 2 and the layered variant. |
| `depth/Log-layered` | see-through log depth | `Log-stage1` fine-tuned with SinkLoss on layer 8 of LayeredDepth-Syn; predicts geometry behind glass. |
| `depth/Uniform-base` | affine-invariant linear depth (Marigold V1 style) | Stage 1 recipe, 30k steps. Parameterization ablation. |
| `depth/Disparity-base` | affine-invariant inverse depth | Stage 1 recipe with VAE decoder fine-tuning, 30k steps. Parameterization ablation. |
| `depth/Disparity-layered` | see-through inverse depth | Stage 1 recipe on layer 8 of LayeredDepth-Syn. |
| `depth/Uniform-layered` | see-through linear depth | LayeredDepth-Syn variant of `Uniform-base`. |
| `normals` | camera-space unit normals | angular loss + iREPA + SinkLoss, VAE decoder fine-tuned. |
| `albedo` | linear RGB albedo in [0, 1] | L1 + iREPA, VAE decoder fine-tuned. |

Log and linear depth increase with distance, disparity decreases. Each folder
holds one `trainables.safetensors` with keys `<component>.<parameter>`
(`Diffuser.*` LoRA weights, `VAE.*` decoder weights when present).
`qwen_text_embeddings/` contains the precomputed prompt embeddings and masks
per modality (`<prefix>_prompt_embeds.pt`, `<prefix>_prompt_mask.pt`), so the
text encoder of the base model is never needed. `manifest.json` lists sizes and
SHA-256 checksums of all files.

## Results

Zero-shot depth with the Pixel-Perfect Depth protocol, `depth/Log-stage2`,
AbsRel ↓ / δ1 ↑ in percent:

| NYUv2 | KITTI | ETH3D | ScanNet | DIODE |
|---|---|---|---|---|
| 3.6 / 98.0 | 5.4 / 97.4 | 2.8 / 99.2 | 3.7 / 97.9 | 5.2 / 97.1 |

Surface normals, `normals`, mean angular error ↓ / % within 11.25° ↑:

| NYUv2 | ScanNet | iBims-1 | Sintel |
|---|---|---|---|
| 16.6 / 61.2 | 14.1 / 67.4 | 15.9 / 70.9 | 28.7 / 27.6 |

Albedo on the Hypersim test split, `albedo`: PSNR 20.78, SSIM 0.811, LPIPS 0.195.

## Training data

Depth: Hypersim and Virtual KITTI 2 (about 74k images, as repackaged for
Marigold V1). See-through depth: LayeredDepth-Syn. Normals and albedo:
Hypersim. All released models were trained on a single 32 GB GPU.

## Citation

```bibtex
@article{pavlovic2026marigoldv2,
    author = {Pavlovic, Igor and Wandel, Thiemo and Obukhov, Anton and Bartolomei, Luca and Davydov, Andrey and Tosi, Fabio and Poggi, Matteo and S{\"u}sstrunk, Sabine and Dai, Dengxin},
    title = {Marigold V2: Revisiting Diffusion Transformers for Monocular Depth Estimation},
    year = {2026},
    issue_date = {December 2026},
    publisher = {Association for Computing Machinery},
    volume = {45},
    number = {6},
    url = {https://doi.org/10.1145/3842528},
    doi = {10.1145/3842528},
    journal = {ACM Trans. Graph.},
    month = dec,
    articleno = {204},
    numpages = {14}
}
```

## License

The weights in this repository are released under the Apache License,
Version 2.0 (see [LICENSE](LICENSE)). The base model Qwen-Image-Edit-2509 keeps
its own license.