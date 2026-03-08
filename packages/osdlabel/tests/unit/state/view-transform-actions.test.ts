import { describe, it, expect } from 'vitest';
import { createAnnotationStore } from '../../../src/state/annotation-store.js';
import { createUIStore } from '../../../src/state/ui-store.js';
import { createContextStore } from '../../../src/state/context-store.js';
import { createActions } from '../../../src/state/actions.js';
import { createImageId, DEFAULT_VIEW_TRANSFORM } from '../../../src/core/types.js';

describe('View transform actions', () => {
  const setup = () => {
    const { state: annState, setState: setAnnState } = createAnnotationStore();
    const { state: uiState, setState: setUIState } = createUIStore();
    const { state: ctxState, setState: setCtxState } = createContextStore();
    const actions = createActions(setAnnState, setUIState, setCtxState, ctxState, uiState);
    return { annState, uiState, actions };
  };

  it('rotateActiveImageCW increments rotation by 90 degrees (mod 360)', () => {
    const { annState, actions } = setup();
    const imgId = createImageId('img-1');
    actions.assignImageToCell(0, imgId);

    actions.rotateActiveImageCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(90);

    actions.rotateActiveImageCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(180);

    actions.rotateActiveImageCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(270);

    actions.rotateActiveImageCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(0);
  });

  it('rotateActiveImageCCW decrements rotation by 90 degrees (mod 360)', () => {
    const { annState, actions } = setup();
    const imgId = createImageId('img-1');
    actions.assignImageToCell(0, imgId);

    actions.rotateActiveImageCCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(270);

    actions.rotateActiveImageCCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(180);

    actions.rotateActiveImageCCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(90);

    actions.rotateActiveImageCCW();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(0);
  });

  it('flipActiveImageH toggles horizontal flip', () => {
    const { annState, actions } = setup();
    const imgId = createImageId('img-1');
    actions.assignImageToCell(0, imgId);

    actions.flipActiveImageH();
    expect(annState.viewTransforms[imgId]?.flippedH).toBe(true);

    actions.flipActiveImageH();
    expect(annState.viewTransforms[imgId]?.flippedH).toBe(false);
  });

  it('flipActiveImageV toggles vertical flip', () => {
    const { annState, actions } = setup();
    const imgId = createImageId('img-1');
    actions.assignImageToCell(0, imgId);

    actions.flipActiveImageV();
    expect(annState.viewTransforms[imgId]?.flippedV).toBe(true);

    actions.flipActiveImageV();
    expect(annState.viewTransforms[imgId]?.flippedV).toBe(false);
  });

  it('resetActiveImageView returns image to default view transform', () => {
    const { annState, actions } = setup();
    const imgId = createImageId('img-1');
    actions.assignImageToCell(0, imgId);

    actions.rotateActiveImageCW();
    actions.flipActiveImageH();
    expect(annState.viewTransforms[imgId]?.rotation).toBe(90);
    expect(annState.viewTransforms[imgId]?.flippedH).toBe(true);

    actions.resetActiveImageView();
    expect(annState.viewTransforms[imgId]).toEqual(DEFAULT_VIEW_TRANSFORM);
  });

  it('actions only affect the active image', () => {
    const { annState, actions } = setup();
    const img1 = createImageId('img-1');
    const img2 = createImageId('img-2');

    actions.assignImageToCell(0, img1);
    actions.assignImageToCell(1, img2);

    actions.setActiveCell(0);
    actions.rotateActiveImageCW();
    expect(annState.viewTransforms[img1]?.rotation).toBe(90);
    expect(annState.viewTransforms[img2]).toBeUndefined();

    actions.setActiveCell(1);
    actions.flipActiveImageH();
    expect(annState.viewTransforms[img1]?.rotation).toBe(90);
    expect(annState.viewTransforms[img2]?.flippedH).toBe(true);
  });

  it('loadAnnotations restores view transforms', () => {
    const { annState, actions } = setup();
    const imgId = createImageId('img-1');
    const vt = { rotation: 180, flippedH: true, flippedV: false };

    actions.loadAnnotations({}, { [imgId]: vt });
    expect(annState.viewTransforms[imgId]).toEqual(vt);
  });
});
