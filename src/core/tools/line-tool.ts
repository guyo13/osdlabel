import { Line } from 'fabric';
import { ShapeTool } from './shape-tool.js';
import { AnnotationType, Point } from '../types.js';

export class LineTool extends ShapeTool<Line> {
  readonly type: AnnotationType = 'line';

  protected createPreview(imagePoint: Point, options: Record<string, any>): Line {
    return new Line([imagePoint.x, imagePoint.y, imagePoint.x, imagePoint.y], {
      ...options,
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    });
  }

  protected updatePreview(imagePoint: Point, _startPoint: Point): void {
    if (!this.preview) return;

    this.preview.set({
      x2: imagePoint.x,
      y2: imagePoint.y,
    });
  }
}
