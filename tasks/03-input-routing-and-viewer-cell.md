# Task 03 — Input Routing & ViewerCell Component

**Depends on:** Task 02
**Spec sections:** §5.3, §8.2

## Objective

Implement the input routing mechanism that switches between OSD navigation and Fabric annotation modes, and wrap everything into a reusable `ViewerCell` SolidJS component.

## Steps

### 1. Implement input routing in `fabric-overlay.ts`

Extend the overlay to manage the navigation ↔ annotation mode switching:

**Navigation mode (default):**
- Fabric canvas has `pointer-events: none` (or `canvas.selection = false` and all objects `evented = false`).
- OSD handles all pointer events for pan/zoom.

**Annotation mode (a tool is active):**
- Fabric canvas has `pointer-events: auto`.
- OSD mouse navigation is disabled: `viewer.setMouseNavEnabled(false)`.
- Fabric canvas receives pointer events for drawing.
- Zoom should still be available via keyboard (spacebar is reserved for temporary pan mode).

**Selection mode (select tool active):**
- Fabric canvas intercepts clicks on existing annotation objects.
- Clicks on empty areas should ideally pass through to OSD. Implementation approach: use Fabric's `mouse:down` event — if the click doesn't hit any Fabric object (`event.target === null`), programmatically re-enable OSD navigation for that gesture.

Add a method to the overlay:
```typescript
setMode(mode: 'navigation' | 'annotation' | 'selection'): void;
```

### 2. Create `src/components/ViewerCell.tsx`

A SolidJS component that encapsulates one OSD viewer + Fabric overlay:

```typescript
interface ViewerCellProps {
  imageSource: ImageSource | undefined;
  isActive: boolean;
  onActivate: () => void;
  // ... more props will be added in later tasks
}
```

**Implementation:**
- Render a `<div>` container with a ref.
- On `onMount`: initialize OSD viewer inside the div. Open the `imageSource` tile source.
- On `onMount`: create a `FabricOverlay` attached to the viewer.
- On `onCleanup`: destroy the overlay and the OSD viewer.
- Use `createEffect` to watch `props.imageSource` — if it changes, close the old tile source and open the new one.
- Use `createEffect` to watch `props.isActive` — apply a visual indicator (CSS border) when active.
- On click of the container div, call `props.onActivate`.

**IMPORTANT SolidJS patterns:**
- Do NOT destructure props.
- Initialize OSD and Fabric in `onMount`, not in the component body.
- Clean up in `onCleanup`.
- Watch prop changes with `createEffect`, not by re-running the component.

### 3. Update the dev app

Replace the direct OSD initialization with:
```tsx
<ViewerCell
  imageSource={{
    id: createImageId('test-1'),
    dziUrl: '/sample-data/test-image.jpg', // type: 'image' for dev
    label: 'Test Image',
  }}
  isActive={true}
  onActivate={() => {}}
/>
```

Add buttons to toggle between navigation and annotation mode to test input routing.

### 4. Write tests

**Unit tests (`tests/unit/overlay/input-routing.test.ts`):**
- Verify that `setMode('navigation')` disables Fabric interactivity and enables OSD navigation.
- Verify that `setMode('annotation')` enables Fabric interactivity and disables OSD navigation.
- Mock the OSD viewer and Fabric canvas.

## NOT in scope for this task

- Drawing tools (the annotation mode doesn't draw yet — just verifying events are routed correctly)
- State management stores
- Grid view (only a single ViewerCell)
- Constraint system

## Verification

1. `pnpm dev` — a `ViewerCell` renders with the test image.
2. In navigation mode: pan and zoom work normally.
3. In annotation mode: OSD pan/zoom is disabled, the Fabric canvas receives pointer events (verify via console log in Fabric's `mouse:down` handler).
4. Switching between modes is clean — no stuck pointer states.
5. `pnpm typecheck` passes.
6. `pnpm test` passes.
