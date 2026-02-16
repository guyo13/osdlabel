import { describe, it, expect } from 'vitest';
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

describe('Serialization', () => {
  const imageId = createImageId('img1');
  const contextId = createAnnotationContextId('ctx1');
  const annId1 = createAnnotationId('ann1');
  const annId2 = createAnnotationId('ann2');

  const baseStyle = {
    strokeColor: 'red',
    strokeWidth: 2,
    fillColor: 'blue',
    fillOpacity: 0.3,
    opacity: 1,
  };

  const annotation1: Annotation = {
    id: annId1,
    imageId,
    contextId,
    geometry: { type: 'rectangle', origin: { x: 10, y: 20 }, width: 100, height: 50, rotation: 0 },
    style: baseStyle,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const annotation2: Annotation = {
    id: annId2,
    imageId,
    contextId,
    geometry: { type: 'circle', center: { x: 200, y: 300 }, radius: 75 },
    style: baseStyle,
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
    return { byImage };
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
      const state: AnnotationState = { byImage: {} };
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
      expect(restoredAnn1.style).toEqual(baseStyle);

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

    it('should reject annotations with invalid style', () => {
      const badAnn = {
        ...annotation1,
        style: { strokeColor: 'red' }, // missing other fields
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
      const state: AnnotationState = { byImage: {} };
      expect(getAllAnnotationsFlat(state)).toEqual([]);
    });
  });
});
