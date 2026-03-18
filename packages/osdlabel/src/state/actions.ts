import { type SetStoreFunction, produce } from 'solid-js/store';
import type {
  Annotation,
  AnnotationId,
  ImageId,
  AnnotationType,
  AnnotationState,
  UIState,
  AnnotationContext,
  AnnotationContextId,
  ContextState,
  ViewTransform,
} from '../core/types.js';
import { DEFAULT_CELL_TRANSFORM } from '../core/types.js';
import { isContextScopedToImage } from '../core/context-scoping.js';
import { DEFAULT_VIEW_TRANSFORM } from '../core/types.js';

export function createActions(
  setAnnotationState: SetStoreFunction<AnnotationState>,
  setUIState: SetStoreFunction<UIState>,
  setContextState: SetStoreFunction<ContextState>,
  contextState: ContextState,
  uiState: UIState,
) {
  function addAnnotation(annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>): void {
    const ctx = contextState.contexts.find((c) => c.id === annotation.contextId);
    if (ctx && !isContextScopedToImage(ctx, annotation.imageId)) {
      console.warn(`Context "${ctx.label}" not scoped to image "${annotation.imageId}"`);
      return;
    }

    setAnnotationState(
      produce((state) => {
        const imageAnns = state.byImage[annotation.imageId] ?? {};
        const now = new Date().toISOString();
        imageAnns[annotation.id] = {
          ...annotation,
          createdAt: now,
          updatedAt: now,
        };
        state.byImage[annotation.imageId] = imageAnns;
        state.changeCounter += 1;
      }),
    );
  }

  function updateAnnotation(
    id: AnnotationId,
    imageId: ImageId,
    patch: Partial<Omit<Annotation, 'id' | 'imageId' | 'createdAt' | 'updatedAt'>>,
  ): void {
    setAnnotationState(
      produce((state) => {
        const imageAnns = state.byImage[imageId];
        if (imageAnns && imageAnns[id]) {
          imageAnns[id] = {
            ...imageAnns[id],
            ...patch,
            updatedAt: new Date().toISOString(),
          };
          state.changeCounter += 1;
        }
      }),
    );
  }

  function deleteAnnotation(id: AnnotationId, imageId: ImageId): void {
    setAnnotationState(
      produce((state) => {
        const imageAnns = state.byImage[imageId];
        if (imageAnns) {
          delete imageAnns[id];
          state.changeCounter += 1;
        }
      }),
    );
  }

  function setActiveTool(tool: AnnotationType | 'select' | null): void {
    setUIState('activeTool', tool);
  }

  function setActiveCell(cellIndex: number): void {
    setUIState('activeCellIndex', cellIndex);
  }

  function setSelectedAnnotation(id: AnnotationId | null): void {
    setUIState('selectedAnnotationId', id);
  }

  function assignImageToCell(cellIndex: number, imageId: ImageId): void {
    setUIState(
      produce((state) => {
        state.gridAssignments[cellIndex] = imageId;
        // Reset visual adjustments when a new image is assigned to the cell
        state.cellTransforms[cellIndex] = { ...DEFAULT_CELL_TRANSFORM };
      }),
    );
  }

  function setGridDimensions(columns: number, rows: number): void {
    setUIState(
      produce((state) => {
        state.gridColumns = columns;
        state.gridRows = rows;

        // Prune cell transforms for cells that no longer exist in the new grid
        const maxIndex = columns * rows - 1;
        for (const indexStr of Object.keys(state.cellTransforms)) {
          const index = parseInt(indexStr, 10);
          if (index > maxIndex) {
            delete state.cellTransforms[index];
          }
        }
      }),
    );
  }

  function setContexts(contexts: AnnotationContext[]): void {
    setContextState('contexts', contexts);
  }

  function setActiveContext(contextId: AnnotationContextId | null): void {
    setContextState('activeContextId', contextId);
  }

  function setDisplayedContexts(contextIds: AnnotationContextId[]): void {
    setContextState('displayedContextIds', contextIds);
  }

  function loadAnnotations(
    byImage: Record<ImageId, Record<AnnotationId, Annotation>>,
    viewTransforms: Record<ImageId, ViewTransform> = {},
  ): void {
    setAnnotationState(
      produce((state) => {
        state.byImage = byImage;
        state.viewTransforms = viewTransforms;
        state.changeCounter += 1;
      }),
    );
  }

  function getActiveImageId(): ImageId | undefined {
    return uiState.gridAssignments[uiState.activeCellIndex];
  }

  function modifyViewTransform(
    imageId: ImageId,
    modifier: (vt: ViewTransform) => ViewTransform,
  ): void {
    setAnnotationState(
      produce((state) => {
        const current = state.viewTransforms[imageId] ?? { ...DEFAULT_VIEW_TRANSFORM };
        state.viewTransforms[imageId] = modifier(current);
        state.changeCounter += 1;
      }),
    );
  }

  function rotateActiveImageCW(): void {
    const imageId = getActiveImageId();
    if (!imageId) return;
    modifyViewTransform(imageId, (vt) => ({ ...vt, rotation: (vt.rotation + 90) % 360 }));
  }

  function rotateActiveImageCCW(): void {
    const imageId = getActiveImageId();
    if (!imageId) return;
    modifyViewTransform(imageId, (vt) => ({ ...vt, rotation: (vt.rotation + 270) % 360 }));
  }

  function flipActiveImageH(): void {
    const imageId = getActiveImageId();
    if (!imageId) return;
    modifyViewTransform(imageId, (vt) => ({ ...vt, flippedH: !vt.flippedH }));
  }

  function flipActiveImageV(): void {
    const imageId = getActiveImageId();
    if (!imageId) return;
    modifyViewTransform(imageId, (vt) => ({ ...vt, flippedV: !vt.flippedV }));
  }

  function toggleActiveImageNegative(): void {
    const cellIndex = uiState.activeCellIndex;
    setUIState(
      produce((state) => {
        const current = state.cellTransforms[cellIndex] ?? { ...DEFAULT_CELL_TRANSFORM };
        state.cellTransforms[cellIndex] = { ...current, inverted: !current.inverted };
      }),
    );
  }

  function increaseActiveImageExposure(): void {
    const cellIndex = uiState.activeCellIndex;
    setUIState(
      produce((state) => {
        const current = state.cellTransforms[cellIndex] ?? { ...DEFAULT_CELL_TRANSFORM };
        const exposure = Math.min(current.exposure + 0.1, 1);
        state.cellTransforms[cellIndex] = { ...current, exposure: Math.round(exposure * 10) / 10 };
      }),
    );
  }

  function decreaseActiveImageExposure(): void {
    const cellIndex = uiState.activeCellIndex;
    setUIState(
      produce((state) => {
        const current = state.cellTransforms[cellIndex] ?? { ...DEFAULT_CELL_TRANSFORM };
        const exposure = Math.max(current.exposure - 0.1, -1);
        state.cellTransforms[cellIndex] = { ...current, exposure: Math.round(exposure * 10) / 10 };
      }),
    );
  }

  function setActiveImageExposure(value: number): void {
    const cellIndex = uiState.activeCellIndex;
    setUIState(
      produce((state) => {
        const current = state.cellTransforms[cellIndex] ?? { ...DEFAULT_CELL_TRANSFORM };
        const exposure = Math.max(Math.min(value, 1), -1);
        // Ensure consistent 1-decimal rounding
        state.cellTransforms[cellIndex] = { ...current, exposure: Math.round(exposure * 10) / 10 };
      }),
    );
  }

  function resetActiveImageView(): void {
    const imageId = getActiveImageId();
    if (imageId) {
      modifyViewTransform(imageId, () => ({ ...DEFAULT_VIEW_TRANSFORM }));
    }

    // Reset only the active cell's adjustments; other cells' transforms remain untouched in state
    const cellIndex = uiState.activeCellIndex;
    setUIState(
      produce((state) => {
        state.cellTransforms[cellIndex] = { ...DEFAULT_CELL_TRANSFORM };
      }),
    );
  }

  return {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setActiveTool,
    setActiveCell,
    setSelectedAnnotation,
    assignImageToCell,
    setGridDimensions,
    setContexts,
    setActiveContext,
    setDisplayedContexts,
    loadAnnotations,
    rotateActiveImageCW,
    rotateActiveImageCCW,
    flipActiveImageH,
    flipActiveImageV,
    toggleActiveImageNegative,
    increaseActiveImageExposure,
    decreaseActiveImageExposure,
    setActiveImageExposure,
    resetActiveImageView,
  };
}
