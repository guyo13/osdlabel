# Reference: Fabric.js v7 API

## Imports

Fabric v7 is TypeScript-native with named ES module exports. No `@types/fabric` needed.

```typescript
// v7 imports (named exports, no namespace)
import { Canvas, Rect, Circle, Line, Path, Polyline, Point } from 'fabric';
import * as fabric from 'fabric'; // alternative for utilities
```

## Canvas Creation

```typescript
// Create an interactive canvas from an existing <canvas> element
const fabricCanvas = new Canvas(canvasElement, {
  selection: true,           // enable object selection
  renderOnAddRemove: false,  // manual render control for performance
  skipOffscreen: true,       // skip rendering off-screen objects
});

// IMPORTANT: The canvasElement must be in the DOM and visible.
// Fabric.js will NOT work with detached or display:none elements.

// Set canvas dimensions to match container
fabricCanvas.setDimensions({
  width: containerWidth,
  height: containerHeight,
});

// Dispose canvas (cleanup)
fabricCanvas.dispose();
```

## viewportTransform

The `viewportTransform` is a 6-element array representing a 2D affine matrix:
`[scaleX, skewY, skewX, scaleY, translateX, translateY]`

For our overlay (no skew), this simplifies to:
`[scale, 0, 0, scale, offsetX, offsetY]`

With rotation:
`[cos*scale, sin*scale, -sin*scale, cos*scale, offsetX, offsetY]`

```typescript
// Set the transform
fabricCanvas.setViewportTransform([2, 0, 0, 2, -100, -50]);
// This means: 2x zoom, panned 100px left and 50px up

// Read the current transform
const vpt = fabricCanvas.viewportTransform;
// vpt[0] = scaleX, vpt[4] = translateX, vpt[5] = translateY

// After changing the transform, request a render
fabricCanvas.requestRenderAll();
```

## Coordinate Conversion with Transforms

```typescript
import { Point as FabricPoint, util } from 'fabric';

// Transform a point from canvas-space to screen-space
const screenPoint = util.transformPoint(
  new FabricPoint(canvasX, canvasY),
  fabricCanvas.viewportTransform
);

// Inverse: screen-space to canvas-space
const inverseVpt = util.invertTransform(fabricCanvas.viewportTransform);
const canvasPoint = util.transformPoint(
  new FabricPoint(screenX, screenY),
  inverseVpt
);

// Multiply two transform matrices
const combined = util.multiplyTransformMatrices(matrixA, matrixB);
```

## Creating Objects

```typescript
import { Rect, Circle, Line, Path, Polyline } from 'fabric';

// Rectangle (coordinates in canvas/image space — the viewportTransform maps to screen)
const rect = new Rect({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fill: 'rgba(255, 0, 0, 0.3)',
  stroke: '#ff0000',
  strokeWidth: 2,
  angle: 0,                    // rotation in degrees
  selectable: true,
  evented: true,
});

// Circle
const circle = new Circle({
  left: 300,                   // left edge (not center!)
  top: 200,                    // top edge (not center!)
  radius: 50,
  fill: 'rgba(0, 255, 0, 0.3)',
  stroke: '#00ff00',
  strokeWidth: 2,
});

// Line
const line = new Line([x1, y1, x2, y2], {
  stroke: '#0000ff',
  strokeWidth: 2,
  selectable: true,
});

// Polyline (open path — array of {x, y} points)
const polyline = new Polyline(
  [{ x: 10, y: 10 }, { x: 50, y: 80 }, { x: 100, y: 30 }],
  {
    fill: 'transparent',
    stroke: '#ff00ff',
    strokeWidth: 2,
  }
);

// Path (SVG path string)
const path = new Path('M 0 0 L 100 100 L 200 50 z', {
  fill: 'rgba(0, 0, 255, 0.2)',
  stroke: '#0000ff',
  strokeWidth: 2,
});

// Add to canvas
fabricCanvas.add(rect);
fabricCanvas.add(circle);

// Remove from canvas
fabricCanvas.remove(rect);

// Render
fabricCanvas.requestRenderAll();
```

## Object Events

```typescript
// Canvas-level events
fabricCanvas.on('mouse:down', (event) => {
  // event.e = native DOM event
  // event.target = Fabric object under cursor (or undefined)
  // event.pointer = { x, y } in canvas coordinates
  const pointer = fabricCanvas.getScenePoint(event.e);
});

fabricCanvas.on('mouse:move', (event) => {
  const pointer = fabricCanvas.getScenePoint(event.e);
});

fabricCanvas.on('mouse:up', (event) => { });

fabricCanvas.on('mouse:dblclick', (event) => { });

// Selection events
fabricCanvas.on('selection:created', (event) => {
  // event.selected = array of selected objects
});

fabricCanvas.on('selection:cleared', () => { });

// Object modification (after move/resize/rotate completes)
fabricCanvas.on('object:modified', (event) => {
  const obj = event.target;
  // Read updated geometry:
  const left = obj.left;
  const top = obj.top;
  const scaleX = obj.scaleX;
  const scaleY = obj.scaleY;
  const angle = obj.angle;
  const width = obj.width * scaleX;   // scaled width
  const height = obj.height * scaleY; // scaled height
});
```

## Selection and Interactivity

```typescript
// Disable all interactivity
fabricCanvas.selection = false;
fabricCanvas.forEachObject((obj) => {
  obj.selectable = false;
  obj.evented = false;
});

// Re-enable
fabricCanvas.selection = true;
fabricCanvas.forEachObject((obj) => {
  obj.selectable = true;
  obj.evented = true;
});

// Programmatically select an object
fabricCanvas.setActiveObject(rect);
fabricCanvas.requestRenderAll();

// Deselect
fabricCanvas.discardActiveObject();
fabricCanvas.requestRenderAll();

// Get currently selected object
const selected = fabricCanvas.getActiveObject();
```

## Custom Data on Objects

You can attach arbitrary data to Fabric objects to link them to annotations:

```typescript
// Attach annotation ID
rect.set('data', { annotationId: 'ann-123' });

// Read it back
const data = rect.get('data');
```

## Performance Tips

- Set `renderOnAddRemove: false` on canvas, call `requestRenderAll()` manually.
- Use `skipOffscreen: true` to avoid rendering objects outside the viewport.
- Batch adds: add multiple objects, then call `requestRenderAll()` once.
- Avoid `canvas.renderAll()` (synchronous) — prefer `canvas.requestRenderAll()` (batched).
