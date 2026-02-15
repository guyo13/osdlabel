# Task 04 — State Management

**Depends on:** Task 03
**Spec sections:** §7

## Objective

Implement the SolidJS stores that hold annotation state and UI state, plus the action functions that mutate them. This provides the reactive data layer that all tools and components will depend on.

## Steps

### 1. Create `src/state/annotation-store.ts`

Use SolidJS `createStore` for the annotation state:

```typescript
import { createStore, produce } from 'solid-js/store';

const [annotationState, setAnnotationState] = createStore<AnnotationState>({
  byImage: {},
});
```

Wrap this in a factory function or context provider so it can be instantiated per `<Annotator>` component instance.

### 2. Create `src/state/ui-store.ts`

```typescript
const [uiState, setUIState] = createStore<UIState>({
  activeTool: null,
  activeCellIndex: 0,
  gridColumns: 1,
  gridRows: 1,
  gridAssignments: {},
  selectedAnnotationId: null,
});
```

### 3. Create `src/state/context-store.ts`

Hold the annotation contexts and active context:

```typescript
const [contextState, setContextState] = createStore({
  contexts: [] as AnnotationContext[],
  activeContextId: null as AnnotationContextId | null,
});
```

### 4. Create `src/state/actions.ts`

Implement all mutation functions. Each function uses `setStore` with `produce`:

```typescript
function addAnnotation(annotation: Annotation): void {
  setAnnotationState(produce((state) => {
    const imageAnns = state.byImage[annotation.imageId] ?? {};
    imageAnns[annotation.id] = annotation;
    state.byImage[annotation.imageId] = imageAnns;
  }));
}

function updateAnnotation(id: AnnotationId, imageId: ImageId, patch: Partial<Omit<Annotation, 'id' | 'imageId'>>): void { ... }
function deleteAnnotation(id: AnnotationId, imageId: ImageId): void { ... }
function setActiveTool(tool: AnnotationType | 'select' | null): void { ... }
function setActiveCell(cellIndex: number): void { ... }
function setSelectedAnnotation(id: AnnotationId | null): void { ... }
function assignImageToCell(cellIndex: number, imageId: ImageId): void { ... }
function setGridDimensions(columns: number, rows: number): void { ... }
```

**Important:** `addAnnotation` should generate the `createdAt` and `updatedAt` timestamps. `updateAnnotation` should update `updatedAt`.

### 5. Create a SolidJS context provider

Create `src/state/annotator-context.tsx`:

```typescript
const AnnotatorContext = createContext<{
  annotationState: AnnotationState;
  uiState: UIState;
  contextState: ContextState;
  actions: typeof actions;
}>();
```

Create `AnnotatorProvider` component that wraps children with the context. This is instantiated once per `<Annotator>`.

### 6. Create derived state for constraint checking

In `src/state/context-store.ts` or a separate file, create a `createMemo` that computes `ConstraintStatus`:

```typescript
const constraintStatus = createMemo(() => {
  const activeContext = contextState.contexts.find(c => c.id === contextState.activeContextId);
  if (!activeContext) return { enabledTools: [], disabledTools: [] };
  
  return activeContext.tools.map(toolConstraint => {
    const currentCount = countAnnotationsForContextAndType(
      annotationState, activeContext.id, toolConstraint.type
    );
    return {
      type: toolConstraint.type,
      enabled: toolConstraint.maxCount === undefined || currentCount < toolConstraint.maxCount,
      currentCount,
      maxCount: toolConstraint.maxCount,
    };
  });
});
```

### 7. Write unit tests

Create `tests/unit/state/actions.test.ts`:
- Test `addAnnotation` adds to the correct image bucket.
- Test `updateAnnotation` updates the correct annotation and sets `updatedAt`.
- Test `deleteAnnotation` removes the annotation.
- Test `setActiveTool` updates UI state.
- Test that constraint status correctly reflects enabled/disabled tools after adding/deleting annotations.
- Test that reaching a tool limit disables the tool, and deleting re-enables it.

## NOT in scope for this task

- Drawing tools
- UI components (Toolbar, Filmstrip, etc.)
- Serialization (load/save)
- Wiring state to the ViewerCell

## Verification

1. `pnpm typecheck` passes.
2. `pnpm test` passes — all state action tests and constraint tests green.
3. State is fully reactive — changes to stores propagate to derived computations (tested via Vitest with SolidJS test utilities).
