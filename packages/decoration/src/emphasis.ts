import type { DecorationProvider } from './provider.js';
import type { TextDecorationStyle, LineDecorationStyle } from './decoration.js';

export interface SelectionEmphasisOptions {
  /** Style overrides applied to text decorations associated with the selected annotation. */
  readonly selectedTextStyle?: Partial<TextDecorationStyle> | undefined;
  /** Style overrides applied to line decorations associated with the selected annotation. */
  readonly selectedLineStyle?: Partial<LineDecorationStyle> | undefined;
}

/**
 * Wraps a decoration provider to apply emphasis styling to decorations
 * associated with the currently selected annotation.
 *
 * It checks if `DecorationContext.selectedAnnotationId` is present in the
 * decoration's `relatedAnnotationIds`. If so, it merges the provided styles
 * into the decoration's style object.
 *
 * @param provider The base provider to wrap.
 * @param options The style overrides to apply when selected.
 */
export function withSelectionEmphasis<E extends object = Record<string, never>>(
  provider: DecorationProvider<E>,
  options: SelectionEmphasisOptions,
): DecorationProvider<E> {
  return (ctx) => {
    const decorations = provider(ctx);
    const selectedId = ctx.selectedAnnotationId;
    if (!selectedId) return decorations;

    // Fast-path: check if any decoration relates to the selected ID before allocating
    let needsUpdate = false;
    for (const dec of decorations) {
      if (dec.relatedAnnotationIds.includes(selectedId)) {
        needsUpdate = true;
        break;
      }
    }
    if (!needsUpdate) return decorations;

    return decorations.map((dec) => {
      if (!dec.relatedAnnotationIds.includes(selectedId)) return dec;

      if (dec.type === 'text' && options.selectedTextStyle) {
        return {
          ...dec,
          style: { ...dec.style, ...options.selectedTextStyle },
        };
      }
      if (dec.type === 'line' && options.selectedLineStyle) {
        return {
          ...dec,
          style: { ...dec.style, ...options.selectedLineStyle },
        };
      }
      return dec;
    });
  };
}
