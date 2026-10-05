# s15 — Surma, "Ditherpunk" (surma.dev/things/ditherpunk/)

Fetched to `page.html` / `page.txt` by `../fetch-refs.sh`. Line numbers are of `page.txt`.

- Ordered dithering with a **threshold map**: maps "can also be precomputed and reused, which makes
  the dithering process deterministic and parallelizable" (`page.txt:87`).
- **Bayer matrices** are defined recursively, level n from level n−1 (`:91-116`). The gist's
  `bayer2/4/8` (s12) is that recursion written per cell.
- **Blue noise** (void-and-cluster) as a less ordered threshold map, tiling seamlessly (`:138-148`).
- **Error diffusion** (Floyd–Steinberg and relatives) diffuses each pixel's error to its neighbours.
  "This makes the process inherently sequential" (`:150`), a poor fit for a fragment shader, where
  every pixel is computed alone.
- Dithering in **linear light** rather than sRGB-encoded values, so 50 % reads as a perceptual
  middle (`:34-54`).
