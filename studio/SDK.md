# Renderer and component SDK — phase two

Phase two adds a reusable Canvas2D renderer, typed component descriptions, a shared
runtime interface and an isolated code preview. Open **Motion graphics · SDK** in
Works, select **Title card**, and edit its Title, Accent, Shape, Show particles or
Corner radius in the Inspector. The three shots form a 12-second example at 24 fps.
The **Add component** control creates another instance with a new stable ID.

The header's **Code preview** opens a temporary function editor. Render a frame,
change its number, or cancel the job. This is a preview tool; it does not commit
code to an existing project. Project creation is phase three, and the integrated
AI source-edit/review pipeline remains phase eight.

## Renderer registration

```js
import {createRendererRegistry} from './sdk/registry.mjs';
import {registerCanvas2D} from './renderers/canvas2d.mjs';
const registry = createRendererRegistry();
registerCanvas2D(registry);
const runtime = await registry.open('canvas2d', {
  canvas, project, components: {badge}, signal,
  onProgress: ({stage, progress, message}) => { /* update loading UI */ }
});
await runtime.renderFrame({frame: 36, quality: 'preview'});
runtime.dispose();
```

Registrations have an ID, exact version, SDK version, explicit capability flags and
audit channels. Duplicate IDs fail. `open()` resolves only after initialization;
loading/ready/failed progress, a readiness timeout and AbortSignal are supported.
Cancelled factories that eventually finish are disposed. Disposal is idempotent.
Factories must yield while loading; trusted synchronous JavaScript cannot be
interrupted by a timer on the same thread. Use the isolated renderer for external code.

| Runtime method | Contract |
|---|---|
| `renderFrame({frame,width,height,quality,signal})` | Await the requested integer frame and decoded resources; report frame and dimensions. Quality is preview/export/audit. |
| `audio({duration,sampleRate})` | Optional offline audio. Result has sampleRate, planar channels, numberOfFrames and startTime. The legacy adapter also retains sr/pcm compatibility. |
| `selection({id})` / `selection({x,y})` | Optional geometry for a stable entity ID or picking in normalized canvas coordinates. |
| `inspect()` | Current frame/clock and available audit channels. Unsupported depth/object-ID channels are not advertised. |
| `cancel()` | Invalidate pending work. The isolated adapter terminates its worker. |
| `dispose()` | Release media, component resources and runtime transport. |

The new Canvas2D runtime currently supports color, geometric selection and
inspection; it does not advertise audio. Existing films retain their sound through
the legacy page adapter. Studio scrubbing and frame-based browser export now call
that common adapter, including frame preparation and offline audio. Live-only pages
remain live-only. A Three.js renderer can register through the same interface in
phase seven; there is no managed 3D scene graph in this release.

## Adding a component without changing Studio core

See [badge.mjs](projects/sdk-motion/badge.mjs) and its
[project document](projects/sdk-motion/project.studio.json).

1. Create a component module containing `description`, synchronous `paint(inputs)`
   and optional `bounds(inputs)`, asynchronous `load({project,signal})` and `dispose()`.
2. Put the exact JSON description in `project.components[id]`. Pass the module in
   the renderer's `components` map. A version or schema mismatch fails readiness.
3. An entity uses `type: "layer2d"`, `component: id`, `layer.binding: id` and the
   component properties alongside the standard x/y/scale/rotation/opacity values.
   `addComponent` fills the defaults and creates a new layer through the shared store.
4. The existing Inspector, context API, CLI, transactions, Undo/Redo, lock and
   keyframe controls apply automatically. No film-ID branch is needed in core.

Properties support bounded numbers, boolean, six-digit color, bounded string and
enumeration. Only numbers animate in this version. Property names cannot override
the standard transforms or prototype keys. Schemas are data, never server-evaluated
JavaScript. The server validates an entire Human/AI operations batch before saving.
Revision conflicts, durable request receipts and project-history checks remain in effect.

