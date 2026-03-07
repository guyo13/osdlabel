---
title: Constants
description: Default configuration values
---

## DEFAULT_ANNOTATION_STYLE

Default visual style applied to new annotations.

```ts
import { DEFAULT_ANNOTATION_STYLE } from 'osdlabel/core';
```

```ts
const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  strokeColor: '#ff0000',
  strokeWidth: 2,
  fillColor: '#ff0000',
  fillOpacity: 0.1,
  opacity: 1,
};
```

Override per-tool via `defaultStyle` in [`ToolConstraint`](/osdlabel/api/types/#toolconstraint).

---

## DEFAULT_GRID_CONFIG

Default grid dimensions on initialization.

```ts
import { DEFAULT_GRID_CONFIG } from 'osdlabel/core';
```

```ts
const DEFAULT_GRID_CONFIG = {
  columns: 1,
  rows: 1,
} as const;
```

---

## MAX_GRID_SIZE

Maximum allowed grid dimensions.

```ts
import { MAX_GRID_SIZE } from 'osdlabel/core';
```

```ts
const MAX_GRID_SIZE = {
  columns: 4,
  rows: 4,
} as const;
```

---

## DEFAULT_KEYBOARD_SHORTCUTS

Default keyboard shortcut bindings. See [Keyboard Shortcuts](/osdlabel/guides/keyboard-shortcuts/) for the full table.

```ts
import { DEFAULT_KEYBOARD_SHORTCUTS } from 'osdlabel/core';
```

```ts
const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutMap = {
  selectTool: 'v',
  rectangleTool: 'r',
  circleTool: 'c',
  lineTool: 'l',
  pointTool: 'p',
  pathTool: 'd',
  cancel: 'Escape',
  delete: 'Delete',
  deleteAlt: 'Backspace',
  gridCell1: '1',
  gridCell2: '2',
  gridCell3: '3',
  gridCell4: '4',
  gridCell5: '5',
  gridCell6: '6',
  gridCell7: '7',
  gridCell8: '8',
  gridCell9: '9',
  increaseGridColumns: '=',
  decreaseGridColumns: '-',
  pathFinish: 'Enter',
  pathClose: 'c',
  pathCancel: 'Escape',
};
```
