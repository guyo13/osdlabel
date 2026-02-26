# Task 10 — Testing, Documentation & Polish

**Depends on:** Task 09
**Spec sections:** §11, §3 (docs/), §13

## Objective

Fill in any missing test coverage, write documentation, fix edge cases, and verify the library is ready for consumption.

## Steps

### 1. Audit and fill unit test gaps

Run `pnpm test --coverage` and identify modules below 90% line coverage. Priority areas:

- `src/core/annotations/model.ts` — factory functions, validation
- `src/core/annotations/constraints.ts` — edge cases (empty contexts, all tools unlimited, zero maxCount)
- `src/overlay/fabric-overlay.ts` — coordinate transforms under rotation
- `src/state/actions.ts` — concurrent modification scenarios

### 2. Write missing E2E tests

Ensure all these scenarios have E2E coverage:

**`tests/e2e/drawing.spec.ts`:**

- Draw each annotation type and verify it persists across pan/zoom.
- Draw on a zoomed-in view, zoom out, verify annotation is at the correct position.

**`tests/e2e/editing.spec.ts`:**

- Select and move an annotation, verify updated coordinates in state.
- Select and resize, verify.
- Select and rotate, verify.
- Delete via keyboard and verify removal.

**`tests/e2e/grid-view.spec.ts`:** (augment from Task 08)

- 3x3 grid with all cells populated and annotated.
- Resize to 2x2 and back to 3x3 — verify state preservation.

**`tests/e2e/constraints.spec.ts`:** (augment from Task 06)

- Full multi-context workflow: switch contexts, annotate, hit limits, switch back.

### 3. Visual regression tests

For a subset of critical scenarios, add screenshot assertions:

```typescript
await expect(page).toHaveScreenshot('single-viewer-with-annotations.png', {
  maxDiffPixelRatio: 0.01,
});
```

Generate baseline screenshots and commit them.

### 4. Write `docs/API.md`

Document all public exports:

- `<Annotator>` component and all its props.
- `Annotation`, `AnnotationContext`, `ImageSource` types.
- `AnnotationDocument` serialization format.
- Tool types and their drawing behaviors.
- Keyboard shortcuts.
- Example usage code.

### 5. Write `docs/ARCHITECTURE.md`

Internal documentation for contributors:

- High-level architecture diagram (text-based).
- Overlay integration explanation.
- State management flow.
- How to add a new tool type.
- How the constraint system works.

### 6. Write `docs/CONSTRAINTS.md`

Dedicated documentation for the constraint system:

- Concept explanation.
- `AnnotationContext` and `ToolConstraint` type references.
- Example configurations for common use cases.
- Behavior specification (what happens when limits are reached, etc.).

### 7. Write `README.md`

- Project description and purpose.
- Installation instructions (`pnpm add @guyo13/osdlabel solid-js`).
- Quick start example (minimal code to render the annotator).
- Link to full API docs.
- Development setup instructions.
- License.

### 8. Edge case polish

Test and fix these known tricky scenarios:

- **Rapid tool switching:** Switch tools multiple times quickly. Ensure no orphaned preview objects or stuck event handlers.
- **Window resize during annotation:** Resize the browser while drawing. The overlay should re-sync.
- **Image load failure:** If a DZI URL fails to load, the ViewerCell should show an error state, not crash.
- **Empty grid cell activation:** Activating a cell with no image should disable all tools.
- **Very large annotation counts:** Test with 100+ annotations on one image. Verify rendering performance stays within the budget (< 32ms Fabric render time per §13).

### 9. Clean up barrel exports

Ensure `src/index.ts` exports exactly and only the public API:

```typescript
// Components
export { Annotator } from './components/Annotator.js';
export type { AnnotatorProps } from './components/Annotator.js';

// Types
export type {
  Annotation,
  AnnotationId,
  AnnotationType,
  AnnotationContext,
  AnnotationContextId,
  AnnotationStyle,
  AnnotationDocument,
  Geometry,
  Point,
  ImageSource,
  ImageId,
  ToolConstraint,
  ConstraintStatus,
  KeyboardShortcutMap,
} from './core/types.js';

// Utilities
export { serialize, deserialize } from './core/annotations/serialization.js';
export { createAnnotationId, createImageId, createAnnotationContextId } from './core/types.js';
```

### 10. Final build verification

```bash
pnpm build
```

Verify:

- `dist/` contains `.js` and `.d.ts` files.
- No `src/` paths leak into the declarations.
- A consumer project can `import { Annotator } from '@guyo13/osdlabel'` and get full type information.

## Verification

1. `pnpm typecheck` — zero errors.
2. `pnpm test` — all pass, coverage ≥ 90% on core modules.
3. `pnpm test:e2e` — all pass, visual regression baselines committed.
4. `pnpm build` — clean output in `dist/`.
5. `pnpm lint` — zero warnings.
6. README, API.md, ARCHITECTURE.md, CONSTRAINTS.md all present and accurate.
7. Dev app demonstrates all features working together.
