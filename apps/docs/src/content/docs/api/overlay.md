---
title: Overlay
description: OSD-Fabric integration layer
---

## FabricOverlay

A Fabric.js canvas overlay synchronized with an OpenSeaDragon viewer. Handles event routing, coordinate transforms, and mode switching.

```ts
import { FabricOverlay } from 'osdlabel/overlay';
```

### Constructor

```ts
new FabricOverlay(viewer: OpenSeadragon.Viewer, options?: OverlayOptions)
```

Creates a Fabric canvas element on top of the OSD viewer, sets up event routing via an OSD MouseTracker, and subscribes to OSD animation events for synchronization.

### Properties

#### canvas

```ts
get canvas(): FabricCanvas
```

The underlying Fabric.js Canvas instance. Use for adding/removing Fabric objects.

### Methods

#### sync

```ts
sync(): void
```

Force a re-sync of the overlay transform with the current OSD viewport. Called automatically on OSD `animation`, `animation-finish`, `resize`, and `open` events. Uses synchronous `renderAll()` to avoid 1-frame lag.

#### setMode

```ts
setMode(mode: OverlayMode): void
```

Switch between interaction modes:

- **`'navigation'`** — OSD handles all input. Fabric objects are non-interactive. The MouseTracker is disabled.
- **`'annotation'`** — Fabric handles input (draw, select, edit). OSD navigation is disabled except for modifier-based pass-through.

#### getMode

```ts
getMode(): OverlayMode
```

Returns the current interaction mode.

#### screenToImage

```ts
screenToImage(screenPoint: Point): Point
```

Convert a point from screen-space (CSS pixels) to image-space (image pixels).

#### imageToScreen

```ts
imageToScreen(imagePoint: Point): Point
```

Convert a point from image-space to screen-space.

#### destroy

```ts
destroy(): void
```

Clean up all event listeners, remove the canvas from the DOM, and dispose the Fabric canvas.

---

## OverlayMode

```ts
type OverlayMode = 'navigation' | 'annotation';
```

---

## OverlayOptions

```ts
interface OverlayOptions {
  readonly interactive?: boolean; // Default: false
}
```

If `interactive` is `true`, the overlay starts in annotation mode instead of navigation mode.

---

## computeViewportTransform

```ts
function computeViewportTransform(viewer: OpenSeadragon.Viewer): TMat2D;
```

Computes the 6-element affine matrix `[a, b, c, d, tx, ty]` that maps image-space to screen-space for the current OSD viewport state.

The matrix is derived by mapping two image-space points `(0,0)` and `(1,0)` through OSD's `imageToViewerElementCoordinates()`, then constructing the affine transform from the resulting screen positions.

---

## Event routing

The overlay uses an OSD `MouseTracker` attached to Fabric's container element to intercept pointer events. In annotation mode:

- Normal clicks/drags are forwarded to Fabric as synthetic `PointerEvent`s
- `Ctrl`/`Cmd` + drag is passed through to OSD for panning
- `Ctrl`/`Cmd` + scroll triggers OSD zoom via `viewport.zoomBy()`
- A re-entrancy guard prevents infinite recursion from bubbled synthetic events
