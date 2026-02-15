# Task 02 — OSD–Fabric Overlay Integration (Proof of Concept)

**Depends on:** Task 01
**Spec sections:** §5

## Objective

Build the custom overlay layer that positions a Fabric.js canvas on top of an OpenSeaDragon viewer and keeps them in sync during pan/zoom. This is the highest-risk piece of the project — get it right before building anything else.

## Steps

### 1. Create `src/overlay/fabric-overlay.ts`

Implement the `FabricOverlay` interface from §5.4 of the spec. The implementation must:

**Create the Fabric canvas:**
- Create a `<canvas>` DOM element.
- Position it absolutely on top of the OSD viewer's canvas element (`viewer.canvas`).
- Set its CSS to `pointer-events: none` initially (navigation mode).
- Instantiate a Fabric `Canvas` on this element.

**Subscribe to OSD viewport events:**
- Listen to `'animation'` (fires every frame during pan/zoom — this is for smooth sync).
- Listen to `'resize'` (viewer container resized).
- Listen to `'open'` (tile source loaded — needed to compute initial image dimensions).
- On each event, call the internal `sync()` method.

**Implement `sync()`:**
- Read OSD viewport state: `viewer.viewport.getCenter(true)`, `viewer.viewport.getZoom(true)`, `viewer.viewport.getRotation()`.
- Compute the affine transform matrix that maps image-space coordinates to the Fabric canvas's screen-space.
- The key formula: for a point `P` in image-space, its screen position is `viewer.viewport.imageToViewerElementCoordinates(P)`.
- Derive the Fabric `viewportTransform` matrix `[scaleX, 0, 0, scaleY, translateX, translateY]` such that a Fabric object at image-space coordinates renders at the correct screen position.
- Call `this.canvas.setViewportTransform(matrix)`.
- Call `this.canvas.requestRenderAll()`.

**The transform derivation (critical):**
```
// Get two reference points in image-space and their screen positions
const imgOrigin = new OpenSeadragon.Point(0, 0);
const imgUnit = new OpenSeadragon.Point(1, 0); // 1 pixel to the right

const screenOrigin = viewer.viewport.imageToViewerElementCoordinates(imgOrigin);
const screenUnit = viewer.viewport.imageToViewerElementCoordinates(imgUnit);

// Scale = screen pixels per image pixel
const scale = screenUnit.x - screenOrigin.x; // assuming no rotation for now

// The Fabric viewportTransform maps Fabric's coordinate space to screen space
// We want Fabric objects positioned in image-space to appear at the right screen location
const vpt = [scale, 0, 0, scale, screenOrigin.x, screenOrigin.y];
```

For rotation support, the matrix becomes:
```
const rotation = viewer.viewport.getRotation() * Math.PI / 180;
const cos = Math.cos(rotation) * scale;
const sin = Math.sin(rotation) * scale;
const vpt = [cos, sin, -sin, cos, screenOrigin.x, screenOrigin.y];
```

**Implement `setInteractive()`:**
- When `true`: set `pointer-events: auto` on the Fabric canvas element, enable Fabric selection.
- When `false`: set `pointer-events: none`, disable Fabric selection.

**Implement coordinate conversion:**
- `screenToImage(point)`: use `viewer.viewport.viewerElementToImageCoordinates()`.
- `imageToScreen(point)`: use `viewer.viewport.imageToViewerElementCoordinates()`.

**Implement `destroy()`:**
- Remove all OSD event handlers.
- Dispose the Fabric canvas.
- Remove the canvas DOM element.

### 2. Create `src/overlay/overlay-manager.ts`

A simple registry that tracks active overlays by cell index. Methods:
- `create(viewer, options) → FabricOverlay`
- `get(cellIndex) → FabricOverlay | undefined`
- `destroy(cellIndex) → void`
- `destroyAll() → void`

### 3. Update the dev app

Modify `dev/App.tsx` to:
- Create a `<div>` container for the OSD viewer.
- Initialize an OSD viewer on mount (use `type: 'image'` tile source with a local test image — add a sample JPEG to `dev/sample-data/`).
- Create a `FabricOverlay` attached to the viewer.
- Add a hardcoded Fabric `Rect` at image-space coordinates `{ left: 100, top: 100, width: 200, height: 200 }` with a red semi-transparent fill.
- The rectangle should remain pinned to the same image region when you pan and zoom.

### 4. Write unit tests

Create `tests/unit/overlay/coordinate-transform.test.ts`:
- Test the affine matrix computation for known inputs (identity zoom, 2x zoom, zoom + pan offset).
- Mock the OSD viewport methods to return predictable values.
- Verify that `screenToImage(imageToScreen(point))` round-trips correctly.

## NOT in scope for this task

- Drawing tools or tool interactions
- State management
- Input routing (that comes in Task 03)
- Grid view
- Multiple viewers

## Verification

1. `pnpm dev` — the browser shows an OSD viewer with a zoomable image.
2. A red rectangle is visible at a fixed location on the image.
3. **Zoom in 5x** — the rectangle stays at the same image location and scales proportionally.
4. **Pan around** — the rectangle moves with the image.
5. **Resize the browser window** — the rectangle repositions correctly.
6. `pnpm typecheck` passes.
7. `pnpm test` passes (coordinate transform tests).
8. The browser console shows no errors.
