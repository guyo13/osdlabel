import { Line } from 'fabric';
import { BaseTool } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle, AnnotationContextId, createAnnotationId } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';
import { getFabricOptions } from '../fabric-utils.js';
import { generateId } from '../../utils/id.js';

export class LineTool extends BaseTool {
  readonly type: AnnotationType = 'line';
  private preview: Line | null = null;
  private startPoint: Point | null = null;
  private activeContextId: AnnotationContextId | null = null;

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.imageId || !this.callbacks) return;

    const contextId = this.callbacks.getActiveContextId();
    if (!contextId) {
      console.warn('No active context, cannot create annotation');
      return;
    }
    if (!this.callbacks.canAddAnnotation(this.type)) return;

    this.activeContextId = contextId;
    this.startPoint = imagePoint;

    const toolConstraint = this.callbacks.getToolConstraint(this.type);
    const style: AnnotationStyle = {
      ...DEFAULT_ANNOTATION_STYLE,
      ...toolConstraint?.defaultStyle,
    };

    const id = createAnnotationId(generateId());
    const options = getFabricOptions(style, id);

    this.preview = new Line([imagePoint.x, imagePoint.y, imagePoint.x, imagePoint.y], {
      ...options,
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
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
    if (!this.overlay || !this.preview || !this.startPoint || !this.imageId || !this.callbacks || !this.activeContextId) {
      this.cancel();
      return;
    }

    this.preview.set({ selectable: true, evented: true });
    this.preview.setCoords();

    this.callbacks.addAnnotation({
      fabricObject: this.preview,
      imageId: this.imageId,
      contextId: this.activeContextId,
      type: this.type,
    });

    this.preview = null;
    this.startPoint = null;
    this.activeContextId = null;
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.preview = null;
    this.startPoint = null;
    this.activeContextId = null;
  }
}
