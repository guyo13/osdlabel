import { SetStoreFunction, produce } from 'solid-js/store';
import { Annotation, AnnotationId, ImageId, AnnotationType, AnnotationState, UIState, AnnotationContext, AnnotationContextId, ContextState } from '../core/types.js';

export function createActions(
  setAnnotationState: SetStoreFunction<AnnotationState>,
  setUIState: SetStoreFunction<UIState>,
  setContextState: SetStoreFunction<ContextState>
) {
  function addAnnotation(annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>): void {
    setAnnotationState(produce((state) => {
      const imageAnns = state.byImage[annotation.imageId] ?? {};
      const now = new Date().toISOString();
      imageAnns[annotation.id] = {
        ...annotation,
        createdAt: now,
        updatedAt: now,
      };
      state.byImage[annotation.imageId] = imageAnns;
    }));
  }

  function updateAnnotation(id: AnnotationId, imageId: ImageId, patch: Partial<Omit<Annotation, 'id' | 'imageId' | 'createdAt' | 'updatedAt'>>): void {
    setAnnotationState(produce((state) => {
      const imageAnns = state.byImage[imageId];
      if (imageAnns && imageAnns[id]) {
        imageAnns[id] = {
          ...imageAnns[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        };
      }
    }));
  }

  function deleteAnnotation(id: AnnotationId, imageId: ImageId): void {
    setAnnotationState(produce((state) => {
      const imageAnns = state.byImage[imageId];
      if (imageAnns) {
        delete imageAnns[id];
      }
    }));
  }

  function setActiveTool(tool: AnnotationType | 'select' | null): void {
    // @ts-ignore - readonly override
    setUIState('activeTool', tool);
  }

  function setActiveCell(cellIndex: number): void {
    // @ts-ignore - readonly override
    setUIState('activeCellIndex', cellIndex);
  }

  function setSelectedAnnotation(id: AnnotationId | null): void {
    // @ts-ignore - readonly override
    setUIState('selectedAnnotationId', id);
  }

  function assignImageToCell(cellIndex: number, imageId: ImageId): void {
    setUIState('gridAssignments', cellIndex, imageId);
  }

  function setGridDimensions(columns: number, rows: number): void {
    setUIState(produce((state) => {
      // @ts-ignore - readonly override
      state.gridColumns = columns;
      // @ts-ignore - readonly override
      state.gridRows = rows;
    }));
  }

  function setContexts(contexts: AnnotationContext[]): void {
    // @ts-ignore - readonly override
    setContextState('contexts', contexts);
  }

  function setActiveContext(contextId: AnnotationContextId | null): void {
    // @ts-ignore - readonly override
    setContextState('activeContextId', contextId);
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
  };
}
