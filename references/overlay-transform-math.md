# Reference: Overlay Transform Derivation

## The Problem

We have Fabric objects positioned in **image-space** (pixel coordinates of the full-resolution source image). We need them to appear at the correct location on screen as the user pans and zooms the OSD viewer.

Fabric's `viewportTransform` is a 6-element affine matrix that maps from the coordinate space where objects are defined (for us: image-space) to the canvas's screen-space pixels.

## The Math

### Without rotation

At any given moment, OSD can tell us where an image-space point appears on screen:

```
screenPoint = viewer.viewport.imageToViewerElementCoordinates(imagePoint)
```

We need to find a matrix M = [a, 0, 0, d, tx, ty] such that:

```
screenX = a * imageX + tx
screenY = d * imageY + ty
```

This is a uniform scale + translate. We can derive it from two reference points:

```typescript
const origin = new OpenSeadragon.Point(0, 0);
const unitX = new OpenSeadragon.Point(1, 0);
const unitY = new OpenSeadragon.Point(0, 1);

const screenOrigin = viewer.viewport.imageToViewerElementCoordinates(origin);
const screenUnitX = viewer.viewport.imageToViewerElementCoordinates(unitX);
const screenUnitY = viewer.viewport.imageToViewerElementCoordinates(unitY);

// Scale = screen pixels per image pixel
const scaleX = screenUnitX.x - screenOrigin.x;
const scaleY = screenUnitY.y - screenOrigin.y;

// Translation = where image origin (0,0) maps to on screen
const tx = screenOrigin.x;
const ty = screenOrigin.y;

// For DZI images without rotation, scaleX ≈ scaleY
const viewportTransform = [scaleX, 0, 0, scaleY, tx, ty];
```

### With rotation

When OSD is rotated by θ degrees, the mapping becomes:

```
screenX = cos(θ)*scale * imageX - sin(θ)*scale * imageY + tx
screenY = sin(θ)*scale * imageX + cos(θ)*scale * imageY + ty
```

Using the same reference point approach:

```typescript
const origin = new OpenSeadragon.Point(0, 0);
const unitX = new OpenSeadragon.Point(1, 0);

const screenOrigin = viewer.viewport.imageToViewerElementCoordinates(origin);
const screenUnitX = viewer.viewport.imageToViewerElementCoordinates(unitX);

// The vector from origin to unitX on screen gives us both scale and rotation
const dx = screenUnitX.x - screenOrigin.x;
const dy = screenUnitX.y - screenOrigin.y;

// For a uniform scale with rotation:
// a = cos(θ) * scale = dx
// b = sin(θ) * scale = dy
// The matrix is:
//   [a,  b, -b, a, tx, ty]
//   [dx, dy, -dy, dx, screenOrigin.x, screenOrigin.y]

const viewportTransform = [dx, dy, -dy, dx, screenOrigin.x, screenOrigin.y];
```

This works because in the affine matrix `[a, b, c, d, e, f]`:

- a = scaleX \* cos(θ)
- b = scaleX \* sin(θ) (Fabric's matrix has b = skewY, which for rotation = sin)
- c = -scaleY \* sin(θ) (skewX, which for rotation = -sin)
- d = scaleY \* cos(θ)
- e = translateX
- f = translateY

For uniform scale (scaleX = scaleY), this simplifies to the formula above.

## Implementation

```typescript
function computeViewportTransform(viewer: OpenSeadragon.Viewer): number[] {
  const origin = new OpenSeadragon.Point(0, 0);
  const unitX = new OpenSeadragon.Point(1, 0);

  const screenOrigin = viewer.viewport.imageToViewerElementCoordinates(origin);
  const screenUnitX = viewer.viewport.imageToViewerElementCoordinates(unitX);

  const dx = screenUnitX.x - screenOrigin.x;
  const dy = screenUnitX.y - screenOrigin.y;

  return [dx, dy, -dy, dx, screenOrigin.x, screenOrigin.y];
}

// Called on every OSD 'animation' event:
function sync() {
  if (!viewer || !fabricCanvas) return;

  const vpt = computeViewportTransform(viewer);
  fabricCanvas.setViewportTransform(vpt as TMat2D);
  fabricCanvas.requestRenderAll();
}
```

## Coordinate Conversion Helpers

```typescript
function screenToImage(viewer: OpenSeadragon.Viewer, screenPoint: Point): Point {
  const osdPoint = viewer.viewport.viewerElementToImageCoordinates(
    new OpenSeadragon.Point(screenPoint.x, screenPoint.y),
  );
  return { x: osdPoint.x, y: osdPoint.y };
}

function imageToScreen(viewer: OpenSeadragon.Viewer, imagePoint: Point): Point {
  const osdPoint = viewer.viewport.imageToViewerElementCoordinates(
    new OpenSeadragon.Point(imagePoint.x, imagePoint.y),
  );
  return { x: osdPoint.x, y: osdPoint.y };
}
```

## Canvas Resize

When the OSD viewer container resizes, the Fabric canvas must match:

```typescript
viewer.addHandler('resize', () => {
  const containerSize = viewer.viewport.getContainerSize();
  fabricCanvas.setDimensions({
    width: containerSize.x,
    height: containerSize.y,
  });
  sync(); // re-sync transform after resize
});
```

## Why Not Convert Each Object's Coordinates?

An alternative approach is to keep Fabric objects in screen-space and update each object's position/scale on every viewport change. This is wrong because:

1. It's O(n) per frame where n = number of annotations.
2. It loses Fabric's built-in hit testing (which operates on object coordinates).
3. It makes serialization harder (you'd need to convert back to image-space).
4. The `viewportTransform` approach is O(1) per frame — just one matrix update.
