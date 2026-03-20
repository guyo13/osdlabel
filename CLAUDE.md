# CLAUDE.md — Project Instructions for Claude Code

## Project Overview

This is `osdlabel`, a DZI image annotation library built with SolidJS, Fabric.js v7, OpenSeaDragon, and TypeScript. Read `image-annotator-spec.md` for the full specification. Read the task files in `tasks/` sequentially — each task builds on the previous one.

## Critical Rules

### TypeScript

- **Never use `any`.** Use `unknown` with type guards, or a specific type. If you find yourself reaching for `any`, stop and define a proper type.
- Always use `const` assertions for literal types: `as const`.
- Prefer `readonly` properties on interfaces. All annotation data types must be immutable. **Exception:** SolidJS store shape interfaces (`AnnotationState`, `UIState`, `ContextState`) omit `readonly` because SolidJS enforces immutability at runtime via store proxies, and `readonly` conflicts with SolidJS's `SetStoreFunction` path-based API.
- Use branded types for IDs (`AnnotationId`, `ImageId`, `AnnotationContextId`) — never pass raw strings where branded types are expected.
- Use discriminated unions (not type assertions) for geometry types. Always check `geometry.type` before accessing geometry-specific fields.
- Run `pnpm typecheck` after every file change. Fix all type errors before proceeding.

### SolidJS

- **Components run once.** Do not write SolidJS components as if they re-render like React. The JSX function body executes once to set up the view. Reactive updates happen through signals and effects.
- **Use `onMount` for imperative library initialization** (OSD viewer, Fabric canvas). Clean up with `onCleanup`. Never create OSD/Fabric instances inside `createMemo` or derived computations.
- **Use `createEffect` to synchronize imperative libraries with reactive state.** When the active tool signal changes, update the Fabric canvas interaction mode inside a `createEffect`. Do NOT re-render the component tree.
- **Do not destructure props.** In Solid, destructuring props breaks reactivity. Access props with `props.myProp` inside JSX or effects.
- **Use `createStore` with `produce` for nested state updates.** This is Solid's equivalent of Immer — it provides immutable-style update semantics with fine-grained tracking.

### Fabric.js v7

- **Import from `'fabric'` directly.** v7 uses named exports: `import { Canvas, Rect, Circle } from 'fabric'`. There is no `fabric.` namespace.
- **Do NOT use `fabric.Canvas` in detached/offscreen mode.** The canvas must be attached to a visible DOM `<canvas>` element for event handling to work.
- **`viewportTransform` is a 6-element array** `[scaleX, skewY, skewX, scaleY, translateX, translateY]`. Use `canvas.setViewportTransform(matrix)` to update it. After setting it, call `canvas.requestRenderAll()`.
- **Fabric objects use image-space coordinates.** Store annotation geometry in image-space and use the overlay's `viewportTransform` to map to screen-space. Do not convert coordinates on each object — that's what the canvas transform does.
- **`canvas.getZoom()` assumes `viewportTransform[0]` is the zoom level**, which is only true for scale+translate matrices. With rotation, `vpt[0] = cos(θ)·scale` — zero at 90°, negative at 180°. This breaks object caching. Override with `Math.sqrt(vpt[0]² + vpt[1]²)`.
- **Set `skipOffscreen: false`** when the viewportTransform includes rotation. Fabric's offscreen culling doesn't account for rotation and incorrectly hides visible objects.
- **All Fabric API calls must go through the overlay interface** (`FabricOverlay`). Components should never import from `'fabric'` directly or access the Fabric canvas instance except through the overlay.

### OpenSeaDragon

