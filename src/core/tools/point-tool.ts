import { Circle } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { actions, contextState } from '../../state/store.js';
import { AnnotationType, Point, AnnotationStyle } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';

export class PointTool extends BaseTool {
  readonly type: AnnotationType = 'point';

  onPointerDown(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.imageId) return;

    const activeContextId = contextState.activeContextId;
    if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        return;
    }

    // Create a temporary object to get geometry
    const circle = new Circle({
        left: imagePoint.x,
        top: imagePoint.y,
        radius: 1, // Dummy radius
        originX: 'center',
        originY: 'center',
    });

    const activeContext = contextState.contexts.find(c => c.id === activeContextId);
    const toolConstraint = activeContext?.tools.find(t => t.type === this.type);

    const style: AnnotationStyle = {
        ...DEFAULT_ANNOTATION_STYLE,
        ...toolConstraint?.defaultStyle,
    };

    const annotation = createAnnotationFromFabricObject(
      circle,
      this.imageId,
      activeContextId,
      style,
      this.type
    );

    if (annotation) {
      actions.addAnnotation(annotation);
    }
  }

  onPointerMove(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {}
  cancel(): void {}
}
