// ── Branded ID Types ──────────────────────────────────────────────────────

declare const annotationIdBrand: unique symbol;
declare const imageIdBrand: unique symbol;
declare const annotationContextIdBrand: unique symbol;

/** Unique annotation identifier */
export type AnnotationId = string & { readonly __brand: typeof annotationIdBrand };

/** Unique image identifier */
export type ImageId = string & { readonly __brand: typeof imageIdBrand };

/** Unique annotation context identifier */
export type AnnotationContextId = string & { readonly __brand: typeof annotationContextIdBrand };

// ── ID Factory Functions ─────────────────────────────────────────────────

export function createAnnotationId(value: string): AnnotationId {
  return value as AnnotationId;
}

export function createImageId(value: string): ImageId {
  return value as ImageId;
}

export function createAnnotationContextId(value: string): AnnotationContextId {
  return value as AnnotationContextId;
}

// ── Core Geometry Types ──────────────────────────────────────────────────

/** Supported annotation geometry types */
export type AnnotationType = 'rectangle' | 'circle' | 'line' | 'point' | 'path';

/** 2D point in image-space coordinates */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Discriminated union of annotation geometries */
export type Geometry =
  | { readonly type: 'rectangle'; readonly origin: Point; readonly width: number; readonly height: number; readonly rotation: number }
  | { readonly type: 'circle'; readonly center: Point; readonly radius: number }
  | { readonly type: 'line'; readonly start: Point; readonly end: Point }
  | { readonly type: 'point'; readonly position: Point }
  | { readonly type: 'path'; readonly points: readonly Point[]; readonly closed: boolean };

// ── Annotation Style ─────────────────────────────────────────────────────

/** Visual styling for an annotation */
export interface AnnotationStyle {
  readonly strokeColor: string;
  /** Stroke width in screen pixels */
  readonly strokeWidth: number;
  readonly strokeDashArray?: readonly number[];
  readonly fillColor: string;
  readonly fillOpacity: number;
  readonly opacity: number;
}

// ── Raw Annotation Data ──────────────────────────────────────────────────

/** Discriminated union for raw annotation data from rendering libraries */
export type RawAnnotationData =
  | { readonly format: 'fabric'; readonly data: Record<string, unknown> };

// ── Annotation Entity ────────────────────────────────────────────────────

/** A single annotation entity */
export interface Annotation {
  readonly id: AnnotationId;
  readonly imageId: ImageId;
  readonly contextId: AnnotationContextId;
  readonly geometry: Geometry;
  readonly rawAnnotationData: RawAnnotationData;
  readonly label?: string | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Serialization Types ──────────────────────────────────────────────────

/** Top-level serialization envelope */
export interface AnnotationDocument {
  readonly version: '1.0.0';
  readonly exportedAt: string;
  readonly images: readonly ImageAnnotations[];
}

/** Annotations for a single image */
export interface ImageAnnotations {
  readonly imageId: ImageId;
  readonly sourceUrl: string;
  readonly annotations: readonly Annotation[];
}

// ── Constraint System ────────────────────────────────────────────────────

/** Tool constraint within an annotation context */
export interface ToolConstraint {
  readonly type: AnnotationType;
  readonly maxCount?: number | undefined;
  readonly defaultStyle?: Partial<AnnotationStyle> | undefined;
}

/** An annotation context defining tool constraints for a particular annotation task */
export interface AnnotationContext {
  readonly id: AnnotationContextId;
  readonly label: string;
  readonly tools: readonly ToolConstraint[];
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

// ── Image Source ──────────────────────────────────────────────────────────

/** Image source descriptor */
export interface ImageSource {
  readonly id: ImageId;
  readonly dziUrl: string;
  readonly thumbnailUrl?: string | undefined;
  readonly label?: string | undefined;
}

// ── State Types ──────────────────────────────────────────────────────────
// Note: State container types intentionally omit `readonly` — SolidJS store
// proxies enforce immutability at runtime, and `readonly` here would conflict
// with SolidJS's `SetStoreFunction` path-based API. Data model types above
// (Annotation, Geometry, etc.) remain fully `readonly`.

/** Root state for the annotation system */
export interface AnnotationState {
  byImage: Record<ImageId, Record<AnnotationId, Annotation>>;
  reloadGeneration: number;
}

/** UI state */
export interface UIState {
  activeTool: AnnotationType | 'select' | null;
  activeCellIndex: number;
  gridColumns: number;
  gridRows: number;
  gridAssignments: Record<number, ImageId>;
  selectedAnnotationId: AnnotationId | null;
}

/** Context state */
export interface ContextState {
  contexts: AnnotationContext[];
  activeContextId: AnnotationContextId | null;
}

// ── Constraint Status ────────────────────────────────────────────────────

/** Derived state showing which tools are enabled/disabled for the active context */
export type ConstraintStatus = Record<AnnotationType, {
  readonly enabled: boolean;
  readonly currentCount: number;
  readonly maxCount: number | null;
}>;

// ── Keyboard Shortcuts ───────────────────────────────────────────────────

/** Keyboard shortcut map */
export interface KeyboardShortcutMap {
  readonly selectTool: string;
  readonly rectangleTool: string;
  readonly circleTool: string;
  readonly lineTool: string;
  readonly pointTool: string;
  readonly pathTool: string;
  readonly cancel: string;
  readonly delete: string;
  readonly deleteAlt: string;
  readonly temporaryPan: string;
  readonly gridCell1: string;
  readonly gridCell2: string;
  readonly gridCell3: string;
  readonly gridCell4: string;
  readonly gridCell5: string;
  readonly gridCell6: string;
  readonly gridCell7: string;
  readonly gridCell8: string;
  readonly gridCell9: string;
  readonly increaseGridColumns: string;
  readonly decreaseGridColumns: string;
}
