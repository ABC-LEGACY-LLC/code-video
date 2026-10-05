# s18 — adoin/Fish-Pool

Cloned by `../fetch-refs.sh` into `work/s18` (gitignored). Commit `4b39024386f2046a33cd84ae7efe80e32bfe4329`,
2026-09-22. Licence **MIT**. README copied to `README.upstream.md`.

- "A dependency-free interactive koi pond for the web. The water simulation, procedural pond
  shading, and koi rendering run directly in WebGL2; fish behavior and pointer hit-testing run in
  TypeScript." (`README.upstream.md:3`). The same CPU-behaviour / GPU-drawing split as the gist.
- `seed` option: "Repeatable fish placement and colors" (`:68`). On npm as `fish-pool-webgl`.
- Much heavier than the gist: "Twelve render targets separate ripple state, water surface,
  caustics, floor, relief, plants, fish, fish shadows, blur passes, and the final scene" (`:121`).
