---
title: Types
description: Core type definitions and branded ID types
---

## Branded ID types

osdlabel uses TypeScript branded types to prevent mixing different kinds of IDs.

### AnnotationId

```ts
declare const annotationIdBrand: unique symbol;
type AnnotationId = string & { readonly __brand: typeof annotationIdBrand };
```

Unique identifier for an annotation.

### ImageId

```ts
declare const imageIdBrand: unique symbol;
type ImageId = string & { readonly __brand: typeof imageIdBrand };
```

Unique identifier for an image.

### AnnotationContextId

```ts
declare const annotationContextIdBrand: unique symbol;
type AnnotationContextId = string & { readonly __brand: typeof annotationContextIdBrand };
```

Unique identifier for an annotation context.

### ID factory functions

Since branded types cannot be assigned from plain strings, use these factory functions:

```ts
function createAnnotationId(value: string): AnnotationId;
function createImageId(value: string): ImageId;
function createAnnotationContextId(value: string): AnnotationContextId;
```

**Example:**

```ts
const imageId = createImageId('xray-001');
const annId = createAnnotationId('ann-1');
const ctxId = createAnnotationContextId('fracture');
```

---

## Geometry types

### AnnotationType

```ts
type AnnotationType = 'rectangle' | 'circle' | 'line' | 'point' | 'path';
```

The five supported annotation geometry types.

### Point

```ts
interface Point {
  readonly x: number;
  readonly y: number;
}
```

A 2D point in image-space coordinates (pixels).

### Geometry

Discriminated union of all annotation geometries. Always check `geometry.type` before accessing type-specific fields.

```ts
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
```

**Usage:**

```ts
function describeGeometry(g: Geometry): string {
  switch (g.type) {
    case 'rectangle':
      return `${g.width}x${g.height} at (${g.origin.x}, ${g.origin.y})`;
    case 'circle':
      return `radius ${g.radius} at (${g.center.x}, ${g.center.y})`;
    case 'line':
      return `from (${g.start.x}, ${g.start.y}) to (${g.end.x}, ${g.end.y})`;
    case 'point':
      return `at (${g.position.x}, ${g.position.y})`;
    case 'path':
      return `${g.points.length} points, ${g.closed ? 'closed' : 'open'}`;
  }
}
```

---

## Annotation types

### AnnotationStyle

```ts
interface AnnotationStyle {
  readonly strokeColor: string;
  readonly strokeWidth: number; // Screen pixels
  readonly strokeDashArray?: readonly number[];
  readonly fillColor: string;
  readonly fillOpacity: number;
  readonly opacity: number;
}
```

### RawAnnotationData

Low-level rendering data preserved for round-trip serialization.

```ts
type RawAnnotationData = {
  readonly format: 'fabric';
  readonly fabricVersion: string;
  readonly data: Record<string, unknown>;
};
```

### Annotation

A single annotation entity.

```ts
interface Annotation {
  readonly id: AnnotationId;
  readonly imageId: ImageId;
  readonly contextId: AnnotationContextId;
  readonly geometry: Geometry;
  readonly rawAnnotationData: RawAnnotationData;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}
```

---

## Serialization types

### AnnotationDocument

Top-level serialization envelope.

```ts
interface AnnotationDocument {
  readonly version: '1.0.0';
  readonly exportedAt: string;
  readonly images: readonly ImageAnnotations[];
}
```

### ImageAnnotations

Annotations for a single image within a document.

```ts
interface ImageAnnotations {
  readonly imageId: ImageId;
  readonly sourceUrl: string;
  readonly annotations: readonly Annotation[];
}
```

---

## Constraint types

### CountScope

```ts
type CountScope = 'per-image' | 'global';
```

### ToolConstraint

Defines a tool's availability and limits within a context.

```ts
interface ToolConstraint {
  readonly type: AnnotationType;
  readonly maxCount?: number;
  readonly countScope?: CountScope; // Default: 'global'
  readonly defaultStyle?: Partial<AnnotationStyle>;
}
```

### AnnotationContext

An annotation context defining tool constraints for a labelling task.

```ts
interface AnnotationContext {
  readonly id: AnnotationContextId;
  readonly label: string;
  readonly tools: readonly ToolConstraint[];
  readonly imageIds?: readonly ImageId[]; // Restrict to specific images
  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

### ConstraintStatus

Derived state showing tool availability for the active context.

```ts
type ConstraintStatus = Record<
  AnnotationType,
  {
    readonly enabled: boolean;
    readonly currentCount: number;
    readonly maxCount: number | null;
  }
>;
```

---

## Image types

### ImageSource

Descriptor for an image available to the annotator.

```ts
interface ImageSource {
  readonly id: ImageId;
  readonly dziUrl: string;
  readonly thumbnailUrl?: string;
  readonly label?: string;
}
```

The `dziUrl` can point to a `.dzi` file for tiled deep zoom images, or a standard image URL (`.jpg`, `.png`) for simple images.

### CellTransform

Per-cell visual adjustments (rotation, flip, exposure, inversion). These are transient view state — not serialized with annotations.

```ts
interface CellTransform {
  readonly rotation: number;  // degrees (0, 90, 180, 270)
  readonly flippedH: boolean;
  readonly flippedV: boolean;
  readonly exposure: number;  // -1 to 1 (0 = default)
  readonly inverted: boolean; // false = normal, true = CSS invert
}
```

---

## State types

### AnnotationState

```ts
interface AnnotationState {
  byImage: Record<ImageId, Record<AnnotationId, Annotation>>;
  changeCounter: number; // Incremented on every mutation
}
```

### UIState

```ts
interface UIState {
  activeTool: AnnotationType | 'select' | null;
  activeCellIndex: number;
  gridColumns: number;
  gridRows: number;
  gridAssignments: Record<number, ImageId>;
  selectedAnnotationId: AnnotationId | null;
  cellTransforms: Record<number, CellTransform>;
}
```

### ContextState

```ts
interface ContextState {
  contexts: AnnotationContext[];
  activeContextId: AnnotationContextId | null;
  displayedContextIds: AnnotationContextId[];
}
```

:::note
State container types (`AnnotationState`, `UIState`, `ContextState`) intentionally omit `readonly` — SolidJS store proxies enforce immutability at runtime, and `readonly` would conflict with SolidJS's `SetStoreFunction` path-based API.
:::

---

## Keyboard types

### KeyboardShortcutMap

```ts
interface KeyboardShortcutMap {
  readonly selectTool: string;
  readonly rectangleTool: string;
  readonly circleTool: string;
  readonly lineTool: string;
  readonly pointTool: string;
  readonly pathTool: string;
  readonly cancel: string;
  readonly delete: string;
  readonly deleteAlt: string;
  readonly gridCell1: string;
  readonly gridCell2: string;
  readonly gridCell3: string;
  readonly gridCell4: string;
  readonly gridCell5: string;
  readonly gridCell6: string;
  readonly gridCell7: string;
  readonly gridCell8: string;
  readonly gridCell9: string;
  readonly increaseGridColumns: string;
  readonly decreaseGridColumns: string;
  readonly pathFinish: string;
  readonly pathClose: string;
  readonly pathCancel: string;
}
```

See [Keyboard Shortcuts](/osdlabel/guides/keyboard-shortcuts/) for default values and customization.
