import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createAnnotationStore } from '../../../src/state/annotation-store';
import { createUIStore } from '../../../src/state/ui-store';
import { createContextStore } from '../../../src/state/context-store';
import { createActions } from '../../../src/state/actions';
import { createImageId, DEFAULT_VIEW_TRANSFORM } from '../../../src/core/types';
import type { ImageId } from '../../../src/core/types';

describe('View Transform Actions', () => {
  const imageId1 = createImageId('img1');
  const imageId2 = createImageId('img2');

  function createTestStore(activeImageId?: ImageId) {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { state: uiState, setState: setUIState } = createUIStore();
      const { state: contextState, setState: setContextState } = createContextStore();
      const actions = createActions(setAnnotationState, setUIState, setContextState, contextState, uiState);

      if (activeImageId) {
        setUIState('gridAssignments', 0, activeImageId);
      }

      return { annotationState, uiState, actions, dispose };
    });
  }

  describe('rotateActiveImageCW', () => {
    it('should rotate 0 → 90 → 180 → 270 → 0', () => {
      const { annotationState, actions, dispose } = createTestStore(imageId1);

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
    it('should rotate 0 → 270 → 180 → 90 → 0', () => {
      const { annotationState, actions, dispose } = createTestStore(imageId1);

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
    it('should toggle between true and false', () => {
      const { annotationState, actions, dispose } = createTestStore(imageId1);

      actions.flipActiveImageH();
      expect(annotationState.viewTransforms[imageId1]?.flippedH).toBe(true);

      actions.flipActiveImageH();
      expect(annotationState.viewTransforms[imageId1]?.flippedH).toBe(false);

      dispose();
    });
  });

  describe('flipActiveImageV', () => {
    it('should toggle between true and false', () => {
      const { annotationState, actions, dispose } = createTestStore(imageId1);

      actions.flipActiveImageV();
      expect(annotationState.viewTransforms[imageId1]?.flippedV).toBe(true);

      actions.flipActiveImageV();
      expect(annotationState.viewTransforms[imageId1]?.flippedV).toBe(false);

      dispose();
    });
  });

  describe('resetActiveImageView', () => {
    it('should reset to defaults', () => {
      const { annotationState, actions, dispose } = createTestStore(imageId1);

      actions.rotateActiveImageCW();
      actions.rotateActiveImageCW();
      actions.flipActiveImageH();
      actions.flipActiveImageV();

      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(180);
      expect(annotationState.viewTransforms[imageId1]?.flippedH).toBe(true);
      expect(annotationState.viewTransforms[imageId1]?.flippedV).toBe(true);

      actions.resetActiveImageView();
      expect(annotationState.viewTransforms[imageId1]).toEqual(DEFAULT_VIEW_TRANSFORM);

      dispose();
    });
  });

  describe('no-op when no active image', () => {
    it('should not crash when no image is assigned to the active cell', () => {
      const { annotationState, actions, dispose } = createTestStore(); // no image assigned

      // These should all be no-ops, not throw
      actions.rotateActiveImageCW();
      actions.rotateActiveImageCCW();
      actions.flipActiveImageH();
      actions.flipActiveImageV();
      actions.resetActiveImageView();

      expect(Object.keys(annotationState.viewTransforms)).toHaveLength(0);

      dispose();
    });
  });

  describe('only affects the active image', () => {
    it('should leave other images untouched', () => {
      const { annotationState, uiState, actions, dispose } = createTestStore(imageId1);

      // Set up image 2 in cell 1
      actions.assignImageToCell(1, imageId2);

      // Rotate image 1
      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(90);

      // Switch to cell 1 (image 2)
      actions.setActiveCell(1);

      // Rotate image 2
      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId2]?.rotation).toBe(90);

      // Image 1 should still be at 90
      expect(annotationState.viewTransforms[imageId1]?.rotation).toBe(90);

      dispose();
    });
  });

  describe('default transform for new images', () => {
    it('should apply default transform when image has no existing entry', () => {
      const { annotationState, actions, dispose } = createTestStore(imageId1);

      // No viewTransform entry for imageId1 initially
      expect(annotationState.viewTransforms[imageId1]).toBeUndefined();

      // First rotation should create the entry from default
      actions.rotateActiveImageCW();
      expect(annotationState.viewTransforms[imageId1]).toEqual({
        rotation: 90,
        flippedH: false,
        flippedV: false,
      });

      dispose();
    });
  });
});
