// Annotation model (re-exported from @osdlabel/annotation)
export type {
  AnnotationId,
  ImageId,
  AnnotationType,
  Point,
  Geometry,
  AnnotationStyle,
  BaseAnnotation,
  Annotation,
  AnnotationDocument,
  ImageAnnotations,
  ImageSource,
  AnnotationState,
  UIState,
  KeyboardShortcutMap,
  RawAnnotationData,
  CellTransform,
  ExtensionValidator,
  ExtensionValidatorFn,
  DeserializeResult,
} from '@osdlabel/annotation';

export {
  createAnnotationId,
  createImageId,
  DEFAULT_CELL_TRANSFORM,
  DEFAULT_ANNOTATION_STYLE,
  DEFAULT_GRID_CONFIG,
  MAX_GRID_SIZE,
  validateBaseAnnotation,
  validateRawAnnotationData,
  createAnnotationValidator,
  getAllAnnotationsFlat,
  SerializationError,
} from '@osdlabel/annotation';

// Annotation context (re-exported from @osdlabel/annotation-context)
export type {
  AnnotationContext,
  AnnotationContextId,
  ToolConstraint,
  ConstraintStatus,
  ContextState,
  CountScope,
  ContextFields,
} from '@osdlabel/annotation-context';

export {
  createAnnotationContextId,
  isContextScopedToImage,
  getCountableImageIds,
  validateContextFields,
} from '@osdlabel/annotation-context';

// Fabric-OSD integration (re-exported from @osdlabel/fabric-osd)
export { FabricOverlay, computeViewportTransform } from '@osdlabel/fabric-osd';
export type { OverlayOptions, OverlayMode, ToolCallbacks, AddAnnotationParams, FabricFields } from '@osdlabel/fabric-osd';
export { validateFabricFields } from '@osdlabel/fabric-osd';

// Validation schemas (re-exported from @osdlabel/validation)
export { GeometrySchema, PointSchema, BaseAnnotationSchema, RawAnnotationDataSchema } from '@osdlabel/validation';

// Own types
export type { OsdAnnotation, OsdFields } from './types.js';
export { validateOsdAnnotation, validateOsdFields } from './validator.js';

// Pre-configured serialization (uses OSD validators)
export { serialize, deserialize } from './serialization-configured.js';

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
