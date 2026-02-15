import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createAnnotationStore } from '../../../src/state/annotation-store';
import { createUIStore } from '../../../src/state/ui-store';
import { createContextStore, createConstraintStatus } from '../../../src/state/context-store';
import { createActions } from '../../../src/state/actions';
import {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
  Annotation,
  AnnotationContext
} from '../../../src/core/types';

describe('State Management', () => {
  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { state: uiState, setState: setUIState } = createUIStore();
      const { state: contextState, setState: setContextState } = createContextStore();

      const actions = createActions(setAnnotationState, setUIState, setContextState);
      const constraintStatus = createConstraintStatus(contextState, annotationState);

      return { annotationState, uiState, contextState, actions, constraintStatus, dispose };
    });
  }

  const dummyAnnotationId = createAnnotationId('ann1');
  const dummyImageId = createImageId('img1');
  const dummyContextId = createAnnotationContextId('ctx1');

  const dummyAnnotation: Annotation = {
    id: dummyAnnotationId,
    imageId: dummyImageId,
    contextId: dummyContextId,
    geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
    style: { strokeColor: 'red', strokeWidth: 1, fillColor: 'none', fillOpacity: 0, opacity: 1 },
    createdAt: '',
    updatedAt: ''
  };

  it('addAnnotation adds to the correct image bucket and sets timestamps', () => {
    const { annotationState, actions, dispose } = createTestStore();

    actions.addAnnotation(dummyAnnotation);

    const imgAnns = annotationState.byImage[dummyImageId];
    expect(imgAnns).toBeDefined();
    const ann = imgAnns[dummyAnnotationId];
    expect(ann).toBeDefined();
    expect(ann.id).toBe(dummyAnnotationId);
    expect(ann.createdAt).not.toBe('');
    expect(ann.updatedAt).not.toBe('');

    dispose();
  });

  it('updateAnnotation updates the annotation and sets updatedAt', () => {
    const { annotationState, actions, dispose } = createTestStore();
    actions.addAnnotation(dummyAnnotation);

    const patch = { label: 'Updated Label' };
    actions.updateAnnotation(dummyAnnotationId, dummyImageId, patch);

    const updatedAnn = annotationState.byImage[dummyImageId][dummyAnnotationId];
    expect(updatedAnn.label).toBe('Updated Label');
    expect(updatedAnn.updatedAt).not.toBe('');

    dispose();
  });

  it('deleteAnnotation removes the annotation', () => {
    const { annotationState, actions, dispose } = createTestStore();
    actions.addAnnotation(dummyAnnotation);

    actions.deleteAnnotation(dummyAnnotationId, dummyImageId);

    const imgAnns = annotationState.byImage[dummyImageId];
    expect(imgAnns[dummyAnnotationId]).toBeUndefined();

    dispose();
  });

  it('setActiveTool updates UI state', () => {
    const { uiState, actions, dispose } = createTestStore();
    actions.setActiveTool('circle');
    expect(uiState.activeTool).toBe('circle');
    dispose();
  });

  it('Constraint logic correctly enables/disables tools', () => {
    const { contextState, actions, constraintStatus, dispose } = createTestStore();

    const context: AnnotationContext = {
      id: dummyContextId,
      label: 'Test Context',
      tools: [
        { type: 'rectangle', maxCount: 1 },
        { type: 'circle' } // unlimited
      ]
    };

    actions.setContexts([context]);
    actions.setActiveContext(dummyContextId);

    // Check initial status
    let status = constraintStatus();
    expect(status.rectangle.enabled).toBe(true);
    expect(status.rectangle.currentCount).toBe(0);
    expect(status.circle.enabled).toBe(true);

    // Add 1 rectangle
    actions.addAnnotation({
      ...dummyAnnotation,
      id: createAnnotationId('rect1'),
      contextId: dummyContextId,
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 }
    });

    status = constraintStatus();
    expect(status.rectangle.currentCount).toBe(1);
    expect(status.rectangle.enabled).toBe(false); // Max 1 reached
    expect(status.circle.enabled).toBe(true);

    // Delete rectangle
    actions.deleteAnnotation(createAnnotationId('rect1'), dummyImageId);

    status = constraintStatus();
    expect(status.rectangle.currentCount).toBe(0);
    expect(status.rectangle.enabled).toBe(true); // Re-enabled

    dispose();
  });
});
