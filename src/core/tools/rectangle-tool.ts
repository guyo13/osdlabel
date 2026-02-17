import { Rect } from 'fabric';
import { BaseTool } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle, AnnotationContextId, createAnnotationId } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';
import { getFabricOptions } from '../fabric-utils.js';
import { generateId } from '../../utils/id.js';

export class RectangleTool extends BaseTool {
  readonly type: AnnotationType = 'rectangle';
  private preview: Rect | null = null;
  private startPoint: Point | null = null;
  private activeContextId: AnnotationContextId | null = null;

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.imageId || !this.callbacks) return;

    // Fail fast: check constraints before starting
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

    this.preview = new Rect({
      ...options,
      left: imagePoint.x,
      top: imagePoint.y,
      width: 0,
      height: 0,
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
      left: width < 0 ? imagePoint.x : this.startPoint.x,
      top: height < 0 ? imagePoint.y : this.startPoint.y,
    });

    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    if (!this.overlay || !this.preview || !this.startPoint || !this.imageId || !this.callbacks || !this.activeContextId) {
      this.cancel();
      return;
    }

    // Make the object interactive
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
