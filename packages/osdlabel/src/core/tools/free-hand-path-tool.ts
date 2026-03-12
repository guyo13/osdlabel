import { Polyline, Polygon } from 'fabric';
import { BaseTool } from './base-tool.js';
import {
  type AnnotationType,
  type Point,
  type AnnotationStyle,
  createAnnotationId,
} from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';
import { getFabricOptions } from '../fabric-utils.js';
import { generateId } from '../../utils/id.js';

/** Minimum distance in screen pixels between consecutive points */
const MIN_DISTANCE_SCREEN_PX = 3;

export class FreeHandPathTool extends BaseTool {
  readonly type: AnnotationType = 'freeHandPath';
  private preview: Polyline | null = null;
  private vertices: Point[] = [];
  private isDrawing: boolean = false;
  private isShiftHeld: boolean = false;

  onPointerDown(event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    this.isShiftHeld = event.shiftKey;
    this.isDrawing = true;
    this.vertices = [{ x: imagePoint.x, y: imagePoint.y }];

    this.preview = new Polyline(
      [
        { x: imagePoint.x, y: imagePoint.y },
        { x: imagePoint.x, y: imagePoint.y },
      ],
      {
        fill: 'transparent',
        stroke: 'rgba(0,0,0,0.5)',
        strokeWidth: 2 / this.overlay.canvas.getZoom(),
        strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
        selectable: false,
        evented: false,
        strokeUniform: true,
        objectCaching: false,
      },
    );
    this.overlay.canvas.add(this.preview);
    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.isDrawing || this.vertices.length === 0) return;

    this.isShiftHeld = event.shiftKey;

    const lastPoint = this.vertices[this.vertices.length - 1]!;

    // Check distance in image pixels based on screen threshold and zoom
    const zoom = this.overlay.canvas.getZoom();
    const threshold = MIN_DISTANCE_SCREEN_PX / zoom;
    const dx = imagePoint.x - lastPoint.x;
    const dy = imagePoint.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= threshold) {
      this.vertices.push({ x: imagePoint.x, y: imagePoint.y });
    }

    const previewPoints = [
      ...this.vertices.map((p) => ({ x: p.x, y: p.y })),
      { x: imagePoint.x, y: imagePoint.y },
    ];
    this.preview.set({ points: previewPoints, dirty: true });
    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(event: PointerEvent, _imagePoint: Point): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.isShiftHeld = event.shiftKey;

    // Default to closed (creates Polygon). If Shift is held, it is open (creates Polyline).
    const closed = !this.isShiftHeld;
    this.finish(closed);
  }

  onKeyDown(event: KeyboardEvent): boolean {
    const shortcuts = this.shortcuts;

    if (this.isDrawing && shortcuts) {
      if (event.key === shortcuts.cancel) {
        this.cancel();
        return true;
      }
    }
    return super.onKeyDown(event);
  }

  private finish(closed: boolean) {
    if (!this.overlay || !this.imageId || !this.callbacks) {
      this.cancel();
      return;
    }

    // Need at least 2 points for an open path, 3 for a closed polygon
    const minPoints = closed ? 3 : 2;
    if (this.vertices.length < minPoints) {
      this.cancel();
      return;
    }

    const activeContextId = this.callbacks.getActiveContextId();
    if (!activeContextId) {
      console.warn('No active context, cannot create annotation');
      this.cancel();
      return;
    }

    if (!this.callbacks.canAddAnnotation(this.type)) {
      this.cancel();
      return;
    }

    const toolConstraint = this.callbacks.getToolConstraint(this.type);
    const style: AnnotationStyle = {
      ...DEFAULT_ANNOTATION_STYLE,
      ...toolConstraint?.defaultStyle,
    };

    const id = createAnnotationId(generateId());
    const options = getFabricOptions(style, id);
    const pts = this.vertices.map((p) => ({ x: p.x, y: p.y }));

    // Remove preview polyline
    if (this.preview) {
      this.overlay.canvas.remove(this.preview);
    }

    // Create the final object (Polygon for closed, Polyline for open)
    let finalObj: Polyline;
    if (closed) {
      finalObj = new Polygon(pts, {
        ...options,
        selectable: true,
        evented: true,
      });
    } else {
      finalObj = new Polyline(pts, {
        ...options,
        fill: 'transparent',
        selectable: true,
        evented: true,
      });
    }

    this.overlay.canvas.add(finalObj);
    this.overlay.canvas.requestRenderAll();

    this.callbacks.addAnnotation({
      fabricObject: finalObj,
      imageId: this.imageId,
      contextId: activeContextId,
      type: this.type,
    });

    this.preview = null;
    this.vertices = [];
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.isDrawing = false;
    this.preview = null;
    this.vertices = [];
  }
}
