# Task 08 — Grid View & Multi-Image Support

**Depends on:** Task 07
**Spec sections:** §8.3, §8.4

## Objective

Implement the MxN grid layout that hosts multiple independent ViewerCells, and the filmstrip sidebar for assigning images to grid slots.

## Steps

### 1. Create `src/components/GridView.tsx`

A CSS Grid-based layout component:

```typescript
interface GridViewProps {
  columns: number;
  rows: number;
  maxColumns: number;
  maxRows: number;
}
```

- Render a CSS Grid with `columns × rows` cells.
- Each cell contains a `<ViewerCell>`.
- The cell at `uiState.activeCellIndex` has `isActive={true}`.
- Clicking a cell activates it (calls `setActiveCell`).
- Empty cells (no image assigned) show a placeholder: dashed border, "Assign an image" text.

**Layout CSS:**
```css
.grid-view {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 4px;
  width: 100%;
  height: 100%;
}
```

### 2. Manage per-cell OSD viewers

Each `ViewerCell` creates its own OSD viewer. When a cell's assigned image changes (via `gridAssignments`), the ViewerCell closes the old tile source and opens the new one. When a cell goes from having an image to having none (image unassigned), the ViewerCell destroys its OSD viewer.

**Performance:** Only the active cell's Fabric overlay is in interactive mode. All other cells' overlays are in `'navigation'` mode — they display existing annotations but don't accept drawing input.

### 3. Create `src/components/Filmstrip.tsx`

A sidebar component showing thumbnail previews of all available images:

```typescript
interface FilmstripProps {
  images: ImageSource[];
  position: 'left' | 'right' | 'bottom';
}
```

- Render a scrollable list of thumbnail images.
- For each image, display the thumbnail (use `thumbnailUrl` if provided, otherwise create a small OSD viewer or just show a placeholder).
- Show the image label.
- Highlight images that are currently assigned to grid cells.
- On click: assign the clicked image to the currently active grid cell.

**Thumbnail approach:** For the initial implementation, use a simple `<img>` tag with `thumbnailUrl`. If no thumbnail URL is provided, show the label text on a colored background. Do NOT create OSD viewers for thumbnails — that would be too expensive.

### 4. Create the top-level `src/components/Annotator.tsx`

The public component that assembles everything:

```tsx
function Annotator(props: AnnotatorProps) {
  return (
    <AnnotatorProvider {...props}>
      <div class="annotator-root" style={props.style}>
        <Toolbar />
        <div class="annotator-body">
          {props.showFilmstrip !== false && (
            <Filmstrip images={props.images} position="left" />
          )}
          <GridView
            columns={uiState.gridColumns}
            rows={uiState.gridRows}
            maxColumns={props.maxGridSize?.columns ?? 4}
            maxRows={props.maxGridSize?.rows ?? 4}
          />
        </div>
        <StatusBar />
      </div>
    </AnnotatorProvider>
  );
}
```

### 5. Implement grid resize controls

Add simple `+`/`-` buttons (or a dropdown) to change grid dimensions. When grid size changes:
- Existing cell assignments are preserved where possible.
- Cells that no longer exist (e.g., going from 3x3 to 2x2 loses cells 5-8) have their images unassigned and their OSD viewers destroyed.
- The active cell index is clamped to the new valid range.

### 6. Update the dev app

Provide 4+ sample images. The dev app should now show:
- A filmstrip on the left with all available images.
- A grid view (starting at 1x1) with image assignment working.
- Grid resize controls.
- Full annotation workflow on the active cell.

### 7. Write tests

**`tests/e2e/grid-view.spec.ts`:**
- Start at 1x1, expand to 2x2.
- Assign different images to each cell.
- Draw an annotation on cell 0, switch to cell 1, draw there.
- Verify annotations are independent per cell.
- Shrink grid back to 1x1, verify cell 0's annotations are preserved.

**`tests/e2e/filmstrip.spec.ts`:**
- Click a filmstrip thumbnail, verify the active cell loads that image.
- Click a different thumbnail, verify the image changes.
- Verify the filmstrip highlights assigned images.

## NOT in scope for this task

- Drag-and-drop from filmstrip to grid cell (just click-to-assign)
- Keyboard shortcuts (next task)

## Verification

1. Grid view renders with configurable MxN layout.
2. Each cell independently displays a DZI image and accepts annotations.
3. Only the active cell accepts drawing input.
4. Filmstrip shows all available images and assigns on click.
5. Grid resize preserves existing state.
6. `pnpm typecheck` passes.
7. `pnpm test` and `pnpm test:e2e` pass.
