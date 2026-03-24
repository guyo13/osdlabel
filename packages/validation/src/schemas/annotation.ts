import * as v from 'valibot';
import { GeometrySchema } from './geometry.js';

/**
 * Schema for @see {@link import("@osdlabel/annotation/types").BaseAnnotation} — validates core annotation fields.
 * Extension fields (contextId, rawAnnotationData, etc.) are not checked here;
 * they pass through via v.looseObject behavior inherited by intersections.
 */
export const BaseAnnotationSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  imageId: v.pipe(v.string(), v.minLength(1)),
  geometry: GeometrySchema,
  label: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.unknown())),
  createdAt: v.string(),
  updatedAt: v.string(),
});
