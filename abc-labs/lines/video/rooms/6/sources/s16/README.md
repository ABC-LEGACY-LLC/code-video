# s16 — Lucas Pope, Return of the Obra Dinn devlog, November 2017 (dukope.com/devlogs/obra-dinn/tig-32/)

Fetched to `page.html` / `page.txt` by `../fetch-refs.sh`. Line numbers are of `page.txt`.

- Obra Dinn renders greyscale and thresholds it to 1-bit in a post pass, using "an 8x8 bayer matrix
  for a smoother range of shades, and a 128x128 blue noise field for a less ordered output" (`:16`).
- A screen-space pattern with moving content "swims": "what is this warping shaking effect and how
  can I turn it off" (`:22`). The pattern should be "pinned" to the geometry. Correlating it only
  with the output means "each frame, moving scene elements threshold against different values"
  (`:26`).
- Tried: texel space (pinned, but aliases, `:28-33`); a cube, then a **sphere** around the camera,
  pinned under rotation but not translation (`:49-61`); thresholding at 2× and downsampling
  (`:61-70`). Result: "Discomfort from swimming dither is totally gone" (`:70`); "the screenspace
  mapping with offset works best at 1x and the sphere mapping works best at 2x" (`:77`). "100 hours"
  of work (`:76`).
