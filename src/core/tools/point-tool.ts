import { Circle } from 'fabric';
import { BaseTool } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle, AnnotationContextId, createAnnotationId } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';
import { getFabricOptions } from '../fabric-utils.js';
import { generateId } from '../../utils/id.js';

export class PointTool extends BaseTool {
  readonly type: AnnotationType = 'point';
  private preview: Circle | null = null;
  private isDragging = false;
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
    this.isDragging = true;

    const toolConstraint = this.callbacks.getToolConstraint(this.type);
    const style: AnnotationStyle = {
      ...DEFAULT_ANNOTATION_STYLE,
      ...toolConstraint?.defaultStyle,
    };

    const id = createAnnotationId(generateId());
    const options = getFabricOptions(style, id);

    this.preview = new Circle({
      ...options,
      left: imagePoint.x,
      top: imagePoint.y,
      radius: 5,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    this.overlay.canvas.add(this.preview);
    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.isDragging) return;

    this.preview.set({
      left: imagePoint.x,
      top: imagePoint.y,
    });

    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.imageId || !this.callbacks || !this.activeContextId) {
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
    this.isDragging = false;
    this.activeContextId = null;
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.preview = null;
    this.isDragging = false;
    this.activeContextId = null;
  }
}
