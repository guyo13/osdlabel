import { Circle } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { AnnotationType, Point } from '../types.js';

export class CircleTool extends BaseTool {
  readonly type: AnnotationType = 'circle';
  private preview: Circle | null = null;
  private startPoint: Point | null = null;

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    this.startPoint = imagePoint;

    // Create preview circle
    // Initial radius is 0
    this.preview = new Circle({
      left: imagePoint.x,
      top: imagePoint.y,
      radius: 0,
      fill: 'transparent',
      stroke: 'rgba(0,0,0,0.5)',
      strokeWidth: 2 / this.overlay.canvas.getZoom(),
      strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    this.overlay.canvas.add(this.preview);
    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.startPoint) return;

    // Radius is distance from start to current
    const dx = imagePoint.x - this.startPoint.x;
    const dy = imagePoint.y - this.startPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    this.preview.set({
      radius: radius,
    });

    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.startPoint || !this.imageId || !this.callbacks) {
        this.cancel();
        return;
    }

    const activeContextId = this.callbacks.getActiveContextId();
    if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        this.cancel();
        return;
    }

    if (this.preview.radius < 1) {
        this.cancel();
        return;
    }

    const style = this.callbacks.getAnnotationStyle(this.type);

    const annotation = createAnnotationFromFabricObject(
      this.preview,
      this.imageId,
      activeContextId,
      style,
      this.type
    );

    this.overlay.canvas.remove(this.preview);
    this.preview = null;
    this.startPoint = null;
    this.overlay.canvas.requestRenderAll();

    if (annotation) {
      this.callbacks.addAnnotation(annotation);
    }
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.preview = null;
    this.startPoint = null;
  }
}
