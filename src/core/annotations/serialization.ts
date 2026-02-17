import type {
  Annotation,
  AnnotationDocument,
  AnnotationId,
  AnnotationState,
  AnnotationType,
  ImageAnnotations,
  ImageId,
  ImageSource,
} from '../types.js';
import { createImageId } from '../types.js';

/** Error type for serialization/deserialization failures */
export class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}

const SUPPORTED_VERSION = '1.0.0';
const ANNOTATION_TYPES: readonly string[] = ['rectangle', 'circle', 'line', 'point', 'path'];

/**
 * Serialize annotation state into a portable JSON document.
 */
export function serialize(state: AnnotationState, images: readonly ImageSource[]): AnnotationDocument {
  const imageAnnotations: ImageAnnotations[] = images.map(image => {
    const annMap = state.byImage[image.id];
    const annotations: Annotation[] = annMap ? Object.values(annMap) : [];
    return {
      imageId: image.id,
      sourceUrl: image.dziUrl,
      annotations,
    };
  });

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    images: imageAnnotations,
  };
}

/**
 * Deserialize a document back into the byImage store structure.
 * Validates the document and throws SerializationError on invalid input.
 */
export function deserialize(doc: unknown): Record<ImageId, Record<AnnotationId, Annotation>> {
  if (!isObject(doc)) {
    throw new SerializationError('Document must be an object');
  }

  const d = doc as Record<string, unknown>;

  if (d.version !== SUPPORTED_VERSION) {
    throw new SerializationError(
      `Unsupported document version: ${String(d.version)}. Expected ${SUPPORTED_VERSION}`
    );
  }

  if (typeof d.exportedAt !== 'string') {
    throw new SerializationError('Missing or invalid exportedAt timestamp');
  }

  if (!Array.isArray(d.images)) {
    throw new SerializationError('Missing or invalid images array');
  }

  const byImage: Record<ImageId, Record<AnnotationId, Annotation>> = {};

  for (const imageEntry of d.images) {
    if (!isObject(imageEntry)) {
      throw new SerializationError('Each image entry must be an object');
    }

    const entry = imageEntry as Record<string, unknown>;

    if (typeof entry.imageId !== 'string' || entry.imageId === '') {
      throw new SerializationError('Image entry missing valid imageId');
    }

    if (!Array.isArray(entry.annotations)) {
      throw new SerializationError(`Image ${entry.imageId}: missing annotations array`);
    }

    const imageId = createImageId(entry.imageId);
    const annMap: Record<AnnotationId, Annotation> = {};

    for (const rawAnn of entry.annotations) {
      if (!validateAnnotation(rawAnn)) {
        throw new SerializationError(`Invalid annotation in image ${entry.imageId}`);
      }
      annMap[rawAnn.id] = rawAnn;
    }

    byImage[imageId] = annMap;
  }

  return byImage;
}

/**
 * Type guard that validates the shape of an annotation object.
 */
export function validateAnnotation(value: unknown): value is Annotation {
  if (!isObject(value)) return false;

  const v = value as Record<string, unknown>;

  // Required string fields
  if (typeof v.id !== 'string' || v.id === '') return false;
  if (typeof v.imageId !== 'string' || v.imageId === '') return false;
  if (typeof v.contextId !== 'string' || v.contextId === '') return false;
  if (typeof v.createdAt !== 'string') return false;
  if (typeof v.updatedAt !== 'string') return false;

  // Validate rawAnnotationData
  if (!validateRawAnnotationData(v.rawAnnotationData)) return false;

  // Validate geometry
  if (!validateGeometry(v.geometry)) return false;

  return true;
}

function validateRawAnnotationData(value: unknown): boolean {
  if (!isObject(value)) return false;
  const r = value as Record<string, unknown>;
  if (r.format !== 'fabric') return false;
  if (!isObject(r.data)) return false;
  return true;
}

function validateGeometry(value: unknown): boolean {
  if (!isObject(value)) return false;
  const g = value as Record<string, unknown>;

  if (typeof g.type !== 'string' || !ANNOTATION_TYPES.includes(g.type)) return false;

  switch (g.type as AnnotationType) {
    case 'rectangle':
      return validatePoint(g.origin) &&
        isFiniteNumber(g.width) &&
        isFiniteNumber(g.height) &&
        isFiniteNumber(g.rotation);

    case 'circle':
      return validatePoint(g.center) && isFiniteNumber(g.radius);

    case 'line':
      return validatePoint(g.start) && validatePoint(g.end);

    case 'point':
      return validatePoint(g.position);

    case 'path':
      if (typeof g.closed !== 'boolean') return false;
      if (!Array.isArray(g.points)) return false;
      if (g.points.length < 2) return false;
      return g.points.every((p: unknown) => validatePoint(p));

    default:
      return false;
  }
}

function validatePoint(value: unknown): boolean {
  if (!isObject(value)) return false;
  const p = value as Record<string, unknown>;
  return isFiniteNumber(p.x) && isFiniteNumber(p.y);
}

function isFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && isFinite(value);
}

function isObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Flatten all annotations from the store into a single array.
 */
export function getAllAnnotationsFlat(state: AnnotationState): Annotation[] {
  const result: Annotation[] = [];
  for (const imageId of Object.keys(state.byImage)) {
    const annMap = state.byImage[imageId as ImageId];
    if (annMap) {
      result.push(...Object.values(annMap));
    }
  }
  return result;
}
