import * as v from 'valibot';
import { GeometrySchema } from './geometry.js';

/**
 * Schema for BaseAnnotation — validates core annotation fields.
 * Extension fields (contextId, rawAnnotationData, etc.) are not checked here;
 * they pass through via v.looseObject behavior inherited by intersections.
 */
export const BaseAnnotationSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  imageId: v.pipe(v.string(), v.minLength(1)),
  geometry: GeometrySchema,
  createdAt: v.string(),
  updatedAt: v.string(),
});
