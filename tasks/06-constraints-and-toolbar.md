# Task 06 — Constraint System & Toolbar Component

**Depends on:** Task 05
**Spec sections:** §6, §8.5

## Objective

Wire the constraint engine to the drawing tools so that tool limits are enforced, and build the Toolbar component that reflects constraint state.

## Steps

### 1. Implement constraint enforcement in tool activation

Create `src/hooks/useConstraints.ts`:

```typescript
function useConstraints() {
  // Returns a reactive accessor for each tool's enabled/disabled state
  const isToolEnabled = (type: AnnotationType): boolean => {
    // Read from the constraintStatus memo created in Task 04
  };

  const canAddAnnotation = (type: AnnotationType): boolean => {
    // Same check — can be used by tools before committing
  };

  return { isToolEnabled, canAddAnnotation };
}
```

### 2. Gate annotation creation on constraints

Modify each tool's commit step (in `onPointerUp` or equivalent):
- Before calling `addAnnotation`, check `canAddAnnotation(this.type)`.
- If false, cancel the drawing and discard the preview object.
- This is a safety net — the UI should prevent reaching this state by disabling the tool button.

### 3. Auto-switch away from disabled tools

In the `useAnnotationTool` hook, add a `createEffect` that watches `isToolEnabled(activeTool)`. If the active tool becomes disabled (because the limit was just reached), automatically switch to the select tool:

```typescript
createEffect(() => {
  const tool = uiState.activeTool;
  if (tool && tool !== 'select' && !isToolEnabled(tool)) {
    actions.setActiveTool('select');
  }
});
```

### 4. Build `src/components/Toolbar.tsx`

A SolidJS component that renders tool buttons:
- One button per tool type allowed by the active context.
- The select tool button is always present.
- A navigation mode button (sets tool to `null`).
- Each button shows enabled/disabled state based on `isToolEnabled`.
- The active tool is visually highlighted.
- Each button shows the current count / max count (e.g., "Rect 2/3").
- Clicking a disabled button does nothing.
- Style with basic CSS (no external UI library needed).

### 5. Build `src/components/StatusBar.tsx`

A small bar (below or above the viewer) showing:
- Active context label.
- Active tool name.
- Total annotation count for the current image.

### 6. Update the dev app

Replace the raw buttons with `<Toolbar>` and `<StatusBar>`. Set up multiple annotation contexts to test switching:

```tsx
const contexts = [
  {
    id: 'ctx-1' as AnnotationContextId,
    label: 'Fracture',
    tools: [
      { type: 'line', maxCount: 3 },
      { type: 'rectangle', maxCount: 2 },
    ],
  },
  {
    id: 'ctx-2' as AnnotationContextId,
    label: 'Pneumothorax',
    tools: [
      { type: 'path', maxCount: 1 },
      { type: 'circle', maxCount: 2 },
    ],
  },
];
```

Add a dropdown to switch between contexts.

### 7. Write unit tests

**`tests/unit/constraints/enforcement.test.ts`:**
- Set up a context with `rectangle` maxCount: 2.
- Add 2 rectangles. Verify the tool is now disabled.
- Delete 1 rectangle. Verify the tool is re-enabled.
- Switch contexts. Verify tool availability changes.
- Test edge case: unlimited tools (no maxCount) never become disabled.

### 8. Write E2E test

**`tests/e2e/constraints.spec.ts`:**
- Load the dev app with the test contexts.
- Draw 3 lines (hitting the limit).
- Verify the line tool button becomes visually disabled.
- Verify clicking it does nothing.
- Delete one line.
- Verify the line tool button is re-enabled.

## NOT in scope for this task

- Grid view
- Filmstrip
- Keyboard shortcuts
- Serialization

## Verification

1. Toolbar shows only tools allowed by the active context.
2. Drawing to the limit disables the tool button.
3. Active tool auto-switches to select when its limit is reached.
4. Deleting an annotation re-enables the tool.
5. Switching contexts updates the toolbar.
6. StatusBar shows correct context and counts.
7. `pnpm typecheck` passes.
8. `pnpm test` passes.
9. `pnpm test:e2e` passes (constraints spec).
