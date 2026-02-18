---
title: API Reference
description: API documentation for OSDLabel.
---

# API Reference

## Components

### `<Annotator />`

The main entry point for the library.

**Props:**

- `images: ImageSource[]` - List of images available for annotation.
- `contexts: AnnotationContext[]` - List of annotation contexts with tool constraints.
- `initialAnnotations?: Annotation[]` - Optional list of initial annotations to load.
- `onAnnotationsChange?: (annotations: Annotation[]) => void` - Callback fired when annotations are added, updated, or removed.
- `onConstraintChange?: (status: ConstraintStatus) => void` - Callback fired when constraint status changes (e.g., tool disabled).
- `showFilmstrip?: boolean` - Whether to show the filmstrip sidebar (default: `true`).
- `filmstripPosition?: 'left' | 'right' | 'bottom'` - Position of the filmstrip (default: `'left'`).
- `maxGridSize?: { columns: number; rows: number }` - Maximum grid dimensions (default: `{ columns: 4, rows: 4 }`).
- `style?: JSX.CSSProperties` - Custom styles for the container.

## Types

### `ImageSource`

```typescript
interface ImageSource {
  id: string;
  dziUrl: string;
  thumbnailUrl?: string;
  label?: string;
}
```

### `AnnotationContext`

```typescript
interface AnnotationContext {
  id: string;
  label: string;
  tools: ToolConstraint[];
}

interface ToolConstraint {
  type: AnnotationType;
  maxCount?: number;
}
```

### `AnnotationType`

Supported types: `'rectangle' | 'circle' | 'line' | 'point' | 'path'`.

### `Annotation`

```typescript
interface Annotation {
  id: string;
  imageId: string;
  contextId: string;
  geometry: Geometry;
  style: AnnotationStyle;
  createdAt: string;
  updatedAt: string;
}
```
