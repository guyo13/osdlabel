# DZI Image Annotation Library — Technical Specification

**Version:** 1.0.0-draft
**Date:** 2026-02-14
**Status:** Pre-implementation specification

---

## 1. Executive Summary

This document specifies an image annotation and labelling library for Deep Zoom Image (DZI) content. The library enables freehand drawing of geometric annotations (circles, rectangles, lines, points, and paths) on high-resolution zoomable images, with full post-creation editing capabilities (selection, move, resize, rotate). It supports multi-image workflows with a configurable grid view, filmstrip navigation, and granular per-context tool/annotation constraints — designed primarily for medical imaging use cases such as annotating independent pathologies on a single radiograph.

The library is built with SolidJS, Fabric.js (v7+), OpenSeaDragon, and TypeScript under strict compiler settings, targeting ESM-only output.

---

## 2. Technology Stack

### 2.1 Core Dependencies

| Dependency        | Version                  | Purpose                                                                                 |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| **SolidJS**       | ^1.9.x (stable 1.x line) | UI framework — fine-grained reactivity for performant canvas-heavy rendering            |
| **Fabric.js**     | ^7.x                     | Canvas abstraction — annotation drawing, selection, manipulation (move, resize, rotate) |
| **OpenSeaDragon** | ^5.x (latest stable)     | DZI/tiled image viewer — pan, zoom, tile management                                     |
| **TypeScript**    | ^5.7+                    | Language — strict mode, ESNext target                                                   |
| **Vite**          | ^6.x                     | Dev server and SolidJS JSX compilation (dev only — not used for library build)          |

### 2.2 Build & Tooling

| Tool           | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| **pnpm**       | Package manager (latest stable)                            |
| **tsc**        | Library build — ESM-only output                            |
| **Vitest**     | Unit and integration testing                               |
| **Playwright** | End-to-end testing (canvas interaction, visual regression) |
| **ESLint**     | Linting (with `@typescript-eslint`)                        |
| **Prettier**   | Code formatting                                            |

### 2.3 Key Decisions & Rationale

**SolidJS over React:** The library manages multiple simultaneous OpenSeaDragon viewers, each with a Fabric.js canvas overlay that must stay synchronized during 60fps pan/zoom interactions. SolidJS's fine-grained reactivity (signals and effects) ensures that state changes update only the specific DOM nodes or side effects that depend on them, eliminating the wasteful reconciliation passes and memoization ceremony that React would require. Components run once to set up the view; subsequent updates are surgical.

**Fabric.js v7:** Annotations must be fully editable after creation (selectable, movable, resizable, rotatable). Fabric.js provides this interaction model out of the box. Version 7 is TypeScript-native with ES module imports, eliminating the need for `@types/fabric`. The existing `openseadragon-fabricjs-overlay` bridge libraries are pinned to Fabric v4/v5 and will not be used — a custom overlay integration layer will be implemented as part of this project (see §5).

**ESM-only output via tsc:** The library targets modern bundler-based consumers. A single `tsconfig.json` targeting `ESNext` module output simplifies the build. No bundler (tsup, Rollup, etc.) is used for the library itself — `tsc` emits `.js` + `.d.ts` files directly. Vite is used only for the dev server and Solid JSX transform during development.

**Playwright for E2E:** Canvas-based annotation interactions (drawing, dragging, resizing) require precise mouse coordinate simulation and pixel-level screenshot assertions. Playwright's out-of-process architecture provides direct control over pointer events at specific coordinates, built-in visual comparison APIs, and native parallel execution — all critical for testing canvas drawing tools reliably.

**Vitest for unit tests:** Shares Vite's transform pipeline (already required for SolidJS compilation), providing near-instant test startup and native TypeScript/JSX support without separate configuration.

---

## 3. Project Structure

