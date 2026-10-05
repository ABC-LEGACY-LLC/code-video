---
license: mit
language:
- en
library_name: pytorch
datasets:
- Linzhan/UniML3D
tags:
- motion-generation
- text-to-motion
- character-animation
- skeletal-animation
- flow-matching
- unimate
- arxiv:2609.05415
---

# UniMate

**One Unified Model to Animate Diverse Skeletons** (SIGGRAPH Asia 2026)

[Project Page](https://linzhanmou.com/unimate/) · [Paper](https://arxiv.org/abs/2609.05415) · [Video](https://youtu.be/xbndC-dEuVw) · [Code](https://github.com/Friedrich-M/UniMate) · [Dataset](https://huggingface.co/datasets/Linzhan/UniML3D) · [Interactive Demo](https://linzhanmou.com/unimate/interactive.html)

![UniMate teaser](teaser.png)

Pretrained checkpoints for UniMate, a text-conditioned flow-matching model that generates motion for skeletons of arbitrary topology: animals, humanoids and rigged objects.

## Models

| Model | Architecture | Training data | Joints | Steps | Params¹ | Status |
|---|---|---|---|---|---|---|
| [`unimate_uniml3d_f60_v2`](unimate_uniml3d_f60_v2) | graph attention, AdaLN text | UniML3D [`faaa817`](https://huggingface.co/datasets/Linzhan/UniML3D/tree/faaa81773b315247b03f183548e3898dbec2ce80) (2026-09-27) | 5–70 | 100k | 74.1M | **Recommended** |
| [`unimate_uniml3d_f60_v2_full_cross_attn`](unimate_uniml3d_f60_v2_full_cross_attn) | full attention, cross-attention text | UniML3D `faaa817` (2026-09-27) | 5–70 | 100k | 66.2M | Variant |
| [`unimate_uniml3d_f60_preview`](unimate_uniml3d_f60_preview) | graph attention, AdaLN text | UniML3D, pre-release build | 5–60 | 120k | 74.1M | Superseded |

¹ Denoiser only. The frozen `google/flan-t5-base` text encoder is downloaded from the Hub on first use.

Use each model's final checkpoint, `checkpoints/checkpoint_step_<steps>.pt`.

**v2 versus preview.** Raising the joint limit from 60 to 70 keeps 98.1% of the training clips instead of 86.9%, and 70 of the 74 Truebones species. Datasets are balanced before object types (`sampler_dataset_alpha = 0.25`), so Truebones, Mixamo and Objaverse-XL make up about 13%, 24% and 63% of the training samples; the single Mixamo rig previously got under 1%.

## Model details

| | |
|---|---|
| **Architecture** | Transformer denoiser, 10 layers, width 512, 8 heads; flow matching with a linear path and velocity prediction |
| **Inputs** | English motion description; the target skeleton's T-pose, joint hierarchy and joint names |
| **Output** | 60 frames at 30 fps, 12 features per joint: 3-D position, 6-D rotation relative to the T-pose, 3-D velocity. The root joint encodes height, facing and planar velocity instead |
| **Text encoder** | `google/flan-t5-base`, frozen |
| **Guidance** | Classifier-free guidance on the caption: 10% caption dropout in training, default scale 3.0 |

## Quick start

Run every command from the root of the [code repository](https://github.com/Friedrich-M/UniMate), with its `unimate` environment installed.

**1. Build the dataset features.** The sampler reads each target skeleton from `dataset/features/<dataset>/`. The Hub dataset ships the stage 1-3 export but not these stage-4 features, so build them from the revision the model was trained on:

```bash
hf download Linzhan/UniML3D --repo-type dataset \
    --revision faaa81773b315247b03f183548e3898dbec2ce80 --local-dir dataset
bash data_process/scripts/run_extract_features.sh truebones   # likewise mixamo, objaverse
```

The Truebones motions come from a commercial pack and are not on the Hub; the dataset card explains how to rebuild them.

**2. Download a model.** This fetches the configuration, normalization statistics and final checkpoint of the recommended model:

```bash
hf download Linzhan/UniMate \
    --include "unimate_uniml3d_f60_v2/*.json" "unimate_uniml3d_f60_v2/*.npy" \
              "unimate_uniml3d_f60_v2/checkpoints/checkpoint_step_100000.pt" \
    --local-dir outputs
```

**3. Generate motion from text.** Write the prompts to `test_cases.json` with keys `<object_type>-<case_id>`. `object_type` is a skeleton in `dataset/features/`: a Truebones species, `mixamo`, or an Objaverse-XL object ID. `case_id` is a free-form tag that names the output files.

```json
{
  "Horse-0": "An object rears up on its hind legs.",
  "mixamo-0": "An object jumps in place with both arms raised.",
  "144367de23534c28ad2e83fc8abbd9ea-0": "An object flaps its wings."
}
```

```bash
python -m unimate.inference.sample \
    --exp_dir outputs/unimate_uniml3d_f60_v2 \
    --test_cases_json test_cases.json \
    --num_repetitions 3
```

The sampler loads the EMA weights of the latest checkpoint in `checkpoints/`. It writes the motions (`.npy`, shape `(60, J, 12)` for a skeleton with `J` joints) and skeleton renders (`.mp4`) to `outputs/unimate_uniml3d_f60_v2/samples/`. In-betweening, joint-level editing, motion expansion and driving a rigged mesh are documented in the code README.

## Training

| | |
|---|---|
| **Optimizer** | AdamW, learning rate 1e-4, betas (0.9, 0.99), weight decay 1e-5, gradient clipping at 1.0 |
| **Schedule** | Linear warmup over the first 3% of steps, then cosine decay to 5% of the peak rate |
| **Loss** | Masked L2 flow-matching loss + 0.5 × geodesic rotation loss + 0.1 × velocity smoothness loss |
| **EMA** | Decay 0.9999; used at inference |
| **Batch size** | 16 per GPU |
| **Data** | 60-frame windows at 30 fps; joint addition, joint removal, pooling and perturbation augmentations |

| Model | Config (code repository) | GPUs | Training time |
|---|---|---|---|
| `unimate_uniml3d_f60_v2` | `configs/uniml3d_60frames_graph_adaln_v2.json` | 8× H100 | about 22 hours |
| `unimate_uniml3d_f60_v2_full_cross_attn` | `configs/uniml3d_60frames_full_cross_attn_v2.json` | 8× H100 | about 36 hours² |
| `unimate_uniml3d_f60_preview` | `configs/uniml3d_60frames_graph_adaln.json` | 6× H100 | about 23 hours |

² Resumed once from the step-60k checkpoint.

Resume from a released checkpoint, or train from scratch:

```bash
bash scripts/run_train.sh configs/uniml3d_60frames_graph_adaln_v2.json -- \
    --resume outputs/unimate_uniml3d_f60_v2/checkpoints/checkpoint_step_100000.pt

accelerate launch --num_processes 8 -m unimate.training.train \
    --config configs/uniml3d_60frames_graph_adaln_v2.json
```

## Repository layout

```
config.json                        index of the released models
LICENSE
<model>/
  config.json                      resolved training configuration; read by inference
  dataset_stats.npy                feature normalization statistics
  checkpoints/
    checkpoint_step_<N>.pt         model and EMA weights, optimizer and scheduler state; every 10k steps
  logs/                            TensorBoard curves, one event file per training job
  samples/
    step_<NNNNNN>/                 motions generated during training (step_000000: before training)
      <object_type>-<i>_fk.mp4     joints from forward kinematics of the predicted rotations
      <object_type>-<i>_ric.mp4    predicted joint positions
```

## Limitations

- **Clip length:** a sample is a fixed 60-frame window (2 seconds). Longer motion requires chaining samples with the expansion application.
- **Joint count:** the v2 models are trained on skeletons with at most 70 joints, which excludes four Truebones species (Bear, Centipede, Monkey, Dragon); the preview model's limit is 60. Skeletons with more than 71 joints (61 for the preview model) cannot be sampled.
- **New skeletons:** there is no skeleton-only input. A new rig must be converted into a feature directory with `data_process/scripts/run_preprocess_char.sh`, and needs at least one animation clip.
- **Text:** every training caption has the subject "An object"; the skeleton determines the character. Prompts should describe the motion only.

## License

The checkpoints and the UniMate code are released under the [MIT License](LICENSE). The training data remain under their source licenses: Adobe's Mixamo terms of use, the per-object licenses of Objaverse-XL, and the commercial [Truebones](https://truebones.com) ZOO license. Review these terms before using the models.

## Citation

```bibtex
@article{mou2026unimate,
  title   = {UniMate: One Unified Model to Animate Diverse Skeletons},
  author  = {Mou, Linzhan and Lei, Jiahui and Dou, Zhiyang and Cai, Chenyue and Song, Chaoyue and Finkelstein, Adam and Rusinkiewicz, Szymon},
  journal = {arXiv preprint arXiv:2609.05415},
  year    = {2026}
}
```
