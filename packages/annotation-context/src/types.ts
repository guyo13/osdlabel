import type { AnnotationType, AnnotationStyle, ImageId } from '@osdlabel/annotation';

// ── Branded ID Type ─────────────────────────────────────────────────────

declare const annotationContextIdBrand: unique symbol;

/** Unique annotation context identifier */
export type AnnotationContextId = string & { readonly __brand: typeof annotationContextIdBrand };

export function createAnnotationContextId(value: string): AnnotationContextId {
  return value as AnnotationContextId;
}

// ── Context Extension Fields ────────────────────────────────────────────

/** Extension fields added by the context system */
export interface ContextFields {
  readonly contextId: AnnotationContextId;
}

// ── Constraint System ───────────────────────────────────────────────────

/** Count scope for tool constraints */
export type CountScope = 'per-image' | 'global';

/** Tool constraint within an annotation context */
export interface ToolConstraint {
  readonly type: AnnotationType;
  readonly maxCount?: number | undefined;
  readonly countScope?: CountScope | undefined;
  readonly defaultStyle?: Partial<AnnotationStyle> | undefined;
}

/** An annotation context defining tool constraints for a particular annotation task */
export interface AnnotationContext {
  readonly id: AnnotationContextId;
  readonly label: string;
  readonly tools: readonly ToolConstraint[];
  readonly imageIds?: readonly ImageId[] | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

// ── State Types ─────────────────────────────────────────────────────────

/** Context state */
export interface ContextState {
  contexts: AnnotationContext[];
  activeContextId: AnnotationContextId | null;
  displayedContextIds: AnnotationContextId[];
}

/** Derived state showing which tools are enabled/disabled for the active context */
export type ConstraintStatus = Record<
  AnnotationType,
  {
    readonly enabled: boolean;
    readonly currentCount: number;
    readonly maxCount: number | null;
  }
>;