```
image-annotator/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                  # Strict TS config, ESNext target/module
├── tsconfig.build.json            # Extends base, excludes tests/dev
├── vite.config.ts                 # Dev server + Solid JSX transform
├── vitest.config.ts               # Unit test config
├── playwright.config.ts           # E2E test config
├── src/
│   ├── index.ts                   # Public API barrel export
│   ├── core/                      # Framework-agnostic logic
│   │   ├── types.ts               # All shared type definitions
│   │   ├── constants.ts           # Default configs, limits
│   │   ├── annotations/
│   │   │   ├── model.ts           # Annotation data model & factory functions
│   │   │   ├── serialization.ts   # JSON serialize/deserialize
│   │   │   └── constraints.ts     # Tool availability & annotation limit enforcement
│   │   ├── coordinate-transform.ts # OSD viewport ↔ image-space ↔ Fabric canvas transforms
│   │   └── tools/
│   │       ├── base-tool.ts       # Abstract tool interface
│   │       ├── rectangle-tool.ts
│   │       ├── circle-tool.ts
│   │       ├── line-tool.ts
│   │       ├── point-tool.ts
│   │       ├── path-tool.ts
│   │       └── select-tool.ts     # Selection/manipulation tool
│   ├── overlay/
│   │   ├── fabric-overlay.ts      # Custom OSD ↔ Fabric.js integration layer
│   │   └── overlay-manager.ts     # Lifecycle management for multiple overlays
│   ├── state/
│   │   ├── annotation-store.ts    # SolidJS store for annotation state (per image)
│   │   ├── ui-store.ts            # UI state (active tool, active cell, grid config, etc.)
│   │   ├── context-store.ts       # Annotation context/profile state (constraints)
│   │   └── actions.ts             # State mutation functions (add, update, delete, undo)
│   ├── components/
│   │   ├── Annotator.tsx          # Top-level public component
│   │   ├── ViewerCell.tsx         # Single OSD + Fabric overlay unit
│   │   ├── GridView.tsx           # MxN grid layout of ViewerCells
│   │   ├── Filmstrip.tsx          # Thumbnail sidebar for image selection
│   │   ├── Toolbar.tsx            # Annotation tool selector (respects constraints)
│   │   └── StatusBar.tsx          # Active context info, annotation counts, limits
│   ├── hooks/
│   │   ├── useOpenSeaDragon.ts    # OSD viewer lifecycle (create, destroy, events)
│   │   ├── useFabricOverlay.ts    # Fabric canvas lifecycle, overlay sync
│   │   ├── useAnnotationTool.ts   # Active tool management, drawing mode
│   │   ├── useConstraints.ts      # Reactive constraint checking
│   │   └── useKeyboard.ts         # Keyboard shortcut bindings
│   └── utils/
│       ├── geometry.ts            # Geometric calculations (hit testing, bounds, etc.)
│       ├── id.ts                  # Annotation ID generation
│       └── deep-clone.ts          # Immutable state update helpers
├── tests/
│   ├── unit/                      # Vitest unit tests
│   │   ├── annotations/
│   │   ├── constraints/
│   │   ├── coordinate-transform/
│   │   └── state/
│   └── e2e/                       # Playwright E2E tests
│       ├── drawing.spec.ts
│       ├── editing.spec.ts
│       ├── grid-view.spec.ts
│       ├── filmstrip.spec.ts
│       ├── constraints.spec.ts
│       └── keyboard.spec.ts
├── dev/                           # Development app (not published)
│   ├── index.html
│   ├── App.tsx                    # Demo app exercising all features
│   └── sample-data/              # Sample DZI sources for development
└── docs/
    ├── API.md                     # Public API reference
    ├── ARCHITECTURE.md            # Internal architecture guide
    └── CONSTRAINTS.md             # Constraint system documentation
```

### 3.1 TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve", // Solid JSX — transformed by Vite/babel plugin
    "jsxImportSource": "solid-js",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "dev"],
}
```

### 3.2 Package Exports

```jsonc
// package.json (relevant fields)
{
  "name": "@guyo13/osdlabel",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js",
    },
  },
  "files": ["dist"],
  "sideEffects": false,
  "peerDependencies": {
    "solid-js": "^1.9.0",
  },
  "dependencies": {
    "fabric": "^7.0.0",
    "openseadragon": "^5.0.0",
  },
}
```

---

## 4. Annotation Data Model

### 4.1 Core Types

All coordinates are stored in **image-space** (pixels relative to the full-resolution source image), making annotations zoom/pan-independent and portable across viewer configurations.

```typescript
/** Unique annotation identifier */
type AnnotationId = string & { readonly __brand: unique symbol };

