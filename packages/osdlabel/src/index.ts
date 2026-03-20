// Annotation model (re-exported from @osdlabel/annotation)
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
  RawAnnotationData,
  CellTransform,
  CountScope,
} from '@osdlabel/annotation';

export {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
  DEFAULT_CELL_TRANSFORM,
  isContextScopedToImage,
  DEFAULT_ANNOTATION_STYLE,
  DEFAULT_GRID_CONFIG,
  MAX_GRID_SIZE,
  serialize,
  deserialize,
  validateAnnotation,
  getAllAnnotationsFlat,
  SerializationError,
} from '@osdlabel/annotation';
export type { DeserializeResult } from '@osdlabel/annotation';

// Fabric-OSD integration (re-exported from @osdlabel/fabric-osd)
export { FabricOverlay, computeViewportTransform } from '@osdlabel/fabric-osd';
export type { OverlayOptions, OverlayMode, ToolCallbacks, AddAnnotationParams } from '@osdlabel/fabric-osd';

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

// Components
export { default as ViewerCell } from './components/ViewerCell.js';
export { default as Toolbar } from './components/Toolbar.js';
export { default as StatusBar } from './components/StatusBar.js';
export { default as ContextSwitcher } from './components/ContextSwitcher.js';
export { default as GridView } from './components/GridView.js';
export { default as Filmstrip } from './components/Filmstrip.js';
export { default as GridControls } from './components/GridControls.js';
export { ViewControls } from './components/ViewControls.js';
export { default as Annotator } from './components/Annotator.js';
export type { AnnotatorProps } from './components/Annotator.js';

// Hooks
export { useConstraints } from './hooks/useConstraints.js';
export { useKeyboard, DEFAULT_KEYBOARD_SHORTCUTS } from './hooks/useKeyboard.js';
