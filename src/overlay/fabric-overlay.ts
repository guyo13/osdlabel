import OpenSeadragon from 'openseadragon';
import { Canvas as FabricCanvas } from 'fabric';
import type { TMat2D } from 'fabric';
import type { Point } from '../core/types.js';

/** Overlay interaction modes */
export type OverlayMode = 'navigation' | 'annotation' | 'selection';

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

  /** Set the overlay interaction mode */
  setMode(mode: OverlayMode): void;

  /** Get the current overlay interaction mode */
  getMode(): OverlayMode;

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

  // ── Current mode tracking ──────────────────────────────────────────
  let currentMode: OverlayMode = 'navigation';

  // ── Sync function ──────────────────────────────────────────────────
  // Uses synchronous renderAll() because this runs inside OSD's own
  // requestAnimationFrame callback. Using the async requestRenderAll()
  // would defer the Fabric paint to the *next* frame, causing a visible
  // 1-frame lag where the image has moved but annotations haven't.
  function sync(): void {
    const vpt = computeViewportTransform(viewer);
    fabricCanvas.setViewportTransform(vpt);
    fabricCanvas.renderAll();
  }

  // ── OSD event handlers ─────────────────────────────────────────────
  const onAnimation = (): void => {
    sync();
  };

  const onAnimationFinish = (): void => {
    // Final sync to ensure annotations are perfectly aligned after
    // the spring animation settles.
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
  viewer.addHandler('animation-finish', onAnimationFinish);
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
    fabricCanvas.renderAll();
  }

  if (options?.interactive) {
    setInteractive(true);
  }

  // ── Selection mode: pass-through clicks on empty canvas to OSD ─────
  // In selection mode, clicks that don't hit a Fabric object should
  // let OSD handle the gesture (panning). We temporarily re-enable
  // OSD mouse nav and disable it again on mouse:up.
  let selectionPassThrough = false;

  fabricCanvas.on('mouse:down', (e) => {
    if (currentMode !== 'selection') return;
    console.log('mouse:down', e.target);
    if (!e.target) {
      // Click on empty area — let OSD handle this gesture
      viewer.setMouseNavEnabled(true);
      selectionPassThrough = true;
    }
  });

  fabricCanvas.on('mouse:up', () => {
    console.log('mouse:up');
    if (selectionPassThrough) {
      // Re-disable OSD nav after the gesture completes
      console.log('mouse:up - re-disable OSD nav');
      viewer.setMouseNavEnabled(false);
      selectionPassThrough = false;
    }
  });

  // ── Mode management ────────────────────────────────────────────────
  function setMode(mode: OverlayMode): void {
    currentMode = mode;
    selectionPassThrough = false;

    switch (mode) {
      case 'navigation':
        // Fabric non-interactive, OSD handles all input
        canvasEl.style.pointerEvents = 'none';
        fabricCanvas.selection = false;
        fabricCanvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        viewer.setMouseNavEnabled(true);
        break;

      case 'annotation':
        // Fabric interactive for drawing, OSD nav disabled
        canvasEl.style.pointerEvents = 'auto';
        fabricCanvas.selection = false;
        fabricCanvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        viewer.setMouseNavEnabled(false);
        break;

      case 'selection':
        // Fabric interactive for selecting existing objects
        // Clicks on empty areas pass through to OSD (via mouse:down handler)
        canvasEl.style.pointerEvents = 'auto';
        fabricCanvas.selection = true;
        fabricCanvas.forEachObject((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        viewer.setMouseNavEnabled(false);
        break;
    }

    fabricCanvas.renderAll();
  }

  function getMode(): OverlayMode {
    return currentMode;
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
    viewer.removeHandler('animation-finish', onAnimationFinish);
    viewer.removeHandler('resize', onResize);
    viewer.removeHandler('open', onOpen);
    fabricCanvas.dispose();
    canvasEl.remove();
  }

  return {
    canvas: fabricCanvas,
    sync,
    setInteractive,
    setMode,
    getMode,
    screenToImage,
    imageToScreen,
    destroy,
  };
}
