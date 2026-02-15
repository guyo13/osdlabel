import { Rect } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject, ToolCallbacks } from './base-tool.js';
import { AnnotationType, Point } from '../types.js';
import { FabricOverlay } from '../../overlay/fabric-overlay.js';
import { ImageId } from '../types.js';

export class RectangleTool extends BaseTool {
  readonly type: AnnotationType = 'rectangle';
  private preview: Rect | null = null;
  private startPoint: Point | null = null;

  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void {
    super.activate(overlay, imageId, callbacks);
  }

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    this.startPoint = imagePoint;

    this.preview = new Rect({
      left: imagePoint.x,
      top: imagePoint.y,
      width: 0,
      height: 0,
      fill: 'rgba(0,0,0,0.1)',
      stroke: 'rgba(0,0,0,0.5)',
      strokeWidth: 2 / this.overlay.canvas.getZoom(),
      strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
      selectable: false,
      evented: false,
    });

    this.overlay.canvas.add(this.preview);
    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.startPoint) return;

    const width = imagePoint.x - this.startPoint.x;
    const height = imagePoint.y - this.startPoint.y;

    this.preview.set({
      width: Math.abs(width),
      height: Math.abs(height),
      left: width > 0 ? this.startPoint.x : imagePoint.x,
      top: height > 0 ? this.startPoint.y : imagePoint.y,
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

    // Ignore small drags
    if (this.preview.width < 1 || this.preview.height < 1) {
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
