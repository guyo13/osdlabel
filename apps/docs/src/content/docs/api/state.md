---
title: State Management
description: Stores, actions, and the context provider
---

## useAnnotator

The primary hook for accessing all annotation state and actions. Must be used within an `AnnotatorProvider`.

```ts
import { useAnnotator } from 'osdlabel/state';
```

### Return value

```ts
{
  annotationState: AnnotationState;
  uiState: UIState;
  contextState: ContextState;
  constraintStatus: Accessor<ConstraintStatus>;
  actions: Actions;
  activeToolKeyHandlerRef: ActiveToolKeyHandlerRef;
  shortcuts: KeyboardShortcutMap;
}
```

| Property           | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `annotationState`  | All annotations organized by image ID with a change counter |
| `uiState`          | Active tool, cell, grid dimensions, assignments, selection  |
| `contextState`     | Available contexts and active context ID                    |
| `constraintStatus` | Reactive accessor returning tool enable/disable status      |
| `actions`          | Object containing all state mutation functions              |
| `shortcuts`        | Merged keyboard shortcut map (defaults + overrides)         |

---

## Actions

Returned by `useAnnotator().actions`. All state mutations go through these functions.

### Annotation actions

#### addAnnotation

```ts
addAnnotation(annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>): void
```

Add a new annotation. Timestamps are set automatically. Validates that the annotation's context is scoped to the target image.

#### updateAnnotation

```ts
updateAnnotation(
  id: AnnotationId,
  imageId: ImageId,
  patch: Partial<Omit<Annotation, 'id' | 'imageId' | 'createdAt' | 'updatedAt'>>
): void
```

Update fields of an existing annotation. `updatedAt` is set automatically.

#### deleteAnnotation

```ts
deleteAnnotation(id: AnnotationId, imageId: ImageId): void
```

Remove an annotation.

#### loadAnnotations

```ts
loadAnnotations(byImage: Record<ImageId, Record<AnnotationId, Annotation>>): void
```

Replace all annotation state. Used for importing deserialized data.

### UI actions

#### setActiveTool

```ts
setActiveTool(tool: AnnotationType | 'select' | null): void
```

Set the active drawing/selection tool, or `null` to deactivate.

#### setActiveCell

```ts
setActiveCell(cellIndex: number): void
```

Set the active grid cell by index.

#### setSelectedAnnotation

```ts
setSelectedAnnotation(id: AnnotationId | null): void
```

Set or clear the selected annotation.

#### assignImageToCell

```ts
assignImageToCell(cellIndex: number, imageId: ImageId): void
```

Assign an image to a grid cell.

#### setGridDimensions

```ts
setGridDimensions(columns: number, rows: number): void
```

Update the grid size.

### Context actions

#### setContexts

```ts
setContexts(contexts: AnnotationContext[]): void
```

Set the available annotation contexts.

#### setActiveContext

```ts
setActiveContext(contextId: AnnotationContextId | null): void
```

Set the active context.

---

## Store factory functions

These are lower-level primitives used by `AnnotatorProvider`. They are exported for advanced use cases where you need direct access to the individual state stores.

### createAnnotationStore

```ts
function createAnnotationStore(): {
  state: AnnotationState;
  setState: SetStoreFunction<AnnotationState>;
};
```

### createUIStore

```ts
function createUIStore(): {
  state: UIState;
  setState: SetStoreFunction<UIState>;
};
```

### createContextStore

```ts
function createContextStore(): {
  state: ContextState;
  setState: SetStoreFunction<ContextState>;
};
```

### createActions

```ts
function createActions(
  setAnnotationState: SetStoreFunction<AnnotationState>,
  setUIState: SetStoreFunction<UIState>,
  setContextState: SetStoreFunction<ContextState>,
  contextState: ContextState,
): Actions;
```

### createConstraintStatus

```ts
function createConstraintStatus(
  contextState: ContextState,
  annotationState: AnnotationState,
  currentImageId: Accessor<ImageId | undefined>,
): Accessor<ConstraintStatus>;
```

Creates a reactive accessor that derives tool enable/disable status from the current context, annotations, and active image.
