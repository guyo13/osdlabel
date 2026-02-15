import OpenSeadragon from 'openseadragon';
import { Canvas as FabricCanvas } from 'fabric';
import type { TMat2D } from 'fabric';
import type { Point } from '../core/types.js';

/** Options for creating a FabricOverlay */
export interface OverlayOptions {
  /** Initial interactive state (default: false) */
  readonly interactive?: boolean;
}

/** A Fabric.js canvas overlay synchronized with an OpenSeaDragon viewer */
export interface FabricOverlay {
  /** The Fabric.js Canvas instance */
  readonly canvas: FabricCanvas;

  /** Force a re-sync of the overlay transform with the current OSD viewport */
  sync(): void;

  /** Enable/disable annotation interaction on this overlay */
  setInteractive(enabled: boolean): void;

  /** Convert a point from screen-space to image-space */
  screenToImage(screenPoint: Point): Point;

  /** Convert a point from image-space to screen-space */
  imageToScreen(imagePoint: Point): Point;

  /** Clean up all event listeners and DOM elements */
  destroy(): void;
}

/**
 * Computes the Fabric viewportTransform matrix that maps image-space to
 * screen-space for the current OSD viewport state.
 *
 * Exported for unit testing.
 */
export function computeViewportTransform(viewer: OpenSeadragon.Viewer): TMat2D {
  const origin = new OpenSeadragon.Point(0, 0);
  const unitX = new OpenSeadragon.Point(1, 0);

  const screenOrigin = viewer.viewport.imageToViewerElementCoordinates(origin);
  const screenUnitX = viewer.viewport.imageToViewerElementCoordinates(unitX);

  // The vector from origin to unitX on screen encodes both scale and rotation
  const dx = screenUnitX.x - screenOrigin.x;
  const dy = screenUnitX.y - screenOrigin.y;

  // Affine matrix: [a, b, c, d, tx, ty]
  // a = cos(θ)*scale = dx, b = sin(θ)*scale = dy
  // c = -sin(θ)*scale = -dy, d = cos(θ)*scale = dx
  return [dx, dy, -dy, dx, screenOrigin.x, screenOrigin.y] as TMat2D;
}

/** Creates and attaches a Fabric.js overlay to an OpenSeaDragon viewer */
export function createFabricOverlay(
  viewer: OpenSeadragon.Viewer,
  options?: OverlayOptions,
): FabricOverlay {
  // ── Create canvas DOM element ──────────────────────────────────────
  const canvasEl = document.createElement('canvas');
  canvasEl.style.position = 'absolute';
  canvasEl.style.top = '0';
  canvasEl.style.left = '0';
  canvasEl.style.pointerEvents = 'none';

  // Insert on top of OSD's canvas element
  const osdCanvas = viewer.canvas;
  osdCanvas.appendChild(canvasEl);

  // Match initial dimensions
  const containerSize = viewer.viewport.getContainerSize();
  canvasEl.width = containerSize.x;
  canvasEl.height = containerSize.y;

  // ── Create Fabric canvas ───────────────────────────────────────────
  const fabricCanvas = new FabricCanvas(canvasEl, {
    selection: false,
    renderOnAddRemove: false,
    skipOffscreen: true,
  });

  fabricCanvas.setDimensions({
    width: containerSize.x,
    height: containerSize.y,
  });

  // ── Sync function ──────────────────────────────────────────────────
  function sync(): void {
    const vpt = computeViewportTransform(viewer);
    fabricCanvas.setViewportTransform(vpt);
    fabricCanvas.requestRenderAll();
  }

  // ── OSD event handlers ─────────────────────────────────────────────
  const onAnimation = (): void => {
    sync();
  };

  const onResize = (): void => {
    const size = viewer.viewport.getContainerSize();
    fabricCanvas.setDimensions({
      width: size.x,
      height: size.y,
    });
    sync();
  };

  const onOpen = (): void => {
    sync();
  };

  viewer.addHandler('animation', onAnimation);
  viewer.addHandler('resize', onResize);
  viewer.addHandler('open', onOpen);

  // Initial sync if the viewer is already open
  if (viewer.isOpen()) {
    sync();
  }

  // ── Interactive state ──────────────────────────────────────────────
  function setInteractive(enabled: boolean): void {
    canvasEl.style.pointerEvents = enabled ? 'auto' : 'none';
    fabricCanvas.selection = enabled;
    fabricCanvas.forEachObject((obj) => {
      obj.selectable = enabled;
      obj.evented = enabled;
    });
    fabricCanvas.requestRenderAll();
  }

  if (options?.interactive) {
    setInteractive(true);
  }

  // ── Coordinate conversion ──────────────────────────────────────────
  function screenToImage(screenPoint: Point): Point {
    const osdPoint = viewer.viewport.viewerElementToImageCoordinates(
      new OpenSeadragon.Point(screenPoint.x, screenPoint.y),
    );
    return { x: osdPoint.x, y: osdPoint.y };
  }

  function imageToScreen(imagePoint: Point): Point {
    const osdPoint = viewer.viewport.imageToViewerElementCoordinates(
      new OpenSeadragon.Point(imagePoint.x, imagePoint.y),
    );
    return { x: osdPoint.x, y: osdPoint.y };
  }

  // ── Destroy ────────────────────────────────────────────────────────
  function destroy(): void {
    viewer.removeHandler('animation', onAnimation);
    viewer.removeHandler('resize', onResize);
    viewer.removeHandler('open', onOpen);
    fabricCanvas.dispose();
    canvasEl.remove();
  }

  return {
    canvas: fabricCanvas,
    sync,
    setInteractive,
    screenToImage,
    imageToScreen,
    destroy,
  };
}