/** Unique image identifier */
type ImageId = string & { readonly __brand: unique symbol };

/** Supported annotation geometry types */
type AnnotationType = 'rectangle' | 'circle' | 'line' | 'point' | 'path';

/** 2D point in image-space coordinates */
interface Point {
  readonly x: number;
  readonly y: number;
}

/** Discriminated union of annotation geometries */
type Geometry =
  | {
      readonly type: 'rectangle';
      readonly origin: Point;
      readonly width: number;
      readonly height: number;
      readonly rotation: number;
    }
  | { readonly type: 'circle'; readonly center: Point; readonly radius: number }
  | { readonly type: 'line'; readonly start: Point; readonly end: Point }
  | { readonly type: 'point'; readonly position: Point }
  | { readonly type: 'path'; readonly points: readonly Point[]; readonly closed: boolean };

/** Visual styling for an annotation */
interface AnnotationStyle {
  readonly strokeColor: string;
  readonly strokeWidth: number;
  readonly fillColor: string;
  readonly fillOpacity: number;
  readonly opacity: number;
}

/** A single annotation entity */
interface Annotation {
  readonly id: AnnotationId;
  readonly imageId: ImageId;
  readonly contextId: AnnotationContextId;
  readonly geometry: Geometry;
  readonly style: AnnotationStyle;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}
```

### 4.2 Serialization Format

Annotations are serialized as a JSON document. The schema is custom but designed for clarity and direct mapping to/from Fabric.js objects.

```typescript
/** Top-level serialization envelope */
interface AnnotationDocument {
  readonly version: '1.0.0';
  readonly exportedAt: string; // ISO 8601
  readonly images: readonly ImageAnnotations[];
}

interface ImageAnnotations {
  readonly imageId: ImageId;
  readonly sourceUrl: string;
  readonly annotations: readonly Annotation[];
}
```

The serialization module provides `serialize(state) → AnnotationDocument` and `deserialize(doc) → state` with schema validation. A future `toW3CWebAnnotation()` adapter can be added as a non-breaking extension if interoperability with W3C-compliant systems is needed.

---

## 5. OSD–Fabric.js Overlay Integration

This is the most critical piece of custom engineering. Since existing overlay libraries are incompatible with Fabric.js v7, we implement our own.

### 5.1 Architecture

Each `ViewerCell` contains one OpenSeaDragon viewer and one Fabric.js `Canvas` instance. The Fabric canvas is positioned as an absolutely-positioned HTML element on top of the OSD canvas, matching its dimensions exactly.

```
┌─────────────────────────────┐
│ ViewerCell container (div)  │
│  ┌────────────────────────┐ │
│  │ OpenSeaDragon canvas   │ │  ← Renders tiled DZI image
│  │  ┌──────────────────┐  │ │
│  │  │ Fabric.js canvas │  │ │  ← Transparent overlay, renders annotations
│  │  └──────────────────┘  │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

### 5.2 Coordinate Synchronization

On every OSD viewport change event (`viewport-change`, `animation`, `zoom`, `pan`, `resize`):

1. Read the current OSD viewport-to-image transform (position, zoom, rotation).
2. Compute the corresponding CSS transform or Fabric canvas `viewportTransform` matrix that maps image-space coordinates to screen-space pixels.
3. Apply the transform to the Fabric canvas so that annotation objects (stored in image-space) render at the correct screen position.
4. Resize the Fabric canvas element to match the OSD container dimensions on resize.

The Fabric canvas `viewportTransform` is a 6-element affine matrix `[a, b, c, d, e, f]` equivalent to the CSS `matrix()` function. This is recomputed on every OSD viewport event.

### 5.3 Input Routing

A critical challenge is that both OSD and Fabric.js listen for pointer/mouse events on overlapping elements. The overlay uses an OSD `MouseTracker` attached to Fabric's container element to intercept events before OSD's inner tracker processes them. A re-entrancy guard prevents infinite recursion from synthetic events bubbling back up.

Two interaction modes:

