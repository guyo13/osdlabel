# Task 05 — Annotation Drawing Tools

**Depends on:** Task 04
**Spec sections:** §9

## Objective

Implement all six annotation tools (rectangle, circle, line, point, path, select) and wire them to the state store and overlay.

## Steps

### 1. Create `src/core/tools/base-tool.ts`

Define the abstract tool interface from §9.1. All tools implement this interface. Add a `createAnnotationFromFabricObject` utility that reads a Fabric object's geometry and converts it to an `Annotation` in image-space coordinates.

### 2. Implement each tool

**`src/core/tools/rectangle-tool.ts`:**

- `onPointerDown`: record start point, create a temporary `fabric.Rect` with dashed stroke.
- `onPointerMove`: update the rect's width/height based on current pointer position.
- `onPointerUp`: compute final geometry in image-space (use overlay's `screenToImage`), create the `Annotation`, call `addAnnotation` action, remove the preview rect, add the final Fabric `Rect` styled with the annotation's style.
- Handle negative-direction drags (dragging up-left from start point).

**`src/core/tools/circle-tool.ts`:**

- `onPointerDown`: record center point, create a temporary `fabric.Circle`.
- `onPointerMove`: set radius based on distance from center to current pointer.
- `onPointerUp`: commit.

**`src/core/tools/line-tool.ts`:**

- `onPointerDown`: record start, create a temporary `fabric.Line`.
- `onPointerMove`: update end point.
- `onPointerUp`: commit.

**`src/core/tools/point-tool.ts`:**

- `onPointerDown`: immediately create a small `fabric.Circle` marker (fixed screen radius, e.g., 5px) at the click location. Commit immediately — no drag interaction.
- No `onPointerMove` or `onPointerUp` needed.

**`src/core/tools/path-tool.ts`:**

- `onPointerDown`: add a point to the current path. If this is the first point, create a temporary `fabric.Polyline`. On subsequent clicks, add points.
- `onPointerMove`: show a "rubber band" line from the last point to the cursor.
- Double-click or Enter: commit the path. Convert to `fabric.Path` or `fabric.Polyline`.
- Escape: cancel and remove all preview objects.
- The committed annotation stores the path as an array of `Point`s.

**`src/core/tools/select-tool.ts`:**

- Enables Fabric's built-in selection on the canvas.
- On `object:selected` Fabric event: update `selectedAnnotationId` in UI state.
- On `selection:cleared`: set `selectedAnnotationId` to null.
- On `object:modified` (after move/resize/rotate): read the updated geometry from the Fabric object, convert to image-space, call `updateAnnotation`.
- On Delete/Backspace keypress while an annotation is selected: call `deleteAnnotation`, remove the Fabric object from the canvas.

### 3. Create `src/hooks/useAnnotationTool.ts`

A SolidJS hook that:

- Reads `uiState.activeTool` signal.
- Maintains a reference to the currently active tool instance.
- When `activeTool` changes (via `createEffect`), deactivates the previous tool and activates the new one.
- Passes the overlay reference to the tool's `activate` method.
- Registers pointer event handlers on the Fabric canvas that delegate to the active tool.

### 4. Wire tools into ViewerCell

Update `ViewerCell.tsx` to use the `useAnnotationTool` hook. The cell should:

- Use `createEffect` to watch `uiState.activeTool` and `props.isActive`.
- When active and a tool is selected, set the overlay to annotation mode and activate the tool.
- When inactive, set the overlay to navigation mode and deactivate any tool.

### 5. Update the dev app

Add a simple toolbar (just buttons for now — the real Toolbar component comes later):

- Buttons for each tool type + select + navigate (null tool).
- Clicking a tool button calls `setActiveTool(type)`.
- Display annotation count.

### 6. Wire annotations to Fabric canvas rendering

When annotations exist in state for an image, they must be rendered as Fabric objects on the canvas. Create a `createEffect` in ViewerCell that:

- Watches the annotation state slice for the cell's current image.
- Diffs against the current Fabric objects on the canvas.
- Adds new Fabric objects for new annotations, removes Fabric objects for deleted annotations.
- Does NOT re-create objects that haven't changed (to avoid losing selection state).

**IMPORTANT:** Fabric objects created by the select tool's modification flow should update the store, not the other way around. Avoid circular updates: when a Fabric `object:modified` triggers a store update, the effect that syncs store → canvas should skip re-creating that object.

### 7. Write unit tests

**`tests/unit/tools/rectangle-tool.test.ts`** (and similar for each tool):

- Mock the overlay and its coordinate conversion methods.
- Simulate pointer event sequences.
- Verify the tool produces the correct `Annotation` geometry.
- Test edge cases: zero-size rectangles, paths with only one point, etc.

**`tests/unit/tools/select-tool.test.ts`:**

- Verify that moving an object updates the annotation in the store.
- Verify that deleting updates the store.

## NOT in scope for this task

- Constraint enforcement (tools don't check limits yet)
- Toolbar component (using raw buttons in dev app)
- Grid view
- Filmstrip
- Keyboard shortcuts (except Delete in select tool)
- Drawing preview styling refinement

## Verification

1. `pnpm dev` — can draw rectangles, circles, lines, points, and paths on the image.
2. Drawn annotations stay pinned to the image during pan/zoom.
3. Select tool: can click to select, drag to move, use handles to resize/rotate.
4. Select tool: Delete key removes the selected annotation.
5. Path tool: click-click-click then double-click creates a multi-point path.
6. Switching tools cleans up the previous tool's state.
7. `pnpm typecheck` passes.
8. `pnpm test` passes.
