# Fish Pool

A dependency-free interactive koi pond for the web. The water simulation, procedural pond shading, and koi rendering run directly in WebGL2; fish behavior and pointer hit-testing run in TypeScript.

The package does **not** depend on React, Next.js, Three.js, or a runtime framework. A lightweight Canvas 2D renderer is included as a fallback.

**Live demo:** <https://adoin.github.io/Fish-Pool/>

## Install

```bash
npm install fish-pool-webgl
```

## Quick start

Give the mount element an explicit size, then create the pond:

```html
<div id="pond" style="width: 720px; max-width: 100%; aspect-ratio: 3 / 2"></div>
```

```ts
import { FishPool } from "fish-pool-webgl";

const pond = new FishPool("#pond", {
  fishCount: 5,
  seed: 42069,
});

pond.addRipple(360, 240, { radius: 36, strength: 1.2 });
pond.dropPebble(); // chooses a free area and adds a persistent small stone

// When the view is permanently removed:
pond.destroy();
```

You can also provide an existing canvas:

```ts
const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const pond = new FishPool(canvas);
```

## Browser script

The package also ships an IIFE build. It exposes `FishPoolWebGL` on `window`:

```html
<script src="https://unpkg.com/fish-pool-webgl/dist/fish-pool.min.js"></script>
<script>
  const pond = new FishPoolWebGL.FishPool("#pond", { fishCount: 4 });
</script>
```

## API

### `new FishPool(target, options?)`

`target` can be a CSS selector, an `HTMLElement`, or an existing `HTMLCanvasElement`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fishCount` | `number` | `4` | Number of original koi, clamped to 1–4. |
| `pixelRatio` | `number` | `2` | Maximum device-pixel ratio. |
| `interactive` | `boolean` | `true` | Enables tap, click, and drag interaction. |
| `paused` | `boolean` | `false` | Creates the pond without starting its loop. |
| `seed` | `number` | `23847` | Repeatable fish placement and colors. |
| `ariaLabel` | `string` | descriptive label | Accessible canvas label. |
| `onFallback` | `(reason: string) => void` | — | Reports why Canvas 2D was selected. |

### Methods

- `start()` and `stop()` control the animation loop.
- `addRipple(x, y, options?)` injects a water impulse in CSS-pixel coordinates.
- `disturbWater(x, y)` runs the original strong water-tap effect and scares nearby fish.
- `dropPebble(options?)` chooses a free area by default, launches a small pebble from outside the pond through `airborne → sinking → settled`, triggers the full water disturbance on impact, and returns its state.
- `getPebbles()` returns immutable snapshots of dynamic pebble positions and states.
- `clearPebbles()` removes only dynamically added pebbles; the three original stones remain unchanged.
- `scareAt(x, y)` startles a fish under the given point and returns whether one was hit.
- `setFishCount(count)` replaces the school with 1–4 original koi.
- `resize()` manually refreshes sizing. A `ResizeObserver` already calls it automatically.
- `getStats()` returns renderer, size, density, fish count, and running state.
- `destroy()` releases observers, listeners, WebGL resources, and the owned canvas.

## Local demo

```bash
npm install
npm run dev
```

Open <http://localhost:4173>.

For a static demo build:

```bash
npm run build:demo
```

## Package build

```bash
npm run check
npm run build
npm pack --dry-run
```

Build outputs:

- `dist/index.js` — ESM
- `dist/index.cjs` — CommonJS
- `dist/fish-pool.min.js` — browser IIFE
- `dist/*.d.ts` — TypeScript declarations
- Source maps for the JavaScript builds

`prepublishOnly` runs type checking and the package build automatically before `npm publish`.

## How it works

- Twelve render targets separate ripple state, water surface, caustics, floor, relief, plants, fish, fish shadows, blur passes, and the final scene.
- The original two-band wave equation accepts drops, splashes, and directional body pushes with separate damping values.
- A 2px water grid refracts caustics across the floor and stones before the scene-composite and film-grain passes.
- Every koi is a dynamic 64 × 9 mesh driven by a 22-point spine and 160-point movement trail.
- The fish shader supplies staggered scales, four paired ray fins, a dorsal fin, a forked translucent tail, organic markings, gill shading, eye highlights, and water-driven specular light.
- The behavior layer preserves goal selection, body-segment avoidance, edge steering, fear propagation, fin folding, tail wakes, pectoral ripples, and centerline hit testing.
- `ResizeObserver`, `IntersectionObserver`, and the Page Visibility API limit unnecessary work.

The visual and interaction reference is the public koi demo on [shwn.design](https://www.shwn.design/). That demo does not load a reusable fish image, video, or 3D model—the koi are generated procedurally—so this package reconstructs the same shader techniques as maintainable source instead of hotlinking an asset or embedding the site's minified application bundle.

For an auditable comparison, the repository also includes:

- `reference/original-pond.compiled.js` — the formatted client module exactly as extracted from the current public bundle.
- `reference/original-pond-analysis.md` — readable identifier, render-pass, interaction, and network mappings.
- `scripts/extract-reference.mjs` and `scripts/generate-original-engine.mjs` — reproducible extraction and framework-removal scripts.

## Attribution

This project recreates the interactive koi pond originally published at [shwn.design](https://www.shwn.design/).

Project source: [github.com/adoin/Fish-Pool](https://github.com/adoin/Fish-Pool)

## Browser support

Modern browsers with WebGL2 receive the full renderer. Browsers without WebGL2 or floating-point color-buffer support automatically use the Canvas 2D fallback.

## License

MIT
