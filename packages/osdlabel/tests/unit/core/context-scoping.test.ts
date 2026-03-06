import { describe, it, expect } from 'vitest';
import { isContextScopedToImage, getCountableImageIds } from '../../../src/core/context-scoping';
import {
  createAnnotationContextId,
  createImageId,
  AnnotationContext,
} from '../../../src/core/types';

describe('isContextScopedToImage', () => {
  const imgA = createImageId('imgA');
  const imgB = createImageId('imgB');
  const imgC = createImageId('imgC');
  const ctxId = createAnnotationContextId('ctx1');

  const baseContext: AnnotationContext = {
    id: ctxId,
    label: 'Test',
    tools: [{ type: 'rectangle' }],
  };

  it('returns true when imageIds is undefined (applies to all images)', () => {
    expect(isContextScopedToImage(baseContext, imgA)).toBe(true);
    expect(isContextScopedToImage(baseContext, imgB)).toBe(true);
  });

  it('returns false when imageIds is empty array (no images)', () => {
    const ctx: AnnotationContext = { ...baseContext, imageIds: [] };
    expect(isContextScopedToImage(ctx, imgA)).toBe(false);
  });

  it('returns true when imageIds includes the image', () => {
    const ctx: AnnotationContext = { ...baseContext, imageIds: [imgA, imgB] };
    expect(isContextScopedToImage(ctx, imgA)).toBe(true);
    expect(isContextScopedToImage(ctx, imgB)).toBe(true);
  });

  it('returns false when imageIds does not include the image', () => {
    const ctx: AnnotationContext = { ...baseContext, imageIds: [imgA, imgB] };
    expect(isContextScopedToImage(ctx, imgC)).toBe(false);
  });
});

describe('getCountableImageIds', () => {
  const imgA = createImageId('imgA');
  const imgB = createImageId('imgB');
  const ctxId = createAnnotationContextId('ctx1');

  const baseContext: AnnotationContext = {
    id: ctxId,
    label: 'Test',
    tools: [{ type: 'rectangle' }],
  };

  it('returns [currentImageId] for per-image scope', () => {
    const result = getCountableImageIds(baseContext, imgA, 'per-image');
    expect(result).toEqual([imgA]);
  });

  it('returns undefined for global scope when no imageIds set', () => {
    const result = getCountableImageIds(baseContext, imgA, 'global');
    expect(result).toBeUndefined();
  });

  it('returns context imageIds for global scope when imageIds is set', () => {
    const ctx: AnnotationContext = { ...baseContext, imageIds: [imgA, imgB] };
    const result = getCountableImageIds(ctx, imgA, 'global');
    expect(result).toEqual([imgA, imgB]);
  });
});
