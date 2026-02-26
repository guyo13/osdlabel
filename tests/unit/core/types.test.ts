import { describe, it, expect } from 'vitest';
import {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
} from '../../../src/core/types.js';
import type {
  AnnotationId,
  ImageId,
  AnnotationContextId,
  Geometry,
} from '../../../src/core/types.js';

describe('Branded ID types', () => {
  it('createAnnotationId produces a branded value', () => {
    const id = createAnnotationId('ann-1');
    expect(id).toBe('ann-1');
    // The value is usable as a string
    const asString: string = id;
    expect(asString).toBe('ann-1');
  });

  it('createImageId produces a branded value', () => {
    const id = createImageId('img-1');
    expect(id).toBe('img-1');
    const asString: string = id;
    expect(asString).toBe('img-1');
  });

  it('createAnnotationContextId produces a branded value', () => {
    const id = createAnnotationContextId('ctx-1');
    expect(id).toBe('ctx-1');
    const asString: string = id;
    expect(asString).toBe('ctx-1');
  });

  it('branded types are not assignable from raw strings', () => {
    // @ts-expect-error - raw string cannot be assigned to AnnotationId
    const _annId: AnnotationId = 'raw-string';

    // @ts-expect-error - raw string cannot be assigned to ImageId
    const _imgId: ImageId = 'raw-string';

    // @ts-expect-error - raw string cannot be assigned to AnnotationContextId
    const _ctxId: AnnotationContextId = 'raw-string';

    // Suppress unused variable warnings
    void _annId;
    void _imgId;
    void _ctxId;
  });

  it('branded types are not interchangeable', () => {
    const annId = createAnnotationId('id-1');
    const imgId = createImageId('id-1');

    // @ts-expect-error - AnnotationId is not assignable to ImageId
    const _asImage: ImageId = annId;

    // @ts-expect-error - ImageId is not assignable to AnnotationId
    const _asAnnotation: AnnotationId = imgId;

    void _asImage;
    void _asAnnotation;
  });
});

describe('Geometry discriminated union', () => {
  it('narrows rectangle geometry correctly', () => {
    const geom: Geometry = {
      type: 'rectangle',
      origin: { x: 0, y: 0 },
      width: 100,
      height: 50,
      rotation: 0,
    };

    if (geom.type === 'rectangle') {
      expect(geom.origin.x).toBe(0);
      expect(geom.width).toBe(100);
      expect(geom.height).toBe(50);
      expect(geom.rotation).toBe(0);
    }
  });

  it('narrows circle geometry correctly', () => {
    const geom: Geometry = {
      type: 'circle',
      center: { x: 50, y: 50 },
      radius: 25,
    };

    if (geom.type === 'circle') {
      expect(geom.center.x).toBe(50);
      expect(geom.radius).toBe(25);
    }
  });

  it('narrows line geometry correctly', () => {
    const geom: Geometry = {
      type: 'line',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
    };

    if (geom.type === 'line') {
      expect(geom.start.x).toBe(0);
      expect(geom.end.x).toBe(100);
    }
  });

  it('narrows point geometry correctly', () => {
    const geom: Geometry = {
      type: 'point',
      position: { x: 42, y: 84 },
    };

    if (geom.type === 'point') {
      expect(geom.position.x).toBe(42);
      expect(geom.position.y).toBe(84);
    }
  });

  it('narrows path geometry correctly', () => {
    const geom: Geometry = {
      type: 'path',
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ],
      closed: true,
    };

    if (geom.type === 'path') {
      expect(geom.points).toHaveLength(3);
      expect(geom.closed).toBe(true);
    }
  });

  it('exhaustively handles all geometry types', () => {
    function getTypeName(geom: Geometry): string {
      switch (geom.type) {
        case 'rectangle':
          return 'rectangle';
        case 'circle':
          return 'circle';
        case 'line':
          return 'line';
        case 'point':
          return 'point';
        case 'path':
          return 'path';
      }
    }

    const geom: Geometry = { type: 'circle', center: { x: 0, y: 0 }, radius: 10 };
    expect(getTypeName(geom)).toBe('circle');
  });
});

describe('Helper functions', () => {
  it('createAnnotationId returns a value that satisfies AnnotationId', () => {
    const id = createAnnotationId('test-id');
    // Can be used where AnnotationId is expected
    const acceptsAnnotationId = (aid: AnnotationId) => aid;
    expect(acceptsAnnotationId(id)).toBe('test-id');
  });

  it('createImageId returns a value that satisfies ImageId', () => {
    const id = createImageId('test-id');
    const acceptsImageId = (iid: ImageId) => iid;
    expect(acceptsImageId(id)).toBe('test-id');
  });

  it('createAnnotationContextId returns a value that satisfies AnnotationContextId', () => {
    const id = createAnnotationContextId('test-id');
    const acceptsContextId = (cid: AnnotationContextId) => cid;
    expect(acceptsContextId(id)).toBe('test-id');
  });
});
