import { SetStoreFunction, produce } from 'solid-js/store';
import { Annotation, AnnotationId, ImageId, AnnotationType, AnnotationState, UIState, AnnotationContext, AnnotationContextId } from '../core/types';
import { ContextState } from './context-store';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export function createActions(
  setAnnotationState: SetStoreFunction<AnnotationState>,
  setUIState: SetStoreFunction<UIState>,
  setContextState: SetStoreFunction<ContextState>
) {
  function addAnnotation(annotation: Annotation): void {
    setAnnotationState(produce((state) => {
      const s = state as Mutable<AnnotationState>;
      const imageAnns = s.byImage[annotation.imageId] ?? {};
      const now = new Date().toISOString();
      imageAnns[annotation.id] = {
        ...annotation,
        createdAt: now,
        updatedAt: now,
      };
      s.byImage[annotation.imageId] = imageAnns;
    }));
  }

  function updateAnnotation(id: AnnotationId, imageId: ImageId, patch: Partial<Omit<Annotation, 'id' | 'imageId'>>): void {
    setAnnotationState(produce((state) => {
      const s = state as Mutable<AnnotationState>;
      const imageAnns = s.byImage[imageId];
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
      const s = state as Mutable<AnnotationState>;
      const imageAnns = s.byImage[imageId];
      if (imageAnns) {
        delete imageAnns[id];
      }
    }));
  }

  function setActiveTool(tool: AnnotationType | 'select' | null): void {
    setUIState(produce((state) => {
      (state as Mutable<UIState>).activeTool = tool;
    }));
  }

  function setActiveCell(cellIndex: number): void {
    setUIState(produce((state) => {
      (state as Mutable<UIState>).activeCellIndex = cellIndex;
    }));
  }

  function setSelectedAnnotation(id: AnnotationId | null): void {
    setUIState(produce((state) => {
      (state as Mutable<UIState>).selectedAnnotationId = id;
    }));
  }

  function assignImageToCell(cellIndex: number, imageId: ImageId): void {
    setUIState(produce((state) => {
      (state as Mutable<UIState>).gridAssignments[cellIndex] = imageId;
    }));
  }

  function setGridDimensions(columns: number, rows: number): void {
    setUIState(produce((state) => {
      const s = state as Mutable<UIState>;
      s.gridColumns = columns;
      s.gridRows = rows;
    }));
  }

  function setContexts(contexts: AnnotationContext[]): void {
    setContextState(produce((state) => {
      state.contexts = contexts;
    }));
  }

  function setActiveContext(contextId: AnnotationContextId | null): void {
    setContextState(produce((state) => {
      state.activeContextId = contextId;
    }));
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
