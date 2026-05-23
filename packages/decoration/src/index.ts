export type {
  Decoration,
  DecorationType,
  TextDecoration,
  TextDecorationStyle,
  TextPlacement,
  LineDecoration,
  LineDecorationStyle,
} from './decoration.js';
export type { DecorationContext, DecorationProvider } from './provider.js';
export { composeProviders } from './provider.js';
export type { Measurement, SpacingAxis, FormatMeasurementOptions } from './measurement.js';
export { toPhysicalLength, toPhysicalArea, formatMeasurement } from './measurement.js';
export {
  area,
  perimeter,
  length,
  radius,
  distance,
  centroid,
  midpoint,
  boundingBox,
} from './geometry-math.js';
export { createMeasurementProvider, createLabelProvider } from './built-in-providers.js';
export type { MeasurementProviderOptions, LabelProviderOptions } from './built-in-providers.js';
