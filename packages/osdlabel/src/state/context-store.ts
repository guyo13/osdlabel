import { createStore } from 'solid-js/store';
import { createMemo } from 'solid-js';
import type {
  ContextState,
  AnnotationContextId,
  AnnotationState,
  ConstraintStatus,
  AnnotationType,
  ImageId,
} from '../core/types.js';
import { isContextScopedToImage, getCountableImageIds } from '../core/context-scoping.js';

export function createContextStore() {
  const [state, setState] = createStore<ContextState>({
    contexts: [],
    activeContextId: null,
  });
  return { state, setState };
}

export function createConstraintStatus(
  contextState: ContextState,
  annotationState: AnnotationState,
  currentImageId: () => ImageId | undefined,
) {
  return createMemo<ConstraintStatus>(() => {
    const activeContext = contextState.contexts.find((c) => c.id === contextState.activeContextId);
    const imgId = currentImageId();

    const allTypes: AnnotationType[] = ['rectangle', 'circle', 'line', 'point', 'path', 'freeHandPath'];
    const result: Partial<ConstraintStatus> = {};

    if (!activeContext || !imgId || !isContextScopedToImage(activeContext, imgId)) {
      for (const type of allTypes) {
        result[type] = { enabled: false, currentCount: 0, maxCount: null };
      }
      return result as ConstraintStatus;
    }

    for (const type of allTypes) {
      const toolConstraint = activeContext.tools.find((t) => t.type === type);
      if (!toolConstraint) {
        result[type] = { enabled: false, currentCount: 0, maxCount: null };
      } else {
        const countScope = toolConstraint.countScope ?? 'global';
        const currentCount = countAnnotationsForContextAndType(
          annotationState,
          activeContext.id,
          type,
          getCountableImageIds(activeContext, imgId, countScope),
        );
        const maxCount = toolConstraint.maxCount ?? null;
        const enabled = maxCount === null || currentCount < maxCount;

        result[type] = {
          enabled,
          currentCount,
          maxCount,
        };
      }
    }
    return result as ConstraintStatus;
  });
}

function countAnnotationsForContextAndType(
  annotationState: AnnotationState,
  contextId: AnnotationContextId,
  type: AnnotationType,
  scopedImageIds?: readonly ImageId[] | undefined,
): number {
  let count = 0;
  const imageBuckets = scopedImageIds
    ? scopedImageIds.map((id) => annotationState.byImage[id])
    : Object.values(annotationState.byImage);

  for (const imageAnns of imageBuckets) {
    if (!imageAnns) continue;
    for (const ann of Object.values(imageAnns)) {
      if (ann.contextId === contextId && ann.geometry.type === type) {
        count++;
      }
    }
  }

  return count;
}
