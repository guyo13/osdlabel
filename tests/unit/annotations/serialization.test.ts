import { describe, it, expect } from 'vitest';
import { version as FABRIC_VERSION } from 'fabric';
import {
  serialize,
  deserialize,
  validateAnnotation,
  getAllAnnotationsFlat,
  SerializationError,
} from '../../../src/core/annotations/serialization';
import {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
  Annotation,
  AnnotationState,
  ImageSource,
  AnnotationId,
  ImageId,
} from '../../../src/core/types';
import {
  MAX_COORDINATE,
  MAX_STRING_LENGTH,
  MAX_POINTS_COUNT,
} from '../../../src/core/fabric-data-sanitizer';

describe('Serialization', () => {
  const imageId = createImageId('img1');
  const contextId = createAnnotationContextId('ctx1');
  const annId1 = createAnnotationId('ann1');
  const annId2 = createAnnotationId('ann2');

  // Use capitalized 'Rect' — matches Fabric v7's toObject() output.
  // width/height are required by the stricter validation for Rect type.
  const baseRawAnnotationData = {
    format: 'fabric' as const,
    fabricVersion: FABRIC_VERSION,
    data: { type: 'Rect', width: 100, height: 50, stroke: 'red', strokeWidth: 2, fill: 'rgba(0,0,255,0.3)', opacity: 1 },
  };

  const annotation1: Annotation = {
    id: annId1,
    imageId,
    contextId,
    geometry: { type: 'rectangle', origin: { x: 10, y: 20 }, width: 100, height: 50, rotation: 0 },
    rawAnnotationData: baseRawAnnotationData,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const annotation2: Annotation = {
    id: annId2,
    imageId,
    contextId,
    geometry: { type: 'circle', center: { x: 200, y: 300 }, radius: 75 },
    rawAnnotationData: baseRawAnnotationData,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const imageSources: ImageSource[] = [
    { id: imageId, dziUrl: 'https://example.com/image.dzi', label: 'Test Image' },
  ];

  function createTestState(annotations: Annotation[]): AnnotationState {
    const byImage: Record<ImageId, Record<AnnotationId, Annotation>> = {};
    for (const ann of annotations) {
      if (!byImage[ann.imageId]) {
        byImage[ann.imageId] = {};
      }
      byImage[ann.imageId][ann.id] = ann;
    }
    return { byImage, reloadGeneration: 0 };
  }

  describe('serialize', () => {
    it('should produce a valid AnnotationDocument', () => {
      const state = createTestState([annotation1, annotation2]);
      const doc = serialize(state, imageSources);

      expect(doc.version).toBe('1.0.0');
      expect(doc.exportedAt).toBeDefined();
      expect(doc.images).toHaveLength(1);
      expect(doc.images[0].imageId).toBe(imageId);
      expect(doc.images[0].sourceUrl).toBe('https://example.com/image.dzi');
      expect(doc.images[0].annotations).toHaveLength(2);
    });

    it('should handle empty state', () => {
      const state: AnnotationState = { byImage: {}, reloadGeneration: 0 };
      const doc = serialize(state, imageSources);

      expect(doc.version).toBe('1.0.0');
      expect(doc.images).toHaveLength(1);
      expect(doc.images[0].annotations).toHaveLength(0);
    });

    it('should handle multiple images', () => {
      const imageId2 = createImageId('img2');
      const ann3: Annotation = {
        ...annotation1,
        id: createAnnotationId('ann3'),
        imageId: imageId2,
      };

      const state = createTestState([annotation1, ann3]);
      const sources: ImageSource[] = [
        ...imageSources,
        { id: imageId2, dziUrl: 'https://example.com/image2.dzi' },
      ];
      const doc = serialize(state, sources);

      expect(doc.images).toHaveLength(2);
    });
  });

  describe('deserialize', () => {
    it('should round-trip serialize → deserialize preserving all data', () => {
      const state = createTestState([annotation1, annotation2]);
      const doc = serialize(state, imageSources);
      const json = JSON.stringify(doc);
      const parsed: unknown = JSON.parse(json);
      const result = deserialize(parsed);

      expect(result[imageId]).toBeDefined();
      const restoredAnn1 = result[imageId][annId1];
      expect(restoredAnn1.id).toBe(annId1);
      expect(restoredAnn1.imageId).toBe(imageId);
      expect(restoredAnn1.contextId).toBe(contextId);
      expect(restoredAnn1.geometry).toEqual(annotation1.geometry);
      expect(restoredAnn1.rawAnnotationData).toEqual(baseRawAnnotationData);

      const restoredAnn2 = result[imageId][annId2];
      expect(restoredAnn2.geometry).toEqual(annotation2.geometry);
    });

    it('should reject non-object input', () => {
      expect(() => deserialize('not an object')).toThrow(SerializationError);
      expect(() => deserialize(null)).toThrow(SerializationError);
      expect(() => deserialize(42)).toThrow(SerializationError);
    });

    it('should reject documents with unknown version', () => {
      expect(() => deserialize({
        version: '2.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        images: [],
      })).toThrow(/Unsupported document version/);
    });

    it('should reject documents with missing version', () => {
      expect(() => deserialize({
        exportedAt: '2024-01-01T00:00:00.000Z',
        images: [],
      })).toThrow(/Unsupported document version/);
    });

    it('should reject documents with missing images array', () => {
      expect(() => deserialize({
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
      })).toThrow(/Missing or invalid images array/);
    });

    it('should reject documents with missing exportedAt', () => {
      expect(() => deserialize({
        version: '1.0.0',
        images: [],
      })).toThrow(/Missing or invalid exportedAt/);
    });

    it('should reject images with invalid annotations', () => {
      expect(() => deserialize({
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        images: [{
          imageId: 'img1',
          sourceUrl: 'https://example.com',
          annotations: [{ id: 'bad' }], // incomplete annotation
        }],
      })).toThrow(/Invalid annotation/);
    });
  });

  describe('validateAnnotation', () => {
    it('should accept a valid rectangle annotation', () => {
      expect(validateAnnotation(annotation1)).toBe(true);
    });

    it('should accept a valid circle annotation', () => {
      expect(validateAnnotation(annotation2)).toBe(true);
    });

    it('should accept a valid line annotation', () => {
      const lineAnn = {
        ...annotation1,
        geometry: { type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
      };
      expect(validateAnnotation(lineAnn)).toBe(true);
    });

    it('should accept a valid point annotation', () => {
      const pointAnn = {
        ...annotation1,
        geometry: { type: 'point', position: { x: 5, y: 5 } },
      };
      expect(validateAnnotation(pointAnn)).toBe(true);
    });

    it('should accept a valid path annotation', () => {
      const pathAnn = {
        ...annotation1,
        geometry: {
          type: 'path',
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }],
          closed: true,
        },
      };
      expect(validateAnnotation(pathAnn)).toBe(true);
    });

    it('should reject non-object values', () => {
      expect(validateAnnotation(null)).toBe(false);
      expect(validateAnnotation(undefined)).toBe(false);
      expect(validateAnnotation('string')).toBe(false);
      expect(validateAnnotation(42)).toBe(false);
    });

    it('should reject annotations missing required fields', () => {
      expect(validateAnnotation({ id: 'test' })).toBe(false);
      expect(validateAnnotation({ ...annotation1, id: '' })).toBe(false);
      expect(validateAnnotation({ ...annotation1, imageId: '' })).toBe(false);
    });

    it('should reject invalid geometry type', () => {
      const badAnn = {
        ...annotation1,
        geometry: { type: 'polygon' },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject NaN coordinates', () => {
      const badAnn = {
        ...annotation1,
        geometry: { type: 'rectangle', origin: { x: NaN, y: 20 }, width: 100, height: 50, rotation: 0 },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject Infinity coordinates', () => {
      const badAnn = {
        ...annotation1,
        geometry: { type: 'circle', center: { x: Infinity, y: 0 }, radius: 10 },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject path with less than 2 points', () => {
      const badAnn = {
        ...annotation1,
        geometry: { type: 'path', points: [{ x: 0, y: 0 }], closed: false },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject annotations with invalid rawAnnotationData', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: { format: 'unknown', data: {} },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject annotations with missing rawAnnotationData', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: undefined,
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject rawAnnotationData with unsupported fabric type', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric' as const,
          fabricVersion: FABRIC_VERSION,
          data: { type: 'malicious-type' },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject rawAnnotationData missing fabricVersion', () => {
      // Intentionally omit fabricVersion to test structural validation.
      // No cast needed — validateAnnotation accepts unknown.
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          data: { type: 'Rect', width: 100, height: 50 },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject rawAnnotationData with invalid numeric properties', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: { type: 'Rect', width: 100, height: 50, left: 'invalid' },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should accept rawAnnotationData with lowercase type (backward compat)', () => {
      const ann = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric' as const,
          fabricVersion: FABRIC_VERSION,
          data: { type: 'rect', width: 100, height: 50 },
        },
      };
      expect(validateAnnotation(ann)).toBe(true);
    });

    it('should reject Rect rawAnnotationData missing width', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: { type: 'Rect', height: 50 },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject Rect rawAnnotationData missing height', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: { type: 'Rect', width: 100 },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject negative radius in Circle rawAnnotationData', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: { type: 'Circle', radius: -5 },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject rawAnnotationData with coordinate exceeding MAX_COORDINATE', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: { type: 'Rect', width: 100, height: 50, left: MAX_COORDINATE + 1 },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject rawAnnotationData with oversized string property', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: { type: 'Rect', width: 100, height: 50, fill: 'x'.repeat(MAX_STRING_LENGTH + 1) },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });

    it('should reject Polyline rawAnnotationData with oversized points array', () => {
      const badAnn = {
        ...annotation1,
        rawAnnotationData: {
          format: 'fabric',
          fabricVersion: FABRIC_VERSION,
          data: {
            type: 'Polyline',
            points: Array.from({ length: MAX_POINTS_COUNT + 1 }, (_, i) => ({ x: i, y: i })),
          },
        },
      };
      expect(validateAnnotation(badAnn)).toBe(false);
    });
  });

  describe('getAllAnnotationsFlat', () => {
    it('should flatten all annotations from store', () => {
      const state = createTestState([annotation1, annotation2]);
      const flat = getAllAnnotationsFlat(state);

      expect(flat).toHaveLength(2);
      expect(flat.map(a => a.id).sort()).toEqual([annId1, annId2].sort());
    });

    it('should return empty array for empty state', () => {
      const state: AnnotationState = { byImage: {}, reloadGeneration: 0 };
      expect(getAllAnnotationsFlat(state)).toEqual([]);
    });
  });
});
