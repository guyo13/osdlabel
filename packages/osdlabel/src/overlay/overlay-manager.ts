import type OpenSeadragon from 'openseadragon';
import { FabricOverlay } from './fabric-overlay.js';
import type { OverlayOptions } from './fabric-overlay.js';

/** Registry tracking active FabricOverlay instances by cell index */
export interface OverlayManager {
  /** Create a new overlay for the given viewer at the specified cell index */
  create(cellIndex: number, viewer: OpenSeadragon.Viewer, options?: OverlayOptions): FabricOverlay;

  /** Retrieve an existing overlay by cell index */
  get(cellIndex: number): FabricOverlay | undefined;

  /** Destroy the overlay at the given cell index */
  destroy(cellIndex: number): void;

  /** Destroy all managed overlays */
  destroyAll(): void;
}

/** Creates a new OverlayManager instance */
export function createOverlayManager(): OverlayManager {
  const overlays = new Map<number, FabricOverlay>();

  function create(
    cellIndex: number,
    viewer: OpenSeadragon.Viewer,
    options?: OverlayOptions,
  ): FabricOverlay {
    // Destroy existing overlay at this index if present
    const existing = overlays.get(cellIndex);
    if (existing) {
      existing.destroy();
    }

    const overlay = new FabricOverlay(viewer, options);
    overlays.set(cellIndex, overlay);
    return overlay;
  }

  function get(cellIndex: number): FabricOverlay | undefined {
    return overlays.get(cellIndex);
  }

  function destroy(cellIndex: number): void {
    const overlay = overlays.get(cellIndex);
    if (overlay) {
      overlay.destroy();
      overlays.delete(cellIndex);
    }
  }

  function destroyAll(): void {
    for (const overlay of overlays.values()) {
      overlay.destroy();
    }
    overlays.clear();
  }

  return { create, get, destroy, destroyAll };
}
