---
title: API Overview
description: Module organization and import patterns
---

## Import structure

`osdlabel` provides ESM-friendly sub-path exports for efficient tree-shaking. Imports are supported at three levels:

### 1. Main barrel

Recommended for quick starts and prototyping. Re-exports all public APIs.

```ts
import { Annotator, useAnnotator, serialize } from 'osdlabel';
```

### 2. Sub-path barrels

Preferred for better build performance and tree-shaking in production apps.

```ts
import { Annotator } from 'osdlabel/components';
import { serialize } from '@osdlabel/annotation';
import { useAnnotator } from 'osdlabel/state';
import type { Annotation, ImageSource } from '@osdlabel/annotation';
import type { AnnotationContext } from '@osdlabel/annotation-context';
```

### 3. Granular imports

For maximum granularity, you can import individual files directly.

```ts
import { Annotator } from 'osdlabel/components/Annotator';
```

---

## Module categories

### Types

Core TypeScript types and branded ID factories. See [Types](/osdlabel/api/types/).

```ts
import type { AnnotationId, ImageId, Geometry, Annotation } from '@osdlabel/annotation';
import { createImageId, createAnnotationId } from '@osdlabel/annotation';
```

### Viewer API

Viewer-level types for UI state, cell transforms, and keyboard shortcuts. See [Types](/osdlabel/api/types/).

```ts
import type { CellTransform, UIState, KeyboardShortcutMap } from '@osdlabel/viewer-api';
import { DEFAULT_CELL_TRANSFORM } from '@osdlabel/viewer-api';
```

### Components

SolidJS UI components for building annotation interfaces. See [Components](/osdlabel/api/components/).

```ts
import {
  Annotator,
  ViewerCell,
  Toolbar,
  StatusBar,
  GridView,
  Filmstrip,
  GridControls,
} from 'osdlabel/components';
```

### State management

Stores, actions, and the context provider. See [State Management](/osdlabel/api/state/).

```ts
import { AnnotatorProvider, useAnnotator, createActions } from 'osdlabel/state';
```

### Overlay

Low-level OSD-Fabric integration. See [Overlay](/osdlabel/api/overlay/).

```ts
import { FabricOverlay, computeViewportTransform } from '@osdlabel/fabric-osd';
```

### Serialization

JSON export/import functions. See [Serialization](/osdlabel/api/serialization/).

```ts
import {
  serialize,
  deserialize,
  validateBaseAnnotation,
  getAllAnnotationsFlat,
} from '@osdlabel/annotation';
```

### Validation

Schema-based validators using [Standard Schema](https://github.com/standard-schema/standard-schema). See [Serialization](/osdlabel/api/serialization/).

```ts
import {
  BaseAnnotationSchema,
  GeometrySchema,
  RawAnnotationDataSchema,
} from '@osdlabel/validation';
```

### Hooks

Custom SolidJS hooks. See [Hooks](/osdlabel/api/hooks/).

```ts
import { useConstraints, useKeyboard } from 'osdlabel/hooks';
```

### Constants

Default configuration values. See [Constants](/osdlabel/api/constants/).

```ts
import { DEFAULT_ANNOTATION_STYLE, DEFAULT_GRID_CONFIG, MAX_GRID_SIZE } from '@osdlabel/annotation';
```