- **Navigation mode** (default — no annotation tool active): The overlay's `MouseTracker` is disabled (`setTracking(false)`), so all pointer events fall through to OSD for pan/zoom. Fabric objects are non-interactive (`selectable = false`, `evented = false`).
- **Annotation mode** (a tool is active, or the user is selecting/editing annotations): The overlay's `MouseTracker` intercepts all pointer events, forwarding them to Fabric as synthetic `PointerEvent`s. OSD mouse navigation is disabled (`viewer.setMouseNavEnabled(false)`). Fabric handles both drawing new annotations and selecting/moving existing ones.
  - **Pan passthrough:** `Ctrl+drag` (or `Cmd+drag` on macOS) temporarily re-enables OSD mouse navigation for that gesture, allowing the user to pan without switching modes.
  - **Zoom passthrough:** `Ctrl+scroll` (or `Cmd+scroll` on macOS) manually invokes `viewport.zoomBy()` to zoom around the pointer position. Plain scroll is blocked to prevent page scrolling.

This is managed by the `setMode()` method, which toggles the tracker, Fabric interactivity, and OSD mouse navigation.

### 5.4 Module Interface

```typescript
type OverlayMode = 'navigation' | 'annotation';

class FabricOverlay {
  /** The Fabric.js Canvas instance */
  readonly canvas: fabric.Canvas;

  constructor(viewer: OpenSeadragon.Viewer, options?: OverlayOptions);

  /** Force a re-sync of the overlay transform with the current OSD viewport */
  sync(): void;

  /** Set the overlay interaction mode */
  setMode(mode: OverlayMode): void;

  /** Get the current overlay interaction mode */
  getMode(): OverlayMode;

  /** Convert a point from screen-space to image-space */
  screenToImage(screenPoint: Point): Point;

  /** Convert a point from image-space to screen-space */
  imageToScreen(imagePoint: Point): Point;

  /** Clean up all event listeners and DOM elements */
  destroy(): void;
}
```

---

## 6. Annotation Context & Constraint System

This is the mechanism for granular control over tool availability and annotation limits. The primary use case is medical imaging: annotating multiple independent pathologies on a single image, where each pathology has its own allowed tool set and per-tool annotation limits.

### 6.1 Concepts

An **AnnotationContext** (or "profile") defines the constraints for a particular annotation task. Multiple contexts can coexist for the same image. The consuming application controls which context is active.

```typescript
type AnnotationContextId = string & { readonly __brand: unique symbol };

interface ToolConstraint {
  /** Which annotation type this constraint applies to */
  readonly type: AnnotationType;
  /** Maximum number of annotations of this type allowed in this context. `undefined` = unlimited. */
  readonly maxCount?: number;
  /** Optional default style for annotations created with this tool in this context */
  readonly defaultStyle?: Partial<AnnotationStyle>;
}

interface AnnotationContext {
  readonly id: AnnotationContextId;
  /** Human-readable label (e.g., "Fracture", "Pneumothorax") */
  readonly label: string;
  /** Which tools are available and their limits */
  readonly tools: readonly ToolConstraint[];
  /** Optional metadata the consumer can attach */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

### 6.2 Enforcement Behavior

The constraint system is **reactive**: it computes derived state from the current annotation count per context per tool and the defined limits.

- When the active context's tool limit is reached, the corresponding tool button is **disabled** in the toolbar.
- If the currently active tool becomes disabled (because the user just drew the last allowed annotation), the active tool automatically switches to the **select tool**.
- When an annotation is **deleted**, the constraint is re-evaluated and the tool is re-enabled if the count drops below the limit.
- Tool constraints are checked **before** an annotation is committed to state — the drawing interaction is prevented, not rolled back.

### 6.3 Consumer API

```typescript
interface AnnotatorProps {
  /** DZI image sources */
  images: ImageSource[];

  /** Annotation contexts with tool/limit constraints */
  contexts: AnnotationContext[];

  /** ID of the currently active context (controlled by consumer) */
  activeContextId: AnnotationContextId;

  /** Existing annotations to load on mount */
  initialAnnotations?: Annotation[];

