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
  ContextState,
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

// Overlay
export { FabricOverlay, computeViewportTransform, createOverlayManager } from './overlay/index.js';
export type { OverlayOptions, OverlayMode, OverlayManager } from './overlay/index.js';

// State
export {
  createAnnotationStore,
  createUIStore,
  createContextStore,
  createActions,
  AnnotatorProvider,
  useAnnotator,
  createConstraintStatus,
} from './state/index.js';
export type { AnnotatorProviderProps } from './state/annotator-context.js';

// Tools
export type { ToolCallbacks, AnnotatedFabricObject } from './core/tools/base-tool.js';

// Serialization
export {
  serialize,
  deserialize,
  validateAnnotation,
  getAllAnnotationsFlat,
  SerializationError,
} from './core/annotations/serialization.js';

// Components
export { default as ViewerCell } from './components/ViewerCell.js';
export { default as Toolbar } from './components/Toolbar.js';
export { default as StatusBar } from './components/StatusBar.js';

// Hooks
export { useConstraints } from './hooks/useConstraints.js';
