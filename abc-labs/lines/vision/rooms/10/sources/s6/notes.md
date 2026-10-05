# s6 — HerdNet (github.com/Alexandre-Delplanque/HerdNet)

Read 2026-09-30 (README). Near-verbatim, through a fetch tool that summarises; the quoted strings are the page's.

- Licence, code: "HerdNet is available under the `MIT License` and is thus open source and freely available."
- Licence, weights: "CC BY-NC-SA-4.0 license and are available for academic research purposes only, no commercial use is permitted."
- What it does: detects and counts (point-based) African mammals in aerial imagery.
- Results as the README reports them:
  - Delplanque et al. (2022) dataset (buffalo, elephant, kob, topi, warthog, waterbuck): F1 83.5 %, MAE 1.9, RMSE 3.6
  - Ennedi 2019 (camel, donkey, sheep, goat): F1 73.6 %, MAE 6.1, RMSE 9.8

Bearing: an open counting model exists for livestock-sized animals from above; the code is free, the
trained weights are not for commercial use — a user would retrain on a licence-clean set such as [s7].
