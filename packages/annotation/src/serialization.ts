import type {
  Annotation,
  AnnotationDocument,
  AnnotationId,
  AnnotationState,
  AnnotationType,
  BaseAnnotation,
  ImageAnnotations,
  ImageId,
  ImageSource,
} from './types.js';
import { createImageId } from './types.js';
import {
  normalizeFabricType,
  isFiniteNumber,
  isObject,
  validatePointValue,
  MAX_COORDINATE,
  MAX_STRING_LENGTH,
  MAX_POINTS_COUNT,
} from './data-sanitizer.js';

/** Error type for serialization/deserialization failures */
export class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}

const SUPPORTED_VERSION = '1.0.0';
const ANNOTATION_TYPES: readonly string[] = ['rectangle', 'circle', 'line', 'point', 'path', 'freeHandPath'];

/** Validator for extension fields on top of BaseAnnotation */
export type ExtensionValidator<E> =
  (value: unknown) => value is E;

/**
 * Serialize annotation state into a portable JSON document.
 */
export function serialize<E extends object = Record<string, never>>(
  state: AnnotationState<E>,
  images: readonly ImageSource[],
): AnnotationDocument<E> {
  const imageAnnotations: ImageAnnotations<E>[] = images.map((image) => {
    const annMap = state.byImage[image.id];
    const annotations: Annotation<E>[] = annMap ? Object.values(annMap) : [];

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

/** Result of deserializing an annotation document */
export interface DeserializeResult<E extends object = Record<string, never>> {
  readonly byImage: Record<ImageId, Record<AnnotationId, Annotation<E>>>;
}

/**
 * Deserialize a document back into the byImage store structure.
 * Validates the document and throws SerializationError on invalid input.
 * Pass an extensionValidator to also validate extension fields (e.g. contextId, rawAnnotationData).
 */
export function deserialize<E extends object = Record<string, never>>(
  doc: unknown,
  extensionValidator?: ExtensionValidator<E>,
): DeserializeResult<E> {
  if (!isObject(doc)) {
    throw new SerializationError('Document must be an object');
  }

  const d = doc as Record<string, unknown>;

  if (d.version !== SUPPORTED_VERSION) {
    throw new SerializationError(
      `Unsupported document version: ${String(d.version)}. Expected ${SUPPORTED_VERSION}`,
    );
  }

  if (typeof d.exportedAt !== 'string') {
    throw new SerializationError('Missing or invalid exportedAt timestamp');
  }

  if (!Array.isArray(d.images)) {
    throw new SerializationError('Missing or invalid images array');
  }

  const validator = extensionValidator
    ? createAnnotationValidator(extensionValidator)
    : (validateBaseAnnotation as (value: unknown) => value is Annotation<E>);

  const byImage: Record<ImageId, Record<AnnotationId, Annotation<E>>> = {};

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
    const annMap: Record<AnnotationId, Annotation<E>> = {};

    for (const rawAnn of entry.annotations) {
      if (!validator(rawAnn)) {
        throw new SerializationError(`Invalid annotation in image ${entry.imageId}`);
      }
      annMap[rawAnn.id] = rawAnn;
    }

    byImage[imageId] = annMap;
  }

  return { byImage };
}

/**
 * Type guard that validates the base annotation fields (id, imageId, geometry, timestamps).
 * Does NOT validate extension fields — use createAnnotationValidator for that.
 */
export function validateBaseAnnotation(value: unknown): value is BaseAnnotation {
  if (!isObject(value)) return false;

  const v = value as Record<string, unknown>;

  // Required string fields
  if (typeof v.id !== 'string' || v.id === '') return false;
  if (typeof v.imageId !== 'string' || v.imageId === '') return false;
  if (typeof v.createdAt !== 'string') return false;
  if (typeof v.updatedAt !== 'string') return false;

  // Validate geometry
  if (!validateGeometry(v.geometry)) return false;

  return true;
}

/**
 * Creates a composed validator for Annotation<E> that checks both
 * base fields and extension fields.
 */
export function createAnnotationValidator<E extends object>(
  extensionValidator: ExtensionValidator<E>,
): (value: unknown) => value is Annotation<E> {
  return (value: unknown): value is Annotation<E> => {
    if (!validateBaseAnnotation(value)) return false;
    return extensionValidator(value);
  };
}

/**
 * @deprecated Use validateBaseAnnotation or createAnnotationValidator instead.
 * Validates base annotation fields only (no extension fields).
 */
export const validateAnnotation: (value: unknown) => value is BaseAnnotation = validateBaseAnnotation;

/**
 * Validates the shape of a RawAnnotationData object.
 * Exported for use by extension validators (e.g. in @osdlabel/fabric-osd).
 */
export function validateRawAnnotationData(value: unknown): boolean {
  if (!isObject(value)) return false;
  const r = value as Record<string, unknown>;
  if (r.format !== 'fabric') return false;
  if (typeof r.fabricVersion !== 'string') return false;
  if (!isObject(r.data)) return false;

  const data = r.data as Record<string, unknown>;
  if (typeof data.type !== 'string') return false;

  // Normalize type (case-insensitive) and check against whitelist.
  const normalizedType = normalizeFabricType(data.type);
  if (normalizedType === null) return false;

  // Numeric property validation: must be finite and within coordinate bounds.
  const numericProps = ['left', 'top', 'scaleX', 'scaleY', 'angle', 'opacity'];
  for (const prop of numericProps) {
    const v = data[prop];
    if (v !== undefined) {
      if (!isFiniteNumber(v)) return false;
      if (Math.abs(v as number) > MAX_COORDINATE) return false;
    }
  }

  // Dimension properties: must be finite, non-negative.
  for (const prop of ['width', 'height'] as const) {
    const v = data[prop];
    if (v !== undefined) {
      if (!isFiniteNumber(v)) return false;
      const n = v as number;
      if (n < 0 || n > MAX_COORDINATE) return false;
    }
  }

  // String property length check (fill, stroke, backgroundColor).
  for (const prop of ['fill', 'stroke', 'backgroundColor'] as const) {
    const v = data[prop];
    if (v !== undefined && v !== null && typeof v === 'string') {
      if (v.length > MAX_STRING_LENGTH) return false;
    }
  }

  // Type-specific validation.
  if (normalizedType === 'Rect') {
    // Rect requires width and height.
    if (!isFiniteNumber(data.width) || !isFiniteNumber(data.height)) return false;
    if ((data.width as number) < 0 || (data.height as number) < 0) return false;
  }

  if (normalizedType === 'Circle') {
    if (!isFiniteNumber(data.radius)) return false;
    if ((data.radius as number) < 0) return false;
  }

  if (normalizedType === 'Line') {
    if (
      !isFiniteNumber(data.x1) ||
      !isFiniteNumber(data.y1) ||
      !isFiniteNumber(data.x2) ||
      !isFiniteNumber(data.y2)
    )
      return false;
    for (const v of [data.x1, data.y1, data.x2, data.y2] as number[]) {
      if (Math.abs(v) > MAX_COORDINATE) return false;
    }
  }

  if (normalizedType === 'Polyline' || normalizedType === 'Polygon') {
    if (!Array.isArray(data.points)) return false;
    if (data.points.length > MAX_POINTS_COUNT) return false;
    for (const p of data.points) {
      if (!validatePointValue(p)) return false;
    }
  }

  return true;
}

function validateGeometry(value: unknown): boolean {
  if (!isObject(value)) return false;
  const g = value as Record<string, unknown>;

  if (typeof g.type !== 'string' || !ANNOTATION_TYPES.includes(g.type)) return false;

  switch (g.type as AnnotationType) {
    case 'rectangle':
      return (
        validatePointValue(g.origin) &&
        isFiniteNumber(g.width) &&
        isFiniteNumber(g.height) &&
        isFiniteNumber(g.rotation)
      );

    case 'circle':
      return validatePointValue(g.center) && isFiniteNumber(g.radius);

    case 'line':
      return validatePointValue(g.start) && validatePointValue(g.end);

    case 'point':
      return validatePointValue(g.position);

    case 'path':
    case 'freeHandPath':
      if (typeof g.closed !== 'boolean') return false;
      if (!Array.isArray(g.points)) return false;
      if (g.points.length < 2) return false;
      return g.points.every((p: unknown) => validatePointValue(p));

    default:
      return false;
  }
}

/**
 * Flatten all annotations from the store into a single array.
 */
export function getAllAnnotationsFlat<E extends object = Record<string, never>>(
  state: AnnotationState<E>,
): Annotation<E>[] {
  const result: Annotation<E>[] = [];
  for (const imageId of Object.keys(state.byImage)) {
    const annMap = state.byImage[imageId as ImageId];
    if (annMap) {
      result.push(...Object.values(annMap));
    }
  }
  return result;
}
