import { describe, it, expect } from 'vitest';
import { version as FABRIC_VERSION } from 'fabric';
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
  AnnotationContext,
  AnnotationContextId,
  ImageId,
} from '../../../src/core/types';

describe('State Management', () => {
  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { state: uiState, setState: setUIState } = createUIStore();
      const { state: contextState, setState: setContextState } = createContextStore();

      const actions = createActions(setAnnotationState, setUIState, setContextState, contextState, uiState);
      // Assign image to cell 0 so constraint status has a currentImageId
      setUIState('gridAssignments', 0, dummyImageId);
      const activeImageId = () => uiState.gridAssignments[uiState.activeCellIndex];
      const constraintStatus = createConstraintStatus(
        contextState,
        annotationState,
        activeImageId,
      );

      return { annotationState, uiState, contextState, actions, constraintStatus, dispose };
    });
  }

  const dummyAnnotationId = createAnnotationId('ann1');
  const dummyImageId = createImageId('img1');
  const dummyContextId = createAnnotationContextId('ctx1');

  const dummyAnnotation: Omit<Annotation, 'createdAt' | 'updatedAt'> = {
    id: dummyAnnotationId,
    imageId: dummyImageId,
    contextId: dummyContextId,
    geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
    rawAnnotationData: {
      format: 'fabric' as const,
      fabricVersion: FABRIC_VERSION,
      data: { type: 'Rect', left: 0, top: 0, width: 10, height: 10 },
    },
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
        { type: 'circle' }, // unlimited
      ],
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
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
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

  it('setActiveCell updates active cell index', () => {
    const { uiState, actions, dispose } = createTestStore();
    actions.setActiveCell(1);
    expect(uiState.activeCellIndex).toBe(1);
    dispose();
  });

  it('assignImageToCell assigns image to cell', () => {
    const { uiState, actions, dispose } = createTestStore();
    actions.assignImageToCell(1, dummyImageId);
    expect(uiState.gridAssignments[1]).toBe(dummyImageId);
    dispose();
  });

  it('setGridDimensions updates grid dimensions', () => {
    const { uiState, actions, dispose } = createTestStore();
    actions.setGridDimensions(2, 2);
    expect(uiState.gridColumns).toBe(2);
    expect(uiState.gridRows).toBe(2);
    dispose();
  });

  it('setSelectedAnnotation updates selected annotation ID', () => {
    const { uiState, actions, dispose } = createTestStore();
    actions.setSelectedAnnotation(dummyAnnotationId);
    expect(uiState.selectedAnnotationId).toBe(dummyAnnotationId);
    dispose();
  });

  it('setContexts updates context state', () => {
    const { contextState, actions, dispose } = createTestStore();
    const context: AnnotationContext = {
      id: dummyContextId,
      label: 'Test Context',
      tools: [],
    };
    actions.setContexts([context]);
    expect(contextState.contexts).toHaveLength(1);
    expect(contextState.contexts[0]).toEqual(context);
    dispose();
  });

  it('updateAnnotation handles non-existent annotation gracefully', () => {
    const { annotationState, actions, dispose } = createTestStore();
    // No annotation added
    actions.updateAnnotation(dummyAnnotationId, dummyImageId, { label: 'New Label' });
    // Should not crash and state should remain unchanged (or empty bucket created if implemented that way)
    expect(annotationState.byImage[dummyImageId]).toBeUndefined();
    dispose();
  });

  it('deleteAnnotation handles non-existent annotation gracefully', () => {
    const { annotationState, actions, dispose } = createTestStore();
    actions.deleteAnnotation(dummyAnnotationId, dummyImageId);
    expect(annotationState.byImage[dummyImageId]).toBeUndefined();
    dispose();
  });

  it('Constraint status handles no active context', () => {
    const { actions, constraintStatus, dispose } = createTestStore();
    actions.setActiveContext(null);
    const status = constraintStatus();
    // All tools should be disabled
    expect(status.rectangle.enabled).toBe(false);
    expect(status.circle.enabled).toBe(false);
    dispose();
  });

  describe('View Controls Actions', () => {
    it('toggleActiveImageNegative toggles the inverted state', () => {
      const { annotationState, actions, dispose } = createTestStore();
      actions.toggleActiveImageNegative();

      let vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.inverted).toBe(true);

      actions.toggleActiveImageNegative();
      vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.inverted).toBe(false);
      dispose();
    });

    it('increaseActiveImageExposure increments by 0.1 and clamps to 1', () => {
      const { annotationState, actions, dispose } = createTestStore();

      // Set to 0.9 first to test clamp at next step
      actions.setActiveImageExposure(0.9);
      actions.increaseActiveImageExposure();
      let vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(1.0);

      // Clamps to 1
      actions.increaseActiveImageExposure();
      vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(1.0);

      dispose();
    });

    it('decreaseActiveImageExposure decrements by 0.1 and clamps to -1', () => {
      const { annotationState, actions, dispose } = createTestStore();

      // Set to -0.9 first to test clamp at next step
      actions.setActiveImageExposure(-0.9);
      actions.decreaseActiveImageExposure();
      let vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(-1.0);

      // Clamps to -1
      actions.decreaseActiveImageExposure();
      vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(-1.0);

      dispose();
    });

    it('setActiveImageExposure sets specific value and clamps', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.setActiveImageExposure(0.5);
      let vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(0.5);

      actions.setActiveImageExposure(1.5);
      vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(1.0);

      actions.setActiveImageExposure(-2.0);
      vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(-1.0);

      dispose();
    });

    it('resetActiveImageView resets exposure and inverted to defaults', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.toggleActiveImageNegative();
      actions.setActiveImageExposure(0.5);

      actions.resetActiveImageView();
      const vt = annotationState.viewTransforms[dummyImageId];
      expect(vt.exposure).toBe(0);
      expect(vt.inverted).toBe(false);

      dispose();
    });
  });
});
