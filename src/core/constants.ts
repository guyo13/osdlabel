import type { AnnotationStyle, KeyboardShortcutMap } from './types.js';

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

/** Default keyboard shortcuts */
export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutMap = {
  selectTool: 'v',
  rectangleTool: 'r',
  circleTool: 'c',
  lineTool: 'l',
  pointTool: 'p',
  pathTool: 'd',
  cancel: 'Escape',
  delete: 'Delete',
  deleteAlt: 'Backspace',
  gridCell1: '1',
  gridCell2: '2',
  gridCell3: '3',
  gridCell4: '4',
  gridCell5: '5',
  gridCell6: '6',
  gridCell7: '7',
  gridCell8: '8',
  gridCell9: '9',
  increaseGridColumns: '+',
  decreaseGridColumns: '-',
} as const;
