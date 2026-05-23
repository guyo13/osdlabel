import type { PixelSpacing } from '@osdlabel/viewer-api';

/** A scalar measurement with an explicit unit. */
export interface Measurement {
  readonly value: number;
  /** Display unit, e.g. `'px'`, `'mm'`, `'mm²'`, `'µm'`. */
  readonly unit: string;
}

/**
 * Axis along which to apply pixel spacing. Use `'x'` or `'y'` for
 * one-dimensional measurements (e.g. horizontal length), `'mean'` for
 * isotropic conversion when the orientation is unknown (e.g. circle radius).
 */
export type SpacingAxis = 'x' | 'y' | 'mean';

/**
 * Convert a 1-D pixel measurement to physical units using `pixelSpacing`.
 * Returns the original value with unit `'px'` if no spacing is provided.
 */
export function toPhysicalLength(
  pixels: number,
  pixelSpacing: PixelSpacing | undefined,
  axis: SpacingAxis = 'mean',
): Measurement {
  if (!pixelSpacing) return { value: pixels, unit: 'px' };
  const factor = axisFactor(pixelSpacing, axis);
  return { value: pixels * factor, unit: pixelSpacing.unit };
}

/**
 * Convert a 2-D pixel-area measurement to physical units. Uses the product
 * of x and y spacing, which is the physically meaningful conversion for
 * area regardless of anisotropy.
 */
export function toPhysicalArea(
  pixelsSquared: number,
  pixelSpacing: PixelSpacing | undefined,
): Measurement {
  if (!pixelSpacing) return { value: pixelsSquared, unit: 'px²' };
  return {
    value: pixelsSquared * pixelSpacing.x * pixelSpacing.y,
    unit: `${pixelSpacing.unit}²`,
  };
}

/** Default formatting options for `formatMeasurement`. */
export interface FormatMeasurementOptions {
  /** Number of fractional digits (default: 2). */
  readonly precision?: number | undefined;
  /** Separator between the numeric value and the unit (default: `' '`). */
  readonly unitSeparator?: string | undefined;
}

/** Render a measurement to a human-readable string (e.g. `"12.34 mm"`). */
export function formatMeasurement(m: Measurement, options?: FormatMeasurementOptions): string {
  const precision = options?.precision ?? 2;
  const sep = options?.unitSeparator ?? ' ';
  return `${m.value.toFixed(precision)}${sep}${m.unit}`;
}

function axisFactor(spacing: PixelSpacing, axis: SpacingAxis): number {
  if (axis === 'x') return spacing.x;
  if (axis === 'y') return spacing.y;
  return (spacing.x + spacing.y) / 2;
}
