import { describe, it } from 'vitest';
import { version as FABRIC_VERSION } from 'fabric';
import { createRoot } from 'solid-js';
import { createAnnotationStore } from '../../src/state/annotation-store';
import { createActions } from '../../src/state/actions';
import { createUIStore } from '../../src/state/ui-store';
import { createContextStore } from '../../src/state/context-store';
import {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
  Annotation,
} from '../../src/core/types';

describe('Performance Benchmark', () => {
  const dummyContextId = createAnnotationContextId('ctx1');

  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { setState: setUIState } = createUIStore();
      const { setState: setContextState } = createContextStore();
      const actions = createActions(setAnnotationState, setUIState, setContextState);
      return { annotationState, actions, dispose };
    });
  }

  it('measures JSON.stringify performance vs property access', { timeout: 30000 }, () => {
    const { annotationState, actions, dispose } = createTestStore();
    const NUM_ANNOTATIONS = 1000;
    const NUM_IMAGES = 10;

    // Populate store
    for (let i = 0; i < NUM_IMAGES; i++) {
      const imageId = createImageId(`img${i}`);
      for (let j = 0; j < NUM_ANNOTATIONS / NUM_IMAGES; j++) {
        const dummyAnnotation: Omit<Annotation, 'createdAt' | 'updatedAt'> = {
          id: createAnnotationId(`ann${i}-${j}`),
          imageId: imageId,
          contextId: dummyContextId,
          geometry: {
            type: 'rectangle',
            origin: { x: 0, y: 0 },
            width: 10,
            height: 10,
            rotation: 0
          },
          rawAnnotationData: {
            format: 'fabric' as const,
            fabricVersion: FABRIC_VERSION,
            data: { type: 'Rect', left: 0, top: 0, width: 10, height: 10 },
          },
        };
        actions.addAnnotation(dummyAnnotation);
      }
    }

    // Benchmark JSON.stringify
    const startStringify = performance.now();
    for (let i = 0; i < 100; i++) {
      JSON.stringify(annotationState.byImage);
    }
    const endStringify = performance.now();
    const avgStringify = (endStringify - startStringify) / 100;
    console.log(`[Benchmark] Average JSON.stringify time: ${avgStringify.toFixed(4)}ms`);

    // Benchmark version access
    const startProp = performance.now();
    for (let i = 0; i < 100; i++) {
      const _ = annotationState.version;
    }
    const endProp = performance.now();
    const avgProp = (endProp - startProp) / 100;
    console.log(`[Benchmark] Average property access time: ${avgProp.toFixed(4)}ms`);

    dispose();
  });
});
