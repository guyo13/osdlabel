import { describe, it, expect } from 'vitest';
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

describe('version counter', () => {
  const dummyContextId = createAnnotationContextId('ctx1');
  const imageId = createImageId('img0');

  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { setState: setUIState } = createUIStore();
      const { setState: setContextState } = createContextStore();
      const actions = createActions(setAnnotationState, setUIState, setContextState);
      return { annotationState, actions, dispose };
    });
  }

  function makeAnnotation(index: number): Omit<Annotation, 'createdAt' | 'updatedAt'> {
    return {
      id: createAnnotationId(`ann${index}`),
      imageId,
      contextId: dummyContextId,
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
      rawAnnotationData: {
        format: 'fabric' as const,
        fabricVersion: FABRIC_VERSION,
        data: { type: 'Rect', left: 0, top: 0, width: 10, height: 10 },
      },
    };
  }

  it('starts at zero', () => {
    const { annotationState, dispose } = createTestStore();
    expect(annotationState.version).toBe(0);
    dispose();
  });

  it('increments once per addAnnotation', () => {
    const { annotationState, actions, dispose } = createTestStore();
    actions.addAnnotation(makeAnnotation(0));
    expect(annotationState.version).toBe(1);
    actions.addAnnotation(makeAnnotation(1));
    expect(annotationState.version).toBe(2);
    dispose();
  });

  it('increments on updateAnnotation', () => {
    const { annotationState, actions, dispose } = createTestStore();
    const ann = makeAnnotation(0);
    actions.addAnnotation(ann);
    const vBefore = annotationState.version;
    actions.updateAnnotation(ann.id, imageId, { label: 'updated' });
    expect(annotationState.version).toBe(vBefore + 1);
    dispose();
  });

  it('increments on deleteAnnotation', () => {
    const { annotationState, actions, dispose } = createTestStore();
    const ann = makeAnnotation(0);
    actions.addAnnotation(ann);
    const vBefore = annotationState.version;
    actions.deleteAnnotation(ann.id, imageId);
    expect(annotationState.version).toBe(vBefore + 1);
    dispose();
  });

  it('increments on loadAnnotations', () => {
    const { annotationState, actions, dispose } = createTestStore();
    const vBefore = annotationState.version;
    actions.loadAnnotations({});
    expect(annotationState.version).toBe(vBefore + 1);
    dispose();
  });

  it('is faster than JSON.stringify for change detection (informational)', { timeout: 30000 }, () => {
    const { annotationState, actions, dispose } = createTestStore();
    const NUM_ANNOTATIONS = 1000;

    for (let i = 0; i < NUM_ANNOTATIONS; i++) {
      actions.addAnnotation(makeAnnotation(i));
    }
    expect(annotationState.version).toBe(NUM_ANNOTATIONS);

    const startStringify = performance.now();
    for (let i = 0; i < 100; i++) {
      JSON.stringify(annotationState.byImage);
    }
    const avgStringify = (performance.now() - startStringify) / 100;

    const startProp = performance.now();
    for (let i = 0; i < 100; i++) {
      void annotationState.version;
    }
    const avgProp = (performance.now() - startProp) / 100;

    console.log(`[Benchmark] JSON.stringify avg: ${avgStringify.toFixed(4)}ms  |  version access avg: ${avgProp.toFixed(4)}ms`);
    expect(avgProp).toBeLessThan(avgStringify);

    dispose();
  });
});