- **OSD `viewportTransform` is NOT the same as Fabric's.** OSD uses its own coordinate system where image width maps to 0–1 in viewport coordinates. Use `viewer.viewport.viewportToImageCoordinates()` and `viewer.viewport.imageToViewerElementCoordinates()` for conversions.
- **Subscribe to `'animation'` event for smooth overlay sync**, not `'animation-finish'`. The `animation` event fires on every frame during pan/zoom animations.
- **Toggle mouse navigation** with `viewer.setMouseNavEnabled(boolean)`. Use this to switch between navigation mode (OSD handles input) and annotation mode (Fabric handles input).
- **Each OSD viewer must have a unique DOM container.** Never try to attach two OSD viewers to the same element.
- **`imageToViewerElementCoordinates` does NOT account for flip.** Flip is applied only in OSD's drawer rendering pipeline (`context.scale(-1,1)`). The Fabric viewportTransform must compose flip separately — see `computeViewportTransform`.
- **`viewport.setRotation(degrees)` uses spring animation by default.** Pass `immediately=true` to snap; otherwise `sync()` computes a matrix for an intermediate rotation angle.
- **For dev/testing, use OSD's `type: 'image'` tile source** with local images. This avoids needing a DZI tile server during development. The library should also support DZI for production.

### Architecture

The project is split into three packages with clear dependency boundaries:

- **`@osdlabel/annotation`** (`packages/annotation/`) — Pure annotation data model with zero external dependencies. Contains: branded ID types, geometry discriminated unions, annotation/context types, constants, serialization, data sanitization, context scoping, and ID utilities.
- **`@osdlabel/fabric-osd`** (`packages/fabric-osd/`) — Fabric.js + OpenSeaDragon integration layer, SolidJS-agnostic. Contains: FabricOverlay (canvas overlay + viewport transform), all annotation tools (rectangle, circle, line, point, path, free-hand-path, select), and Fabric object serialization utilities. Depends on `@osdlabel/annotation`, `fabric`, and `openseadragon`.
- **`osdlabel`** (`packages/osdlabel/`) — SolidJS annotator UI. Contains: reactive state stores, hooks, and components. Depends on `@osdlabel/annotation`, `@osdlabel/fabric-osd`, and `solid-js`.

Key architectural rules:
- **`@osdlabel/annotation` has zero framework dependencies.** No imports from `solid-js`, `fabric`, or `openseadragon`.
- **`@osdlabel/fabric-osd` is SolidJS-agnostic.** No imports from `solid-js`. Import annotation types from `@osdlabel/annotation`.
- **State mutations go through named action functions.** Never modify the store directly from components. All mutations are in `packages/osdlabel/src/state/actions.ts`.
- **One active cell at a time.** Only one grid cell can be in annotation mode at a time. All other cells display existing annotations in read-only mode.
- **Constraint enforcement is reactive.** Use Solid's `createMemo` to derive whether each tool is enabled/disabled from the current annotation counts and the active context's limits. The toolbar reads this derived state. Do not imperatively enable/disable tools.
- **All packages use lockstep versioning.** Run `pnpm run check-versions` to validate. CI enforces this.

### Testing

- Run `pnpm test` (Vitest) after implementing any core logic. Tests run across all 3 packages.
- Run `pnpm test:e2e` (Playwright) after implementing any UI interaction. For parallel worktree runs, use `PORT=5174 pnpm test:e2e` to avoid port conflicts (default: 5173).
- Write tests for the module you just built before moving to the next task.
- **For canvas E2E tests:** Use Playwright's `page.mouse.move()`, `page.mouse.down()`, `page.mouse.up()` for precise drawing simulation. Use `page.screenshot()` with `expect(screenshot).toMatchSnapshot()` for visual regression.

### File Conventions

- One exported entity per file where practical. Exceptions: closely related types can share a file.
- File names use kebab-case: `rectangle-tool.ts`, `annotation-store.ts`.
- Test files mirror source structure: `packages/annotation/src/types.ts` → `packages/annotation/tests/unit/types.test.ts`.
- All imports use explicit file extensions: `import { Foo } from './foo.js'` (required for ESM).
- Cross-package imports use the package name: `import type { Annotation } from '@osdlabel/annotation'`.

### Monorepo Structure

This is a pnpm workspace monorepo with Turborepo for task orchestration:

- `packages/annotation/` — `@osdlabel/annotation` (annotation data model, zero deps)
- `packages/fabric-osd/` — `@osdlabel/fabric-osd` (Fabric.js + OSD integration)
- `packages/osdlabel/` — `osdlabel` (SolidJS annotator UI)
- `apps/dev/` — the development app (`@osdlabel/dev`); source in `src/`, E2E tests in `tests/e2e/`
- `apps/docs/` — the documentation site (`@osdlabel/docs`); Astro + Starlight, deployed to GitHub Pages

