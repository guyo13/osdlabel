import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createAnnotationStore } from '../../../src/state/annotation-store';
import { createUIStore } from '../../../src/state/ui-store';
import { createContextStore } from '../../../src/state/context-store';
import { createActions } from '../../../src/state/actions';
import {
  createImageId,
  DEFAULT_VIEW_TRANSFORM,
} from '../../../src/core/types';

describe('View Transform Actions', () => {
  const imageId1 = createImageId('img1');
  const imageId2 = createImageId('img2');

  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { state: uiState, setState: setUIState } = createUIStore();
      const { state: contextState, setState: setContextState } = createContextStore();

      // Assign images to cells
      setUIState('gridAssignments', 0, imageId1);
      setUIState('gridAssignments', 1, imageId2);

      const actions = createActions(
        setAnnotationState,
        setUIState,
        setContextState,
        contextState,
        uiState,
      );

      return { annotationState, uiState, actions, setUIState, dispose };
    });
  }

  describe('rotateActiveImageCW', () => {
    it('rotates 0 → 90 → 180 → 270 → 0', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(90);

      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(180);

      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(270);

      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(0);

      dispose();
    });
  });

  describe('rotateActiveImageCCW', () => {
    it('rotates 0 → 270 → 180 → 90 → 0', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.rotateActiveImageCCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(270);

      actions.rotateActiveImageCCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(180);

      actions.rotateActiveImageCCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(90);

      actions.rotateActiveImageCCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(0);

      dispose();
    });
  });

  describe('flipActiveImageH', () => {
    it('toggles between true and false', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.flipActiveImageH();
      expect(annotationState.viewTransforms[imageId1]?.flippedH).toBe(true);

      actions.flipActiveImageH();
      expect(annotationState.viewTransforms[imageId1]?.flippedH).toBe(false);

      dispose();
    });
  });

  describe('flipActiveImageV', () => {
    it('toggles between true and false', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.flipActiveImageV();
      expect(annotationState.viewTransforms[imageId1]?.flippedV).toBe(true);

      actions.flipActiveImageV();
      expect(annotationState.viewTransforms[imageId1]?.flippedV).toBe(false);

      dispose();
    });
  });

  describe('resetActiveImageView', () => {
    it('resets to defaults', () => {
      const { annotationState, actions, dispose } = createTestStore();

      actions.rotateActiveImageCW();
      actions.flipActiveImageH();
      actions.resetActiveImageView();

      const vt = annotationState.viewTransforms[imageId1];
      expect(vt?.rotation).toBe(DEFAULT_VIEW_TRANSFORM.rotation);
      expect(vt?.flippedH).toBe(DEFAULT_VIEW_TRANSFORM.flippedH);
      expect(vt?.flippedV).toBe(DEFAULT_VIEW_TRANSFORM.flippedV);

      dispose();
    });
  });

  it('is a no-op when no active image is assigned', () => {
    const { annotationState, actions, setUIState, dispose } = createTestStore();

    // Set active cell to an unassigned cell
    setUIState('activeCellIndex', 5);

    actions.rotateActiveImageCW();
    expect(Object.keys(annotationState.viewTransforms)).toHaveLength(0);

    dispose();
  });

  it('only affects the active image, leaves other images untouched', () => {
    const { annotationState, actions, setUIState, dispose } = createTestStore();

    // Rotate image 1
    actions.rotateActiveImageCW();
    expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(90);

    // Switch to image 2
    setUIState('activeCellIndex', 1);
    actions.rotateActiveImageCW();
    actions.rotateActiveImageCW();
    expect(annotationState.viewTransforms[imageId2]?.rotation).toBe(180);

    // Image 1 should still be at 90
    expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(90);

    dispose();
  });

  it('applies default transform for images with no existing entry', () => {
    const { annotationState, actions, dispose } = createTestStore();

    // First action on image creates the entry
    actions.rotateActiveImageCW();
    const vt = annotationState.viewTransforms[imageId1];
    expect(vt).toBeDefined();
    expect(vt?.flippedH).toBe(false);
    expect(vt?.flippedV).toBe(false);

    dispose();
  });
});
