# s17 — paper-design/shaders

Cloned by `../fetch-refs.sh` into `work/s17` (gitignored). Commit `43cd68db79fa0b1759f72ffc941b3238e2a3954c`,
2026-09-17 (`commit.txt`). Licence **Apache-2.0** (`license.txt`; `packages/shaders/package.json`
`"license": "Apache-2.0"`, `"version": "0.0.81"`).

- `packages/shaders/src/shaders/dithering.ts:9` "Animated 2-color dithering over multiple pattern
  sources". Dithering types: `1 = random, 2 = 2x2 Bayer, 3 = 4x4 Bayer, 4 = 8x8 Bayer` (`:32`), and a
  `u_pxSize` "Pixel size of dithering grid" (`:33`). The grid is computed "from gl_FragCoord before
  any transforms", so the cell stays "in consistent actual pixels" (`:11-13`): the same screen-space,
  CSS-sized cell as the gist's `pixel × uPixelRatio`.
- `packages/shaders/src/shaders/image-dithering.ts`: the same over an image.
- Vanilla and React packages (`packages/shaders`, `packages/shaders-react`).

The gist's dither is what this library has published openly under Apache-2.0. Neither is new.
