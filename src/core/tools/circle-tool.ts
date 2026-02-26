import { Circle } from 'fabric';
import { ShapeTool } from './shape-tool.js';
import { AnnotationType, Point } from '../types.js';

export class CircleTool extends ShapeTool<Circle> {
  readonly type: AnnotationType = 'circle';

  protected createPreview(imagePoint: Point, options: Record<string, any>): Circle {
    return new Circle({
      ...options,
      left: imagePoint.x,
      top: imagePoint.y,
      radius: 0,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
  }

  protected updatePreview(imagePoint: Point, startPoint: Point): void {
    if (!this.preview) return;

    const dx = imagePoint.x - startPoint.x;
    const dy = imagePoint.y - startPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    this.preview.set({ radius });
  }
}
