import { Rect } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { actions, contextState } from '../../state/store.js';
import { AnnotationType, Point, AnnotationStyle } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';

export class RectangleTool extends BaseTool {
  readonly type: AnnotationType = 'rectangle';
  private preview: Rect | null = null;
  private startPoint: Point | null = null;

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    this.startPoint = imagePoint;

    // Create preview rect
    this.preview = new Rect({
      left: imagePoint.x,
      top: imagePoint.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: 'rgba(0,0,0,0.5)',
      strokeWidth: 2 / this.overlay.canvas.getZoom(), // Keep stroke thin on screen
      strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
      selectable: false,
      evented: false,
      strokeUniform: true // Fabric feature to keep stroke width constant? No, that's SVG.
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
    if (!this.overlay || !this.preview || !this.startPoint || !this.imageId) {
        this.cancel();
        return;
    }

    const activeContextId = contextState.activeContextId;
    if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        this.cancel();
        return;
    }

    const activeContext = contextState.contexts.find(c => c.id === activeContextId);
    const toolConstraint = activeContext?.tools.find(t => t.type === this.type);

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

    // Remove preview
    this.overlay.canvas.remove(this.preview);
    this.preview = null;
    this.startPoint = null;
    this.overlay.canvas.requestRenderAll();

    if (annotation) {
      actions.addAnnotation(annotation);
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
