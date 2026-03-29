import * as v from 'valibot';

/** Finite number check (rejects NaN, Infinity, -Infinity) */
const FiniteNumber = v.pipe(v.number(), v.finite());

/** A schema for validating @see {@link import("@osdlabel/annotation/geometry").Point}. */
export const PointSchema = v.object({
  x: FiniteNumber,
  y: FiniteNumber,
});

/** A schema for validating @see {@link import("@osdlabel/annotation/geometry").RectangleGeometry}. */
export const RectangleGeometrySchema = v.object({
  type: v.literal('rectangle'),
  origin: PointSchema,
  width: FiniteNumber,
  height: FiniteNumber,
  rotation: FiniteNumber,
});

/** A schema for validating @see {@link import("@osdlabel/annotation/geometry").CircleGeometry}. */
export const CircleGeometrySchema = v.object({
  type: v.literal('circle'),
  center: PointSchema,
  radius: FiniteNumber,
});

/** A schema for validating @see {@link import("@osdlabel/annotation/geometry").LineGeometry}. */
export const LineGeometrySchema = v.object({
  type: v.literal('line'),
  start: PointSchema,
  end: PointSchema,
});

/** A schema for validating @see {@link import("@osdlabel/annotation/geometry").PointGeometry}. */
export const PointGeometrySchema = v.object({
  type: v.literal('point'),
  position: PointSchema,
});

const PathPointsSchema = v.pipe(v.array(PointSchema), v.minLength(2));

/** A schema for validating @see {@link import("@osdlabel/annotation/geometry").PathGeometry}. */
export const PathGeometrySchema = v.object({
  type: v.literal('path'),
  points: PathPointsSchema,
  closed: v.boolean(),
});

export const GeometrySchema = v.variant('type', [
  RectangleGeometrySchema,
  CircleGeometrySchema,
  LineGeometrySchema,
  PointGeometrySchema,
  PathGeometrySchema,
]);
