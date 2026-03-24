import * as v from 'valibot';

/** Finite number check (rejects NaN, Infinity, -Infinity) */
const FiniteNumber = v.pipe(v.number(), v.finite());

/** Point: { x: number, y: number } with finite values */
export const PointSchema = v.object({
  x: FiniteNumber,
  y: FiniteNumber,
});

export const RectangleGeometrySchema = v.object({
  type: v.literal('rectangle'),
  origin: PointSchema,
  width: FiniteNumber,
  height: FiniteNumber,
  rotation: FiniteNumber,
});

export const CircleGeometrySchema = v.object({
  type: v.literal('circle'),
  center: PointSchema,
  radius: FiniteNumber,
});

export const LineGeometrySchema = v.object({
  type: v.literal('line'),
  start: PointSchema,
  end: PointSchema,
});

export const PointGeometrySchema = v.object({
  type: v.literal('point'),
  position: PointSchema,
});

const PathPointsSchema = v.pipe(v.array(PointSchema), v.minLength(2));

export const PathGeometrySchema = v.object({
  type: v.literal('path'),
  points: PathPointsSchema,
  closed: v.boolean(),
});

export const FreeHandPathGeometrySchema = v.object({
  type: v.literal('freeHandPath'),
  points: PathPointsSchema,
  closed: v.boolean(),
});

export const GeometrySchema = v.variant('type', [
  RectangleGeometrySchema,
  CircleGeometrySchema,
  LineGeometrySchema,
  PointGeometrySchema,
  PathGeometrySchema,
  FreeHandPathGeometrySchema,
]);
