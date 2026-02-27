import type { AnnotationStyle } from './types.js';

/** Default visual style applied to new annotations */
export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  strokeColor: '#ff0000',
  strokeWidth: 2,
  fillColor: '#ff0000',
  fillOpacity: 0.1,
  opacity: 1,
} as const;

/** Default grid configuration */
export const DEFAULT_GRID_CONFIG = {
  columns: 1,
  rows: 1,
} as const;

/** Maximum grid size */
export const MAX_GRID_SIZE = {
  columns: 4,
  rows: 4,
} as const;
