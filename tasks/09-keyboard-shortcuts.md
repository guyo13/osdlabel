# Task 09 — Keyboard Shortcuts

**Depends on:** Task 08
**Spec sections:** §10

## Objective

Implement the keyboard shortcut system with default bindings and consumer overrides.

## Steps

### 1. Create `src/hooks/useKeyboard.ts`

A SolidJS hook that registers global keyboard event listeners:

- Listen on `'keydown'` and `'keyup'` on `document` (or the annotator root element).
- Maintain a map of `key → action` from the merged shortcut config (defaults + overrides from props).
- **Suppress shortcuts** when the active element is a text input, textarea, or contenteditable.
- Handle modifier keys if needed.

### 2. Implement all default shortcuts from §10

| Key | Action function |
|---|---|
| `V` | `setActiveTool('select')` |
| `R` | `setActiveTool('rectangle')` |
| `C` | `setActiveTool('circle')` |
| `L` | `setActiveTool('line')` |
| `P` | `setActiveTool('point')` |
| `D` | `setActiveTool('path')` |
| `Escape` | Cancel current drawing OR deselect OR set tool to null |
| `Delete` / `Backspace` | Delete selected annotation |
| `1`–`9` | `setActiveCell(n - 1)` |
| `+` / `=` | Increment grid columns (up to max) |
| `-` | Decrement grid columns (down to 1) |

**Escape behavior (cascading):**
1. If currently drawing (tool in mid-interaction): cancel the drawing.
2. Else if an annotation is selected: deselect it.
3. Else if a tool is active: switch to navigation mode (tool = null).

**Tool shortcuts + constraints:**
- When the user presses a tool shortcut key (e.g., `R` for rectangle), check if that tool is enabled by the constraint system.
- If disabled, ignore the keypress.

### 3. Support custom overrides via props

The `keyboardShortcuts` prop is a `Partial<KeyboardShortcutMap>` that overrides specific bindings. The hook merges defaults with overrides:

```typescript
const shortcuts = { ...DEFAULT_KEYBOARD_SHORTCUTS, ...props.keyboardShortcuts };
```

### 4. Clean up on unmount

Register event listeners in `onMount`, remove in `onCleanup`. The hook should be instantiated once inside the `AnnotatorProvider`.

### 5. Write E2E tests

**`tests/e2e/keyboard.spec.ts`:**
- Press `R`, draw a rectangle, verify it works.
- Press `V`, click an annotation, verify it's selected.
- Press `Delete`, verify the annotation is removed.
- Press `Escape` to cycle through: cancel drawing → deselect → navigation mode.
- Press `1`, `2` to switch grid cells.
- Press `+` to expand grid.

## NOT in scope for this task

- Nothing — this is the last feature task before final testing.

## Verification

1. All default shortcuts work as specified.
2. Escape cascading works correctly.
3. Shortcuts are suppressed when typing in a text input.
4. Custom shortcut overrides work.
5. `pnpm typecheck` passes.
6. `pnpm test:e2e` passes (keyboard spec).
