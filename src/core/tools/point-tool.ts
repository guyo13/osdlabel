import { BaseTool } from './base-tool.js';
import { AnnotationType, Point } from '../types.js';
import { createAnnotationId } from '../types.js';
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

    const style = this.callbacks.getAnnotationStyle(this.type);

    this.callbacks.addAnnotation({
        id: createAnnotationId(generateId()),
        imageId: this.imageId,
        contextId: activeContextId,
        geometry: {
            type: 'point',
            position: { x: imagePoint.x, y: imagePoint.y },
        },
        style,
    });
  }

  onPointerMove(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {}
  cancel(): void {}
}
