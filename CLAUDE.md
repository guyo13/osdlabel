# CLAUDE.md — Project Instructions for Claude Code

## Project Overview

This is `@guyo13/osdlabel`, a DZI image annotation library built with SolidJS, Fabric.js v7, OpenSeaDragon, and TypeScript. Read `image-annotator-spec.md` for the full specification. Read the task files in `tasks/` sequentially — each task builds on the previous one.

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
- **All Fabric API calls must go through the overlay interface** (`FabricOverlay`). Components should never import from `'fabric'` directly or access the Fabric canvas instance except through the overlay.

### OpenSeaDragon

- **OSD `viewportTransform` is NOT the same as Fabric's.** OSD uses its own coordinate system where image width maps to 0–1 in viewport coordinates. Use `viewer.viewport.viewportToImageCoordinates()` and `viewer.viewport.imageToViewerElementCoordinates()` for conversions.
- **Subscribe to `'animation'` event for smooth overlay sync**, not `'animation-finish'`. The `animation` event fires on every frame during pan/zoom animations.
- **Toggle mouse navigation** with `viewer.setMouseNavEnabled(boolean)`. Use this to switch between navigation mode (OSD handles input) and annotation mode (Fabric handles input).
- **Each OSD viewer must have a unique DOM container.** Never try to attach two OSD viewers to the same element.
- **For dev/testing, use OSD's `type: 'image'` tile source** with local images. This avoids needing a DZI tile server during development. The library should also support DZI for production.

### Architecture

- **Core logic is framework-agnostic.** Everything in `packages/osdlabel/src/core/` must have zero imports from `solid-js` or any UI framework. This includes the annotation model, serialization, constraints, coordinate transforms, and tool implementations.
- **State mutations go through named action functions.** Never modify the store directly from components. All mutations are in `packages/osdlabel/src/state/actions.ts`.
- **One active cell at a time.** Only one grid cell can be in annotation mode at a time. All other cells display existing annotations in read-only mode.
- **Constraint enforcement is reactive.** Use Solid's `createMemo` to derive whether each tool is enabled/disabled from the current annotation counts and the active context's limits. The toolbar reads this derived state. Do not imperatively enable/disable tools.

### Testing

- Run `pnpm test` (Vitest) after implementing any core logic.
- Run `pnpm test:e2e` (Playwright) after implementing any UI interaction.
- Write tests for the module you just built before moving to the next task.
- **For canvas E2E tests:** Use Playwright's `page.mouse.move()`, `page.mouse.down()`, `page.mouse.up()` for precise drawing simulation. Use `page.screenshot()` with `expect(screenshot).toMatchSnapshot()` for visual regression.

### File Conventions

- One exported entity per file where practical. Exceptions: closely related types can share a file.
- File names use kebab-case: `rectangle-tool.ts`, `annotation-store.ts`.
- Test files mirror source structure: `packages/osdlabel/src/core/annotations/model.ts` → `packages/osdlabel/tests/unit/annotations/model.test.ts`.
- All imports use explicit file extensions: `import { Foo } from './foo.js'` (required for ESM).

### Monorepo Structure

This is a pnpm workspace monorepo with Turborepo for task orchestration:

- `packages/osdlabel/` — the publishable `@guyo13/osdlabel` library (source: `src/`, unit tests: `tests/unit/`)
- `apps/dev/` — the development app (`@osdlabel/dev`); source in `src/`, E2E tests in `tests/e2e/`

### Build Commands

Run from the workspace root — Turbo fans out to the correct packages:

```bash
pnpm dev          # Start Vite dev server (apps/dev) with HMR into library source
pnpm build        # Build @guyo13/osdlabel with tsc → packages/osdlabel/dist/
pnpm typecheck    # Type-check all packages (builds osdlabel first for d.ts)
pnpm test         # Run Vitest unit tests in packages/osdlabel/
pnpm test:e2e     # Run Playwright E2E tests in apps/dev/
pnpm lint         # Run ESLint across all packages
pnpm format       # Run Prettier across the workspace
```

Per-package commands (run from within the package directory):

```bash
# packages/osdlabel/
pnpm build        # tsc -p tsconfig.build.json
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm test:watch   # vitest (watch mode)

# apps/dev/
pnpm dev          # vite
pnpm test:e2e     # playwright test
```

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
