import { Line } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';

export class LineTool extends BaseTool {
  readonly type: AnnotationType = 'line';
  private preview: Line | null = null;
  private startPoint: Point | null = null;

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    this.startPoint = imagePoint;

    this.preview = new Line([imagePoint.x, imagePoint.y, imagePoint.x, imagePoint.y], {
      fill: 'transparent',
      stroke: 'rgba(0,0,0,0.5)',
      strokeWidth: 2 / this.overlay.canvas.getZoom(),
      strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });

    this.overlay.canvas.add(this.preview);
    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.startPoint) return;

    this.preview.set({
      x2: imagePoint.x,
      y2: imagePoint.y,
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