Painters receive `{context,width,height,entity,properties,clock,random}`. Draw in
project coordinates; the composition applies camera and layer transforms, clipping
by visibility interval, opacity and layer order. Bounds are a centered rectangle
`{width,height}` in project coordinates, transformed to a normalized quadrilateral.
Picking currently uses its axis-aligned bounding box, not per-pixel object masks.
The output canvas can be scaled to export dimensions; this does not reflow layout.

`paint()` must finish synchronously. Await fonts, images or other resources in
`load()` before readiness. A Promise returned by paint is rejected. Existing imported
video layers use the composition's decoded-frame preparation before export.

Legacy named artwork and procedural voice validation live in
[components/legacy.mjs](components/legacy.mjs). Their original painters remain
owned by the film adapters; existing documents and stable IDs do not change.
This compatibility catalogue does not grow when a new described component is added.

## Time and reproducibility

[frameClock](sdk/clock.mjs) uses integer sequence frames and rational FPS. It returns
shot ID, local frame, sequence/local seconds and seed. Shot intervals are inclusive
at their start and exclusive at their end. `randomAt(seed,frame,stream,sample)` is a
stateless sample: seeking or changing layer order cannot advance a shared generator.
Canvas painters get a stream keyed by the entity ID. Use sample indexes instead of
wall time or persistent simulation state. Simulations requiring history need an
explicit replay/checkpoint adapter.

The Canvas renderer serializes frame requests and uses the same composition for
preview and export. Tests compare pixel equality across out-of-order seeks. They
do not establish cross-browser font/GPU identity. Arbitrary JavaScript that uses
other clocks, crypto randomness or external state is not certified deterministic.

## External code boundary

[isolated.mjs](sdk/isolated.mjs) registers `isolated-canvas2d`. The host creates a
sandboxed iframe with `allow-scripts` and without `allow-same-origin`. Its fixed
bridge receives messages through a private MessageChannel and creates a fresh
worker for each requested frame. User source is sent as data and executes only in
that worker; it is never interpolated into iframe HTML or evaluated by the server.

The bridge's CSP denies network, frames, media and external scripts. Blob workers
inherit that policy; see the browser documentation on
[worker CSP inheritance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#content_security_policy).
Only frame clock, bounded properties and dimensions enter the worker. Its response
is a size-checked ImageBitmap or a bounded error; there are no host RPC calls for
filesystem access, sessions, provider keys or project writes. Nested workers are disabled.

Default frame deadline is two seconds; configurable limits are 50–10000 ms, 100000
source characters, 32000 serialized property characters and two million output
pixels, with 2048 pixels per side. Timeout, Cancel and disposal terminate the worker.
Fresh workers prevent seek history from carrying into the next frame. Seeded random
samples and Math.random are reset per frame. Other nondeterministic APIs are not a
reproducibility guarantee.

These are browser isolation and execution limits, not an operating-system memory
quota. A pathological allocation may exhaust a browser process before a deadline.
Arbitrary browser-hostile code needs a separate process/container service before
being admitted as a production render backend. Existing installed work pages are
trusted same-origin code and are not relabelled isolated.

## Validation and release

Run `node --test studio/test/sdk.mjs studio/test/sdk-ui.mjs` and `make audit-studio`.
The SDK tests cover typed UI and AI edits, invalid schemas, stale writes, Undo,
readiness/cancel cleanup, out-of-order frames, actual encoded video reopened in the
browser, and hostile preview functions. Isolation probes must both fail inside the
worker and produce zero requests at the server. No final video is saved to the server.

The release baseline is recorded in `build/.phase2-baselines/`; validation evidence
and the release receipt are under `build/phase2/`. The runtime migration rebases only
history entries tied to the exact reviewed old source hash. It preserves project
data, generation, request receipts and both history stacks, retains unrelated source
guards, and refuses to overwrite a document changed since the baseline. Each rebase
has a byte-exact backup and receipt under `build/.migration-backups/sdk-1/`.

This example proves the phase-two extension contract. The full three-scenario
end-to-end acceptance in [acceptance/scenarios.json](acceptance/scenarios.json) remains
a later milestone; this phase does not claim the complete creator, audio/caption,
3D or integrated AI workflows have shipped.
