import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createAnnotationStore } from '../../../src/state/annotation-store';
import { createUIStore } from '../../../src/state/ui-store';
import { createContextStore } from '../../../src/state/context-store';
import { createActions } from '../../../src/state/actions';
import { createImageId } from '../../../src/core/types';
import { DEFAULT_VIEW_TRANSFORM } from '../../../src/core/types';

describe('View Transform Actions', () => {
  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { state: uiState, setState: setUIState } = createUIStore();
      const { state: contextState, setState: setContextState } = createContextStore();

      const actions = createActions(
        setAnnotationState,
        setUIState,
        setContextState,
        contextState,
        uiState,
      );

      return { annotationState, uiState, setUIState, actions, dispose };
    });
  }

  const dummyImageId = createImageId('img1');

  it('rotateActiveImageCW rotates by 90 degrees', () => {
    const { annotationState, setUIState, actions, dispose } = createTestStore();
    setUIState('gridAssignments', 0, dummyImageId);

    actions.rotateActiveImageCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 90,
    });

    actions.rotateActiveImageCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 180,
    });

    actions.rotateActiveImageCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 270,
    });

    actions.rotateActiveImageCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 0,
    });

    dispose();
  });

  it('rotateActiveImageCCW rotates by -90 degrees (270)', () => {
    const { annotationState, setUIState, actions, dispose } = createTestStore();
    setUIState('gridAssignments', 0, dummyImageId);

    actions.rotateActiveImageCCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 270,
    });

    actions.rotateActiveImageCCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 180,
    });

    actions.rotateActiveImageCCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 90,
    });

    actions.rotateActiveImageCCW();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 0,
    });

    dispose();
  });

  it('flipActiveImageH toggles horizontal flip', () => {
    const { annotationState, setUIState, actions, dispose } = createTestStore();
    setUIState('gridAssignments', 0, dummyImageId);

    actions.flipActiveImageH();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      flippedH: true,
    });

    actions.flipActiveImageH();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      flippedH: false,
    });

    dispose();
  });

  it('flipActiveImageV toggles vertical flip', () => {
    const { annotationState, setUIState, actions, dispose } = createTestStore();
    setUIState('gridAssignments', 0, dummyImageId);

    actions.flipActiveImageV();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      flippedV: true,
    });

    actions.flipActiveImageV();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      flippedV: false,
    });

    dispose();
  });

  it('resetActiveImageView resets to default transform', () => {
    const { annotationState, setUIState, actions, dispose } = createTestStore();
    setUIState('gridAssignments', 0, dummyImageId);

    actions.rotateActiveImageCW();
    actions.flipActiveImageH();

    actions.resetActiveImageView();
    expect(annotationState.viewTransforms[dummyImageId]).toEqual(DEFAULT_VIEW_TRANSFORM);

    dispose();
  });

  it('actions are no-op when no active image', () => {
    const { annotationState, actions, dispose } = createTestStore();

    actions.rotateActiveImageCW();
    actions.flipActiveImageH();

    expect(annotationState.viewTransforms).toEqual({});

    dispose();
  });

  it('only affects the active image', () => {
    const { annotationState, setUIState, actions, dispose } = createTestStore();
    const otherImageId = createImageId('img2');

    setUIState('gridAssignments', 0, dummyImageId);
    actions.flipActiveImageH();

    setUIState('gridAssignments', 0, otherImageId);
    actions.rotateActiveImageCW();

    expect(annotationState.viewTransforms[dummyImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      flippedH: true,
    });
    expect(annotationState.viewTransforms[otherImageId]).toEqual({
      ...DEFAULT_VIEW_TRANSFORM,
      rotation: 90,
    });

    dispose();
  });
});