  /** Called whenever annotation state changes */
  onAnnotationsChange?: (annotations: Annotation[]) => void;

  /** Called when the active context's constraints change (tool enabled/disabled) */
  onConstraintChange?: (status: ConstraintStatus) => void;

  // ... other props (see §8)
}
```

### 6.4 Example: Multi-Pathology X-Ray Annotation

```tsx
const contexts: AnnotationContext[] = [
  {
    id: 'fracture' as AnnotationContextId,
    label: 'Fracture',
    tools: [
      { type: 'line', maxCount: 5 },
      { type: 'rectangle', maxCount: 3 },
      { type: 'point', maxCount: 10 },
    ],
  },
  {
    id: 'pneumothorax' as AnnotationContextId,
    label: 'Pneumothorax',
    tools: [
      { type: 'path', maxCount: 2 },
      { type: 'circle', maxCount: 1 },
    ],
  },
];

// Consumer switches contexts (e.g., via a dropdown):
const [activeCtx, setActiveCtx] = createSignal<AnnotationContextId>(
  'fracture' as AnnotationContextId,
);

<Annotator
  images={xrayImages}
  contexts={contexts}
  activeContextId={activeCtx()}
  onAnnotationsChange={(annotations) => saveToBackend(annotations)}
/>;
```

---

## 7. State Management

### 7.1 SolidJS Stores

State is managed using SolidJS's built-in `createStore` for nested reactive state, and `createSignal` for simple values. No external state library (Redux, Immer, etc.) is needed — Solid's store already provides immutable-style update semantics with fine-grained tracking via its `produce` utility (analogous to Immer but integrated with Solid's reactivity).

### 7.2 State Shape

```typescript
/** Root state for the annotation system */
interface AnnotationState {
  /** All annotations keyed by image ID, then by annotation ID */
  readonly byImage: Record<ImageId, Record<AnnotationId, Annotation>>;
}

interface UIState {
  /** Currently active annotation tool (null = navigation mode) */
  readonly activeTool: AnnotationType | 'select' | null;
  /** Currently active viewer cell in the grid (receives input) */
  readonly activeCellIndex: number;
  /** Grid dimensions */
  readonly gridColumns: number;
  readonly gridRows: number;
  /** Which image is assigned to each grid slot */
  readonly gridAssignments: Record<number, ImageId>;
  /** Currently selected annotation ID (if any) */
  readonly selectedAnnotationId: AnnotationId | null;
}
```

> **Implementation note:** The `readonly` modifiers on state container interfaces
> (`AnnotationState`, `UIState`, `ContextState`) are omitted in the actual implementation.
> SolidJS store proxies enforce immutability at runtime, and `readonly` conflicts with
> SolidJS's `SetStoreFunction` path-based setter API. Data model types (`Annotation`,
> `Geometry`, etc.) retain `readonly` for compile-time safety.

### 7.3 Mutation Functions

All state mutations go through named action functions that use `setStore` with `produce` for immutable update semantics:

```typescript
// Example action signatures
function addAnnotation(annotation: Annotation): void;
function updateAnnotation(id: AnnotationId, imageId: ImageId, patch: Partial<Annotation>): void;
function deleteAnnotation(id: AnnotationId, imageId: ImageId): void;
function setActiveTool(tool: AnnotationType | 'select' | null): void;
function assignImageToCell(cellIndex: number, imageId: ImageId): void;
```

### 7.4 External State Synchronization

The component is **controlled-ish**: the consumer provides `initialAnnotations` and `contexts` as props, and receives changes via callbacks (`onAnnotationsChange`). Internal state is the source of truth during interaction, but the consumer can load state on mount and react to changes.

The `onAnnotationsChange` callback fires on every committed mutation (not during in-progress drawing). It provides the full current annotation array, not a diff.

---

## 8. Component Architecture

### 8.1 Top-Level Component: `<Annotator>`

The single public component that consumers mount. All configuration is via props.

```typescript
interface ImageSource {
  /** Unique identifier for this image */
  readonly id: ImageId;
  /** URL to the DZI descriptor (.dzi file) */
  readonly dziUrl: string;
  /** Optional thumbnail URL for the filmstrip (falls back to DZI lowest-res tile) */
  readonly thumbnailUrl?: string;
  /** Optional human-readable label */
  readonly label?: string;
}

