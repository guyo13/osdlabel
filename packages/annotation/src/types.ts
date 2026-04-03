declare const imageIdBrand: unique symbol;
/** Unique image identifier */
export type ImageId = string & { readonly __brand: typeof imageIdBrand };

// ── Image Source ──────────────────────────────────────────────────────────

/** Image source descriptor */
export interface ImageSource {
  readonly id: ImageId;
  readonly tileSource: string;
  readonly thumbnailUrl?: string | undefined;
  readonly label?: string | undefined;
}
