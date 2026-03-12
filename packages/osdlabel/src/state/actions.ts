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
import { isContextScopedToImage } from '../core/context-scoping.js';
import { DEFAULT_VIEW_TRANSFORM, DEFAULT_CELL_TRANSFORM } from '../core/types.js';

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
    setUIState('gridAssignments', cellIndex, imageId);
  }

  function setGridDimensions(columns: number, rows: number): void {
    setUIState(
      produce((state) => {
        state.gridColumns = columns;
        state.gridRows = rows;
      }),
    );
  }

  function setContexts(contexts: AnnotationContext[]): void {
    setContextState('contexts', contexts);
  }

  function setActiveContext(contextId: AnnotationContextId | null): void {
    setContextState('activeContextId', contextId);
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

  function modifyViewTransform(imageId: ImageId, modifier: (vt: ViewTransform) => ViewTransform): void {
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

  function resetActiveImageView(): void {
    const imageId = getActiveImageId();
    if (!imageId) return;
    modifyViewTransform(imageId, () => ({ ...DEFAULT_VIEW_TRANSFORM }));
  }

  function setActiveCellExposure(exposure: number): void {
    setUIState(
      produce((state) => {
        const cellIndex = state.activeCellIndex;
        const current = state.cellTransforms[cellIndex] ?? { ...DEFAULT_CELL_TRANSFORM };
        state.cellTransforms[cellIndex] = { ...current, exposure };
      }),
    );
  }

  function toggleActiveCellNegative(): void {
    setUIState(
      produce((state) => {
        const cellIndex = state.activeCellIndex;
        const current = state.cellTransforms[cellIndex] ?? { ...DEFAULT_CELL_TRANSFORM };
        state.cellTransforms[cellIndex] = { ...current, negative: !current.negative };
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
    loadAnnotations,
    rotateActiveImageCW,
    rotateActiveImageCCW,
    flipActiveImageH,
    flipActiveImageV,
    resetActiveImageView,
    setActiveCellExposure,
    toggleActiveCellNegative,
  };
}