interface AnnotatorProps {
  /** List of DZI images available for annotation */
  images: ImageSource[];

  /** Annotation contexts defining tool constraints */
  contexts: AnnotationContext[];

  /** Active annotation context ID */
  activeContextId: AnnotationContextId;

  /** Pre-existing annotations to load */
  initialAnnotations?: Annotation[];

  /** Callback on any annotation state change */
  onAnnotationsChange?: (annotations: Annotation[]) => void;

  /** Callback when constraint status changes */
  onConstraintChange?: (status: ConstraintStatus) => void;

  /** Initial grid configuration */
  gridConfig?: { columns: number; rows: number };

  /** Maximum grid size (default: 3x3, documented max: 4x4) */
  maxGridSize?: { columns: number; rows: number };

  /** Default annotation style applied to new annotations */
  defaultStyle?: Partial<AnnotationStyle>;

  /** Whether the filmstrip sidebar is visible */
  showFilmstrip?: boolean;

  /** Whether the toolbar is visible (tools still usable via keyboard shortcuts) */
  showToolbar?: boolean;

  /** Custom keyboard shortcut overrides */
  keyboardShortcuts?: Partial<KeyboardShortcutMap>;

  /** CSS class name for the root container */
  class?: string;

  /** Inline styles for the root container */
  style?: JSX.CSSProperties;
}
```

### 8.2 ViewerCell

A single unit containing one OSD viewer + Fabric overlay. Manages its own OSD instance lifecycle and Fabric overlay synchronization. Receives its image source and annotations slice from the parent grid.

Key behaviors:

- Creates OSD viewer on mount, destroys on unmount.
- Creates Fabric overlay attached to the OSD viewer.
- Syncs Fabric canvas transform on every OSD viewport event.
- Routes pointer events based on active tool state.
- Renders annotations from state as Fabric objects.
- Reports annotation create/update/delete back to the store via actions.
- Visual indicator (border highlight) when this cell is the active input target.

### 8.3 GridView

Renders an MxN grid of `ViewerCell` components. Manages layout (CSS Grid), cell activation on click, and grid resize behavior.

**Performance considerations:**

- Maximum recommended grid size is **4×4** (16 simultaneous OSD viewers). Beyond this, tile cache memory and animation loop overhead may degrade performance.
- The `maxGridSize` prop allows consumers to set a lower cap. Default: 3×3.
- Cells that are not assigned an image render as empty placeholders with a "drop image here" prompt.
- When grid dimensions change, existing cell assignments are preserved where possible.

### 8.4 Filmstrip

A persistent sidebar (configurable: left, right, bottom) displaying thumbnail previews of all available images. Each thumbnail is a static image (using the `thumbnailUrl` if provided, otherwise the lowest-resolution DZI tile).

Interactions:

- Click a thumbnail to assign it to the active grid cell.
- Drag a thumbnail onto a specific grid cell to assign it there (stretch goal — see §12).
- Visual indicator showing which images are currently assigned to grid cells.
- Scroll/overflow behavior for large image sets.

### 8.5 Toolbar

Renders tool buttons corresponding to the tools allowed by the active annotation context. Respects constraints: buttons are disabled when the annotation limit for that tool is reached.

Displays the currently active tool with a visual highlight. Includes the select tool (always available) and a navigation/pan mode toggle.

---

## 9. Annotation Tools

### 9.1 Common Tool Interface

All tools implement a common interface that handles the drawing interaction lifecycle:

```typescript
interface AnnotationTool {
  /** Tool identifier */
  readonly type: AnnotationType;

  /** Called when the tool becomes active */
  activate(overlay: FabricOverlay): void;

  /** Called when the tool is deactivated */
  deactivate(): void;