### Library Entrypoints & Granularity

The library is split across multiple npm packages:

1. **`@osdlabel/annotation`** — Pure data model. `import { Annotation, createImageId, serialize } from '@osdlabel/annotation'`
2. **`@osdlabel/fabric-osd`** — Canvas integration. `import { FabricOverlay, computeViewportTransform } from '@osdlabel/fabric-osd'`
3. **`osdlabel`** — SolidJS UI. Re-exports everything from the above packages plus its own state/hooks/components.
   - Main barrel: `import { Annotator, serialize, FabricOverlay } from 'osdlabel'`
   - Sub-path barrels: `osdlabel/components`, `osdlabel/state`, `osdlabel/hooks`
   - Granular imports: `import { Annotator } from 'osdlabel/components/Annotator'`

The `osdlabel` package is built using **Vite in library mode** with `vite-plugin-solid`. The `@osdlabel/annotation` and `@osdlabel/fabric-osd` packages are built with plain `tsc`.

### Build Commands

Run from the workspace root — Turbo fans out to the correct packages:

```bash
pnpm dev            # Start Vite dev server (apps/dev) with HMR into library source
pnpm build          # Build all packages (annotation → fabric-osd → osdlabel)
pnpm typecheck      # Type-check all packages
pnpm test           # Run Vitest unit tests across all packages
pnpm test:e2e       # Run Playwright E2E tests in apps/dev/
pnpm lint           # Run ESLint across all packages
pnpm format         # Run Prettier across the workspace
pnpm check-versions # Validate lockstep package versions
pnpm docs:dev       # Start docs dev server (apps/docs)
pnpm docs:build     # Build docs site (generates LLM page first, then Astro build)
```

Per-package commands (run from within the package directory):

```bash
# packages/annotation/
pnpm build        # tsc -p tsconfig.build.json
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run

# packages/fabric-osd/
pnpm build        # tsc -p tsconfig.build.json
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run

# packages/osdlabel/
pnpm build        # vite build + tsc --emitDeclarationOnly
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm test:watch   # vitest (watch mode)

# apps/dev/
pnpm dev          # vite
pnpm test:e2e     # playwright test

# apps/docs/
pnpm dev          # astro dev
pnpm build        # generates LLM page + astro build
```

### Documentation Site (Astro/Starlight)

- **Use `legacy: { collections: true }` in `astro.config.mjs`.** The `docsLoader()` content layer API has issues with build-time content resolution in this monorepo setup. Legacy collections with `src/content/config.ts` (no loader, schema only) work reliably.
- **Branded ID types in docs examples:** Use `createAnnotationContextId()` factory functions instead of `as AnnotationContextId` casts — keeps examples consistent with the library's public API.
- **Adding new docs pages:** Create `.md` in `apps/docs/src/content/docs/` and add a sidebar entry in `apps/docs/astro.config.mjs`. Use `.md` for reference/prose, `.mdx` for guides needing interactive components.
- **LLM page:** Generated at build time by `scripts/generate-llm-page.js`. Also produces `public/llms.txt` for the llms.txt convention.

### Incremental Verification

After completing each task file, verify the acceptance criteria listed at the bottom of that task before proceeding to the next one. If a verification step fails, fix it before moving on — do not accumulate technical debt across tasks.

## Dependency Versions (pinned)

```
solid-js@1.9.11
fabric@7.1.0
openseadragon@5.0.1
typescript@5.7.3
vite@6.1.0
vitest@3.0.5
@playwright/test@1.50.1
vite-plugin-solid@2.11.0
```

## Quick Reference: Coordinate Systems

```
Image-space (pixels):     (0,0) top-left of full-res image, measured in pixels
OSD Viewport-space:       (0,0) top-left, image width = 1.0, y is aspect-ratio-dependent
Screen-space (CSS px):    (0,0) top-left of browser viewport
Fabric canvas-space:      Same as screen-space, but transformed by viewportTransform
```

The overlay's job is to compute the Fabric `viewportTransform` matrix that maps
image-space → screen-space, so that Fabric objects stored in image-space render
at the correct screen position at the current OSD zoom/pan.
