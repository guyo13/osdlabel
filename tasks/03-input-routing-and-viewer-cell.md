# Task 03 — Input Routing & ViewerCell Component

**Depends on:** Task 02
**Spec sections:** §5.3, §8.2

## Objective

Implement the input routing mechanism that switches between OSD navigation and Fabric annotation modes, and wrap everything into a reusable `ViewerCell` SolidJS component.

## Steps

### 1. Implement input routing in `fabric-overlay.ts`

Extend the overlay to manage the navigation ↔ annotation mode switching using an OSD `MouseTracker` attached to Fabric's container element. CSS `pointer-events` stays `none`; event routing is handled entirely by the tracker. A re-entrancy guard prevents infinite recursion from synthetic PointerEvents bubbling back.

**Navigation mode (default):**
- Overlay `MouseTracker` disabled (`setTracking(false)`) — events fall through to OSD.
- `canvas.selection = false`, all objects `selectable = false`, `evented = false`.
- OSD handles all pointer events for pan/zoom.
- `discardActiveObject()` is called to clear any lingering Fabric selection.

**Annotation mode (a tool is active or user is selecting/editing):**
- Overlay `MouseTracker` enabled — intercepts pointer events, forwards to Fabric as synthetic `PointerEvent`s.
- `canvas.selection = true`, all objects `selectable = true`, `evented = true`.
- OSD mouse navigation disabled: `viewer.setMouseNavEnabled(false)`.
- Fabric handles drawing new annotations AND selecting/moving existing ones.
- **Pan passthrough:** `Ctrl+drag` (or `Cmd+drag` on macOS) temporarily re-enables OSD nav for that gesture (down→move→up lifecycle).
- **Zoom passthrough:** `Ctrl+scroll` (or `Cmd+scroll`) manually calls `viewport.zoomBy()` around the pointer position. Plain scroll is blocked to prevent page scrolling.

Add a method to the overlay:
```typescript
setMode(mode: 'navigation' | 'annotation'): void;
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

Add buttons to toggle between navigation and annotation mode to test input routing. Display a hint in annotation mode about Ctrl/Cmd+drag to pan and Ctrl/Cmd+scroll to zoom.

### 4. Write tests

**Unit tests (`tests/unit/overlay/input-routing.test.ts`):**

Since `FabricOverlay` requires real DOM + OSD + Fabric (unavailable in jsdom), unit tests use a lightweight mock that mirrors the `setMode` contract to verify the expected state transitions:

- `setMode('navigation')`: tracker off, selection off, objects non-selectable/non-evented, OSD nav enabled.
- `setMode('annotation')`: tracker on, selection on, objects selectable/evented, OSD nav disabled.
- Mode transitions: annotation→navigation, navigation→annotation, idempotent same-mode calls, rapid switching.

**Not covered by unit tests (requires E2E / manual browser testing):**

- Re-entrancy guard preventing infinite recursion in event forwarding.
- Ctrl/Cmd+drag pan passthrough gesture lifecycle.
- Ctrl/Cmd+scroll zoom passthrough via `viewport.zoomBy()`.
- Plain scroll blocking in annotation mode.
- `discardActiveObject()` clearing selection on mode switch to navigation.

## NOT in scope for this task

- Drawing tools (the annotation mode doesn't draw yet — just verifying events are routed correctly)
- State management stores
- Grid view (only a single ViewerCell)
- Constraint system

## Verification

1. `pnpm dev` — a `ViewerCell` renders with the test image.
2. In navigation mode: pan and zoom work normally, annotations are visible but non-interactive.
3. In annotation mode: clicking an annotation selects it (shows Fabric controls), dragging moves it. Ctrl/Cmd+drag pans OSD. Ctrl/Cmd+scroll zooms. Plain scroll is blocked.
4. Switching between modes is clean — no stuck pointer states, selection controls disappear on switch to navigation.
5. `pnpm typecheck` passes.
6. `pnpm test` passes.
