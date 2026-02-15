// Core types
export type {
  AnnotationId,
  ImageId,
  AnnotationContextId,
  AnnotationType,
  Point,
  Geometry,
  AnnotationStyle,
  Annotation,
  AnnotationDocument,
  ImageAnnotations,
  ToolConstraint,
  AnnotationContext,
  ImageSource,
  AnnotationState,
  UIState,
  ConstraintStatus,
  KeyboardShortcutMap,
} from './core/types.js';

// ID factory functions
export {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
} from './core/types.js';

// Constants
export {
  DEFAULT_ANNOTATION_STYLE,
  DEFAULT_GRID_CONFIG,
  MAX_GRID_SIZE,
  DEFAULT_KEYBOARD_SHORTCUTS,
} from './core/constants.js';
