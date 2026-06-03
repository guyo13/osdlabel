import type { AnnotationId, Point } from '@osdlabel/annotation';

/** Styling applied to a text decoration (DOM-rendered). */
export interface TextDecorationStyle {
  readonly color?: string | undefined;
  /** Font size in screen pixels. */
  readonly fontSize?: number | undefined;
  readonly fontFamily?: string | undefined;
  readonly fontWeight?: string | number | undefined;
  /** CSS background shorthand (e.g. 'rgba(0,0,0,0.6)'). */
  readonly background?: string | undefined;
  /** CSS padding shorthand (e.g. '2px 4px'). */
  readonly padding?: string | undefined;
  /** CSS border-radius shorthand. */
  readonly borderRadius?: string | undefined;
  /** Additional CSS class applied to the host element. */
  readonly className?: string | undefined;
  /** CSS z-index to control stacking order of text labels. */
  readonly zIndex?: number | undefined;
}

/** Styling applied to a line decoration (Fabric-rendered). */
export interface LineDecorationStyle {
  readonly stroke?: string | undefined;
  /** Stroke width in screen pixels (rendered with strokeUniform). */
  readonly strokeWidth?: number | undefined;
  readonly opacity?: number | undefined;
}

interface BaseDecoration {
  /**
   * Stable identifier used for diffing across recomputations. Providers must
   * produce the same id for the same logical decoration so the renderer can
   * update in place instead of recreating DOM/canvas objects.
   */
  readonly id: string;
  /**
   * Annotation ids this decoration is associated with. Used for lifecycle
   * (e.g. so the renderer can remove decorations when their related
   * annotations are deleted). May be empty for purely contextual decorations.
   */
  readonly relatedAnnotationIds: readonly AnnotationId[];
}

/**
 * Where the text element is anchored relative to its own bounding box.
 *
 * - `'top-left'` (default): the element's top-left corner is at the anchor.
 * - `'center'`: the element is centered on the anchor.
 * - `'top'` / `'bottom'`: horizontally centered, top/bottom edge at anchor.
 * - `'left'` / `'right'`: vertically centered, left/right edge at anchor.
 */
export type TextPlacement = 'top-left' | 'center' | 'top' | 'bottom' | 'left' | 'right';

/** A text label rendered as a DOM element positioned over the image. */
export interface TextDecoration extends BaseDecoration {
  readonly type: 'text';
  readonly text: string;
  /** Anchor point in image-space coordinates. */
  readonly anchor: Point;
  /**
   * Optional screen-pixel offset added to the anchor's screen position
   * before the element is placed.
   */
  readonly offset?: { readonly x: number; readonly y: number } | undefined;
  /** How the element aligns to its anchor. Default: `'top-left'`. */
  readonly placement?: TextPlacement | undefined;
  readonly style?: TextDecorationStyle | undefined;
}

/** A connector / measurement line rendered as a Fabric object in image-space. */
export interface LineDecoration extends BaseDecoration {
  readonly type: 'line';
  /** Start point in image-space coordinates. */
  readonly start: Point;
  /** End point in image-space coordinates. */
  readonly end: Point;
  /** If true, the line is rendered with a dash pattern. */
  readonly dashed?: boolean | undefined;
  readonly style?: LineDecorationStyle | undefined;
}

/**
 * Declarative description of something to render alongside annotations.
 *
 * Decorations are pure data: providers return them, the renderer turns them
 * into DOM/Fabric objects. Decorations are never serialized into annotation
 * data — they are always recomputed from current state.
 */
export type Decoration = TextDecoration | LineDecoration;

/** Discriminator values of `Decoration`. */
export type DecorationType = Decoration['type'];
