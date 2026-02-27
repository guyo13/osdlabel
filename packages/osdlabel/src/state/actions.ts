import { SetStoreFunction, produce } from 'solid-js/store';
import {
  Annotation,
  AnnotationId,
  ImageId,
  AnnotationType,
  AnnotationState,
  UIState,
  AnnotationContext,
  AnnotationContextId,
  ContextState,
} from '../core/types.js';

export function createActions(
  setAnnotationState: SetStoreFunction<AnnotationState>,
  setUIState: SetStoreFunction<UIState>,
  setContextState: SetStoreFunction<ContextState>,
) {
  function addAnnotation(annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>): void {
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
        state.version += 1;
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
          state.version += 1;
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
          state.version += 1;
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

  function loadAnnotations(byImage: Record<ImageId, Record<AnnotationId, Annotation>>): void {
    setAnnotationState(
      produce((state) => {
        state.byImage = byImage;
        state.version += 1;
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
  };
}
