import { createStore } from 'solid-js/store';
import { createMemo } from 'solid-js';
import { ContextState, AnnotationContextId, AnnotationState, ConstraintStatus, AnnotationType } from '../core/types.js';

export function createContextStore() {
  const [state, setState] = createStore<ContextState>({
    contexts: [],
    activeContextId: null,
  });
  return { state, setState };
}

export function createConstraintStatus(contextState: ContextState, annotationState: AnnotationState) {
  return createMemo<ConstraintStatus>(() => {
    const activeContext = contextState.contexts.find(c => c.id === contextState.activeContextId);

    const allTypes: AnnotationType[] = ['rectangle', 'circle', 'line', 'point', 'path'];
    const result: Partial<ConstraintStatus> = {};

    if (!activeContext) {
      for (const type of allTypes) {
        result[type] = { enabled: false, currentCount: 0, maxCount: null };
      }
      return result as ConstraintStatus;
    }

    for (const type of allTypes) {
      const toolConstraint = activeContext.tools.find(t => t.type === type);
      if (!toolConstraint) {
        result[type] = { enabled: false, currentCount: 0, maxCount: null };
      } else {
        const currentCount = countAnnotationsForContextAndType(
          annotationState, activeContext.id, type
        );
        const maxCount = toolConstraint.maxCount ?? null;
        const enabled = maxCount === null || currentCount < maxCount;

        result[type] = {
          enabled,
          currentCount,
          maxCount
        };
      }
    }
    return result as ConstraintStatus;
  });
}

function countAnnotationsForContextAndType(
  annotationState: AnnotationState,
  contextId: AnnotationContextId,
  type: AnnotationType
): number {
  let count = 0;
  for (const imageAnns of Object.values(annotationState.byImage)) {
    if (!imageAnns) continue;
    for (const ann of Object.values(imageAnns)) {
      if (ann.contextId === contextId && ann.geometry.type === type) {
        count++;
      }
    }
  }
  return count;
}
