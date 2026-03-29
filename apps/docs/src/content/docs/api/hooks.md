---
title: Hooks
description: Custom SolidJS hooks
---

## useConstraints

Convenience hook for checking tool availability based on the active context's constraints.

```ts
import { useConstraints } from 'osdlabel/hooks';
```

Must be used within an `AnnotatorProvider`.

### Return value

```ts
{
  isToolEnabled: (type: ToolType) => boolean;
  canAddAnnotation: (type: ToolType) => boolean;
}
```

| Function           | Description                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| `isToolEnabled`    | Returns whether a tool type is enabled (context allows it and limit not reached) |
| `canAddAnnotation` | Same check as `isToolEnabled` — used by tools as a safety net before committing  |

### Example

```tsx
function MyToolbar() {
  const { isToolEnabled } = useConstraints();

  return (
    <div>
      <button disabled={!isToolEnabled('rectangle')}>Rectangle</button>
      <button disabled={!isToolEnabled('circle')}>Circle</button>
    </div>
  );
}
```

---

## useKeyboard

Sets up keyboard shortcut handling. Called automatically by `AnnotatorProvider` — you don't need to call this directly unless building a fully custom setup.

```ts
import { useKeyboard } from 'osdlabel/hooks';
```

### Signature

```ts
function useKeyboard(
  shortcuts: KeyboardShortcutMap,
  activeToolKeyHandlerRef: ActiveToolKeyHandlerRef,
  shouldSkipTargetPredicate?: (target: HTMLElement) => boolean,
): void;
```

| Parameter                   | Description                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `shortcuts`                 | The keyboard shortcut map (default + overrides)                                     |
| `activeToolKeyHandlerRef`   | Ref to the active tool's key handler (for tool-specific keys like path `Enter`/`c`) |
| `shouldSkipTargetPredicate` | Optional callback to suppress shortcuts for specific targets                        |

### Behavior

- Registers a `keydown` listener on `window` via `onMount`
- Automatically suppresses shortcuts in `<input>`, `<textarea>`, and `contenteditable` elements
- Delegates tool-specific keys (path finish/close) to the active tool's handler first
- Cleans up the listener via `onCleanup`

---

## isContextScopedToImage

Utility function for checking if an annotation context applies to a specific image.

```ts
import { isContextScopedToImage } from 'osdlabel/hooks';
```

### Signature

```ts
function isContextScopedToImage(context: AnnotationContext, imageId: ImageId): boolean;
```

Returns `true` if:

- The context has no `imageIds` array (applies to all images), OR
- The `imageIds` array includes the given `imageId`