  /** Handle pointer down — start drawing */
  onPointerDown(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer move — update drawing preview */
  onPointerMove(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer up — commit the annotation */
  onPointerUp(event: PointerEvent, imagePoint: Point): void;

  /** Cancel the current drawing interaction */
  cancel(): void;
}
```

### 9.2 Tool Behaviors

**Rectangle:** Click-drag to define a bounding box. The rectangle is drawn from the initial click point to the current pointer position. On pointer up, the geometry is committed in image-space coordinates.

**Circle:** Click-drag where the initial click is the center and the drag distance defines the radius.

**Line:** Click to set the start point, drag to the end point, release to commit.

**Point:** Single click to place a point marker at the click location. No drag interaction.

**Path:** Click to place sequential waypoints. Each click adds a point to the path. Double-click or press Enter to commit the path. Press Escape to cancel. The path can optionally be closed (last point connects to first) — this is configurable per context.

**Select:** Click on an annotation to select it. Selected annotations show Fabric.js control handles for move, resize, and rotate. Click on empty space to deselect. Press Delete/Backspace to remove the selected annotation.

### 9.3 Drawing Preview

While drawing (between pointer down and pointer up), a temporary Fabric object is rendered showing a preview of the annotation being created. This preview uses a dashed/transparent style to distinguish it from committed annotations. On commit, the preview is replaced with the final annotation object.

---

## 10. Keyboard Shortcuts

Default keyboard shortcuts (all overridable via the `keyboardShortcuts` prop):

| Key                    | Action                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| `V`                    | Switch to Select tool                                                       |
| `R`                    | Switch to Rectangle tool                                                    |
| `C`                    | Switch to Circle tool                                                       |
| `L`                    | Switch to Line tool                                                         |
| `P`                    | Switch to Point tool                                                        |
| `D`                    | Switch to Path (draw) tool                                                  |
| `Escape`               | Cancel current drawing / deselect annotation / exit tool to navigation mode |
| `Delete` / `Backspace` | Delete selected annotation                                                  |
| `1`–`9`                | Activate grid cell 1–9                                                      |
| `+` / `-`              | Increase/decrease grid columns                                              |

Shortcuts are suppressed when a text input or other focusable element has focus.

---

## 11. Testing Strategy

### 11.1 Unit Tests (Vitest)

Coverage targets: core logic at >90% line coverage.

Tested modules:

- **Annotation model:** Factory functions, validation, cloning.
- **Serialization:** Round-trip serialize/deserialize, schema validation, version migration.
- **Constraint engine:** Limit enforcement, tool enable/disable transitions, edge cases (delete re-enables tool, context switching resets availability).
- **Coordinate transforms:** Image-space ↔ viewport-space ↔ screen-space conversions under various zoom/pan/rotation states.
- **State actions:** All mutation functions tested for correct state transitions.
- **Geometry utilities:** Hit testing, bounding box computation, point-in-polygon.

### 11.2 E2E Tests (Playwright)

Test real browser interactions against the dev application. Key test scenarios:

- **Drawing flow:** For each tool type, simulate pointer events to draw an annotation, verify it appears on canvas and in state.
- **Editing flow:** Draw an annotation, select it, drag to move, resize via handles, verify updated geometry in state.
- **Constraint enforcement:** Configure a context with limits, draw to the limit, verify tool becomes disabled, delete one, verify tool re-enables.
- **Grid view:** Switch between grid sizes, assign images to cells, verify each cell independently renders and accepts annotations.
- **Filmstrip:** Click thumbnails to assign images, verify grid cell updates.
- **Keyboard shortcuts:** Verify each shortcut triggers the expected tool/action.
- **State persistence:** Load initial annotations, verify they render. Draw additional annotations, verify `onAnnotationsChange` fires with correct data.
- **Visual regression:** Screenshot comparisons for annotation rendering at various zoom levels.

### 11.3 Test Infrastructure

- **Fixtures:** A set of test DZI images (small, predictable tile sets) included in the test suite.
- **Helpers:** Shared Playwright helpers for common canvas interactions (draw rectangle at coordinates, select annotation, etc.).
- **CI:** Tests run in headless Chromium. Playwright visual snapshots committed to the repo and compared on CI.

---

## 12. Implementation Phases

### Phase 1 — Core Foundation

- Project scaffolding (pnpm, TypeScript, Vite, ESLint, Prettier).
- Type definitions (§4).
- OSD–Fabric overlay integration layer (§5).
- Single `ViewerCell` component rendering one DZI image with Fabric overlay.
- Coordinate synchronization (pan/zoom/resize).
- Input routing (navigation mode vs. annotation mode).

### Phase 2 — Annotation Tools

- Implement all drawing tools (rectangle, circle, line, point, path) (§9).
- Select tool with move, resize, rotate.
- Drawing preview during interaction.
- State management: annotation store, UI store, actions (§7).
- Serialization (load initial state, export current state) (§4.2).

### Phase 3 — Constraint System

- Annotation context model and constraint engine (§6).
- Reactive tool availability based on limits.
- Toolbar reflecting constraints.
- Context switching.

### Phase 4 — Multi-Image & Grid

- GridView component with configurable MxN layout (§8.3).
- Cell activation and independent annotation per cell.
- Filmstrip sidebar with thumbnail navigation (§8.4).
- Image assignment to grid cells.

### Phase 5 — Keyboard Shortcuts & Polish

- Keyboard shortcut system with overrides (§10).
- StatusBar component showing context info and annotation counts.
- Default style configuration.
- Edge case handling (window resize, grid resize with existing assignments, rapid tool switching).

### Phase 6 — Testing & Documentation

- Unit tests for all core modules (§11.1).
- E2E tests for all interaction flows (§11.2).
- API documentation (§3 `docs/` folder).
- README with getting-started guide and examples.

---

## 13. Performance Budgets & Constraints

| Metric                                           | Target                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| Overlay transform sync latency                   | < 1 frame (16ms) after OSD viewport event                                  |
| Annotation render (100 annotations on one image) | < 32ms total Fabric render time                                            |
| Grid view: 4×4 viewers                           | Smooth pan/zoom on active cell; idle cells do not consume animation frames |
| Library bundle size (minified, before gzip)      | < 500KB (excluding peer deps)                                              |
| Time to interactive (single viewer, cold load)   | < 2 seconds on modern hardware                                             |

**Documented maximum grid size:** 4×4 (16 viewers). Beyond this, performance is not guaranteed and is at the consumer's discretion. The `maxGridSize` prop defaults to `{ columns: 3, rows: 3 }`.

---

## 14. Open Questions & Future Considerations

These items are explicitly **out of scope** for v1 but documented for future planning:

1. **Undo/redo:** An action history stack with undo/redo commands. This fits naturally with the action-based state model but adds meaningful complexity.
2. **Annotation labels:** Text labels attached to annotation shapes (rendered on canvas near the annotation). Requires Fabric.js text objects and label positioning logic.
3. **Per-annotation style customization:** A UI for changing stroke color, fill, opacity on individual annotations. The data model already supports this; only the UI is missing.
4. **W3C Web Annotation export:** An adapter that converts the internal annotation format to W3C Web Annotation JSON-LD.
5. **Drag-and-drop from filmstrip to grid cell:** Currently filmstrip click assigns to active cell. Drag-and-drop is a UX improvement.
6. **Collaborative annotation:** Real-time multi-user annotation via WebSocket/CRDT. Far future.
7. **Accessibility:** ARIA labels for toolbar, keyboard-only annotation editing (currently keyboard shortcuts support tool switching and deletion, but drawing itself requires pointer input).
8. **Annotation grouping/layers:** Grouping annotations into named layers with visibility toggles.

---

## 15. Glossary

| Term                   | Definition                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **DZI**                | Deep Zoom Image — a tiled image format for efficient display of very large images at multiple zoom levels                                    |
| **Image-space**        | Coordinate system where (0,0) is the top-left of the full-resolution source image, measured in pixels                                        |
| **Viewport-space**     | OpenSeaDragon's normalized coordinate system where the image width maps to 0–1                                                               |
| **Screen-space**       | CSS pixel coordinates relative to the browser viewport                                                                                       |
| **Annotation context** | A named configuration defining which tools are available and annotation limits, typically representing a single pathology or annotation task |
| **Overlay**            | The Fabric.js canvas layered on top of the OSD viewer to render and interact with annotations                                                |
| **ViewerCell**         | A single unit of OSD viewer + Fabric overlay, representing one image slot in the grid                                                        |
