import { Circle } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';

export class CircleTool extends BaseTool {
  readonly type: AnnotationType = 'circle';
  private preview: Circle | null = null;
  private centerPoint: Point | null = null;

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    this.centerPoint = imagePoint;

    this.preview = new Circle({
      left: imagePoint.x,
      top: imagePoint.y,
      radius: 0,
      originX: 'center',
      originY: 'center',
      fill: 'transparent',
      stroke: 'rgba(0,0,0,0.5)',
      strokeWidth: 2 / this.overlay.canvas.getZoom(),
      strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
      selectable: false,
      evented: false,
      strokeUniform: true,
    });

    this.overlay.canvas.add(this.preview);
    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.centerPoint) return;

    const dx = imagePoint.x - this.centerPoint.x;
    const dy = imagePoint.y - this.centerPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    this.preview.set({
      radius: radius,
    });

    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.centerPoint || !this.imageId || !this.callbacks) {
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

    const annotation = createAnnotationFromFabricObject(
      this.preview,
      this.imageId,
      activeContextId,
      style,
      this.type
    );

    this.overlay.canvas.remove(this.preview);
    this.preview = null;
    this.centerPoint = null;
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
    this.centerPoint = null;
  }
}
