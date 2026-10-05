# Code-Video -- code-built films: shared technique at the root, one folder per project

    Code-Video\
      setup.bat / setup.ps1   one-time setup (moves the existing environment here, installs what is missing, runs the first project)
      env\        installed ONCE, used by every project: venv\ (PyTorch CUDA, SAM 2), ckpt\ (model weights),
                  sam2_repo\, ct_repo\ (CoTracker3). Install / repair: env\setup_env.bat (bootstrap.py). ~3.5 GB.
      tools\      shared scripts (the mechanism). Each takes a project folder and writes into that folder's output\:
                    sam2_video.py -- SAM 2: propagates point / box / mask prompts across the frames, shot by shot
                    cotracker_video.py -- CoTracker3: tracks query points through the frames, job by job
                      (project: ct_jobs.json + ct_queries.npz + frame zips/folders; output\ct\<job>.npz, log.txt)
      Projects\   one folder per project: DATA + OUTPUT + a small run.bat that points at the root. No scripts, no installs.
        <name>\
          frames\         reference frames (PNG, sorted by name). PRIVATE: they stay on this computer, never in a repo
          prompts.json    {"shot": {"s1": [frame indices], ...}, "mark": {"R03": 2, ...},
                           "prompt": {"s1": {"<object>": [{"frame": i, "box": [x0,y0,x1,y1], "points": [[x,y]..], "labels": [1|0..]}
                                                         | {"frame": i, "mask": "<npz key>"}]}}}
          prompts.npz     mask prompts (bool [H, W]); keys are the "mask" values in prompts.json
          marks.json      (optional) human marks per frame tag -- drawn in yellow on the sheets
          run.bat         runs ..\..\tools\sam2_video.py with ..\..\env\venv on this folder
          output\         masks_A.npz, masks_B.npz, sheet_B_<object>.png, log.txt

Rule: nothing project-specific in env\ or tools\; nothing shared inside a project folder. A new project = Projects\<name>\
with frames + prompts + a copy of run.bat. No installation, no preparation.

run.bat looks for the environment in ..\..\env first, then in Documents\tungi-sam2 (the old location) as a fallback.

## In this repository

`tools/gpu/` is that folder's code: the setup, `env/bootstrap.py`, the two tools and a project
template (`Projects/_template/run.bat`). It runs on the laptop with the GPU (Windows, CUDA), not on
the studio's server. To use it, copy `tools/gpu/` to `Documents\Code-Video\` and run `setup.bat`.

Not in git, by rule: `env\` (venv, model weights, repositories — installed by the setup), and every
project's `frames\`, prompts, marks and `output\`. Those are taken from a reference clip, which is
someone else's work: they stay on the laptop, or on the server in the work's `private/` folder
(`studio/projects/<work>/private/`, ignored by git). A project folder that a work needs is kept
there, beside the data it was made from.
