# s9–s12 — the open text-to-motion repositories the brief names

Fetched 2026-09-30 by `work/fetch-web.sh`: the GitHub API record (`repo.json`) and the README (`README.upstream.md`)
of each, both gitignored. Only metadata and README lines were read; no code was cloned or run. This note covers
all four; s10, s11 and s12 point here.

| id | repository | licence (API) | stars | last push | skeleton / data, from its README |
|---|---|---|---|---|---|
| s9 | GuyTevet/motion-diffusion-model (MDM) | MIT | 4,107 | 2025-10-01 | human text-to-motion; "MDM results on *HumanML3D*" (`README.upstream.md:21`); `prepare/download_smpl_files.sh` (`:156`); "CUDA capable GPU (one is enough)" (`:130`) |
| s10 | EricGuo5513/momask-codes (MoMask) | MIT | 1,320 | 2024-09-13 | human; HumanML3D and KIT (`:87-91`); "The WebUI demo … is now running smoothly on a CPU. No GPU is required to use MoMask." (`:17`) |
| s11 | OpenMotionLab/MotionGPT | MIT | 1,974 | 2025-07-01 | human; SMPL (`:78`), HumanML3D (`:146`); tasks t2m, m2t, prediction, in-between (`:198`) |
| s12 | Anytop2025/Anytop (AnyTop) | MIT | 456 | 2026-04-11 | any skeleton, Truebones only: "Download the full dataset from the official Truebones website" (`:46`); a guide for "in-the-wild skeletons from any source" with "some skeleton-specific adjustments" (`:61-62`); "CUDA capable GPU" (`:33`); no text conditioning, by UniMate's account ([s4] `paper.txt:165`) |

Stars and dates are from the API at fetch (`node -e` over each `repo.json` in the container).
