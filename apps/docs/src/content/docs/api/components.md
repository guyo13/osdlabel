---
title: Components
description: SolidJS UI components
---

## Annotator

All-in-one annotation component with toolbar, grid view, filmstrip, and status bar.

```tsx
import { Annotator } from 'osdlabel/components';
```

### Props

`AnnotatorProps` extends `AnnotatorProviderProps` (minus `children`):

| Prop                                  | Type                                                | Default                   | Description                      |
| ------------------------------------- | --------------------------------------------------- | ------------------------- | -------------------------------- |
| `images`                              | `readonly ImageSource[]`                            | (required)                | Available images                 |
| `contexts`                            | `readonly AnnotationContext[]`                      | (required)                | Annotation contexts              |
| `showFilmstrip`                       | `boolean`                                           | `true`                    | Show the filmstrip sidebar       |
| `showGridControls`                    | `boolean`                                           | `false`                   | Show the grid size controls      |
| `showContextSwitcher`                 | `boolean`                                           | `false`                   | Show the context selector        |
| `filmstripPosition`                   | `'left' \| 'right' \| 'bottom'`                     | `'left'`                  | Filmstrip placement              |
| `maxGridSize`                         | `{ columns: number; rows: number }`                 | `{ columns: 4, rows: 4 }` | Maximum grid dimensions          |
| `style`                               | `JSX.CSSProperties`                                 | —                         | Custom style for root container  |
| `initialAnnotations`                  | `Record<ImageId, Record<AnnotationId, Annotation>>` | —                         | Pre-existing annotations         |
| `onAnnotationsChange`                 | `(annotations: Annotation[]) => void`               | —                         | Fires on annotation changes      |
| `onConstraintChange`                  | `(status: ConstraintStatus) => void`                | —                         | Fires on constraint changes      |
| `keyboardShortcuts`                   | `Partial<KeyboardShortcutMap>`                      | —                         | Override default shortcuts       |
| `shouldSkipKeyboardShortcutPredicate` | `(target: HTMLElement) => boolean`                  | —                         | Suppress shortcuts conditionally |

### Example

```tsx
<Annotator
  images={images}
  contexts={contexts}
  showContextSwitcher={true}
  filmstripPosition="left"
  onAnnotationsChange={(anns) => console.log(anns.length)}
/>
```

---

## AnnotatorProvider

Context provider that manages all state stores. Use this when building a custom layout instead of `Annotator`.

```tsx
import { AnnotatorProvider } from 'osdlabel/state';
```

### Props (AnnotatorProviderProps)

| Prop                                  | Type                                                | Default    | Description                      |
| ------------------------------------- | --------------------------------------------------- | ---------- | -------------------------------- |
| `children`                            | `JSX.Element`                                       | (required) | Child components                 |
| `initialAnnotations`                  | `Record<ImageId, Record<AnnotationId, Annotation>>` | —          | Pre-existing annotations         |
| `onAnnotationsChange`                 | `(annotations: Annotation[]) => void`               | —          | Fires on annotation changes      |
| `onConstraintChange`                  | `(status: ConstraintStatus) => void`                | —          | Fires on constraint changes      |
| `keyboardShortcuts`                   | `Partial<KeyboardShortcutMap>`                      | —          | Override default shortcuts       |
| `shouldSkipKeyboardShortcutPredicate` | `(target: HTMLElement) => boolean`                  | —          | Suppress shortcuts conditionally |

### Example

```tsx
<AnnotatorProvider onAnnotationsChange={(anns) => saveAnnotations(anns)}>
  <Toolbar />
  <GridView columns={2} rows={1} maxColumns={4} maxRows={4} images={images} />
  <StatusBar imageId={activeImageId()} />
</AnnotatorProvider>
```

---

## ViewerCell

A single OSD viewer with a Fabric.js overlay. Used internally by `GridView`, but can be used directly for custom layouts.

```tsx
import { ViewerCell } from 'osdlabel/components';
```

### Props (ViewerCellProps)

| Prop             | Type                               | Default        | Description                                         |
| ---------------- | ---------------------------------- | -------------- | --------------------------------------------------- |
| `imageSource`    | `ImageSource \| undefined`         | (required)     | The image to display in this cell                   |
| `isActive`       | `boolean`                          | (required)     | Whether this cell is the active annotation target   |
| `mode`           | `OverlayMode`                      | `'navigation'` | Interaction mode (`'navigation'` or `'annotation'`) |
| `onActivate`     | `() => void`                       | (required)     | Called when the user clicks the cell                |
| `onOverlayReady` | `(overlay: FabricOverlay) => void` | —              | Called when the Fabric overlay is initialized       |

---

## Toolbar

Tool selector that respects the active context's constraints. Shows available tools with count indicators.

```tsx
import { Toolbar } from 'osdlabel/components';

<Toolbar />;
```

No props required — reads state from `useAnnotator()`.

---

## StatusBar

Displays the active context, tool, and annotation count for the current image.

```tsx
import { StatusBar } from 'osdlabel/components';

<StatusBar imageId={activeImageId()} />;
```

| Prop      | Type                   | Description                     |
| --------- | ---------------------- | ------------------------------- |
| `imageId` | `ImageId \| undefined` | The image ID of the active cell |

---

## GridView

MxN grid layout of `ViewerCell` components.

```tsx
import { GridView } from 'osdlabel/components';

<GridView columns={2} rows={2} maxColumns={4} maxRows={4} images={images} />;
```

| Prop         | Type                     | Description               |
| ------------ | ------------------------ | ------------------------- |
| `columns`    | `number`                 | Current number of columns |
| `rows`       | `number`                 | Current number of rows    |
| `maxColumns` | `number`                 | Maximum columns allowed   |
| `maxRows`    | `number`                 | Maximum rows allowed      |
| `images`     | `readonly ImageSource[]` | Available images          |

---

## Filmstrip

Thumbnail sidebar for assigning images to grid cells.

```tsx
import { Filmstrip } from 'osdlabel/components';

<Filmstrip images={images} position="left" />;
```

| Prop       | Type                            | Description                    |
| ---------- | ------------------------------- | ------------------------------ |
| `images`   | `readonly ImageSource[]`        | Available images               |
| `position` | `'left' \| 'right' \| 'bottom'` | Placement relative to the grid |

Clicking a thumbnail assigns that image to the active cell. Assigned images are highlighted.

---

## GridControls

UI controls for adjusting grid dimensions.

```tsx
import { GridControls } from 'osdlabel/components';

<GridControls maxColumns={4} maxRows={4} />;
```

| Prop         | Type     | Description             |
| ------------ | -------- | ----------------------- |
| `maxColumns` | `number` | Maximum columns allowed |
| `maxRows`    | `number` | Maximum rows allowed    |

---

## ContextSwitcher

UI control for switching between available annotation contexts.

```tsx
import { ContextSwitcher } from 'osdlabel/components';

<ContextSwitcher label="Task:" />;
```

| Prop    | Type     | Description         |
| ------- | -------- | ------------------- |
| `label` | `string` | Optional text label |
