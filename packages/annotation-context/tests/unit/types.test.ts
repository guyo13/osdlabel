import { describe, it, expect } from 'vitest';
import { createAnnotationContextId } from '../../src/types.js';
import type { AnnotationContextId } from '../../src/types.js';

describe('AnnotationContextId branded type', () => {
  it('createAnnotationContextId produces a branded value', () => {
    const id = createAnnotationContextId('ctx-1');
    expect(id).toBe('ctx-1');
    const asString: string = id;
    expect(asString).toBe('ctx-1');
  });

  it('branded type is not assignable from raw strings', () => {
    // @ts-expect-error - raw string cannot be assigned to AnnotationContextId
    const _ctxId: AnnotationContextId = 'raw-string';
    void _ctxId;
  });

  it('createAnnotationContextId returns a value that satisfies AnnotationContextId', () => {
    const id = createAnnotationContextId('test-id');
    const acceptsContextId = (cid: AnnotationContextId) => cid;
    expect(acceptsContextId(id)).toBe('test-id');
  });
});
