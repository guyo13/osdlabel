import { BaseTool } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle, createAnnotationId } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';
import { generateId } from '../../utils/id.js';

export class PointTool extends BaseTool {
  readonly type: AnnotationType = 'point';

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.imageId || !this.callbacks) return;

    const activeContextId = this.callbacks.getActiveContextId();
    if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        return;
    }

    if (!this.callbacks.canAddAnnotation(this.type)) {
        return;
    }

    const toolConstraint = this.callbacks.getToolConstraint(this.type);

    const style: AnnotationStyle = {
        ...DEFAULT_ANNOTATION_STYLE,
        ...toolConstraint?.defaultStyle,
    };

    const annotation = {
      id: createAnnotationId(generateId()),
      imageId: this.imageId,
      contextId: activeContextId,
      geometry: { type: 'point' as const, position: { x: imagePoint.x, y: imagePoint.y } },
      style,
    };

    this.callbacks.addAnnotation(annotation);
  }

  onPointerMove(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {}
  cancel(): void {}
}
